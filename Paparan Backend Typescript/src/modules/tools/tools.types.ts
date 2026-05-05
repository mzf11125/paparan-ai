/**
 * Central export file for all tool types
 */

// ============================================================================
// Tavily Search Types
// ============================================================================

export type { SourceTier, TavilySearchResult, TavilySearchParams, TavilySearchResponse } from './tavily/tavily.types';

// ============================================================================
// Supabase Tools Types
// ============================================================================

export type { VectorSearchParams, VectorSearchResult, DocumentChunk } from './supabase-tools/supabase-tools.service';

// ============================================================================
// HTTP Client Types
// ============================================================================

export type { HttpRequestOptions, HttpResponse } from './http/http-client.service';

// ============================================================================
// Document Processing Types
// ============================================================================

export interface DocumentExtractionResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    pageCount?: number;
    createdAt?: Date;
    modifiedAt?: Date;
  };
}

export interface DocumentChunkMetadata {
  id: string;
  documentId: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  page?: number;
}

// ============================================================================
// Search Tool Types
// ============================================================================

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  score: number;
  publishedDate?: string;
  source?: string;
}

export interface SearchOptions {
  maxResults?: number;
  daysAgo?: number;
  topic?: 'general' | 'news' | 'finance';
  region?: string;
  language?: string;
}

// ============================================================================
// Bellingcat OSINT Types
// ============================================================================

export interface MaritimeVessel {
  id: string;
  name: string;
  imo?: string;
  mmsi?: string;
  type?: string;
  flag?: string;
  lastPosition?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  status?: string;
}

export interface EnvironmentalAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  location: string;
  description: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
}

export interface ConflictEvent {
  id: string;
  type: string;
  location: string;
  date: Date;
  fatalities?: number;
  injuries?: number;
  description: string;
  actors?: string[];
  source?: string;
}

// ============================================================================
// Export Types
// ============================================================================

export interface PdfGenerationOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  includeSources?: boolean;
  includeMetadata?: boolean;
}

export interface PptxGenerationOptions {
  title: string;
  subtitle?: string;
  author?: string;
  theme?: 'professional' | 'modern' | 'minimal';
  includeCharts?: boolean;
}

// ============================================================================
// Knowledge Graph Types
// ============================================================================

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight?: number;
  properties?: Record<string, any>;
}

export interface KnowledgeGraphQueryResult {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metadata?: {
    totalNodes: number;
    totalEdges: number;
    queryTime: number;
  };
}

// ============================================================================
// RPJMN Types
// ============================================================================

export interface RPJMNPillar {
  code: string;
  name: string;
  description: string;
  targets: RPJMNSector[];
}

export interface RPJMNSector {
  code: string;
  name: string;
  description: string;
  indicators?: string[];
}

export interface RPJMNAlignment {
  pillar: string;
  target?: string;
  score: number;
  rationale: string;
  suggestions?: string[];
}

// ============================================================================
// SDI Types
// ============================================================================

export interface SDIKCode {
  code: string;
  name: string;
  description: string;
}

export interface SDILCode {
  code: string;
  name: string;
  description: string;
  kCode: string;
  unit?: string;
}

export interface SDIIndicator {
  kCode: string;
  lCode: string;
  indicatorName: string;
  definition: string;
  sector: string;
  subsector?: string;
  unit?: string;
  data?: Record<string, any>;
}

// ============================================================================
// Tool Execution Types
// ============================================================================

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    cached?: boolean;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: (params: Record<string, any>) => Promise<ToolResult>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

// ============================================================================
// RAG Types
// ============================================================================

export interface RAGDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface RAGQueryResult {
  content: string;
  sources: Array<{
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  metadata?: {
    query: string;
    totalResults: number;
    queryTime: number;
  };
}
