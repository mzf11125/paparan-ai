export type Impact = "HIGH" | "MEDIUM" | "LOW";
export type Delta = "NEW" | "UPDATED" | "ESCALATED" | "DE-ESCALATED";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Priority = Impact;

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
  executiveSummary: string[];
  currentSituation: string;
  developments: Development[];
  implications: string;
  risks: string[];
  opportunities: string[];
  actions: Action[];
  sources: Source[];
  tags?: string[];
}

export type FilterType = "all" | "high";
