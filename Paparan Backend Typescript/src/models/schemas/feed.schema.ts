// Database schema types for feed

export interface FeedItemSchema {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  summary?: string;
  content?: string;
  published_at: string;
  regions?: string[];
  metadata?: Record<string, any>;
  created_at: string;
}
