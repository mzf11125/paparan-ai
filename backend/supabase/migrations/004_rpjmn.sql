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
