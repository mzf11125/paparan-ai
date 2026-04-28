-- Migration 009: Monitoring and Observability
-- This migration adds:
-- - Query performance tracking
-- - Error logging and tracking
-- - System health metrics
-- - Audit triggers for critical tables
-- - Performance monitoring views

-- ============================================================================
-- 1. CREATE MONITORING SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS monitoring;

-- Grant usage on monitoring schema to authenticated users
GRANT USAGE ON SCHEMA monitoring TO authenticated;


-- ============================================================================
-- 2. QUERY PERFORMANCE TRACKING
-- ============================================================================

-- Query performance log table
CREATE TABLE monitoring.query_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id UUID,
    query_name TEXT,
    query_type TEXT, -- SELECT, INSERT, UPDATE, DELETE, FUNCTION
    table_name TEXT,
    execution_ms INT,
    row_count INT,
    cache_hit BOOLEAN DEFAULT TRUE,
    query_hash TEXT, -- For grouping similar queries
    query_params JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query log analysis
CREATE INDEX idx_query_log_user_time ON monitoring.query_log(user_id, created_at DESC);
CREATE INDEX idx_query_log_table_time ON monitoring.query_log(table_name, created_at DESC);
CREATE INDEX idx_query_log_type_time ON monitoring.query_log(query_type, created_at DESC);
CREATE INDEX idx_query_log_execution ON monitoring.query_log(execution_ms DESC) WHERE execution_ms > 1000; -- Slow queries
CREATE INDEX idx_query_log_hash ON monitoring.query_log(query_hash, created_at DESC);

-- RLS for query log (admin only, users can see their own)
ALTER TABLE monitoring.query_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_query_log" ON monitoring.query_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_can_view_all_query_log" ON monitoring.query_log
    FOR SELECT USING (public.has_role('admin'));

CREATE POLICY "service_can_insert_query_log" ON monitoring.query_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Comment
COMMENT ON TABLE monitoring.query_log IS 'Track query performance for optimization';


-- ============================================================================
-- 3. ERROR LOGGING AND TRACKING
-- ============================================================================

-- Error log table
CREATE TABLE monitoring.error_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id UUID,
    error_code TEXT,
    error_message TEXT NOT NULL,
    error_category TEXT, -- VALIDATION, PERMISSION, CONSTRAINT, SYSTEM, NETWORK
    table_name TEXT,
    function_name TEXT,
    query_context TEXT,
    stack_trace TEXT,
    request_id TEXT,
    user_agent TEXT,
    ip_address INET,
    severity TEXT DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for error log analysis
CREATE INDEX idx_error_log_user_time ON monitoring.error_log(user_id, created_at DESC);
CREATE INDEX idx_error_log_category_time ON monitoring.error_log(error_category, created_at DESC);
CREATE INDEX idx_error_log_severity_time ON monitoring.error_log(severity, created_at DESC);
CREATE INDEX idx_error_log_table_time ON monitoring.error_log(table_name, created_at DESC);
CREATE INDEX idx_error_log_unresolved ON monitoring.error_log(resolved, created_at DESC) WHERE resolved = FALSE;

-- RLS for error log
ALTER TABLE monitoring.error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_error_log" ON monitoring.error_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_can_view_all_error_log" ON monitoring.error_log
    FOR ALL USING (public.has_role('admin'));

CREATE POLICY "service_can_insert_error_log" ON monitoring.error_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Comment
COMMENT ON TABLE monitoring.error_log IS 'Track application errors for debugging';


-- ============================================================================
-- 4. SYSTEM HEALTH METRICS
-- ============================================================================

-- System health metrics table
CREATE TABLE monitoring.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value FLOAT,
    metric_unit TEXT,
    metric_type TEXT, -- gauge, counter, histogram
    tags JSONB DEFAULT '{}',
    source TEXT, -- database, api, storage, auth
    status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'critical', 'unknown')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for health metrics
CREATE INDEX idx_system_health_name_time ON monitoring.system_health(metric_name, created_at DESC);
CREATE INDEX idx_system_health_source_time ON monitoring.system_health(source, created_at DESC);
CREATE INDEX idx_system_health_status_time ON monitoring.system_health(status, created_at DESC);
CREATE INDEX idx_system_health_tags ON monitoring.system_health USING GIN (tags);

