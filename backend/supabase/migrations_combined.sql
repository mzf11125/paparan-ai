-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- user, analyst, admin
  tracked_topics JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paparan reports
CREATE TABLE public.paparan_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  region TEXT DEFAULT 'ASEAN',
  report_type TEXT DEFAULT 'on_demand', -- on_demand, daily
  content JSONB NOT NULL, -- 7-section schema
  delta_summary JSONB,
  previous_report_id UUID REFERENCES paparan_reports(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sources
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paparan_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT,
  source_type TEXT, -- government, news, research, uploaded
  confidence TEXT, -- high, medium, low
  retrieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  parsed_text TEXT,
  metadata JSONB,
  embedding vector(1536),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Developments (for delta tracking)
CREATE TABLE public.developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paparan_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  delta_type TEXT, -- NEW, UPDATED, ESCALATED, DE-ESCALATED
  impact_level TEXT, -- HIGH, MEDIUM, LOW
  entities JSONB,
  source_id UUID REFERENCES sources(id)
);

-- Indexes
CREATE INDEX idx_paparan_user_topic ON paparan_reports(user_id, topic);
CREATE INDEX idx_paparan_created ON paparan_reports(created_at DESC);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat(embedding vector_cosine_ops);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paparan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "users_own_paparan" ON paparan_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_sources" ON sources
  FOR ALL USING (
    paparan_id IN (
      SELECT id FROM paparan_reports WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_developments" ON developments
  FOR ALL USING (
    paparan_id IN (
      SELECT id FROM paparan_reports WHERE user_id = auth.uid()
    )
  );
-- Feed cache (FeedItem object type)
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  summary TEXT,
  url TEXT UNIQUE,
  source TEXT,
  region TEXT,
  topic_tags TEXT[],
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  embedding vector(1536),
  expires_at TIMESTAMPTZ
);

-- Agent memory
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  memory_type TEXT,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ontology link tables
CREATE TABLE IF NOT EXISTS brief_sources (
  brief_id UUID REFERENCES public.paparan_reports(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
  PRIMARY KEY (brief_id, source_id)
);

CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES public.paparan_reports(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, brief_id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  regions TEXT[],
  frequency TEXT DEFAULT 'daily',
  last_triggered TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_embedding ON feed_items USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_feed_url ON feed_items(url);
CREATE INDEX IF NOT EXISTS idx_feed_expires ON feed_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_feed_region ON feed_items(region);

-- RLS
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_feed_read" ON feed_items FOR SELECT USING (true);
CREATE POLICY "users_own_memory" ON agent_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_alerts" ON alerts FOR ALL USING (auth.uid() = user_id);
-- Migration 003: Bappenas Metadata Extraction Tables
-- This migration adds tables for SDI-compliant metadata extraction
-- from RPJMN/Renstra documents with cross-K/L consistency checking

-- Note: Supabase uses gen_random_uuid() (PostgreSQL 13+ native) instead of uuid-ossp

-- 1. Bappenas Documents Table
-- Stores uploaded documents for metadata extraction
CREATE TABLE IF NOT EXISTS bappenas_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_hash TEXT UNIQUE NOT NULL, -- SHA-256 for deduplication
    file_size BIGINT NOT NULL,
    content_type TEXT NOT NULL,
    page_count INTEGER DEFAULT 0,
    extracted_text TEXT,
    metadata JSONB DEFAULT '{}',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for documents
CREATE INDEX idx_bappenas_docs_user ON bappenas_documents(user_id);
CREATE INDEX idx_bappenas_docs_hash ON bappenas_documents(file_hash);
CREATE INDEX idx_bappenas_docs_status ON bappenas_documents(processing_status);
CREATE INDEX idx_bappenas_docs_uploaded ON bappenas_documents(uploaded_at DESC);

-- Row Level Security for documents
ALTER TABLE bappenas_documents ENABLE ROW LEVEL SECURITY;

-- Users can see their own documents
CREATE POLICY "Users can view own documents"
    ON bappenas_documents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON bappenas_documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON bappenas_documents
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON bappenas_documents
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. SDI Indicators Table
-- Stores extracted SDI-compliant indicators
CREATE TABLE IF NOT EXISTS sdi_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES bappenas_documents(id) ON DELETE CASCADE,

    -- Identitas (Identity)
    indicator_id TEXT NOT NULL,
    indicator_name TEXT NOT NULL,
    indicator_name_en TEXT DEFAULT '',

    -- Definisi (Definition)
    definition TEXT NOT NULL,
    methodology TEXT DEFAULT '',

    -- Produsen Data (Data Producer)
    producing_institution TEXT NOT NULL,
    kl_code TEXT NOT NULL, -- 3-digit KL code

    -- Spasio Waktu (Spatial & Temporal)
    spatial_coverage TEXT DEFAULT '',
    temporal_coverage TEXT DEFAULT '',
    temporal_resolution TEXT DEFAULT 'annual' CHECK (temporal_resolution IN (
        'realtime', 'hourly', 'daily', 'weekly', 'monthly',
        'quarterly', 'semiannual', 'annual', 'biennial', 'quinary'
    )),

    -- Unit (Measurement Unit)
    unit TEXT NOT NULL,
    unit_type TEXT DEFAULT 'nominal' CHECK (unit_type IN (
        'nominal', 'ratio', 'index', 'count', 'percentage', 'rate', 'duration', 'currency'
    )),

    -- Ketersediaan (Availability)
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN (
        'available', 'partial', 'scheduled', 'discontinued'
    )),
    last_updated TIMESTAMPTZ,

    -- Recommended fields
    sector TEXT DEFAULT '',
    sub_sector TEXT DEFAULT '',
    sdi_goal_code TEXT DEFAULT '',
    sdg_code TEXT DEFAULT '',
    data_quality_notes TEXT DEFAULT '',
    extraction_confidence TEXT DEFAULT 'MEDIUM' CHECK (extraction_confidence IN ('HIGH', 'MEDIUM', 'LOW')),

    -- Source tracking
    source_page_number INTEGER,
    source_excerpt TEXT DEFAULT '',

    -- Embedding for semantic search
    embedding VECTOR(1536),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Full-text search vector for Indonesian text
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('indonesian', coalesce(indicator_name, '')), 'A') ||
        setweight(to_tsvector('indonesian', coalesce(definition, '')), 'B') ||
        setweight(to_tsvector('indonesian', coalesce(producing_institution, '')), 'C')
    ) STORED
);

