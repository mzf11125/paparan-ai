-- Migration 003: Bappenas Metadata Extraction Tables
-- This migration adds tables for SDI-compliant metadata extraction
-- from RPJMN/Renstra documents with cross-K/L consistency checking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bappenas Documents Table
-- Stores uploaded documents for metadata extraction
CREATE TABLE IF NOT EXISTS bappenas_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    ('135', 'Komisi Pengawas Persaingan Usaha', 'Lembaga'),
    ('136', 'Arsip Nasional Republik Indonesia', 'Lembaga'),
    ('137', 'Perpustakaan Nasional', 'Lembaga'),
    ('138', 'Badan Meteorologi, Klimatologi, dan Geofisika', 'Lembaga'),
    ('139', 'Badan Standardisasi Nasional', 'Lembaga'),
    ('140', 'Badan Ketahanan Pangan', 'Lembaga'),
    ('141', 'Badan Narkotika Nasional', 'Lembaga'),
    ('142', 'Badan Nasional Pengelola Perbatasan', 'Lembaga'),
    ('143', 'Komisi Nasional Anti Kekerasan terhadap Perempuan', 'Lembaga'),
    ('144', 'Komisi Pengawas Persaingan Usaha Daerah', 'Lembaga'),
    ('145', 'Badan Pembinaan Ideologi Pancasila', 'Lembaga'),
    ('146', 'Badan Intelijen Negara', 'Lembaga'),
    ('147', 'Badan Siber dan Sandi Negara', 'Lembaga'),
    ('148', 'Kementrian Investasi/BKPM', 'Lembaga')
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
