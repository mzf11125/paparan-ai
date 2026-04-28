-- Migration 006: Security Hardening
-- This migration adds comprehensive security features including:
-- - Audit logging system
-- - Role-Based Access Control (RBAC)
-- - Input validation functions
-- - Fix for public feed access security issue

-- ============================================================================
-- 1. ROLE-BASED ACCESS CONTROL (RBAC) - MUST BE CREATED FIRST
-- ============================================================================

-- Create user_roles table for enhanced RBAC
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'analyst', 'admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Track role changes
    previous_role TEXT,
    change_reason TEXT
);

-- Index for role lookups
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- RLS for user_roles (users can read their own role, admins can manage all)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_can_read_all_roles" ON public.user_roles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "admins_can_insert_roles" ON public.user_roles
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "admins_can_update_roles" ON public.user_roles
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ));

CREATE POLICY "admins_can_delete_roles" ON public.user_roles
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ));

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on has_role to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = auth.uid();

    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on get_current_role to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_role() TO authenticated;

-- Initialize user_roles for existing users
-- This inserts a default 'user' role for any existing users not in the table
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT id, 'user', id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Comment
COMMENT ON TABLE public.user_roles IS 'Enhanced RBAC - user can be user, analyst, or admin';
COMMENT ON FUNCTION public.has_role IS 'Check if current user has a specific role';
COMMENT ON FUNCTION public.get_current_role IS 'Get the current user''s role';


-- ============================================================================
-- 2. AUDIT LOGGING SYSTEM
-- ============================================================================

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Audit log table
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_user ON audit.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_table ON audit.audit_logs(table_name, created_at DESC);
CREATE INDEX idx_audit_action ON audit.audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_record ON audit.audit_logs(record_id, created_at DESC);

-- RLS for audit logs (admin only)
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_audit_select" ON audit.audit_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "admin_only_audit_insert" ON audit.audit_logs
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Comment
COMMENT ON TABLE audit.audit_logs IS 'Audit trail for all critical data changes';
COMMENT ON SCHEMA audit IS 'Audit logging schema for security monitoring';


-- ============================================================================
-- 3. FIX PUBLIC FEED ACCESS SECURITY ISSUE
-- ============================================================================

-- Drop the overly permissive policy that allows anyone to read feed_items
DROP POLICY IF EXISTS "public_feed_read" ON feed_items;

