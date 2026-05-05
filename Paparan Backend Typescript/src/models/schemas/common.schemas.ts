import { z } from 'zod';

// ============================================================================
// Policy Brief Schemas
// ============================================================================

export const BriefSourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  publishedAt: z.string().optional(),
  author: z.string().optional(),
  tier: z.enum(['primary', 'tier_1', 'indonesia', 'islamic_web3', 'general']),
  summary: z.string(),
  keyPoints: z.array(z.string()),
});

export const BriefDevelopmentSchema = z.object({
  title: z.string(),
  description: z.string(),
  significance: z.string(),
  timeframe: z.string().optional(),
  sources: z.array(z.string()),
});

export const BriefRecommendationSchema = z.object({
  action: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  rationale: z.string(),
  stakeholders: z.array(z.string()).optional(),
});

export const RPJMNAlignmentSchema = z.object({
  pillar: z.string().optional(),
  target: z.string().optional(),
  score: z.number().min(0).max(100),
  rationale: z.string(),
});

export const PolicyBriefSchema = z.object({
  topic: z.string(),
  region: z.string().optional(),
  classification: z.string(),
  title: z.string(),
  summary: z.string(),
  keyDevelopments: z.array(BriefDevelopmentSchema),
  implications: z.array(z.string()),
  recommendations: z.array(BriefRecommendationSchema),
  sources: z.array(BriefSourceSchema),
  talkingPoints: z.array(z.string()).optional(),
  rpjmnAlignment: RPJMNAlignmentSchema.optional(),
});

// ============================================================================
// Research Schemas
// ============================================================================

export const ResearchSourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  publishedAt: z.string().optional(),
});

export const ResearchResultSchema = z.object({
  sources: z.array(ResearchSourceSchema),
  keyFindings: z.array(z.string()),
  summary: z.string(),
});

// ============================================================================
// Analysis Schemas
// ============================================================================

export const AnalysisResultSchema = z.object({
  implications: z.array(z.string()),
  recommendations: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1).optional(),
});

// ============================================================================
// SDI Metadata Schemas
// ============================================================================

export const SDIIndicatorSchema = z.object({
  kCode: z.string().regex(/^K\d+$/),
  lCode: z.string().regex(/^L\d+$/),
  indicatorName: z.string(),
  definition: z.string(),
  sector: z.string(),
  subsector: z.string().optional(),
  unit: z.string().optional(),
  data: z.record(z.any()).optional(),
});

export const SDIMetadataExtractionSchema = z.object({
  indicators: z.array(SDIIndicatorSchema),
  documentMetadata: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    date: z.string().optional(),
    source: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }),
});

// ============================================================================
// Classification Schemas
// ============================================================================

export const TopicClassificationSchema = z.object({
  classification: z.enum(['bappenas', 'financial', 'asean', 'general']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggestedRegion: z.string().optional(),
});

// ============================================================================
// Chat Schemas
// ============================================================================

export const ChatResponseSchema = z.object({
  content: z.string(),
  sources: z.array(z.object({
    url: z.string().url().optional(),
    title: z.string().optional(),
    snippet: z.string().optional(),
  })).optional(),
  followUpQuestions: z.array(z.string()).optional(),
});

// ============================================================================
// ASEAN Simulation Schemas
// ============================================================================

export const ASEANCountryPositionSchema = z.object({
  country: z.string(),
  position: z.string(),
  reasoning: z.string(),
  likelihood: z.number().min(0).max(1),
});

export const ASEANSimulationResultSchema = z.object({
  scenario: z.string(),
  likelihood: z.number().min(0).max(1),
  keyPositions: z.array(ASEANCountryPositionSchema),
  consensus: z.string().optional(),
  blockingCountries: z.array(z.string()).optional(),
  timeline: z.string().optional(),
});

// ============================================================================
// RPJMN Scoring Schemas
// ============================================================================

export const RPJMNScoringResultSchema = z.object({
  pillar: z.string(),
  target: z.string(),
  score: z.number().min(0).max(100),
  alignment: z.enum(['high', 'medium', 'low']),
  rationale: z.string(),
  suggestions: z.array(z.string()).optional(),
});

// ============================================================================
// OSINT Intelligence Schemas
// ============================================================================

export const MaritimeIntelligenceSchema = z.object({
  vessels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
    flag: z.string().optional(),
    lastPosition: z.object({
      latitude: z.number(),
      longitude: z.number(),
      timestamp: z.string(),
    }).optional(),
  })).optional(),
  summary: z.string(),
  keyEvents: z.array(z.string()).optional(),
});

export const EnvironmentalIntelligenceSchema = z.object({
  alerts: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'extreme']),
    location: z.string(),
    description: z.string(),
    timestamp: z.string(),
  })).optional(),
  summary: z.string(),
  trends: z.array(z.string()).optional(),
});

export const ConflictIntelligenceSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    type: z.string(),
    location: z.string(),
    date: z.string(),
    fatalities: z.number().optional(),
    description: z.string(),
    actors: z.array(z.string()).optional(),
  })).optional(),
  summary: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'extreme']).optional(),
});

// ============================================================================
// Export type inference
// ============================================================================

export type PolicyBrief = z.infer<typeof PolicyBriefSchema>;
export type BriefSource = z.infer<typeof BriefSourceSchema>;
export type BriefDevelopment = z.infer<typeof BriefDevelopmentSchema>;
export type BriefRecommendation = z.infer<typeof BriefRecommendationSchema>;
export type RPJMNAlignment = z.infer<typeof RPJMNAlignmentSchema>;
export type ResearchResult = z.infer<typeof ResearchResultSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type SDIIndicator = z.infer<typeof SDIIndicatorSchema>;
export type SDIMetadataExtraction = z.infer<typeof SDIMetadataExtractionSchema>;
export type TopicClassification = z.infer<typeof TopicClassificationSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type ASEANSimulationResult = z.infer<typeof ASEANSimulationResultSchema>;
export type RPJMNScoringResult = z.infer<typeof RPJMNScoringResultSchema>;
export type MaritimeIntelligence = z.infer<typeof MaritimeIntelligenceSchema>;
export type EnvironmentalIntelligence = z.infer<typeof EnvironmentalIntelligenceSchema>;
export type ConflictIntelligence = z.infer<typeof ConflictIntelligenceSchema>;
