-- Migration 007: Enhanced Row Level Security (RLS) Policies
-- This migration enhances RLS policies with:
-- - Policy helper functions for consistent access control
-- - Enhanced policies using RBAC functions
-- - Analyst-level access for elevated users
-- - Admin-level access for full data access

-- ============================================================================
-- 1. POLICY HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user owns the report or has elevated access
CREATE OR REPLACE FUNCTION public.can_access_report(report_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = report_user_id
        OR public.has_role('analyst')
        OR public.has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can modify a report
CREATE OR REPLACE FUNCTION public.can_modify_report(report_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only owner or admin can modify
    RETURN auth.uid() = report_user_id
        OR public.has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a document
CREATE OR REPLACE FUNCTION public.can_access_document(document_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = document_user_id
        OR public.has_role('analyst')
        OR public.has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access bappenas documents
CREATE OR REPLACE FUNCTION public.can_access_bappenas_document(doc_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = doc_user_id
        OR public.has_role('analyst')
        OR public.has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage users (admin only)
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.can_access_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_modify_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_bappenas_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_users TO authenticated;

-- Comments
COMMENT ON FUNCTION public.can_access_report IS 'Check if user can access a report (owner, analyst, or admin)';
COMMENT ON FUNCTION public.can_modify_report IS 'Check if user can modify a report (owner or admin only)';
COMMENT ON FUNCTION public.can_access_document IS 'Check if user can access a document';
COMMENT ON FUNCTION public.can_access_bappenas_document IS 'Check if user can access bappenas documents';


-- ============================================================================
-- 2. ENHANCED RLS POLICIES FOR paparan_reports
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_paparan" ON paparan_reports;

-- Create enhanced policies with RBAC
CREATE POLICY "users_can_view_own_reports" ON paparan_reports
    FOR SELECT USING (public.can_access_report(user_id));

CREATE POLICY "users_can_insert_reports" ON paparan_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_reports" ON paparan_reports
    FOR UPDATE USING (public.can_modify_report(user_id));

CREATE POLICY "users_can_delete_own_reports" ON paparan_reports
    FOR DELETE USING (public.can_modify_report(user_id));

-- Admin can insert reports for any user
CREATE POLICY "admins_can_insert_reports_for_any" ON paparan_reports
    FOR INSERT WITH CHECK (public.has_role('admin'));


-- ============================================================================
-- 3. ENHANCED RLS POLICIES FOR sources
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_sources" ON sources;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_sources" ON sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND public.can_access_report(user_id)
        )
    );

CREATE POLICY "users_can_insert_sources" ON sources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND auth.uid() = user_id
        )
    );

CREATE POLICY "users_can_update_own_sources" ON sources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND public.can_modify_report(user_id)
        )
    );

CREATE POLICY "users_can_delete_own_sources" ON sources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND public.can_modify_report(user_id)
        )
    );

-- Analysts can view all sources
CREATE POLICY "analysts_can_view_all_sources" ON sources
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 4. ENHANCED RLS POLICIES FOR documents
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_documents" ON documents;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_documents" ON documents
    FOR SELECT USING (public.can_access_document(user_id));

CREATE POLICY "users_can_insert_documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE POLICY "users_can_delete_own_documents" ON documents
    FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Analysts can view all documents
CREATE POLICY "analysts_can_view_all_documents" ON documents
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 5. ENHANCED RLS POLICIES FOR developments
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_developments" ON developments;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_developments" ON developments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND public.can_access_report(user_id)
        )
    );

CREATE POLICY "users_can_insert_developments" ON developments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND auth.uid() = user_id
        )
    );

CREATE POLICY "users_can_update_own_developments" ON developments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND public.can_modify_report(user_id)
        )
    );

CREATE POLICY "users_can_delete_own_developments" ON developments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = paparan_id
            AND public.can_modify_report(user_id)
        )
    );

-- Analysts can view all developments
CREATE POLICY "analysts_can_view_all_developments" ON developments
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 6. ENHANCED RLS POLICIES FOR users TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_data" ON users;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view and manage all users
CREATE POLICY "admins_can_view_all_users" ON users
    FOR SELECT USING (public.has_role('admin'));

CREATE POLICY "admins_can_update_any_user" ON users
    FOR UPDATE USING (public.has_role('admin'));

CREATE POLICY "admins_can_delete_users" ON users
    FOR DELETE USING (public.has_role('admin'));

