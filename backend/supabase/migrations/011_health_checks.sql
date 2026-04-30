-- Migration 011: Health Checks and Diagnostics
-- This migration adds:
-- - Comprehensive health check functions
-- - RLS compliance checking
-- - Database diagnostics
-- - Performance benchmarks
-- - System readiness checks

-- ============================================================================
-- 1. CREATE HEALTH SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS health;

-- Grant usage on health schema
GRANT USAGE ON SCHEMA health TO authenticated;


-- ============================================================================
-- 2. COMPREHENSIVE DATABASE HEALTH CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.database_health()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    table_count INT;
    index_count INT;
    policy_count INT;
    total_users INT;
    total_reports INT;
    total_documents INT;
    vector_index_ok BOOLEAN := TRUE;
    extension_status JSONB := '{}';
    storage_status JSONB := '{}';
    rls_compliance INT;
    disk_usage TEXT;
    connection_count INT;
    active_connections INT;
    database_size TEXT;
    cache_hit_ratio FLOAT;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';

    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    -- Count users
    SELECT COUNT(*) INTO total_users FROM public.users;

    -- Count reports
    SELECT COUNT(*) INTO total_reports FROM public.paparan_reports;

    -- Count documents
    SELECT COUNT(*) INTO total_documents FROM public.documents;

    -- Check vector indexes (should be HNSW, not ivfflat)
    SELECT COUNT(*) = 0 INTO vector_index_ok
    FROM pg_indexes
    WHERE indexname LIKE '%embedding%'
    AND indexdef LIKE '%ivfflat%';

    -- Check extension status
    SELECT jsonb_object_agg(
        extname,
        jsonb_build_object(
            'installed', TRUE,
            'version', extversion
        )
    ) INTO extension_status
    FROM pg_extension
    WHERE extname IN ('vector', 'pg_cron', 'pg_stat_statements', 'pgjwt');

    -- Check storage bucket
    SELECT jsonb_build_object(
        'documents_bucket_exists',
        EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'documents'),
        'public', COALESCE((SELECT public FROM storage.buckets WHERE id = 'documents'), FALSE)
    ) INTO storage_status;

    -- Count RLS compliant tables
    SELECT COUNT(*) INTO rls_compliance
    FROM (
        SELECT relname
        FROM pg_class
        WHERE relname IN (
            'users', 'paparan_reports', 'sources', 'documents', 'developments',
            'feed_items', 'agent_memory', 'alerts', 'bappenas_documents',
            'sdi_indicators', 'extraction_jobs', 'consistency_flags',
            'brief_versions', 'brief_outcomes', 'rpjmn_alignments',
            'brief_sources', 'user_watchlist', 'user_roles'
        )
        AND relrowsecurity = TRUE
    ) t;

    -- Get database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO database_size;

    -- Get connection counts
    SELECT count(*) INTO connection_count
    FROM pg_stat_activity
    WHERE datname = current_database();

    SELECT count(*) INTO active_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
    AND state = 'active';

    -- Calculate cache hit ratio
    SELECT
        round(sum(blks_hit)::numeric / NULLIF(sum(blks_hit) + sum(blks_read), 0), 4)
    INTO cache_hit_ratio
    FROM pg_stat_database
    WHERE datname = current_database();

    -- Determine overall status
    -- Build result
    result := jsonb_build_object(
        'status', CASE
            WHEN vector_index_ok AND rls_compliance >= 15 THEN 'healthy'
            WHEN vector_index_ok AND rls_compliance >= 10 THEN 'degraded'
            ELSE 'unhealthy'
        END,
        'timestamp', NOW(),
        'tables', table_count,
        'indexes', index_count,
        'rls_policies', policy_count,
        'rls_compliant_tables', rls_compliance,
        'total_users', total_users,
        'total_reports', total_reports,
        'total_documents', total_documents,
        'vector_indexes_optimized', vector_index_ok,
        'extensions', extension_status,
        'storage', storage_status,
        'database_size', database_size,
        'connections', jsonb_build_object(
            'total', connection_count,
            'active', active_connections
        ),
        'cache_hit_ratio', cache_hit_ratio,
        'checks', jsonb_build_object(
            'pgvector_enabled', EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector'),
            'rls_enabled_on_users', EXISTS(SELECT 1 FROM pg_class WHERE relname = 'users' AND relrowsecurity = TRUE),
            'rls_enabled_on_reports', EXISTS(SELECT 1 FROM pg_class WHERE relname = 'paparan_reports' AND relrowsecurity = TRUE),
            'rls_enabled_on_feed_items', EXISTS(SELECT 1 FROM pg_class WHERE relname = 'feed_items' AND relrowsecurity = TRUE),
            'public_feed_policy_removed', NOT EXISTS(SELECT 1 FROM pg_policies WHERE policyname = 'public_feed_read'),
            'audit_logs_table_exists', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'audit' AND tablename = 'audit_logs'),
            'monitoring_tables_exist', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'monitoring' AND tablename = 'query_log'),
            'archive_tables_exist', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'data' AND tablename = 'paparan_reports_archive'),
            'user_roles_table_exists', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles')
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.database_health TO authenticated;