-- Indexes for indicators
CREATE INDEX idx_sdi_indicators_user ON sdi_indicators(user_id);
CREATE INDEX idx_sdi_indicators_doc ON sdi_indicators(document_id);
CREATE INDEX idx_sdi_indicators_id ON sdi_indicators(indicator_id);
CREATE INDEX idx_sdi_indicators_kl ON sdi_indicators(kl_code);
CREATE INDEX idx_sdi_indicators_sector ON sdi_indicators(sector);
CREATE INDEX idx_sdi_indicators_confidence ON sdi_indicators(extraction_confidence);
CREATE INDEX idx_sdi_indicators_embedding ON sdi_indicators USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100); -- ivfflat for approximate nearest neighbor
CREATE INDEX idx_sdi_indicators_search ON sdi_indicators USING GIN (search_vector);

-- Unique constraint on indicator_id per user to avoid exact duplicates
CREATE UNIQUE INDEX idx_sdi_indicators_unique_id ON sdi_indicators(user_id, indicator_id);

-- Row Level Security for indicators
ALTER TABLE sdi_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own indicators"
    ON sdi_indicators
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own indicators"
    ON sdi_indicators
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own indicators"
    ON sdi_indicators
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own indicators"
    ON sdi_indicators
    FOR DELETE
    USING (auth.uid() = user_id);