-- Analysts can view all users (read-only)
CREATE POLICY "analysts_can_view_all_users" ON users
    FOR SELECT USING (public.has_role('analyst'));


-- ============================================================================
-- 7. ENHANCED RLS POLICIES FOR agent_memory
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_memory" ON agent_memory;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_memory" ON agent_memory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_memory" ON agent_memory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_memory" ON agent_memory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_memory" ON agent_memory
    FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Admins can view all agent memory
CREATE POLICY "admins_can_view_all_memory" ON agent_memory
    FOR SELECT USING (public.has_role('admin'));


-- ============================================================================
-- 8. ENHANCED RLS POLICIES FOR alerts
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_alerts" ON alerts;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_alerts" ON alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_alerts" ON alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_alerts" ON alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_alerts" ON alerts
    FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Admins can view all alerts
CREATE POLICY "admins_can_view_all_alerts" ON alerts
    FOR SELECT USING (public.has_role('admin'));


-- ============================================================================
-- 9. ENHANCED RLS POLICIES FOR bappenas_documents
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own documents" ON bappenas_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON bappenas_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON bappenas_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON bappenas_documents;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_bappenas_docs" ON bappenas_documents
    FOR SELECT USING (public.can_access_bappenas_document(user_id));

CREATE POLICY "users_can_insert_bappenas_docs" ON bappenas_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_bappenas_docs" ON bappenas_documents
    FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE POLICY "users_can_delete_own_bappenas_docs" ON bappenas_documents
    FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Analysts can view all bappenas documents
CREATE POLICY "analysts_can_view_all_bappenas_docs" ON bappenas_documents
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 10. ENHANCED RLS POLICIES FOR sdi_indicators
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own indicators" ON sdi_indicators;
DROP POLICY IF EXISTS "Users can insert own indicators" ON sdi_indicators;
DROP POLICY IF EXISTS "Users can update own indicators" ON sdi_indicators;
DROP POLICY IF EXISTS "Users can delete own indicators" ON sdi_indicators;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_indicators" ON sdi_indicators
    FOR SELECT USING (public.can_access_bappenas_document(user_id));

CREATE POLICY "users_can_insert_indicators" ON sdi_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_indicators" ON sdi_indicators
    FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE POLICY "users_can_delete_own_indicators" ON sdi_indicators
    FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Analysts can view all indicators
CREATE POLICY "analysts_can_view_all_indicators" ON sdi_indicators
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 11. ENHANCED RLS POLICIES FOR extraction_jobs
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON extraction_jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON extraction_jobs;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_jobs" ON extraction_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_jobs" ON extraction_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_jobs" ON extraction_jobs
    FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Admins and service role can update jobs
CREATE POLICY "service_can_update_jobs" ON extraction_jobs
    FOR UPDATE USING (auth.role() = 'service_role' OR public.has_role('admin'));

-- Analysts can view all jobs
CREATE POLICY "analysts_can_view_all_jobs" ON extraction_jobs
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 12. ENHANCED RLS POLICIES FOR consistency_flags
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own flags" ON consistency_flags;
DROP POLICY IF EXISTS "Users can insert own flags" ON consistency_flags;
DROP POLICY IF EXISTS "Users can update own flags" ON consistency_flags;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_flags" ON consistency_flags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_flags" ON consistency_flags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_flags" ON consistency_flags
    FOR UPDATE USING (
        auth.uid() = user_id
        OR resolved_by = auth.uid()
        OR public.has_role('admin')
    );

-- Analysts can view all flags
CREATE POLICY "analysts_can_view_all_flags" ON consistency_flags
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 13. ENHANCED RLS POLICIES FOR brief_versions
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_versions" ON brief_versions;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_versions" ON brief_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND public.can_access_report(user_id)
        )
    );

CREATE POLICY "users_can_insert_versions" ON brief_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND auth.uid() = user_id
        )
    );

CREATE POLICY "users_can_update_own_versions" ON brief_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND public.can_modify_report(user_id)
        )
    );

CREATE POLICY "users_can_delete_own_versions" ON brief_versions
    FOR DELETE USING (public.has_role('admin'));