COMMENT ON FUNCTION health.database_health IS 'Comprehensive database health check';


-- ============================================================================
-- 3. RLS POLICY COMPLIANCE CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.check_rls_compliance()
RETURNS TABLE (
    table_name TEXT,
    has_rls BOOLEAN,
    policy_count INT,
    is_compliant BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::TEXT,
        COALESCE(r.relrowsecurity, FALSE) AS has_rls,
        COALESCE(p.policy_count, 0) AS policy_count,
        COALESCE(p.policy_count, 0) > 0 AS is_compliant,
        CASE
            WHEN COALESCE(r.relrowsecurity, FALSE) = FALSE THEN 'WARNING - RLS disabled'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN 'WARNING - no policies'
            ELSE 'compliant'
        END AS status
    FROM (
        -- List of critical tables that must have RLS
        VALUES
            ('users', true),
            ('paparan_reports', true),
            ('sources', true),
            ('documents', true),
            ('developments', true),
            ('feed_items', true),
            ('agent_memory', true),
            ('alerts', true),
            ('bappenas_documents', true),
            ('sdi_indicators', true),
            ('extraction_jobs', true),
            ('consistency_flags', true),
            ('brief_versions', true),
            ('brief_outcomes', true),
            ('rpjmn_alignments', true),
            ('brief_sources', true),
            ('user_watchlist', true),
            ('user_roles', true)
    ) AS req(table_name, required)
    LEFT JOIN LATERAL (
        SELECT relname AS table_name, relrowsecurity
        FROM pg_class
        WHERE relname = req.table_name
    ) r ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS policy_count
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = req.table_name
    ) p ON true
    ORDER BY req.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.check_rls_compliance TO authenticated;

COMMENT ON FUNCTION health.check_rls_compliance IS 'Check RLS compliance for all tables';


-- ============================================================================
-- 4. EXTENSION HEALTH CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.check_extensions()
RETURNS TABLE (
    extension_name TEXT,
    is_installed BOOLEAN,
    version TEXT,
    is_required BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH required_extensions AS (
        SELECT * FROM (VALUES
            ('vector', true),
            ('pg_stat_statements', false),
            ('pg_cron', false),
            ('pgjwt', false)
        ) AS e(name, required)
    )
    SELECT
        e.name::TEXT AS extension_name,
        EXISTS(SELECT 1 FROM pg_extension WHERE extname = e.name) AS is_installed,
        COALESCE((SELECT extversion FROM pg_extension WHERE extname = e.name), 'N/A')::TEXT AS version,
        e.required AS is_required,
        CASE
            WHEN e.required AND NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname = e.name) THEN 'missing'
            WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = e.name) THEN 'installed'
            ELSE 'optional'
        END AS status
    FROM required_extensions e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.check_extensions TO authenticated;

COMMENT ON FUNCTION health.check_extensions IS 'Check installed and required extensions';


-- ============================================================================
-- 5. INDEX HEALTH CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.check_indexes()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_type TEXT,
    index_size TEXT,
    is_valid BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.nspname || '.' || t.relname::TEXT AS table_name,
        i.relname::TEXT AS index_name,
        CASE
            WHEN amname = 'btree' THEN 'B-Tree'
            WHEN amname = 'hash' THEN 'Hash'
            WHEN amname = 'gin' THEN 'GIN'
            WHEN amname = 'gist' THEN 'GiST'
            WHEN amname = 'hnsw' THEN 'HNSW (vector)'
            ELSE amname
        END AS index_type,
        pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
        NOT indisvalid AS is_valid,
        CASE
            WHEN NOT indisvalid THEN 'invalid'
            WHEN indexdef LIKE '%WHERE%' THEN 'partial'
            WHEN indexdef LIKE '%INCLUDE%' THEN 'covering'
            ELSE 'standard'
        END AS status
    FROM pg_index x
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_am am ON am.oid = i.relam
    WHERE n.nspname = 'public'
    AND NOT t.relname LIKE 'pg_%'
    ORDER BY pg_relation_size(i.oid) DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.check_indexes TO authenticated;