-- 3. Extraction Jobs Table
-- Tracks async metadata extraction jobs
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES bappenas_documents(id) ON DELETE CASCADE,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT DEFAULT '',

    result_indicators_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    retry_count INTEGER DEFAULT 0
);

-- Indexes for jobs
CREATE INDEX idx_extraction_jobs_user ON extraction_jobs(user_id);
CREATE INDEX idx_extraction_jobs_doc ON extraction_jobs(document_id);
CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_created ON extraction_jobs(created_at DESC);

-- Row Level Security for jobs
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
    ON extraction_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
    ON extraction_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- 4. Consistency Flags Table
-- Stores cross-K/L consistency issues
CREATE TABLE IF NOT EXISTS consistency_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    indicator_a_id UUID REFERENCES sdi_indicators(id) ON DELETE CASCADE,
    indicator_b_id UUID REFERENCES sdi_indicators(id) ON DELETE CASCADE,

    indicator_a_name TEXT NOT NULL,
    indicator_b_name TEXT NOT NULL,

    conflict_type TEXT NOT NULL CHECK (conflict_type IN (
        'duplicate', 'unit_mismatch', 'definition_inconsistency',
        'temporal_inconsistency', 'kl_code_mismatch'
    )),

    similarity_score REAL NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),

    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',

    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT DEFAULT ''
);

-- Indexes for consistency flags
CREATE INDEX idx_consistency_flags_user ON consistency_flags(user_id);
CREATE INDEX idx_consistency_flags_indicator_a ON consistency_flags(indicator_a_id);
CREATE INDEX idx_consistency_flags_indicator_b ON consistency_flags(indicator_b_id);
CREATE INDEX idx_consistency_flags_status ON consistency_flags(status);
CREATE INDEX idx_consistency_flags_similarity ON consistency_flags(similarity_score DESC);

-- Row Level Security for consistency flags
ALTER TABLE consistency_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flags"
    ON consistency_flags
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flags"
    ON consistency_flags
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flags"
    ON consistency_flags
    FOR UPDATE
    USING (auth.uid() = user_id OR resolved_by = auth.uid());


