/**
 * Tavily search types
 */

export type SourceTier = 'primary' | 'tier_1' | 'indonesia' | 'islamic_web3' | 'general';

export interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
  score: number;
  publishedDate: string | null;
  tier: SourceTier;
}

export interface TavilySearchParams {
  query: string;
  maxResults?: number;
  daysAgo?: number;
  topic?: 'general' | 'news' | 'finance';
  searchDepth?: 'basic' | 'advanced';
  includeRawContent?: boolean;
  includeAnswer?: boolean;
}

export interface TavilySearchResponse {
  answer: string | null;
  query: string;
  results: TavilySearchResult[];
}
