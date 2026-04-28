export type Impact = "HIGH" | "MEDIUM" | "LOW";
export type Delta = "NEW" | "UPDATED" | "ESCALATED" | "DE-ESCALATED";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Priority = Impact;
export type ClassificationLevel = "unclassified" | "official" | "confidential" | "secret";

export interface Development {
  id: string;
  text: string;
  impact: Impact;
  delta: Delta;
  sourceId: string;
  date?: string;
  entities?: string[];
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  confidence: Confidence;
  date: string;
}

export interface Action {
  priority: Priority;
  text: string;
  owner?: string;
  deadline?: string;
}

export interface Paparan {
  id: string;
  title: string;
  date: string;
  region: string;
  lastUpdated?: string;
  classification?: ClassificationLevel;
  executiveSummary: string[];
  currentSituation: string;
  developments: Development[];
  implications: string;
  risks: string[];
  opportunities: string[];
  actions: Action[];
  sources: Source[];
  tags?: string[];
  // Intelligence enhancements
  rpjmn_alignment?: Record<string, Record<string, number>> | null;
  urgency_score?: number | null;
  source_count?: number;
  confidence_score?: string;
  diplomat_meta?: Record<string, unknown> | null;
  previous_report_id?: string | null;
}

export type FilterType = "all" | "high";
