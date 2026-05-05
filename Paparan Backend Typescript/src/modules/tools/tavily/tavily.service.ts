import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LRUCache } from 'lru-cache';
import { TavilySearchResult, TavilySearchParams, SourceTier } from './tavily.types';

/**
 * Source tier configuration
 */
const SOURCE_TIER_CONFIG: Record<string, SourceTier> = {
  // Primary sources (most authoritative)
  'go.id': 'primary',
  'bappenas.go.id': 'primary',
  'dpr.go.id': 'primary',
  'setneg.go.id': 'primary',
  'kemlu.go.id': 'primary',
  'bps.go.id': 'primary',
  'asean.org': 'primary',
  'un.org': 'primary',
  'worldbank.org': 'primary',
  'imf.org': 'primary',
  'oecd.org': 'primary',
  'who.int': 'primary',
  'wto.org': 'primary',

  // Indonesia-specific sources
  'jakarta.go.id': 'indonesia',
  'indonesia.go.id': 'indonesia',
  'kompas.com': 'indonesia',
  'tempo.co': 'indonesia',
  'detik.com': 'indonesia',
  'thejakartapost.com': 'indonesia',
  'antaranews.com': 'indonesia',

  // Tier 1 (high quality)
  'reuters.com': 'tier_1',
  'apnews.com': 'tier_1',
  'bloomberg.com': 'tier_1',
  'ft.com': 'tier_1',
  'economist.com': 'tier_1',
  'nature.com': 'tier_1',
  'science.org': 'tier_1',
  'foreignaffairs.com': 'tier_1',
  'foreignpolicy.com': 'tier_1',
  'csis.org': 'tier_1',
  'brookings.edu': 'tier_1',
  'rand.org': 'tier_1',
};

/**
 * Tavily Search Service with caching and source tiering
 */
@Injectable()
export class TavilyService {
  private readonly logger = new Logger(TavilyService.name);
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  // Cache for search results (5 min TTL, max 100 entries)
  private cache: LRUCache<string, TavilySearchResult[]>;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('TAVILY_API_KEY') || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    this.cache = new LRUCache<string, TavilySearchResult[]>({
      max: 100,
      ttl: 300000, // 5 minutes
    });
  }

  /**
   * Perform a search with Tavily API
   */
  async search(params: TavilySearchParams): Promise<TavilySearchResult[]> {
    const cacheKey = this.getCacheKey(params);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for query: ${params.query}`);
      return cached;
    }

    try {
      this.logger.debug(`Searching Tavily for: ${params.query}`);

      const response = await this.client.post('/search', {
        api_key: this.apiKey,
        query: params.query,
        max_results: params.maxResults || 10,
        days_aago: params.daysAgo || 30,
        topic: params.topic || 'general',
        include_raw_content: params.includeRawContent || false,
        include_images: false,
        include_image_descriptions: false,
        include_answer: params.includeAnswer || false,
        search_depth: params.searchDepth || 'basic',
      });

      const results = this.processResults(response.data.results || []);

      // Cache the results
      this.cache.set(cacheKey, results);

      return results;
    } catch (error) {
      this.logger.error(`Tavily search failed: ${error.message}`);

      if (error.response?.status === 401) {
        throw new Error('Invalid Tavily API key');
      }

      if (error.response?.status === 429) {
        throw new Error('Tavily rate limit exceeded');
      }

      throw error;
    }
  }

  /**
   * Search and return only formatted results with source tiering
   */
  async searchWithTiering(params: TavilySearchParams): Promise<TavilySearchResult[]> {
    const results = await this.search(params);
    return results.map(r => ({
      ...r,
      tier: this.determineTier(r.url),
    }));
  }

  /**
   * Search and return only results from specific tiers
   */
  async searchByTier(
    params: TavilySearchParams,
    allowedTiers: SourceTier[],
  ): Promise<TavilySearchResult[]> {
    const results = await this.search(params);
    return results
      .map(r => ({ ...r, tier: this.determineTier(r.url) }))
      .filter(r => allowedTiers.includes(r.tier))
      .sort((a, b) => this.getTierPriority(a.tier) - this.getTierPriority(b.tier));
  }

  /**
   * Get source tier priority for sorting
   */
  private getTierPriority(tier: SourceTier): number {
    const priorities: Record<SourceTier, number> = {
      primary: 1,
      tier_1: 2,
      indonesia: 3,
      islamic_web3: 4,
      general: 5,
    };
    return priorities[tier] || 5;
  }

  /**
   * Determine source tier from URL
   */
  determineTier(url: string): SourceTier {
    try {
      const hostname = new URL(url).hostname;

      // Check exact matches
      for (const [domain, tier] of Object.entries(SOURCE_TIER_CONFIG)) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return tier;
        }
      }

      // Check for Islamic/finance keywords
      if (this.isIslamicFinanceSource(hostname)) {
        return 'islamic_web3';
      }

      return 'general';
    } catch {
      return 'general';
    }
  }

  /**
   * Check if source is Islamic finance related
   */
  private isIslamicFinanceSource(hostname: string): boolean {
    const keywords = [
      'islamic', 'sharia', 'sukuk', 'halal',
      'zakat', 'waqf', 'islam'
    ];

    const lower = hostname.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
  }

  /**
   * Process Tavily results and format them
   */
  private processResults(results: any[]): TavilySearchResult[] {
    return results.map(r => ({
      url: r.url || '',
      title: r.title || '',
      content: r.content || '',
      score: r.score || 0,
      publishedDate: r.publishedDate || null,
      tier: this.determineTier(r.url),
    }));
  }

  /**
   * Generate cache key from search params
   */
  private getCacheKey(params: TavilySearchParams): string {
    return `${params.query}-${params.maxResults || 10}-${params.daysAgo || 30}-${params.topic || 'general'}`;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
    };
  }

  /**
   * Perform advanced search with multiple queries
   */
  async advancedSearch(params: {
    queries: string[];
    maxResults?: number;
    daysAgo?: number;
  }): Promise<TavilySearchResult[]> {
    const results = await Promise.all(
      params.queries.map(q =>
        this.search({ query: q, maxResults: params.maxResults, daysAgo: params.daysAgo })
      )
    );

    // Flatten and deduplicate by URL
    const seen = new Set<string>();
    const unique: TavilySearchResult[] = [];

    for (const result of results.flat()) {
      if (!seen.has(result.url)) {
        seen.add(result.url);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * Extract key points from search results
   */
  async extractKeyPoints(query: string, maxResults = 5): Promise<{
    summary: string;
    keyPoints: string[];
    sources: TavilySearchResult[];
  }> {
    const results = await this.search({ query, maxResults });

    return {
      summary: `Found ${results.length} relevant sources for "${query}"`,
      keyPoints: results.slice(0, 3).map(r => r.title),
      sources: results,
    };
  }
}
