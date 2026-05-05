// Core agent types and interfaces

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  userId: string;
  threadId?: string;
  region?: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentState {
  messages: AgentMessage[];
  context: AgentContext;
  intermediateSteps?: AgentStep[];
  result?: any;
}

export interface AgentStep {
  agent: string;
  input: any;
  output: any;
  timestamp: Date;
}

export interface AgentConfig {
  name: string;
  description: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}

// Base Agent Interface
export interface IAgent {
  readonly name: string;
  readonly description: string;
  execute(input: any, context: AgentContext): Promise<AgentResponse>;
  stream?(input: any, context: AgentContext): AsyncIterable<string>;
}

// Orchestrator State
export interface OrchestratorState extends AgentState {
  topic: string;
  region?: string;
  classification?: string;
  route?: string;
  researchResult?: ResearchResult;
  analysisResult?: AnalysisResult;
  brief?: PolicyBrief;
}

export interface ResearchResult {
  sources: Source[];
  keyFindings: string[];
  summary: string;
}

export interface AnalysisResult {
  implications: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Source {
  url: string;
  title: string;
  publishedAt?: string;
  author?: string;
  tier: 'primary' | 'tier_1' | 'indonesia' | 'islamic_web3' | 'general';
  summary: string;
  keyPoints: string[];
}

export interface PolicyBrief {
  id?: string;
  topic: string;
  region?: string;
  classification: string;
  title: string;
  summary: string;
  keyDevelopments: BriefDevelopment[];
  implications: string[];
  recommendations: BriefRecommendation[];
  sources: Source[];
  talkingPoints?: string[];
  rpjmnAlignment?: RPJMNAlignment;
  regulatoryContext?: any;  // RDTII extraction results
  aseanSimulation?: any;     // ASEAN simulation results
  createdAt?: string;
}

export interface BriefDevelopment {
  title: string;
  description: string;
  significance: string;
  timeframe?: string;
  sources: string[];
}

export interface BriefRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  stakeholders?: string[];
}

export interface RPJMNAlignment {
  pillar?: string;
  target?: string;
  score: number;
  rationale: string;
}

// Agent Types
export type AgentType =
  | 'orchestrator'
  | 'researcher'
  | 'analyst'
  | 'gov_intel'
  | 'metadata_extractor'
  | 'consistency_checker'
  | 'conversational'
  | 'scraper'
  | 'rpjmn_scorer'
  | 'rdtii_extractor'
  | 'synthesizer'
  | 'asean_simulator';

// Route Types for Orchestrator
export type RouteType = 'bappenas' | 'financial' | 'default' | 'asean';