-- Create proper policy - only authenticated users can read
CREATE POLICY "authenticated_feed_read" ON feed_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for feed insertion (service role only)
CREATE POLICY "service_feed_insert" ON feed_items
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create policy for feed updates (service role only)
CREATE POLICY "service_feed_update" ON feed_items
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create policy for feed deletion (service role only)
CREATE POLICY "service_feed_delete" ON feed_items
    FOR DELETE USING (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE feed_items IS 'Cached feed items - requires authentication to access';


-- ============================================================================
-- 5. INPUT VALIDATION FUNCTIONS
-- ============================================================================

-- Email validation function (RFC 5322 compliant basic validation)
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- URL validation function (http/https only)
CREATE OR REPLACE FUNCTION public.is_valid_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN url ~ '^https?://[A-Za-z0-9.-]+(:[0-9]+)?(/.*)?$';
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Sanitize HTML function (basic XSS prevention)
CREATE OR REPLACE FUNCTION public.sanitize_html(html TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Basic HTML sanitization - remove script tags and event handlers
    RETURN regexp_replace(
        regexp_replace(html, '<script[^>]*>.*?</script>', '', 'gi'),
        '\s+on\w+\s*=', '', 'gi'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Validate topic name (prevent injection)
CREATE OR REPLACE FUNCTION public.is_valid_topic_name(topic TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only allow alphanumeric, spaces, hyphens, and common punctuation
    RETURN topic ~ '^[\w\s\-.,;:!?()''"]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Validate region code
CREATE OR REPLACE FUNCTION public.is_valid_region(region TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow common region formats
    RETURN region ~ '^[A-Za-z0-9\-_ ]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Grant execute on validation functions
GRANT EXECUTE ON FUNCTION public.is_valid_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_url TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitize_html TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_topic_name TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_region TO authenticated;

-- Comments
COMMENT ON FUNCTION public.is_valid_email IS 'Validate email format';
COMMENT ON FUNCTION public.is_valid_url IS 'Validate URL format (http/https only)';
COMMENT ON FUNCTION public.sanitize_html IS 'Basic HTML sanitization for XSS prevention';
COMMENT ON FUNCTION public.is_valid_topic_name IS 'Validate topic name to prevent injection';


-- ============================================================================
-- 6. SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can access another user's data
CREATE OR REPLACE FUNCTION public.can_access_user_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- User can access their own data
    IF auth.uid() = target_user_id THEN
        RETURN TRUE;
    END IF;

    -- Analysts and admins can access all data
    IF public.has_role('analyst') OR public.has_role('admin') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on security helper functions
GRANT EXECUTE ON FUNCTION public.can_access_user_data TO authenticated;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type TEXT,
    event_details JSONB
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit.audit_logs (
        user_id,
        action,
        table_name,
        new_values
    ) VALUES (
        auth.uid(),
        event_type,
        'security_event',
        event_details
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on log_security_event to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

COMMENT ON FUNCTION public.can_access_user_data IS 'Check if current user can access target user data';
COMMENT ON FUNCTION public.log_security_event IS 'Log security events to audit trail';


-- ============================================================================
-- 7. RATE LIMITING TRACKING (for application-level rate limiting)
-- ============================================================================

-- Create rate_limit schema
CREATE SCHEMA IF NOT EXISTS rate_limit;

-- Rate limit tracking table
CREATE TABLE rate_limit.request_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    endpoint TEXT NOT NULL,
    ip_address INET,
    request_count INT DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute'
);

-- Index for rate limit queries
CREATE INDEX idx_rate_limit_user_endpoint ON rate_limit.request_log(user_id, endpoint, window_start DESC);
CREATE INDEX idx_rate_limit_ip_endpoint ON rate_limit.request_log(ip_address, endpoint, window_start DESC);

-- RLS for rate limit logs (admin only)
ALTER TABLE rate_limit.request_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_rate_log" ON rate_limit.request_log
    FOR ALL USING (public.has_role('admin'));

-- Function to check rate limit
CREATE OR REPLACE FUNCTION rate_limit.check_rate_limit(
    endpoint_param TEXT,
    max_requests INT DEFAULT 60,
    window_seconds INT DEFAULT 60
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_count INT,
    reset_time TIMESTAMPTZ
) AS $$
DECLARE
    window_start TIMESTAMPTZ := NOW() - (window_seconds || ' seconds')::INTERVAL;
    request_count INT;
BEGIN
    -- Count requests in the window
    SELECT COUNT(*) INTO request_count
    FROM rate_limit.request_log
    WHERE user_id = auth.uid()
    AND endpoint = endpoint_param
    AND window_start <= NOW();

    -- Clean up old logs
    DELETE FROM rate_limit.request_log
    WHERE window_end < NOW();

    RETURN QUERY
    SELECT
        (request_count < max_requests) AS allowed,
        request_count AS current_count,
        NOW() + window_seconds || ' seconds'::INTERVAL AS reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on rate_limit functions to authenticated users
GRANT EXECUTE ON FUNCTION rate_limit.check_rate_limit TO authenticated;

-- Comment
COMMENT ON SCHEMA rate_limit IS 'Rate limiting schema for API protection';
COMMENT ON TABLE rate_limit.request_log IS 'Track API requests for rate limiting';
COMMENT ON FUNCTION rate_limit.check_rate_limit IS 'Check if user has exceeded rate limit';


-- ============================================================================
-- 8. SECURITY CHECKS VIEW
-- ============================================================================

-- Create security schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS security;

-- Create a view for security monitoring
CREATE OR REPLACE VIEW security.security_status AS
SELECT
    'audit_logs_enabled' AS check_name,
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'audit' AND tablename = 'audit_logs') AS status
UNION ALL
SELECT
    'rls_enabled_on_users',
    relrowsecurity AS status
FROM pg_class
WHERE relname = 'users'
UNION ALL
SELECT
    'rls_enabled_on_paparan_reports',
    relrowsecurity AS status
FROM pg_class
WHERE relname = 'paparan_reports'
UNION ALL
SELECT
    'rls_enabled_on_feed_items',
    relrowsecurity AS status
FROM pg_class
WHERE relname = 'feed_items'
UNION ALL
SELECT
    'public_feed_policy_removed',
    NOT EXISTS(SELECT 1 FROM pg_policies WHERE policyname = 'public_feed_read') AS status
UNION ALL
SELECT
    'user_roles_table_exists',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') AS status;

-- Grant select on security_status to admins
GRANT SELECT ON security.security_status TO authenticated;

COMMENT ON VIEW security.security_status IS 'Security configuration status checks';
COMMENT ON SCHEMA security IS 'Security monitoring and configuration schema';