-- RLS for system health
ALTER TABLE monitoring.system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_view_system_health" ON monitoring.system_health
    FOR SELECT USING (public.has_role('admin'));

CREATE POLICY "service_can_insert_system_health" ON monitoring.system_health
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE monitoring.system_health IS 'Track system health metrics for monitoring';


-- ============================================================================
-- 5. AUDIT TRIGGER FUNCTIONS
-- ============================================================================

-- Generic audit trigger function (enhanced version)
CREATE OR REPLACE FUNCTION audit.trigger_audit()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    user_ip TEXT;
    user_agent TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Extract IP and user agent from application context if available
    -- These would typically be set by the application using SET LOCAL
    user_ip := current_setting('request.ip', TRUE);
    user_agent := current_setting('request.user_agent', TRUE);

    INSERT INTO audit.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(OLD.id, NEW.id),
        old_data,
        new_data,
        user_ip,
        user_agent
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lighter audit trigger for high-volume tables (only tracks changes, not full data)
CREATE OR REPLACE FUNCTION audit.trigger_audit_light()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(OLD.id, NEW.id),
        jsonb_build_object(
            'changed_at', NOW(),
            'operation', TG_OP
        ),
        CASE
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE jsonb_build_object(
                'id', NEW.id,
                'user_id', NEW.user_id
            )
        END
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 6. APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- ============================================================================

-- Paparan reports - full audit
DROP TRIGGER IF EXISTS audit_paparan_reports ON paparan_reports;
CREATE TRIGGER audit_paparan_reports
    AFTER INSERT OR UPDATE OR DELETE ON paparan_reports
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- Users - full audit
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- User roles - full audit (security sensitive)
DROP TRIGGER IF EXISTS audit_user_roles ON user_roles;
CREATE TRIGGER audit_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- Documents - light audit (high volume)
DROP TRIGGER IF EXISTS audit_documents ON documents;
CREATE TRIGGER audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_light();

-- Bappenas documents - full audit
DROP TRIGGER IF EXISTS audit_bappenas_documents ON bappenas_documents;
CREATE TRIGGER audit_bappenas_documents
    AFTER INSERT OR UPDATE OR DELETE ON bappenas_documents
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- SDI indicators - light audit (high volume)
DROP TRIGGER IF EXISTS audit_sdi_indicators ON sdi_indicators;
CREATE TRIGGER audit_sdi_indicators
    AFTER INSERT OR UPDATE OR DELETE ON sdi_indicators
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit_light();

-- Extraction jobs - full audit
DROP TRIGGER IF EXISTS audit_extraction_jobs ON extraction_jobs;
CREATE TRIGGER audit_extraction_jobs
    AFTER INSERT OR UPDATE OR DELETE ON extraction_jobs
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- Consistency flags - full audit
DROP TRIGGER IF EXISTS audit_consistency_flags ON consistency_flags;
CREATE TRIGGER audit_consistency_flags
    AFTER INSERT OR UPDATE OR DELETE ON consistency_flags
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- Alert table for monitoring security events
DROP TRIGGER IF EXISTS audit_security_alerts ON alerts;
CREATE TRIGGER audit_security_alerts
    AFTER INSERT OR UPDATE OR DELETE ON alerts
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();


-- ============================================================================
-- 7. MONITORING HELPER FUNCTIONS
-- ============================================================================