COMMENT ON FUNCTION health.check_indexes IS 'Check index health and status';


-- ============================================================================
-- 6. TABLE SIZE AND STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION health.check_table_sizes()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT,
    last_vacuum TIMESTAMPTZ,
    last_autovacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ,
    last_autoanalyze TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename::TEXT AS table_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_indexes_size(schemaname||'.'||tablename)) AS total_size,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.check_table_sizes TO authenticated;

COMMENT ON FUNCTION health.check_table_sizes IS 'Check table sizes and statistics';


-- ============================================================================
-- 7. VECTOR INDEX PERFORMANCE CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.check_vector_indexes()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_type TEXT,
    index_count INT,
    index_dimension INT,
    is_optimal BOOLEAN,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH vector_indexes AS (
        SELECT
            t.relname::TEXT AS table_name,
            i.relname::TEXT AS index_name,
            CASE
                WHEN amname = 'hnsw' THEN 'HNSW (optimal)'
                WHEN amname LIKE '%ivfflat%' THEN 'IVFFlat (suboptimal)'
                ELSE amname::TEXT
            END AS index_type,
            COUNT(*) OVER (PARTITION BY t.relname) AS index_count
        FROM pg_index x
        JOIN pg_class t ON t.oid = x.indrelid
        JOIN pg_class i ON i.oid = x.indexrelid
        JOIN pg_am am ON am.oid = i.relam
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.atttypid = (SELECT oid FROM pg_type WHERE typname = 'vector')
        WHERE n.nspname = 'public'
        AND i.relname LIKE '%embedding%'
    )
    SELECT
        vi.table_name,
        vi.index_name,
        vi.index_type,
        vi.index_count,
        1536 AS index_dimension, -- Standard for OpenAI/Claude embeddings
        vi.index_type = 'HNSW (optimal)' AS is_optimal,
        CASE
            WHEN vi.index_type = 'HNSW (optimal)' THEN 'None - using optimal HNSW index'
            ELSE 'Consider upgrading to HNSW for better vector search performance'
        END AS recommendation
    FROM vector_indexes vi;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.check_vector_indexes TO authenticated;

COMMENT ON FUNCTION health.check_vector_indexes IS 'Check vector index configuration and performance';


-- ============================================================================
-- 8. SECURITY AUDIT CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.security_audit()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    public_feed_policy_exists BOOLEAN;
    admin_count INT;
    analyst_count INT;
    user_count INT;
    audit_log_count BIGINT;
    error_log_count BIGINT;
BEGIN
    -- Check for the dangerous public feed policy
    public_feed_policy_exists := EXISTS(
        SELECT 1 FROM pg_policies
        WHERE policyname = 'public_feed_read'
    );

    -- Count users by role
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';

    SELECT COUNT(*) INTO analyst_count
    FROM public.user_roles
    WHERE role = 'analyst';

    SELECT COUNT(*) INTO user_count
    FROM public.user_roles
    WHERE role = 'user';

    -- Count audit and error logs
    SELECT COUNT(*) INTO audit_log_count
    FROM audit.audit_logs;

    SELECT COUNT(*) INTO error_log_count
    FROM monitoring.error_log
    WHERE created_at > NOW() - INTERVAL '7 days';

    result := jsonb_build_object(
        'status', CASE
            WHEN NOT public_feed_policy_exists THEN 'secure'
            ELSE 'warning - public feed policy exists'
        END,
        'timestamp', NOW(),
        'users_by_role', jsonb_build_object(
            'admin', admin_count,
            'analyst', analyst_count,
            'user', user_count
        ),
        'audit_stats', jsonb_build_object(
            'total_audit_logs', audit_log_count,
            'recent_errors', error_log_count
        ),
        'security_checks', jsonb_build_object(
            'public_feed_policy_removed', NOT public_feed_policy_exists,
            'audit_logging_enabled', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'audit' AND tablename = 'audit_logs'),
            'rbac_enabled', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles'),
            'rate_limiting_enabled', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'rate_limit' AND tablename = 'request_log')
        ),
        'recommendations', CASE
            WHEN public_feed_policy_exists THEN '["Remove public_feed_read policy immediately"]'::jsonb
            WHEN admin_count = 0 THEN '["Create at least one admin user"]'::jsonb
            ELSE '[]'::jsonb
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.security_audit TO authenticated;

COMMENT ON FUNCTION health.security_audit IS 'Security audit check';


