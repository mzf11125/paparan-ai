-- Migration 012: RDTII Regulatory Evidence
-- Stores clause-level evidence extracted from policy documents mapped to RDTII pillars

CREATE TABLE IF NOT EXISTS rdtii_evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id        UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
    source_url      TEXT NOT NULL DEFAULT '',
    clause_text     TEXT NOT NULL,
    pillar_id       TEXT NOT NULL CHECK (pillar_id IN ('P1','P2','P3','P4','P5','P6','P7')),
    indicator_code  TEXT NOT NULL,   -- e.g. '6.1', '3.2'
    country         TEXT NOT NULL DEFAULT '',
    confidence      TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (confidence IN ('HIGH','MEDIUM','LOW')),
    extracted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rdtii_evidence_brief_id_idx ON rdtii_evidence (brief_id);
CREATE INDEX IF NOT EXISTS rdtii_evidence_pillar_id_idx ON rdtii_evidence (pillar_id);
CREATE INDEX IF NOT EXISTS rdtii_evidence_country_idx  ON rdtii_evidence (country);

-- RLS: users can only read evidence linked to their own briefs
ALTER TABLE rdtii_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY rdtii_evidence_select ON rdtii_evidence
    FOR SELECT USING (
        brief_id IN (
            SELECT id FROM paparan_reports WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY rdtii_evidence_insert ON rdtii_evidence
    FOR INSERT WITH CHECK (
        brief_id IN (
            SELECT id FROM paparan_reports WHERE user_id = auth.uid()::text
        )
    );