-- 5. KL Code Reference Table
-- Lookup table for Kementrian/Lembaga codes
CREATE TABLE IF NOT EXISTS kl_code_reference (
    code TEXT PRIMARY KEY, -- 3-digit code
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('Kementrian', 'Lembaga')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for KL codes
INSERT INTO kl_code_reference (code, name, category) VALUES
    ('001', 'Kementrian Dalam Negeri', 'Kementrian'),
    ('002', 'Kementrian Luar Negeri', 'Kementrian'),
    ('003', 'Kementrian Pertahanan', 'Kementrian'),
    ('004', 'Kementrian Hukum dan Hak Asasi Manusia', 'Kementrian'),
    ('005', 'Kementrian Keuangan', 'Kementrian'),
    ('006', 'Kementrian Pendidikan Dasar dan Menengah', 'Kementrian'),
    ('007', 'Kementrian Kesehatan', 'Kementrian'),
    ('008', 'Kementrian Sosial', 'Kementrian'),
    ('009', 'Kementrian Tenaga Kerja', 'Kementrian'),
    ('010', 'Kementrian Pariwisata dan Ekonomi Kreatif', 'Kementrian'),
    ('011', 'Kementrian Perdagangan', 'Kementrian'),
    ('012', 'Kementrian Pertanian', 'Kementrian'),
    ('013', 'Kementrian Kelautan dan Perikanan', 'Kementrian'),
    ('014', 'Kementrian Energi dan Sumber Daya Mineral', 'Kementrian'),
    ('015', 'Kementrian Industri', 'Kementrian'),
    ('016', 'Kementrian Perhubungan', 'Kementrian'),
    ('017', 'Kementrian Komunikasi dan Informatika', 'Kementrian'),
    ('018', 'Kementrian Badan Usaha Milik Negara', 'Kementrian'),
    ('019', 'Kementrian Agraria dan Tata Ruang', 'Kementrian'),
    ('020', 'Kementrian Lingkungan Hidup dan Kehutanan', 'Kementrian'),
    ('021', 'Kementrian Koperasi dan UKM', 'Kementrian'),
    ('022', 'Kementrian Pemberdayaan Perempuan dan Perlindungan Anak', 'Kementrian'),
    ('023', 'Kementrian Pemberdayaan Aparatur Negara dan Reformasi Birokrasi', 'Kementrian'),
    ('024', 'Kementrian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi', 'Kementrian'),
    ('025', 'Kementrian Agama', 'Kementrian'),
    ('026', 'Kementrian Koordinator Bidang Politik, Hukum, dan Keamanan', 'Kementrian'),
    ('027', 'Kementrian Koordinator Bidang Ekonomi', 'Kementrian'),
    ('028', 'Kementrian Koordinator Bidang Pembangunan Manusia dan Kebudayaan', 'Kementrian'),
    ('029', 'Kementrian Koordinator Bidang Kemaritiman dan Investasi', 'Kementrian'),
    ('030', 'Kementrian Investasi/BKPM', 'Kementrian'),
    ('101', 'Bappenas', 'Lembaga'),
    ('102', 'Badan Pusat Statistik', 'Lembaga'),
    ('103', 'Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah', 'Lembaga'),
    ('104', 'Badan Pengelola Keuangan Haji', 'Lembaga'),
    ('105', 'Badan Pengawas Perdagangan Berjangka Komoditi', 'Lembaga'),
    ('106', 'Badan Pengawas Tenaga Nuklir', 'Lembaga'),
    ('107', 'Badan Tenaga Nuklir Nasional', 'Lembaga'),
    ('108', 'Badan Pengkajian dan Penerapan Teknologi', 'Lembaga'),
    ('109', 'Badan Riset dan Inovasi Nasional', 'Lembaga'),
    ('110', 'Badan Informasi Geospasial', 'Lembaga'),
    ('111', 'Badan Pengawas Pemilihan Umum', 'Lembaga'),
    ('112', 'Komisi Pemilihan Umum', 'Lembaga'),
    ('113', 'Badan Pengawasan Keuangan dan Pembangunan', 'Lembaga'),
    ('114', 'Badan Pemeriksa Keuangan', 'Lembaga'),
    ('115', 'Badan Nasional Penanggulangan Bencana', 'Lembaga'),
    ('116', 'Badan Narkotika Nasional', 'Lembaga'),
    ('117', 'Otoritas Jasa Keuangan', 'Lembaga'),
    ('118', 'Lembaga Penjamin Simpanan', 'Lembaga'),
    ('119', 'Badan Pengelola Transportasi Jabodetabek', 'Lembaga'),
    ('120', 'Lembaga Penyiaran Publik RRI', 'Lembaga'),
    ('121', 'Lembaga Penyiaran Publik TVRI', 'Lembaga'),
    ('122', 'Badan Standardisasi dan Kebijakan Jasa Industri', 'Lembaga'),
    ('123', 'Badan Pengawas Obat dan Makanan', 'Lembaga'),
    ('124', 'Komisi Pengawas Persaingan Usaha', 'Lembaga'),
    ('125', 'Komisi Pemberantasan Korupsi', 'Lembaga'),
    ('126', 'Komisi Nasional Hak Asasi Manusia', 'Lembaga'),
    ('127', 'Komisi Informasi', 'Lembaga'),
    ('128', 'Komisi Pengawas Persaingan Usaha Daerah', 'Lembaga'),
    ('129', 'Ombudsman Republik Indonesia', 'Lembaga'),
    ('130', 'Komisi Aparatur Sipil Negara', 'Lembaga'),
    ('131', 'Komisi Nasional Lanjut Usia', 'Lembaga'),
    ('132', 'Komisi Nasional Disabilitas', 'Lembaga'),
    ('133', 'Komisi Nasional Anti Kekerasan terhadap Perempuan', 'Lembaga'),
    ('134', 'Komisi Nasional Kekekerasan Anak', 'Lembaga'),
    ('135', 'Komisi Pengawas Persaingan Usaha 2', 'Lembaga'),
    ('136', 'Arsip Nasional Republik Indonesia', 'Lembaga'),
    ('137', 'Perpustakaan Nasional', 'Lembaga'),
    ('138', 'Badan Meteorologi, Klimatologi, dan Geofisika', 'Lembaga'),
    ('139', 'Badan Standardisasi Nasional', 'Lembaga'),
    ('140', 'Badan Ketahanan Pangan', 'Lembaga'),
    ('141', 'Badan Narkotika Nasional 2', 'Lembaga'),
    ('142', 'Badan Nasional Pengelola Perbatasan', 'Lembaga'),
    ('143', 'Komisi Nasional Anti Kekerasan terhadap Perempuan 2', 'Lembaga'),
    ('144', 'Komisi Pengawas Persaingan Usaha Daerah 2', 'Lembaga'),
    ('145', 'Badan Pembinaan Ideologi Pancasila', 'Lembaga'),
    ('146', 'Badan Intelijen Negara', 'Lembaga'),
    ('147', 'Badan Siber dan Sandi Negara', 'Lembaga'),
    ('148', 'Kementrian Investasi/BKPM 2', 'Lembaga')
ON CONFLICT (code) DO NOTHING;


-- 6. Sector Reference Table
-- Lookup table for sector codes per Perpres 195/2024
CREATE TABLE IF NOT EXISTS sector_reference (
    code TEXT PRIMARY KEY, -- 2-digit code
    name TEXT NOT NULL UNIQUE,
    parent_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sector_reference (code, name, parent_code) VALUES
    ('01', 'Ekonomi', NULL),
    ('02', 'Sosial', NULL),
    ('03', 'Politik', NULL),
    ('04', 'Pertahanan', NULL),
    ('05', 'Hukum', NULL),
    ('06', 'Pendidikan', NULL),
    ('07', 'Kesehatan', NULL),
    ('08', 'Pembangunan', NULL),
    ('09', 'Lingkungan', NULL),
    ('10', 'Pertanian', NULL),
    ('11', 'Kelautan', NULL),
    ('12', 'Energi', NULL),
    ('13', 'Industri', NULL),
    ('14', 'Perhubungan', NULL),
    ('15', 'Komunikasi', NULL),
    ('16', 'Pariwisata', NULL),
    ('17', 'Keuangan', NULL),
    ('18', 'Tenaga Kerja', NULL),
    ('19', 'Pemberdayaan', NULL)
ON CONFLICT (code) DO NOTHING;


-- 7. SDI Goal Reference Table
-- Lookup table for SDI goals per Perpres 195/2024
CREATE TABLE IF NOT EXISTS sdi_goal_reference (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sdi_goal_reference (code, description) VALUES
    ('SDI 1', 'Memperkuat data untuk pembangunan SDGs'),
    ('SDI 2', 'Memperkuat data untuk pembangunan berkelanjutan'),
    ('SDI 3', 'Memperkuat data untuk pembangunan inklusif'),
    ('SDI 4', 'Memperkuat data untuk pembangunan berbasis wilayah'),
    ('SDI 5', 'Memperkuat data untuk pemerintahan berbasis data')
ON CONFLICT (code) DO NOTHING;


-- 8. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to sdi_indicators
DROP TRIGGER IF EXISTS update_sdi_indicators_updated_at ON sdi_indicators;
CREATE TRIGGER update_sdi_indicators_updated_at
    BEFORE UPDATE ON sdi_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 9. Function for full-text search on indicators
CREATE OR REPLACE FUNCTION search_indicators_by_text(search_query TEXT)
RETURNS TABLE (
    id UUID,
    indicator_name TEXT,
    definition TEXT,
    producing_institution TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sdi.id,
        sdi.indicator_name,
        sdi.definition,
        sdi.producing_institution,
        ts_rank(sdi.search_vector, plainto_tsquery('indonesian', search_query)) AS rank
    FROM sdi_indicators sdi
    WHERE sdi.search_vector @@ plainto_tsquery('indonesian', search_query)
    ORDER BY rank DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;


-- 10. Function to find similar indicators by embedding
CREATE OR REPLACE FUNCTION find_similar_indicators(
    query_embedding VECTOR(1536),
    user_id_param UUID,
    threshold FLOAT DEFAULT 0.85,
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    indicator_id TEXT,
    indicator_name TEXT,
    producing_institution TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sdi.id,
        sdi.indicator_id,
        sdi.indicator_name,
        sdi.producing_institution,
        1 - (sdi.embedding <=> query_embedding) AS similarity
    FROM sdi_indicators sdi
    WHERE sdi.user_id = user_id_param
      AND sdi.embedding IS NOT NULL
      AND (1 - (sdi.embedding <=> query_embedding)) >= threshold
    ORDER BY similarity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


COMMENT ON TABLE bappenas_documents IS 'Stores uploaded RPJMN/Renstra documents for metadata extraction';
COMMENT ON TABLE sdi_indicators IS 'Stores extracted SDI-compliant indicators with embeddings';
COMMENT ON TABLE extraction_jobs IS 'Tracks async metadata extraction jobs';
COMMENT ON TABLE consistency_flags IS 'Stores cross-K/L consistency issues between indicators';
COMMENT ON TABLE kl_code_reference IS 'Lookup table for Kementrian/Lembaga codes (Perpres 195/2024)';
COMMENT ON TABLE sector_reference IS 'Lookup table for sector codes (Perpres 195/2024)';
COMMENT ON TABLE sdi_goal_reference IS 'Lookup table for SDI goals (Perpres 195/2024)';
-- Migration 004: RPJMN alignment, brief versions, outcomes, ref sequence

-- Ref number sequence for diplomat briefs
CREATE SEQUENCE IF NOT EXISTS paparan_ref_seq START 1;

-- Add columns to paparan_reports
ALTER TABLE paparan_reports
  ADD COLUMN IF NOT EXISTS urgency_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_score TEXT DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS rpjmn_alignment JSONB,
  ADD COLUMN IF NOT EXISTS diplomat_meta JSONB;

-- Brief versions table
CREATE TABLE IF NOT EXISTS brief_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  version_num INT NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  diff_summary TEXT DEFAULT '',
  urgency_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brief_versions_brief ON brief_versions(brief_id);

ALTER TABLE brief_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_versions" ON brief_versions FOR ALL
  USING (brief_id IN (SELECT id FROM paparan_reports WHERE user_id = auth.uid()));

-- Brief outcomes table
CREATE TABLE IF NOT EXISTS brief_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  outcome_notes TEXT DEFAULT '',
  action_taken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brief_outcomes_brief ON brief_outcomes(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_outcomes_user ON brief_outcomes(user_id);

ALTER TABLE brief_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_outcomes" ON brief_outcomes FOR ALL USING (auth.uid() = user_id);

-- RPJMN alignment table (for querying by pillar)
CREATE TABLE IF NOT EXISTS rpjmn_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  pillar_id TEXT NOT NULL,
  score FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rpjmn_brief ON rpjmn_alignments(brief_id);
CREATE INDEX IF NOT EXISTS idx_rpjmn_pillar ON rpjmn_alignments(pillar_id);

ALTER TABLE rpjmn_alignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_rpjmn" ON rpjmn_alignments FOR ALL
  USING (brief_id IN (SELECT id FROM paparan_reports WHERE user_id = auth.uid()));
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for documents storage
CREATE POLICY "users_can_upload_documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_can_view_own_documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_can_delete_own_documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
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