-- ============================================================================
-- 9. CONNECTION POOL CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.check_connections()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    total_connections INT;
    active_connections INT;
    idle_connections INT;
    max_connections INT;
    connection_usage_pct INT;
BEGIN
    -- Get connection counts
    SELECT COUNT(*) INTO total_connections
    FROM pg_stat_activity
    WHERE datname = current_database();

    SELECT COUNT(*) INTO active_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
    AND state = 'active';

    SELECT COUNT(*) INTO idle_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
    AND state = 'idle';

    -- Get max connections setting
    SELECT setting::INT INTO max_connections
    FROM pg_settings
    WHERE name = 'max_connections';

    -- Calculate usage percentage
    connection_usage_pct := ROUND((total_connections::FLOAT / max_connections::FLOAT) * 100);

    result := jsonb_build_object(
        'status', CASE
            WHEN connection_usage_pct < 70 THEN 'healthy'
            WHEN connection_usage_pct < 90 THEN 'warning'
            ELSE 'critical'
        END,
        'timestamp', NOW(),
        'connections', jsonb_build_object(
            'total', total_connections,
            'active', active_connections,
            'idle', idle_connections,
            'max_allowed', max_connections,
            'usage_percent', connection_usage_pct
        ),
        'recommendations', CASE
            WHEN connection_usage_pct > 90 THEN '["Increase connection pool size", "Check for connection leaks"]'::jsonb
            WHEN connection_usage_pct > 70 THEN '["Monitor connection usage"]'::jsonb
            ELSE '[]'::jsonb
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.check_connections TO authenticated;

COMMENT ON FUNCTION health.check_connections IS 'Check database connection status';


-- ============================================================================
-- 10. SYSTEM READINESS CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.system_readiness()
RETURNS JSONB AS $$
DECLARE
    health_check JSONB;
    rls_check JSONB := '{}';
    extension_check JSONB := '{}';
    security_check JSONB;
    connection_check JSONB;
    readiness_status TEXT := 'ready';
    issues TEXT[] := '{}';
BEGIN
    -- Get database health
    SELECT health.database_health() INTO health_check;

    -- Check RLS compliance
    SELECT jsonb_agg(
        jsonb_build_object(
            'table', table_name,
            'compliant', is_compliant,
            'status', status
        )
    ) INTO rls_check
    FROM health.check_rls_compliance();

    -- Check extensions
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', extension_name,
            'installed', is_installed,
            'required', is_required
        )
    ) INTO extension_check
    FROM health.check_extensions();

    -- Get security audit
    SELECT health.security_audit() INTO security_check;

    -- Get connection status
    SELECT health.check_connections() INTO connection_check;

    -- Collect issues
    IF health_check->>'status' != 'healthy' THEN
        issues := array_append(issues, 'Database health check failed');
    END IF;

    IF EXISTS(SELECT 1 FROM health.check_rls_compliance() WHERE NOT is_compliant) THEN
        issues := array_append(issues, 'Some tables lack RLS policies');
        readiness_status := 'degraded';
    END IF;

    IF EXISTS(SELECT 1 FROM health.check_extensions() WHERE is_required AND NOT is_installed) THEN
        issues := array_append(issues, 'Required extensions missing');
        readiness_status := 'degraded';
    END IF;

    IF security_check->>'status' = 'warning - public feed policy exists' THEN
        issues := array_append(issues, 'Security issue: public feed policy exists');
        readiness_status := 'unsecure';
    END IF;

    IF connection_check->>'status' = 'critical' THEN
        issues := array_append(issues, 'Connection pool critical');
        readiness_status := 'degraded';
    END IF;

    RETURN jsonb_build_object(
        'status', readiness_status,
        'timestamp', NOW(),
        'health', health_check,
        'rls_compliance', rls_check,
        'extensions', extension_check,
        'security', security_check,
        'connections', connection_check,
        'issues', CASE WHEN array_length(issues, 1) > 0 THEN to_jsonb(issues) ELSE '[]'::jsonb END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.system_readiness TO authenticated;

COMMENT ON FUNCTION health.system_readiness IS 'Complete system readiness check';


-- ============================================================================
-- 11. HEALTH CHECK DASHBOARD VIEW
-- ============================================================================

CREATE OR REPLACE VIEW health.dashboard AS
SELECT
    'Database Health' AS category,
    health.database_health()->>'status' AS status,
    jsonb_pretty(health.database_health()) AS details
UNION ALL
SELECT
    'Security Audit',
    health.security_audit()->>'status',
    jsonb_pretty(health.security_audit())
UNION ALL
SELECT
    'Connections',
    health.check_connections()->>'status',
    jsonb_pretty(health.check_connections())
UNION ALL
SELECT
    'Vector Indexes',
    CASE
        WHEN COUNT(*) = 0 THEN 'unknown'
        WHEN BOOL_AND(is_optimal) THEN 'optimal'
        ELSE 'suboptimal'
    END,
    jsonb_pretty(jsonb_agg(jsonb_build_object(
        'table', table_name,
        'index', index_name,
        'type', index_type,
        'optimal', is_optimal
    )))
FROM health.check_vector_indexes();

GRANT SELECT ON health.dashboard TO authenticated;

COMMENT ON VIEW health.dashboard IS 'Health check dashboard summary';


-- ============================================================================
-- 12. QUICK HEALTH CHECK (for API endpoints)
-- ============================================================================

CREATE OR REPLACE FUNCTION health.quick_check()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'status', 'ok',
        'timestamp', NOW(),
        'database', CASE
            WHEN EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' LIMIT 1) THEN 'connected'
            ELSE 'disconnected'
        END,
        'auth', CASE
            WHEN EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'auth' LIMIT 1) THEN 'enabled'
            ELSE 'disabled'
        END,
        'storage', CASE
            WHEN EXISTS(SELECT 1 FROM storage.buckets LIMIT 1) THEN 'available'
            ELSE 'unavailable'
        END,
        'vector_extension', EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector'),
        'rls_enabled', EXISTS(SELECT 1 FROM pg_class WHERE relrowsecurity = TRUE LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.quick_check TO authenticated;

COMMENT ON FUNCTION health.quick_check IS 'Quick health check for API endpoints';


-- ============================================================================
-- 13. PERFORMANCE BENCHMARK
-- ============================================================================

CREATE OR REPLACE FUNCTION health.run_benchmark()
RETURNS TABLE (
    test_name TEXT,
    result JSONB
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    duration_ms INT;
    row_count INT;
BEGIN
    -- Test 1: Simple SELECT
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count FROM public.users;
    end_time := clock_timestamp();
    duration_ms := EXTRACT(MILLISECOND FROM (end_time - start_time))::INT;
    RETURN QUERY SELECT 'simple_select'::TEXT, jsonb_build_object(
        'duration_ms', duration_ms,
        'row_count', row_count
    );

    -- Test 2: JOIN query
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count
    FROM public.paparan_reports pr
    JOIN public.sources s ON pr.id = s.paparan_id;
    end_time := clock_timestamp();
    duration_ms := EXTRACT(MILLISECOND FROM (end_time - start_time))::INT;
    RETURN QUERY SELECT 'join_query'::TEXT, jsonb_build_object(
        'duration_ms', duration_ms,
        'row_count', row_count
    );

    -- Test 3: Vector similarity (if data exists)
    start_time := clock_timestamp();
    PERFORM public.find_similar_indicators(
        '[0]'::vector(1536),
        COALESCE((SELECT id FROM public.users LIMIT 1), '00000000-0000-0000-0000-000000000000'::UUID),
        0.5,
        5
    );
    end_time := clock_timestamp();
    duration_ms := EXTRACT(MILLISECOND FROM (end_time - start_time))::INT;
    RETURN QUERY SELECT 'vector_search'::TEXT, jsonb_build_object(
        'duration_ms', duration_ms,
        'test_performed', TRUE
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION health.run_benchmark TO authenticated;

COMMENT ON FUNCTION health.run_benchmark IS 'Run performance benchmarks on common queries';


-- ============================================================================
-- 14. HEALTH CHECK SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW health.summary AS
SELECT
    jsonb_build_object(
        'overall_status',
        CASE
            WHEN health.database_health()->>'status' = 'healthy'
                AND health.security_audit()->>'status' = 'secure'
                AND health.check_connections()->>'status' = 'healthy'
            THEN 'healthy'
            WHEN health.database_health()->>'status' = 'degraded'
                OR health.check_connections()->>'status' = 'warning'
            THEN 'degraded'
            ELSE 'unhealthy'
        END,
        'database', health.database_health()->>'status',
        'security', health.security_audit()->>'status',
        'connections', health.check_connections()->>'status',
        'timestamp', NOW()
    ) AS health_summary;

GRANT SELECT ON health.summary TO authenticated;

COMMENT ON VIEW health.summary IS 'Quick health status summary';

COMMENT ON SCHEMA health IS 'Health check and diagnostic functions';
