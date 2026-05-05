// Tool execution types

export interface ToolInput {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolOutput {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: (params: Record<string, any>) => Promise<ToolOutput>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

// Tavily Search
export interface TavilySearchParams {
  query: string;
  maxResults?: number;
  topic?: 'general' | 'news' | 'finance';
  daysAgo?: number;
}

export interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
  score: number;
  publishedAt?: string;
}

// Bellingcat OSINT
export interface MaritimeSearchParams {
  region: string;
  startDate?: string;
  endDate?: string;
}

export interface EnvironmentalSearchParams {
  region: string;
  startDate?: string;
  endDate?: string;
}

export interface ConflictSearchParams {
  region: string;
  startDate?: string;
  endDate?: string;
}

// Document Processing
export interface DocumentProcessingInput {
  file: Buffer;
  filename: string;
  mimeType: string;
}

export interface DocumentProcessingOutput {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    pageCount?: number;
  };
}
