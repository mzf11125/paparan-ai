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
