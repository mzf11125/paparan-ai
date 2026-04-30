-- Migration 010: Data Maintenance and Archival
-- This migration adds:
-- - Data retention policies
-- - Archive tables for old data
-- - Automated cleanup functions
-- - Data validation functions
-- - Maintenance procedures

-- ============================================================================
-- 1. CREATE MAINTENANCE SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS data;

-- Grant usage on data schema
GRANT USAGE ON SCHEMA data TO authenticated;


-- ============================================================================
-- 2. ARCHIVE TABLES
-- ============================================================================

-- Archive table for old paparan reports
CREATE TABLE data.paparan_reports_archive (
    LIKE public.paparan_reports INCLUDING ALL
);

-- Indexes for archive queries
CREATE INDEX idx_archive_reports_created ON data.paparan_reports_archive(created_at DESC);
CREATE INDEX idx_archive_reports_user ON data.paparan_reports_archive(user_id, created_at DESC);
CREATE INDEX idx_archive_reports_region ON data.paparan_reports_archive(region, created_at DESC);

-- Comment
COMMENT ON TABLE data.paparan_reports_archive IS 'Archive of paparan reports older than 1 year';


-- Archive table for old documents
CREATE TABLE data.documents_archive (
    LIKE public.documents INCLUDING ALL
);

-- Indexes for archive queries
CREATE INDEX idx_archive_documents_created ON data.documents_archive(uploaded_at DESC);
CREATE INDEX idx_archive_documents_user ON data.documents_archive(user_id, uploaded_at DESC);

-- Comment
COMMENT ON TABLE data.documents_archive IS 'Archive of documents older than 1 year';


-- Archive table for old bappenas documents
CREATE TABLE data.bappenas_documents_archive (
    LIKE public.bappenas_documents INCLUDING ALL
);

-- Indexes for archive queries
CREATE INDEX idx_archive_bappenas_created ON data.bappenas_documents_archive(uploaded_at DESC);
CREATE INDEX idx_archive_bappenas_user ON data.bappenas_documents_archive(user_id, uploaded_at DESC);

-- Comment
COMMENT ON TABLE data.bappenas_documents_archive IS 'Archive of bappenas documents older than 1 year';


-- Archive table for old feed items
CREATE TABLE data.feed_items_archive (
    LIKE public.feed_items INCLUDING ALL
);

-- Indexes for archive queries
CREATE INDEX idx_archive_feed_published ON data.feed_items_archive(published_at DESC);
CREATE INDEX idx_archive_feed_source ON data.feed_items_archive(source, published_at DESC);

-- Comment
COMMENT ON TABLE data.feed_items_archive IS 'Archive of feed items older than 30 days';


-- ============================================================================
-- 3. RLS FOR ARCHIVE TABLES
-- ============================================================================

-- RLS for paparan_reports_archive
ALTER TABLE data.paparan_reports_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_archived_reports" ON data.paparan_reports_archive
    FOR SELECT USING (public.can_access_report(user_id));

CREATE POLICY "analysts_can_view_all_archived_reports" ON data.paparan_reports_archive
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- RLS for documents_archive
ALTER TABLE data.documents_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_archived_documents" ON data.documents_archive
    FOR SELECT USING (public.can_access_document(user_id));

CREATE POLICY "analysts_can_view_all_archived_documents" ON data.documents_archive
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- RLS for bappenas_documents_archive
ALTER TABLE data.bappenas_documents_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_archived_bappenas" ON data.bappenas_documents_archive
    FOR SELECT USING (public.can_access_bappenas_document(user_id));

CREATE POLICY "analysts_can_view_all_archived_bappenas" ON data.bappenas_documents_archive
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- RLS for feed_items_archive
ALTER TABLE data.feed_items_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_view_archived_feed" ON data.feed_items_archive
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "analysts_can_view_all_archived_feed" ON data.feed_items_archive
    FOR SELECT USING (public.has_role('analyst') OR public.has_role('admin'));


