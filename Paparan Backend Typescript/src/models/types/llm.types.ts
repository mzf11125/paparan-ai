// LLM Provider types

export type LLMProviderType = 'zai' | 'anthropic' | 'zhipu';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

export interface LLMConfig {
  provider: LLMProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMProvider {
  readonly type: LLMProviderType;
  chat(messages: LLMMessage[], config?: LLMConfig): Promise<LLMResponse>;
  stream(messages: LLMMessage[], config?: LLMConfig): AsyncIterable<LLMStreamChunk>;
  generateStructured<T>(
    prompt: string,
    schema: Record<string, any>,
    config?: LLMConfig,
  ): Promise<T>;
}

// Structured output schemas
export interface BriefSchema {
  title: string;
  summary: string;
  keyDevelopments: Array<{
    title: string;
    description: string;
    significance: string;
  }>;
  implications: string[];
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
}

export interface ResearchSchema {
  sources: Array<{
    url: string;
    title: string;
    summary: string;
    keyPoints: string[];
    publishedAt?: string;
  }>;
  keyFindings: string[];
  summary: string;
}

export interface MetadataExtractionSchema {
  indicators: Array<{
    kCode: string;
    lCode: string;
    indicatorName: string;
    definition: string;
    sector: string;
    subsector?: string;
    unit?: string;
    data?: any;
  }>;
  documentMetadata: {
    title?: string;
    author?: string;
    date?: string;
    source?: string;
  };
}
