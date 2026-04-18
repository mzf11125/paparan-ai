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