-- Function to log query performance
CREATE OR REPLACE FUNCTION monitoring.log_query(
    query_name_param TEXT,
    table_name_param TEXT,
    execution_ms_param INT,
    row_count_param INT DEFAULT 0,
    query_params_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO monitoring.query_log (
        user_id,
        query_name,
        table_name,
        execution_ms,
        row_count,
        query_params
    ) VALUES (
        auth.uid(),
        query_name_param,
        table_name_param,
        execution_ms_param,
        row_count_param,
        query_params_param
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION monitoring.log_error(
    error_code_param TEXT,
    error_message_param TEXT,
    error_category_param TEXT DEFAULT 'SYSTEM',
    table_name_param TEXT DEFAULT NULL,
    query_context_param TEXT DEFAULT NULL,
    severity_param TEXT DEFAULT 'error'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO monitoring.error_log (
        user_id,
        error_code,
        error_message,
        error_category,
        table_name,
        query_context,
        severity
    ) VALUES (
        auth.uid(),
        error_code_param,
        error_message_param,
        error_category_param,
        table_name_param,
        query_context_param,
        severity_param
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record system health metric
CREATE OR REPLACE FUNCTION monitoring.record_metric(
    metric_name_param TEXT,
    metric_value_param FLOAT,
    metric_unit_param TEXT DEFAULT NULL,
    metric_type_param TEXT DEFAULT 'gauge',
    tags_param JSONB DEFAULT '{}',
    source_param TEXT DEFAULT 'database',
    status_param TEXT DEFAULT 'ok'
)
RETURNS UUID AS $$
DECLARE
    metric_id UUID;
BEGIN
    INSERT INTO monitoring.system_health (
        metric_name,
        metric_value,
        metric_unit,
        metric_type,
        tags,
        source,
        status
    ) VALUES (
        metric_name_param,
        metric_value_param,
        metric_unit_param,
        metric_type_param,
        tags_param,
        source_param,
        status_param
    ) RETURNING id INTO metric_id;

    RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on monitoring functions
GRANT EXECUTE ON FUNCTION monitoring.log_query TO authenticated;
GRANT EXECUTE ON FUNCTION monitoring.log_error TO authenticated;
GRANT EXECUTE ON FUNCTION monitoring.record_metric TO authenticated;

-- Comments
COMMENT ON FUNCTION monitoring.log_query IS 'Log query performance for monitoring';
COMMENT ON FUNCTION monitoring.log_error IS 'Log application errors for tracking';
COMMENT ON FUNCTION monitoring.record_metric IS 'Record system health metrics';


-- ============================================================================
-- 8. MONITORING VIEWS
-- ============================================================================

-- Slow queries view (queries taking > 1 second)
CREATE OR REPLACE VIEW monitoring.slow_queries AS
SELECT
    query_name,
    table_name,
    AVG(execution_ms) AS avg_execution_ms,
    MAX(execution_ms) AS max_execution_ms,
    COUNT(*) AS execution_count,
    SUM(row_count) AS total_rows,
    MAX(created_at) AS last_seen
FROM monitoring.query_log
WHERE execution_ms > 1000
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY query_name, table_name
ORDER BY avg_execution_ms DESC;

GRANT SELECT ON monitoring.slow_queries TO authenticated;

-- Error summary view
CREATE OR REPLACE VIEW monitoring.error_summary AS
SELECT
    error_category,
    error_code,
    COUNT(*) AS error_count,
    COUNT(*) FILTER (WHERE resolved = FALSE) AS unresolved_count,
    MAX(created_at) AS last_occurrence
FROM monitoring.error_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY error_category, error_code
ORDER BY error_count DESC;

GRANT SELECT ON monitoring.error_summary TO authenticated;

-- System health status view
CREATE OR REPLACE VIEW monitoring.health_status AS
SELECT
    metric_name,
    source,
    status,
    AVG(metric_value) AS avg_value,
    MIN(metric_value) AS min_value,
    MAX(metric_value) AS max_value,
    COUNT(*) AS sample_count,
    MAX(created_at) AS last_update
FROM monitoring.system_health
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY metric_name, source, status
ORDER BY status, metric_name;

GRANT SELECT ON monitoring.health_status TO authenticated;

-- Daily performance summary
CREATE OR REPLACE VIEW monitoring.daily_performance_summary AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS total_queries,
    AVG(execution_ms) AS avg_execution_ms,
    MAX(execution_ms) AS max_execution_ms,
    SUM(row_count) AS total_rows,
    COUNT(*) FILTER (WHERE execution_ms > 1000) AS slow_query_count
FROM monitoring.query_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

GRANT SELECT ON monitoring.daily_performance_summary TO authenticated;

-- User activity summary
CREATE OR REPLACE VIEW monitoring.user_activity_summary AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT ql.id) AS query_count,
    COUNT(DISTINCT el.id) AS error_count,
    MAX(ql.created_at) AS last_activity
FROM users u
LEFT JOIN monitoring.query_log ql ON u.id = ql.user_id AND ql.created_at > NOW() - INTERVAL '30 days'
LEFT JOIN monitoring.error_log el ON u.id = el.user_id AND el.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name, u.email
ORDER BY query_count DESC;

GRANT SELECT ON monitoring.user_activity_summary TO authenticated;

-- Comments
COMMENT ON VIEW monitoring.slow_queries IS 'View of slow queries (>1s) from the past 7 days';
COMMENT ON VIEW monitoring.error_summary IS 'Summary of errors by category and code';
COMMENT ON VIEW monitoring.health_status IS 'Current system health status';
COMMENT ON VIEW monitoring.daily_performance_summary IS 'Daily query performance summary';
COMMENT ON VIEW monitoring.user_activity_summary IS 'User activity and error summary';


-- ============================================================================
-- 9. ALERT FUNCTIONS
-- ============================================================================

-- Function to check for critical errors that need attention
CREATE OR REPLACE FUNCTION monitoring.check_critical_alerts()
RETURNS TABLE (
    alert_type TEXT,
    alert_message TEXT,
    metric_value FLOAT,
    threshold FLOAT,
    severity TEXT
) AS $$
BEGIN
    -- Check for high error rate
    RETURN QUERY
    SELECT
        'high_error_rate'::TEXT AS alert_type,
        'Error rate exceeds threshold'::TEXT AS alert_message,
        error_count::FLOAT,
        100.0::FLOAT AS threshold,
        CASE WHEN error_count > 500 THEN 'critical'::TEXT ELSE 'warning'::TEXT END AS severity
    FROM (
        SELECT COUNT(*) AS error_count
        FROM monitoring.error_log
        WHERE created_at > NOW() - INTERVAL '1 hour'
    ) errors
    WHERE error_count > 50;

    -- Check for slow queries
    RETURN QUERY
    SELECT
        'slow_queries'::TEXT AS alert_type,
        'High number of slow queries detected'::TEXT AS alert_message,
        slow_count::FLOAT,
        10.0::FLOAT AS threshold,
        CASE WHEN slow_count > 100 THEN 'critical'::TEXT ELSE 'warning'::TEXT END AS severity
    FROM (
        SELECT COUNT(*) AS slow_count
        FROM monitoring.query_log
        WHERE execution_ms > 1000
        AND created_at > NOW() - INTERVAL '1 hour'
    ) slow
    WHERE slow_count > 10;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION monitoring.check_critical_alerts TO authenticated;

COMMENT ON FUNCTION monitoring.check_critical_alerts IS 'Check for critical system alerts';


-- ============================================================================
-- 10. DATA RETENTION FOR MONITORING TABLES
-- ============================================================================

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION monitoring.cleanup_old_data()
RETURNS TABLE (
    table_name TEXT,
    rows_deleted BIGINT
) AS $$
BEGIN
    -- Clean up query logs older than 90 days
    WITH deleted_logs AS (
        DELETE FROM monitoring.query_log
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING *
    )
    SELECT 'query_log'::TEXT, COUNT(*)::BIGINT
    FROM deleted_logs
    INTO rows_deleted;

    RETURN QUERY SELECT 'query_log'::TEXT, rows_deleted::BIGINT;

    -- Clean up resolved error logs older than 180 days
    WITH deleted_errors AS (
        DELETE FROM monitoring.error_log
        WHERE created_at < NOW() - INTERVAL '180 days'
        AND resolved = TRUE
        RETURNING *
    )
    SELECT 'error_log'::TEXT, COUNT(*)::BIGINT
    FROM deleted_errors
    INTO rows_deleted;

    RETURN QUERY SELECT 'error_log'::TEXT, rows_deleted::BIGINT;

    -- Clean up old health metrics (keep detailed for 7 days, aggregated for 90 days)
    WITH deleted_health AS (
        DELETE FROM monitoring.system_health
        WHERE created_at < NOW() - INTERVAL '7 days'
        RETURNING *
    )
    SELECT 'system_health'::TEXT, COUNT(*)::BIGINT
    FROM deleted_health
    INTO rows_deleted;

    RETURN QUERY SELECT 'system_health'::TEXT, rows_deleted::BIGINT;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION monitoring.cleanup_old_data TO authenticated;

COMMENT ON FUNCTION monitoring.cleanup_old_data IS 'Clean up old monitoring data to manage storage';