-- ============================================================================
-- 4. DATA CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up old feed items
CREATE OR REPLACE FUNCTION data.cleanup_old_feed_items()
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    -- Delete feed items older than 7 days and past expiration
    WITH deleted AS (
        DELETE FROM public.feed_items
        WHERE expires_at < NOW() - INTERVAL '7 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to archive old reports
CREATE OR REPLACE FUNCTION data.archive_old_reports()
RETURNS BIGINT AS $$
DECLARE
    archived_count BIGINT;
BEGIN
    -- Archive reports older than 1 year
    WITH archived AS (
        INSERT INTO data.paparan_reports_archive
        SELECT * FROM public.paparan_reports
        WHERE created_at < NOW() - INTERVAL '1 year'
        ON CONFLICT (id) DO NOTHING
        RETURNING *
    )
    SELECT COUNT(*) INTO archived_count FROM archived;

    -- Delete archived reports from main table
    DELETE FROM public.paparan_reports
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND id IN (SELECT id FROM data.paparan_reports_archive);

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to archive old documents
CREATE OR REPLACE FUNCTION data.archive_old_documents()
RETURNS BIGINT AS $$
DECLARE
    archived_count BIGINT;
BEGIN
    -- Archive documents older than 1 year
    WITH archived AS (
        INSERT INTO data.documents_archive
        SELECT * FROM public.documents
        WHERE uploaded_at < NOW() - INTERVAL '1 year'
        ON CONFLICT (id) DO NOTHING
        RETURNING *
    )
    SELECT COUNT(*) INTO archived_count FROM archived;

    -- Delete archived documents from main table
    DELETE FROM public.documents
    WHERE uploaded_at < NOW() - INTERVAL '1 year'
    AND id IN (SELECT id FROM data.documents_archive);

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to archive old bappenas documents
CREATE OR REPLACE FUNCTION data.archive_old_bappenas_documents()
RETURNS BIGINT AS $$
DECLARE
    archived_count BIGINT;
BEGIN
    -- Archive bappenas documents older than 1 year
    WITH archived AS (
        INSERT INTO data.bappenas_documents_archive
        SELECT * FROM public.bappenas_documents
        WHERE uploaded_at < NOW() - INTERVAL '1 year'
        ON CONFLICT (id) DO NOTHING
        RETURNING *
    )
    SELECT COUNT(*) INTO archived_count FROM archived;

    -- Delete archived documents from main table
    DELETE FROM public.bappenas_documents
    WHERE uploaded_at < NOW() - INTERVAL '1 year'
    AND id IN (SELECT id FROM data.bappenas_documents_archive);

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to clean up old agent memory (keep last 100 per user)
CREATE OR REPLACE FUNCTION data.cleanup_old_agent_memory()
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    -- Keep only the 100 most recent memories per user
    WITH deleted AS (
        DELETE FROM public.agent_memory
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id ORDER BY created_at DESC
                    ) AS rn
                FROM public.agent_memory
            ) sub
            WHERE rn > 100
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to clean up completed extraction jobs
CREATE OR REPLACE FUNCTION data.cleanup_old_extraction_jobs()
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    -- Delete completed jobs older than 30 days
    WITH deleted AS (
        DELETE FROM public.extraction_jobs
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '30 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to clean up resolved consistency flags
CREATE OR REPLACE FUNCTION data.cleanup_old_consistency_flags()
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    -- Delete resolved flags older than 90 days
    WITH deleted AS (
        DELETE FROM public.consistency_flags
        WHERE status = 'resolved'
        AND resolved_at < NOW() - INTERVAL '90 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Master cleanup function that runs all cleanup tasks
CREATE OR REPLACE FUNCTION data.cleanup_old_data()
RETURNS TABLE (
    task_name TEXT,
    rows_affected BIGINT
) AS $$
BEGIN
    -- Run each cleanup task and return results
    RETURN QUERY
    SELECT 'feed_items'::TEXT, data.cleanup_old_feed_items()::BIGINT
    UNION ALL
    SELECT 'agent_memory', data.cleanup_old_agent_memory()
    UNION ALL
    SELECT 'extraction_jobs', data.cleanup_old_extraction_jobs()
    UNION ALL
    SELECT 'consistency_flags', data.cleanup_old_consistency_flags();

    -- Archive tasks (run less frequently)
    -- These are commented out by default - should be run separately
    -- SELECT 'archive_reports', data.archive_old_reports()
    -- UNION ALL
    -- SELECT 'archive_documents', data.archive_old_documents()
    -- UNION ALL
    -- SELECT 'archive_bappenas_documents', data.archive_old_bappenas_documents();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant execute on cleanup functions
GRANT EXECUTE ON FUNCTION data.cleanup_old_feed_items TO authenticated;
GRANT EXECUTE ON FUNCTION data.archive_old_reports TO authenticated;
GRANT EXECUTE ON FUNCTION data.archive_old_documents TO authenticated;
GRANT EXECUTE ON FUNCTION data.archive_old_bappenas_documents TO authenticated;
GRANT EXECUTE ON FUNCTION data.cleanup_old_agent_memory TO authenticated;
GRANT EXECUTE ON FUNCTION data.cleanup_old_extraction_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION data.cleanup_old_consistency_flags TO authenticated;
GRANT EXECUTE ON FUNCTION data.cleanup_old_data TO authenticated;

-- Comments
COMMENT ON FUNCTION data.cleanup_old_feed_items IS 'Clean up feed items older than 7 days';
COMMENT ON FUNCTION data.archive_old_reports IS 'Archive reports older than 1 year';
COMMENT ON FUNCTION data.archive_old_documents IS 'Archive documents older than 1 year';
COMMENT ON FUNCTION data.archive_old_bappenas_documents IS 'Archive bappenas documents older than 1 year';
COMMENT ON FUNCTION data.cleanup_old_agent_memory IS 'Keep only last 100 agent memories per user';
COMMENT ON FUNCTION data.cleanup_old_extraction_jobs IS 'Clean up completed extraction jobs older than 30 days';
COMMENT ON FUNCTION data.cleanup_old_consistency_flags IS 'Clean up resolved consistency flags older than 90 days';
COMMENT ON FUNCTION data.cleanup_old_data IS 'Run all cleanup tasks';


-- ============================================================================
-- 5. DATA VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate report structure
CREATE OR REPLACE FUNCTION data.validate_report_structure(report_data JSONB)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    -- Check required sections
    IF NOT (report_data ? 'executive_summary'
        AND report_data ? 'key_developments'
        AND report_data ? 'analysis'
        AND report_data ? 'sources'
        AND report_data ? 'recommendations'
        AND report_data ? 'timeline'
        AND report_data ? 'risk_assessment') THEN
        RETURN QUERY SELECT FALSE, 'Missing required sections'::TEXT;
        RETURN;
    END IF;

    -- Validate executive_summary is not empty
    IF jsonb_array_length(report_data->'executive_summary') = 0 THEN
        RETURN QUERY SELECT FALSE, 'Executive summary cannot be empty'::TEXT;
        RETURN;
    END IF;

    -- Validate sources are provided
    IF jsonb_array_length(report_data->'sources') = 0 THEN
        RETURN QUERY SELECT FALSE, 'At least one source is required'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Function to validate SDI indicator structure
CREATE OR REPLACE FUNCTION data.validate_sdi_indicator(indicator_data JSONB)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    -- Check required SDI fields
    IF NOT (indicator_data ? 'indicator_id'
        AND indicator_data ? 'indicator_name'
        AND indicator_data ? 'definition'
        AND indicator_data ? 'producing_institution'
        AND indicator_data ? 'kl_code'
        AND indicator_data ? 'unit') THEN
        RETURN QUERY SELECT FALSE, 'Missing required SDI fields'::TEXT;
        RETURN;
    END IF;

    -- Validate KL code format (3 digits)
    IF (indicator_data->>'kl_code') !~ '^\d{3}$' THEN
        RETURN QUERY SELECT FALSE, 'KL code must be 3 digits'::TEXT;
        RETURN;
    END IF;

    -- Validate temporal_resolution if present
    IF indicator_data ? 'temporal_resolution' THEN
        IF indicator_data->>'temporal_resolution' NOT IN (
            'realtime', 'hourly', 'daily', 'weekly', 'monthly',
            'quarterly', 'semiannual', 'annual', 'biennial', 'quinary'
        ) THEN
            RETURN QUERY SELECT FALSE, 'Invalid temporal_resolution value'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Validate unit_type if present
    IF indicator_data ? 'unit_type' THEN
        IF indicator_data->>'unit_type' NOT IN (
            'nominal', 'ratio', 'index', 'count', 'percentage', 'rate', 'duration', 'currency'
        ) THEN
            RETURN QUERY SELECT FALSE, 'Invalid unit_type value'::TEXT;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Function to validate URL format
CREATE OR REPLACE FUNCTION data.validate_url(url TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    IF url IS NULL OR url = '' THEN
        RETURN QUERY SELECT FALSE, 'URL cannot be empty'::TEXT;
        RETURN;
    END IF;

    IF NOT public.is_valid_url(url) THEN
        RETURN QUERY SELECT FALSE, 'Invalid URL format'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Function to check for duplicate indicators
CREATE OR REPLACE FUNCTION data.check_duplicate_indicators(user_id_param UUID, indicator_id_param TEXT)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    existing_indicator_id UUID,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TRUE AS is_duplicate,
        id AS existing_indicator_id,
        1.0::FLOAT AS similarity_score
    FROM public.sdi_indicators
    WHERE user_id = user_id_param
    AND indicator_id = indicator_id_param

    UNION ALL

    -- Check for semantic duplicates using embedding
    SELECT
        TRUE AS is_duplicate,
        id AS existing_indicator_id,
        (1 - (embedding <=> (
            SELECT embedding FROM public.sdi_indicators
            WHERE user_id = user_id_param AND indicator_id = indicator_id_param
            LIMIT 1
        )))::FLOAT AS similarity_score
    FROM public.sdi_indicators
    WHERE user_id = user_id_param
    AND embedding IS NOT NULL
    AND indicator_id != indicator_id_param
    AND (1 - (embedding <=> (
        SELECT embedding FROM public.sdi_indicators
        WHERE user_id = user_id_param AND indicator_id = indicator_id_param
        LIMIT 1
    ))) > 0.95
    LIMIT 5;

    -- If no results, return not duplicate
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0.0::FLOAT;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Grant execute on validation functions
GRANT EXECUTE ON FUNCTION data.validate_report_structure TO authenticated;
GRANT EXECUTE ON FUNCTION data.validate_sdi_indicator TO authenticated;
GRANT EXECUTE ON FUNCTION data.validate_url TO authenticated;
GRANT EXECUTE ON FUNCTION data.check_duplicate_indicators TO authenticated;

-- Comments
COMMENT ON FUNCTION data.validate_report_structure IS 'Validate paparan report structure';
COMMENT ON FUNCTION data.validate_sdi_indicator IS 'Validate SDI indicator structure';
COMMENT ON FUNCTION data.validate_url IS 'Validate URL format';
COMMENT ON FUNCTION data.check_duplicate_indicators IS 'Check for duplicate or similar indicators';


-- ============================================================================
-- 6. MAINTENANCE VIEWS
-- ============================================================================

-- View for archive statistics
CREATE OR REPLACE VIEW data.archive_statistics AS
SELECT
    'paparan_reports' AS table_name,
    COUNT(*) AS archived_count,
    MIN(created_at) AS oldest_date,
    MAX(created_at) AS newest_date
FROM data.paparan_reports_archive
UNION ALL
SELECT
    'documents',
    COUNT(*),
    MIN(uploaded_at),
    MAX(uploaded_at)
FROM data.documents_archive
UNION ALL
SELECT
    'bappenas_documents',
    COUNT(*),
    MIN(uploaded_at),
    MAX(uploaded_at)
FROM data.bappenas_documents_archive
UNION ALL
SELECT
    'feed_items',
    COUNT(*),
    MIN(published_at),
    MAX(published_at)
FROM data.feed_items_archive;

GRANT SELECT ON data.archive_statistics TO authenticated;

COMMENT ON VIEW data.archive_statistics IS 'Statistics for archived data';


-- View for data quality summary
CREATE OR REPLACE VIEW data.data_quality_summary AS
SELECT
    'reports' AS data_type,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE content IS NOT NULL) AS with_content,
    COUNT(*) FILTER (WHERE delta_summary IS NOT NULL) AS with_delta,
    COUNT(*) FILTER (WHERE urgency_score > 0.7) AS high_urgency,
    AVG(urgency_score) AS avg_urgency_score
FROM public.paparan_reports
UNION ALL
SELECT
    'documents',
    COUNT(*),
    COUNT(*) FILTER (WHERE parsed_text IS NOT NULL),
    COUNT(*) FILTER (WHERE embedding IS NOT NULL),
    0,
    0
FROM public.documents
UNION ALL
SELECT
    'sdi_indicators',
    COUNT(*),
    COUNT(*) FILTER (WHERE definition IS NOT NULL),
    COUNT(*) FILTER (WHERE embedding IS NOT NULL),
    COUNT(*) FILTER (WHERE extraction_confidence = 'HIGH'),
    0
FROM public.sdi_indicators;

GRANT SELECT ON data.data_quality_summary TO authenticated;

COMMENT ON VIEW data.data_quality_summary IS 'Data quality summary for main tables';


-- ============================================================================
-- 7. TRIGGER FOR AUTOMATIC VALIDATION
-- ============================================================================

-- Function to validate report before insert/update
CREATE OR REPLACE FUNCTION data.validate_report_before_save()
RETURNS TRIGGER AS $$
DECLARE
    validation_result RECORD;
BEGIN
    -- Validate report structure
    SELECT * INTO validation_result
    FROM data.validate_report_structure(NEW.content);

    IF NOT validation_result.is_valid THEN
        RAISE EXCEPTION 'Invalid report structure: %', validation_result.error_message;
    END IF;

    -- Validate topic name
    IF NOT public.is_valid_topic_name(NEW.topic) THEN
        RAISE EXCEPTION 'Invalid topic name: contains invalid characters';
    END IF;

    -- Validate region
    IF NOT public.is_valid_region(NEW.region) THEN
        RAISE EXCEPTION 'Invalid region: contains invalid characters';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to paparan_reports
DROP TRIGGER IF EXISTS validate_paparan_report_before_save ON paparan_reports;
CREATE TRIGGER validate_paparan_report_before_save
    BEFORE INSERT OR UPDATE ON paparan_reports
    FOR EACH ROW
    EXECUTE FUNCTION data.validate_report_before_save();

-- Function to validate SDI indicator before insert/update
CREATE OR REPLACE FUNCTION data.validate_sdi_indicator_before_save()
RETURNS TRIGGER AS $$
DECLARE
    validation_result RECORD;
BEGIN
    -- Build indicator data JSONB for validation
    validation_result := data.validate_sdi_indicator(jsonb_build_object(
        'indicator_id', NEW.indicator_id,
        'indicator_name', NEW.indicator_name,
        'definition', NEW.definition,
        'producing_institution', NEW.producing_institution,
        'kl_code', NEW.kl_code,
        'unit', NEW.unit,
        'temporal_resolution', NEW.temporal_resolution,
        'unit_type', NEW.unit_type
    ));

    IF NOT (SELECT is_valid FROM validation_result) THEN
        RAISE EXCEPTION 'Invalid SDI indicator: %',
            (SELECT error_message FROM validation_result);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to sdi_indicators
DROP TRIGGER IF EXISTS validate_sdi_indicator_before_save ON sdi_indicators;
CREATE TRIGGER validate_sdi_indicator_before_save
    BEFORE INSERT OR UPDATE ON sdi_indicators
    FOR EACH ROW
    EXECUTE FUNCTION data.validate_sdi_indicator_before_save();

-- Comments
COMMENT ON FUNCTION data.validate_report_before_save IS 'Validate report before saving';
COMMENT ON FUNCTION data.validate_sdi_indicator_before_save IS 'Validate SDI indicator before saving';


-- ============================================================================
-- 8. SCHEDULED MAINTENANCE (if pg_cron is available)
-- ============================================================================

-- Note: These require pg_cron extension to be enabled
-- Uncomment and run after enabling pg_cron in Supabase

/*
-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
    'daily-data-cleanup',
    '0 2 * * *',
    $$SELECT data.cleanup_old_data();$$
);

-- Schedule weekly archival on Sunday at 3 AM
SELECT cron.schedule(
    'weekly-data-archive',
    '0 3 * * 0',
    $$
    SELECT data.archive_old_reports();
    SELECT data.archive_old_documents();
    SELECT data.archive_old_bappenas_documents();
    $$
);

-- Schedule monitoring cleanup daily at 1 AM
SELECT cron.schedule(
    'daily-monitoring-cleanup',
    '0 1 * * *',
    $$SELECT monitoring.cleanup_old_data();$$
);

-- View scheduled jobs
SELECT jobid, schedule, command
FROM cron.job
ORDER BY jobid;
*/

COMMENT ON SCHEMA data IS 'Data maintenance and archival functions';
