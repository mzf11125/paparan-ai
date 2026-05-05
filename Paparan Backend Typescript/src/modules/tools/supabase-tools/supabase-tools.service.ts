import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClientService } from '@database/supabase.client';
import { LLMService } from '@config/llm.service';

export interface VectorSearchParams {
  query: string;
  limit?: number;
  threshold?: number;
  table?: string;
  filter?: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  similarity: number;
}

export interface DocumentChunk {
  id?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Supabase vector search and document operations
 */
@Injectable()
export class SupabaseToolsService {
  private readonly logger = new Logger(SupabaseToolsService.name);
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(
    private supabase: SupabaseClientService,
    private llmService: LLMService,
    private config: ConfigService,
  ) {}

  /**
   * Perform vector similarity search
   */
  async vectorSearch(params: VectorSearchParams): Promise<VectorSearchResult[]> {
    try {
      this.logger.debug(`Vector search for: ${params.query.substring(0, 50)}...`);

      // Generate embedding for the query
      const embedding = await this.generateEmbedding(params.query);

      // Call the match_documents RPC function
      const { data, error } = await this.supabase
        .getClient()
        .rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: params.threshold ?? 0.7,
          match_count: params.limit ?? 5,
        });

      if (error) {
        // If the function doesn't exist, try the alternative approach
        this.logger.warn('match_documents RPC not available, using fallback');
        return this.fallbackVectorSearch(embedding, params);
      }

      return data || [];
    } catch (error) {
      this.logger.error(`Vector search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fallback vector search using direct query
   */
  private async fallbackVectorSearch(
    embedding: number[],
    params: VectorSearchParams,
  ): Promise<VectorSearchResult[]> {
    // This is a fallback implementation that would use cosine similarity
    // In production, you'd want to use pgvector properly
    this.logger.warn('Using fallback vector search (not optimized)');

    try {
      const table = params.table || 'documents';
      const { data, error } = await this.supabase
        .getClient()
        .from(table)
        .select('*')
        .limit(params.limit ?? 5);

      if (error) throw error;

      // Simple similarity calculation (in production, do this in SQL)
      const results = (data || []).map((doc: any) => ({
        id: doc.id,
        content: doc.content || '',
        metadata: doc.metadata,
        similarity: this.cosineSimilarity(embedding, doc.embedding || []),
      }))
      .filter((r: VectorSearchResult) => r.similarity >= (params.threshold ?? 0.7))
      .sort((a: VectorSearchResult, b: VectorSearchResult) => b.similarity - a.similarity);

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.hashString(text);
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use OpenAI embeddings API (or the configured LLM provider)
      const response = await this.fetchOpenAIEmbedding(text);

      // Cache the result
      this.embeddingCache.set(cacheKey, response);

      // Limit cache size
      if (this.embeddingCache.size > 1000) {
        const firstKey = this.embeddingCache.keys().next().value;
        this.embeddingCache.delete(firstKey);
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);

      // Return a zero vector as fallback
      return new Array(1536).fill(0); // OpenAI embedding dimension
    }
  }

  /**
   * Fetch embedding from OpenAI API
   */
  private async fetchOpenAIEmbedding(text: string): Promise<number[]> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY') ||
                   this.config.get<string>('ZAI_API_KEY');

    if (!apiKey) {
      throw new Error('No API key available for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Simple hash function for caching
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Store document with embedding
   */
  async storeDocument(chunk: DocumentChunk, table = 'documents'): Promise<string> {
    const embedding = await this.generateEmbedding(chunk.content);

    const { data, error } = await this.supabase
      .getClient()
      .from(table)
      .insert({
        content: chunk.content,
        embedding,
        metadata: chunk.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to store document: ${error.message}`);
      throw error;
    }

    return data.id;
  }

  /**
   * Batch store documents with embeddings
   */
  async batchStoreDocuments(
    chunks: DocumentChunk[],
    table = 'documents',
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const chunk of chunks) {
      try {
        const id = await this.storeDocument(chunk, table);
        ids.push(id);
      } catch (error) {
        this.logger.error(`Failed to store chunk: ${error.message}`);
      }
    }

    return ids;
  }

  /**
   * Hybrid search: combines vector search with keyword search
   */
  async hybridSearch(params: {
    query: string;
    limit?: number;
    vectorWeight?: number; // Default 0.7
    keywordWeight?: number; // Default 0.3
  }): Promise<VectorSearchResult[]> {
    const vectorWeight = params.vectorWeight ?? 0.7;
    const keywordWeight = params.keywordWeight ?? 0.3;

    // Get vector search results
    const vectorResults = await this.vectorSearch({
      query: params.query,
      limit: params.limit ?? 10,
      threshold: 0.5, // Lower threshold for hybrid
    });

    // Get keyword search results
    const keywordResults = await this.keywordSearch({
      query: params.query,
      limit: params.limit ?? 10,
    });

    // Combine and re-score
    const combined = new Map<string, VectorSearchResult>();

    // Add vector results
    for (const result of vectorResults) {
      combined.set(result.id, {
        ...result,
        similarity: result.similarity * vectorWeight,
      });
    }

    // Add keyword results
    for (const result of keywordResults) {
      const existing = combined.get(result.id);
      if (existing) {
        existing.similarity += result.similarity * keywordWeight;
      } else {
        combined.set(result.id, {
          ...result,
          similarity: result.similarity * keywordWeight,
        });
      }
    }

    // Sort by combined score and return top results
    return Array.from(combined.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, params.limit ?? 5);
  }

  /**
   * Simple keyword search (full-text)
   */
  async keywordSearch(params: {
    query: string;
    limit?: number;
    table?: string;
  }): Promise<VectorSearchResult[]> {
    const table = params.table || 'documents';
    const limit = params.limit ?? 10;

    const { data, error } = await this.supabase
      .getClient()
      .from(table)
      .select('*')
      .textSearch('content', params.query)
      .limit(limit);

    if (error) {
      this.logger.error(`Keyword search failed: ${error.message}`);
      return [];
    }

    return (data || []).map((doc: any) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      similarity: 0.8, // Fixed score for keyword matches
    }));
  }

  /**
   * Clear embedding cache
   */
  clearEmbeddingCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
    };
  }
}