-- Analysts can view all versions
CREATE POLICY "analysts_can_view_all_versions" ON brief_versions
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 14. ENHANCED RLS POLICIES FOR brief_outcomes
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_outcomes" ON brief_outcomes;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_outcomes" ON brief_outcomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_outcomes" ON brief_outcomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_outcomes" ON brief_outcomes
    FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE POLICY "users_can_delete_own_outcomes" ON brief_outcomes
    FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- Analysts can view all outcomes
CREATE POLICY "analysts_can_view_all_outcomes" ON brief_outcomes
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 15. ENHANCED RLS POLICIES FOR rpjmn_alignments
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_rpjmn" ON rpjmn_alignments;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_rpjmn" ON rpjmn_alignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND public.can_access_report(user_id)
        )
    );

CREATE POLICY "users_can_insert_rpjmn" ON rpjmn_alignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND auth.uid() = user_id
        )
    );

CREATE POLICY "users_can_update_own_rpjmn" ON rpjmn_alignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND public.can_modify_report(user_id)
        )
    );

CREATE POLICY "users_can_delete_own_rpjmn" ON rpjmn_alignments
    FOR DELETE USING (public.has_role('admin'));

-- Analysts can view all rpjmn alignments
CREATE POLICY "analysts_can_view_all_rpjmn" ON rpjmn_alignments
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 16. ENHANCED RLS POLICIES FOR brief_sources
-- ============================================================================

-- Drop existing policies (if any exist for this table)
DROP POLICY IF EXISTS "users_own_brief_sources" ON brief_sources;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_brief_sources" ON brief_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND public.can_access_report(user_id)
        )
    );

CREATE POLICY "users_can_insert_brief_sources" ON brief_sources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND auth.uid() = user_id
        )
    );

CREATE POLICY "users_can_delete_own_brief_sources" ON brief_sources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM paparan_reports
            WHERE id = brief_id
            AND public.can_modify_report(user_id)
        )
    );

-- Analysts can view all brief_sources
CREATE POLICY "analysts_can_view_all_brief_sources" ON brief_sources
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 17. ENHANCED RLS POLICIES FOR user_watchlist
-- ============================================================================

-- Drop existing policies (if any exist for this table)
DROP POLICY IF EXISTS "users_own_watchlist" ON user_watchlist;

-- Create enhanced policies
CREATE POLICY "users_can_view_own_watchlist" ON user_watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_watchlist" ON user_watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_watchlist" ON user_watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Analysts can view all watchlist entries
CREATE POLICY "analysts_can_view_all_watchlist" ON user_watchlist
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 18. RLS POLICY COMPLIANCE VIEW
-- ============================================================================

-- Create a view to check RLS policy compliance
CREATE OR REPLACE VIEW security.rls_policy_compliance AS
SELECT
    t.tablename::TEXT AS table_name,
    t.relrowsecurity AS has_rls,
    COALESCE(p.policy_count, 0) AS policy_count,
    CASE
        WHEN t.relrowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN 'compliant'
        WHEN NOT t.relrowsecurity THEN 'warning - RLS disabled'
        ELSE 'warning - no policies'
    END AS compliance_status
FROM (
    SELECT relname::TEXT AS tablename, relrowsecurity
    FROM pg_class
    WHERE relname IN (
        'users', 'paparan_reports', 'sources', 'documents', 'developments',
        'feed_items', 'agent_memory', 'alerts', 'bappenas_documents',
        'sdi_indicators', 'extraction_jobs', 'consistency_flags',
        'brief_versions', 'brief_outcomes', 'rpjmn_alignments',
        'brief_sources', 'user_watchlist'
    )
) t
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = t.tablename
) p ON true
ORDER BY t.tablename;

-- Grant select on compliance view to authenticated users
GRANT SELECT ON security.rls_policy_compliance TO authenticated;

COMMENT ON VIEW security.rls_policy_compliance IS 'View to check RLS policy compliance for all tables';


-- ============================================================================
-- 19. ROLE PERMISSIONS SUMMARY VIEW
-- ============================================================================

-- Create a view summarizing role permissions
CREATE OR REPLACE VIEW security.role_permissions AS
SELECT
    'user' AS role,
    'Can access own data only' AS permissions
UNION ALL
SELECT
    'analyst',
    'Can access own data + read all data'
UNION ALL
SELECT
    'admin',
    'Full access to all data and user management';

-- Grant select on role permissions view
GRANT SELECT ON security.role_permissions TO authenticated;

COMMENT ON VIEW security.role_permissions IS 'Summary of permissions for each role';
