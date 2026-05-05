// Database schema types for reports

export interface PolicyBriefSchema {
  id: string;
  user_id: string;
  topic: string;
  region?: string;
  classification: string;
  brief: {
    title: string;
    summary: string;
    keyDevelopments: BriefDevelopmentSchema[];
    implications: string[];
    recommendations: BriefRecommendationSchema[];
    sources: SourceSchema[];
    talkingPoints?: string[];
    rpjmnAlignment?: RPJMNAlignmentSchema;
  };
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface BriefDevelopmentSchema {
  title: string;
  description: string;
  significance: string;
  timeframe?: string;
  sources: string[];
}

export interface BriefRecommendationSchema {
  action: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  stakeholders?: string[];
}

export interface SourceSchema {
  url: string;
  title: string;
  publishedAt?: string;
  author?: string;
  tier: string;
  summary: string;
  keyPoints: string[];
}

export interface RPJMNAlignmentSchema {
  pillar?: string;
  target?: string;
  score: number;
  rationale: string;
}
