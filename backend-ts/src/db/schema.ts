// Schema types mirroring Python backend/app/db/schema.py

export type Impact = "HIGH" | "MEDIUM" | "LOW";
export type Delta = "NEW" | "UPDATED" | "ESCALATED" | "DE-ESCALATED";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Classification = "unclassified" | "official" | "confidential" | "secret";

export interface Source {
  id: string;
  title: string;
  url: string;
  confidence: Confidence;
  date: string;
}

export interface Development {
  id: string;
  text: string;
  impact: Impact;
  delta: Delta;
  sourceId: string;
  date?: string;
  entities?: string[];
}

export interface Action {
  priority: Impact;
  text: string;
  owner?: string;
  deadline?: string;
}

export interface RdtiiEvidence {
  id: string;
  brief_id: string;
  source_url: string;
  clause_text: string;
  pillar_id: string;       // P1–P7
  indicator_code: string;  // e.g. "6.1"
  country: string;
  confidence: Confidence;
  extracted_at: string;
}

export interface PolicyBrief {
  id: string;
  title: string;
  date: string;
  region: string;
  lastUpdated?: string;
  classification: Classification;
  executiveSummary: string[];
  currentSituation: string;
  developments: Development[];
  implications: string;
  risks: string[];
  opportunities: string[];
  actions: Action[];
  sources: Source[];
  tags: string[];
  rpjmn_alignment?: Record<string, number>;
  rdtii_evidence?: RdtiiEvidence[];
  urgency_score?: number;
  confidence_score?: Confidence;
  diplomat_meta?: Record<string, unknown>;
  spatial_context?: Record<string, unknown>;
}

export interface GenerateBriefRequest {
  topic: string;
  region: string;
  classification?: Classification;
}
