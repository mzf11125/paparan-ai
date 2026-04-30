-- Migration 008: Performance Optimization
-- This migration adds:
-- - HNSW indexes for vector similarity search (upgrade from ivfflat)
-- - Composite indexes for common query patterns
-- - JSONB GIN indexes for metadata queries
-- - Partial indexes for filtered queries
-- - Covering indexes for hot queries

-- ============================================================================
-- 1. UPGRADE TO HNSW INDEXES FOR VECTOR SEARCH
-- ============================================================================

-- Note: HNSW (Hierarchical Navigable Small World) provides better performance
-- for vector similarity search compared to ivfflat, especially for high-dimensional
-- vectors and large datasets. HNSW supports faster queries with better recall.

-- Drop old ivfflat indexes and create HNSW indexes for documents
DROP INDEX IF EXISTS idx_documents_embedding;
CREATE INDEX idx_documents_embedding_hnsw
    ON documents USING hnsw(embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Drop old ivfflat indexes and create HNSW indexes for feed_items
DROP INDEX IF EXISTS idx_feed_embedding;
CREATE INDEX idx_feed_embedding_hnsw
    ON feed_items USING hnsw(embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Drop old ivfflat indexes and create HNSW indexes for sdi_indicators
DROP INDEX IF EXISTS idx_sdi_indicators_embedding;
CREATE INDEX idx_sdi_indicators_embedding_hnsw
    ON sdi_indicators USING hnsw(embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Comments for HNSW indexes
COMMENT ON INDEX idx_documents_embedding_hnsw IS 'HNSW index for document vector similarity search (cosine)';
COMMENT ON INDEX idx_feed_embedding_hnsw IS 'HNSW index for feed item vector similarity search (cosine)';
COMMENT ON INDEX idx_sdi_indicators_embedding_hnsw IS 'HNSW index for SDI indicator vector similarity search (cosine)';


-- ============================================================================
-- 2. COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Paparan reports: Regional reports with ordering (common filter + sort)
-- Note: Partial index with NOW() not supported, using full index
CREATE INDEX idx_paparan_region_created
    ON paparan_reports(region, created_at DESC);

-- Paparan reports: User reports with type and ordering
CREATE INDEX idx_paparan_user_type_created
    ON paparan_reports(user_id, report_type, created_at DESC);

-- Paparan reports: High urgency reports (partial index)
CREATE INDEX idx_paparan_high_urgency
    ON paparan_reports(user_id, urgency_score DESC, created_at DESC)
    WHERE urgency_score > 0.7;

-- Paparan reports: Daily reports with date ordering
CREATE INDEX idx_paparan_daily_created
    ON paparan_reports(report_type, created_at DESC)
    WHERE report_type = 'daily';

-- Sources: Source type filtering with retrieval date
CREATE INDEX idx_sources_type_retrieved
    ON sources(source_type, retrieved_at DESC);

-- Sources: Confidence filtering
CREATE INDEX idx_sources_confidence
    ON sources(confidence, retrieved_at DESC)
    WHERE confidence IN ('high', 'medium');

-- Documents: User documents with metadata filtering and upload date
-- Note: Partial index with NOW() not supported, using full index
CREATE INDEX idx_documents_user_created
    ON documents(user_id, uploaded_at DESC);

-- SDI indicators: Sector filtering with temporal resolution
CREATE INDEX idx_sdi_sector_temporal
    ON sdi_indicators(sector, temporal_resolution, created_at DESC)
    WHERE sector != '';

-- SDI indicators: KL code filtering
CREATE INDEX idx_sdi_kl_created
    ON sdi_indicators(kl_code, created_at DESC);

-- SDI indicators: Extraction confidence filtering
CREATE INDEX idx_sdi_confidence_created
    ON sdi_indicators(extraction_confidence, created_at DESC)
    WHERE extraction_confidence IN ('HIGH', 'MEDIUM');

-- Alerts: User alerts with frequency and last triggered
CREATE INDEX idx_alerts_user_frequency
    ON alerts(user_id, frequency, last_triggered)
    WHERE frequency IN ('daily', 'weekly', 'monthly');

-- Extraction jobs: Status monitoring with creation date
CREATE INDEX idx_extraction_jobs_status_created
    ON extraction_jobs(status, created_at DESC);

-- Extraction jobs: User's active jobs
CREATE INDEX idx_extraction_jobs_user_active
    ON extraction_jobs(user_id, status, created_at DESC)
    WHERE status IN ('pending', 'processing');

-- Consistency flags: Open flags by user with similarity score
CREATE INDEX idx_consistency_flags_user_open
    ON consistency_flags(user_id, status, similarity_score DESC)
    WHERE status IN ('open', 'in_review');

-- Brief outcomes: User outcomes with action taken
CREATE INDEX idx_brief_outcomes_user_action
    ON brief_outcomes(user_id, action_taken, created_at DESC)
    WHERE action_taken = FALSE;

-- Feed items: Region-based queries with expiration
-- Note: Partial index with NOW() not supported, using full index
CREATE INDEX idx_feed_region_expires
    ON feed_items(region, expires_at DESC);

-- Feed items: Source-based queries
-- Note: Partial index with NOW() not supported, using full index
CREATE INDEX idx_feed_source_published
    ON feed_items(source, published_at DESC);

-- Brief versions: Version history ordering
CREATE INDEX idx_brief_versions_brief_version
    ON brief_versions(brief_id, version_num DESC);

-- RPJMN alignments: Pillar-based queries with score
CREATE INDEX idx_rpjmn_pillar_score
    ON rpjmn_alignments(pillar_id, score DESC);


-- ============================================================================
-- 3. JSONB GIN INDEXES FOR METADATA QUERIES
-- ============================================================================

-- GIN index for document metadata (supports @>, ?, ?& operators)
CREATE INDEX idx_documents_metadata
    ON documents USING GIN (metadata);

-- GIN index for report content (supports JSONB queries)
CREATE INDEX idx_paparan_content
    ON paparan_reports USING GIN (content);

-- GIN index for report delta_summary
CREATE INDEX idx_paparan_delta
    ON paparan_reports USING GIN (delta_summary)
    WHERE delta_summary IS NOT NULL;

-- GIN index for report rpjmn_alignment
CREATE INDEX idx_paparan_rpjmn
    ON paparan_reports USING GIN (rpjmn_alignment)
    WHERE rpjmn_alignment IS NOT NULL;

-- GIN index for report diplomat_meta
CREATE INDEX idx_paparan_diplomat_meta
    ON paparan_reports USING GIN (diplomat_meta)
    WHERE diplomat_meta IS NOT NULL;

-- GIN index for bappenas_documents metadata
CREATE INDEX idx_bappenas_metadata
    ON bappenas_documents USING GIN (metadata);

-- GIN index for sdi_indicators search_vector (already exists, adding comment)
COMMENT ON INDEX idx_sdi_indicators_search IS 'GIN index for full-text search on SDI indicators';

-- GIN index for consistency_flags details
CREATE INDEX idx_consistency_flags_details
    ON consistency_flags USING GIN (details);

-- GIN index for user tracked_topics
CREATE INDEX idx_users_tracked_topics
    ON users USING GIN (tracked_topics);

-- GIN index for developments entities
CREATE INDEX idx_developments_entities
    ON developments USING GIN (entities)
    WHERE entities IS NOT NULL;


-- ============================================================================
-- 4. COVERING INDEXES FOR HOT QUERIES
-- ============================================================================

-- Covering index for recent reports list (includes commonly accessed columns)
CREATE INDEX idx_paparan_user_recent_covering
    ON paparan_reports(user_id, created_at DESC)
    INCLUDE (topic, region, report_type, urgency_score, source_count);

-- Covering index for document listing
CREATE INDEX idx_documents_user_list_covering
    ON documents(user_id, uploaded_at DESC)
    INCLUDE (file_name, metadata);

-- Covering index for feed items listing
-- Note: Partial index with NOW() not supported, using full index
CREATE INDEX idx_feed_list_covering
    ON feed_items(published_at DESC)
    INCLUDE (title, summary, source, region);


-- ============================================================================
-- 5. TRIGGER INDEXES FOR UPDATED_AT
-- ============================================================================

-- Note: These ensure the update_updated_at_column trigger is efficient
-- The trigger function already exists from migration 003

-- Ensure trigger exists on all tables with updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to sdi_indicators (already has trigger, re-creating for safety)
DROP TRIGGER IF EXISTS update_sdi_indicators_updated_at ON sdi_indicators;
CREATE TRIGGER update_sdi_indicators_updated_at
    BEFORE UPDATE ON sdi_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_roles (new table from migration 006)
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 6. INDEX MAINTENANCE FUNCTIONS
-- ============================================================================

-- Create maintenance schema
CREATE SCHEMA IF NOT EXISTS maintenance;

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION maintenance.analyze_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('ANALYZE %I', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reindex a specific index
CREATE OR REPLACE FUNCTION maintenance.reindex_index(index_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('REINDEX INDEX CONCURRENTLY IF EXISTS %I', index_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION maintenance.get_index_usage()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || relname::TEXT AS table_name,
        indexrelname::TEXT AS index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        COALESCE(idx_scan, 0) AS index_scans,
        COALESCE(idx_tup_read, 0) AS tuples_read,
        COALESCE(idx_tup_fetch, 0) AS tuples_fetched
    FROM pg_stat_user_indexes
    WHERE schemaname IN ('public', 'audit', 'monitoring', 'rate_limit')
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find unused indexes
CREATE OR REPLACE FUNCTION maintenance.find_unused_indexes()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || relname::TEXT AS table_name,
        indexrelname::TEXT AS index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey'
    AND schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on maintenance functions to admins
REVOKE ALL ON FUNCTION maintenance.analyze_table FROM PUBLIC;
REVOKE ALL ON FUNCTION maintenance.reindex_index FROM PUBLIC;
REVOKE ALL ON FUNCTION maintenance.get_index_usage FROM PUBLIC;
REVOKE ALL ON FUNCTION maintenance.find_unused_indexes FROM PUBLIC;

GRANT EXECUTE ON FUNCTION maintenance.analyze_table TO authenticated;
GRANT EXECUTE ON FUNCTION maintenance.reindex_index TO authenticated;
GRANT EXECUTE ON FUNCTION maintenance.get_index_usage TO authenticated;
GRANT EXECUTE ON FUNCTION maintenance.find_unused_indexes TO authenticated;

-- Comments
COMMENT ON SCHEMA maintenance IS 'Database maintenance functions and procedures';
COMMENT ON FUNCTION maintenance.analyze_table IS 'Analyze table statistics for query optimization';
COMMENT ON FUNCTION maintenance.reindex_index IS 'Rebuild an index concurrently';
COMMENT ON FUNCTION maintenance.get_index_usage IS 'Get index usage statistics';
COMMENT ON FUNCTION maintenance.find_unused_indexes IS 'Find indexes that have never been used';


-- ============================================================================
-- 7. QUERY PERFORMANCE VIEW
-- ============================================================================

-- Create view for index summary
CREATE OR REPLACE VIEW maintenance.index_summary AS
SELECT
    psi.schemaname || '.' || psi.relname::TEXT AS table_name,
    psi.indexrelname::TEXT AS index_name,
        CASE
            WHEN psi.indexrelname LIKE '%hnsw%' THEN 'HNSW (vector)'
            WHEN psi.indexrelname LIKE '%gin%' THEN 'GIN (JSONB/FTS)'
            WHEN psi.indexrelname LIKE '%_pkey' THEN 'Primary Key'
            WHEN pi.indexdef LIKE '%WHERE%' THEN 'Partial'
            ELSE 'B-Tree'
        END AS index_type,
    pg_size_pretty(pg_relation_size(psi.indexrelid)) AS index_size,
    COALESCE(psi.idx_scan, 0) AS index_scans,
    COALESCE(psi.idx_tup_read, 0) AS tuples_read,
    COALESCE(psi.idx_tup_fetch, 0) AS tuples_fetched,
    pi.indexdef AS index_definition
FROM pg_stat_user_indexes psi
JOIN pg_indexes pi ON psi.schemaname = pi.schemaname AND psi.indexrelname = pi.indexname
WHERE psi.schemaname IN ('public', 'audit', 'monitoring', 'rate_limit')
ORDER BY pg_relation_size(psi.indexrelid) DESC;

GRANT SELECT ON maintenance.index_summary TO authenticated;

COMMENT ON VIEW maintenance.index_summary IS 'Summary of all indexes with usage statistics';


-- ============================================================================
-- 8. VACUUM AND ANALYZE SCHEDULING
-- ============================================================================

-- Note: Autovacuum is enabled by default in Supabase/PostgreSQL
-- This function can be called manually or via pg_cron if available

CREATE OR REPLACE FUNCTION maintenance.vacuum_analyze_tables()
RETURNS TABLE (
    table_name TEXT,
    status TEXT
) AS $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('VACUUM ANALYZE %I', tbl.tablename);
        RETURN QUERY SELECT tbl.tablename::TEXT, 'completed'::TEXT;
        RETURN;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION maintenance.vacuum_analyze_tables TO authenticated;

COMMENT ON FUNCTION maintenance.vacuum_analyze_tables IS 'Run VACUUM ANALYZE on all public tables';


-- ============================================================================
-- 9. POSTGRESQL CONFIGURATION RECOMMENDATIONS
-- ============================================================================

-- Note: These settings are recommendations for Supabase dashboard configuration
-- They cannot be set via SQL in Supabase but should be configured in the dashboard

/*
Recommended PostgreSQL settings for vector workloads:

1. shared_buffers: 2GB - 4GB (25% of available RAM)
2. effective_cache_size: 4GB - 8GB (50% of available RAM)
3. maintenance_work_mem: 512MB - 1GB
4. work_mem: 16MB - 32MB
5. max_parallel_workers_per_gather: 2-4
6. max_parallel_workers: 4-8
7. random_page_cost: 1.1 (for SSD storage)
8. effective_io_concurrency: 200 (for SSD storage)

For HNSW indexes specifically:
- No special configuration needed
- HNSW is optimized for high-dimensional vectors
- Default m=16 and ef_construction=64 provide good balance

To configure these, go to:
Supabase Dashboard > Project > Settings > Database > Configuration
*/
