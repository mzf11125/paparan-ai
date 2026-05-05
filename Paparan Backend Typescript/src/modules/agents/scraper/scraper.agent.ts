import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { HttpClientService } from '@modules/tools/http/http-client.service';
import { DocumentProcessorService } from '@modules/tools/document-processor/document-processor.service';

export interface ScraperInput {
  source?: string;
  urls?: string[];
  topics?: string[];
  maxPages?: number;
  extractContent?: boolean;
  storeAsFeed?: boolean;
}

export interface ScrapedSource {
  url: string;
  title: string;
  content: string;
  publishedAt?: string;
  author?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface ScraperResult {
  scraped: number;
  sources: ScrapedSource[];
  summary: string;
  errors?: Array<{
    url: string;
    error: string;
  }>;
}

// Indonesian government sources to scrape
const GOVERNMENT_SOURCES = {
  bappenas: 'https://www.bappenas.go.id',
  kemendagri: 'https://www.kemendagri.go.id',
  kemenkeu: 'https://www.kemenkeu.go.id',
  bkpm: 'https://www.bkpm.go.id',
  ojk: 'https://www.ojk.go.id',
  bi: 'https://www.bi.go.id',
  setneg: 'https://www.setneg.go.id',
  dpr: 'https://www.dpr.go.id',
};

/**
 * Scraper Agent - Scrapes government websites for policy updates
 */
@Injectable()
export class ScraperAgent extends BaseAgent {
  readonly name = 'scraper';
  readonly description = 'Scrapes government websites for policy updates';
  readonly type: AgentType = 'scraper';

  constructor(
    protected llm: LLMService,
    private httpClient: HttpClientService,
    private documentProcessor: DocumentProcessorService,
  ) {
    super(llm, {
      systemPrompt: `You are a Government Website Scraper for Indonesian policy intelligence.

Your role is to:
1. Extract relevant policy content from government websites
2. Identify new regulations, announcements, and updates
3. Extract metadata (date, source, title, tags)
4. Filter and prioritize content by relevance
5. Summarize key findings

When scraping:
- Respect robots.txt and rate limits
- Extract clean, readable content
- Preserve attribution and source links
- Identify document types (regulation, press release, announcement)
- Extract dates and other metadata
- Classify content by topic and importance`,
    });
  }

  async execute(input: ScraperInput, context: AgentContext): Promise<AgentResponse<ScraperResult>> {
    try {
      const sources: ScrapedSource[] = [];
      const errors: Array<{ url: string; error: string }> = [];

      // Determine URLs to scrape
      let urlsToScrape: string[] = [];
      if (input.urls && input.urls.length > 0) {
        urlsToScrape = input.urls;
      } else if (input.source && GOVERNMENT_SOURCES[input.source as keyof typeof GOVERNMENT_SOURCES]) {
        urlsToScrape = [GOVERNMENT_SOURCES[input.source as keyof typeof GOVERNMENT_SOURCES]];
      } else {
        // Default to scraping main government sources
        urlsToScrape = Object.values(GOVERNMENT_SOURCES).slice(0, 3);
      }

      // Limit pages to scrape
      const maxPages = input.maxPages || 10;
      urlsToScrape = urlsToScrape.slice(0, maxPages);

      // Scrape each URL
      for (const url of urlsToScrape) {
        try {
          const scraped = await this.scrapeUrl(url, input);
          sources.push(...scraped);
        } catch (error) {
          errors.push({ url, error: error.message });
        }
      }

      // Generate summary
      const summary = await this.generateSummary(sources, input.topics);

      return {
        success: true,
        data: {
          scraped: sources.length,
          sources,
          summary,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Scraping failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape a single URL
   */
  private async scrapeUrl(url: string, options: ScraperInput): Promise<ScrapedSource[]> {
    const results: ScrapedSource[] = [];

    // Fetch the page
    const response = await this.httpClient.get(url, { cache: false });

    // Extract content using document processor
    const processed = await this.documentProcessor.extractText(
      Buffer.from(response.data),
      'text/html',
      url,
    );

    if (!processed.content || processed.content.trim().length === 0) {
      return results;
    }

    // Extract metadata using LLM
    const metadata = await this.extractMetadata(processed.content, url);

    // Filter by topics if specified
    const isRelevant = options.topics && options.topics.length > 0
      ? this.isRelevantToTopics(metadata, options.topics)
      : true;

    if (isRelevant) {
      results.push({
        url,
        title: metadata.title || this.extractTitle(processed.content),
        content: options.extractContent !== false ? processed.content : '',
        publishedAt: metadata.publishedAt,
        author: metadata.author,
        tags: metadata.tags || [],
        metadata: {
          ...metadata,
          scrapedAt: new Date().toISOString(),
        },
      });
    }

    // Look for linked pages (simplified - in production would use proper link extraction)
    // This would parse HTML, find relevant links, and recursively scrape

    return results;
  }

  /**
   * Extract metadata from content using LLM
   */
  private async extractMetadata(content: string, url: string): Promise<{
    title?: string;
    publishedAt?: string;
    author?: string;
    tags?: string[];
    documentType?: string;
  }> {
    // Truncate content for LLM
    const truncated = this.truncateText(content, 2000);

    const prompt = `Extract metadata from this Indonesian government web content:

URL: ${url}

Content:
${truncated}

Extract:
- Title (main heading or document title)
- Published date (if mentioned)
- Author/Department (if mentioned)
- Tags/topics (3-5 relevant keywords)
- Document type (regulation, press release, announcement, etc.)

Return as JSON.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.3, maxTokens: 300 });

    try {
      return this.extractJson(response.content);
    } catch {
      return {};
    }
  }

  /**
   * Extract title from HTML content
   */
  private extractTitle(content: string): string {
    // Try to find title tag or first h1
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1[1].trim();
    }

    return 'Untitled';
  }

  /**
   * Check if content is relevant to specified topics
   */
  private isRelevantToTopics(metadata: any, topics: string[]): boolean {
    const text = [
      metadata.title,
      metadata.tags?.join(' '),
      metadata.documentType,
    ].join(' ').toLowerCase();

    return topics.some(topic =>
      text.includes(topic.toLowerCase()) ||
      topic.toLowerCase().split(' ').some(word => text.includes(word))
    );
  }

  /**
   * Generate summary of scraped content
   */
  private async generateSummary(sources: ScrapedSource[], topics?: string[]): Promise<string> {
    if (sources.length === 0) {
      return 'No relevant content found.';
    }

    const titles = sources.map(s => s.title).join('\n- ');

    const prompt = `Summarize these Indonesian government policy updates:

${sources.length} sources scraped:
- ${titles}

${topics ? `Topics of interest: ${topics.join(', ')}` : ''}

Provide a 2-3 sentence summary of key findings.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.5, maxTokens: 300 });

    return response.content.trim();
  }

  /**
   * Schedule recurring scraping
   */
  async scheduleScraping(schedule: {
    sources: string[];
    interval: 'hourly' | 'daily' | 'weekly';
    topics?: string[];
  }): Promise<{ jobId: string; nextRun: string }> {
    // This would integrate with BullMQ for scheduled jobs
    const jobId = `scrape_${Date.now()}`;
    const nextRun = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    // TODO: Implement actual job scheduling
    this.logger.log(`Scheduled scraping job ${jobId} for ${schedule.sources.join(', ')}`);

    return { jobId, nextRun };
  }

  /**
   * Extract RSS feed from source
   */
  async extractRSSFeed(url: string): Promise<{
    title: string;
    items: Array<{
      title: string;
      link: string;
      pubDate?: string;
      description?: string;
    }>;
  }> {
    try {
      const response = await this.httpClient.get(url, { cache: true });
      const content = response.data;

      // Parse RSS feed
      const prompt = `Parse this RSS feed and extract items:

${this.truncateText(content, 3000)}

Return JSON with title and items array containing title, link, pubDate, description.`;

      const messages = this.formatMessages(prompt);
      const parsed = await this.llm.chat(messages, { temperature: 0.2, maxTokens: 2000 });

      try {
        return this.extractJson(parsed.content);
      } catch {
        return { title: '', items: [] };
      }
    } catch {
      return { title: '', items: [] };
    }
  }

  /**
   * Get available government sources
   */
  getAvailableSources(): Record<string, string> {
    return GOVERNMENT_SOURCES;
  }

  /**
   * Validate URL is scrapable
   */
  validateUrl(url: string): { valid: boolean; reason?: string } {
    try {
      const parsed = new URL(url);

      // Check protocol
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, reason: 'Only HTTP/HTTPS URLs are supported' };
      }

      // Check for common file extensions (skip PDFs, images, etc.)
      const skipExtensions = ['.pdf', '.jpg', '.png', '.gif', '.zip', '.exe'];
      if (skipExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext))) {
        return { valid: false, reason: 'File type not supported for scraping' };
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'Invalid URL format' };
    }
  }

  /**
   * Batch scrape multiple URLs
   */
  async batchScrape(urls: string[], options: Omit<ScraperInput, 'urls'> = {}): Promise<ScraperResult> {
    const sources: ScrapedSource[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    // Process URLs in parallel batches
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(url => this.scrapeUrl(url, options))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const url = batch[j];

        if (result.status === 'fulfilled') {
          sources.push(...result.value);
        } else {
          errors.push({ url, error: result.reason?.message || 'Unknown error' });
        }
      }

      // Brief delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await this.sleep(1000);
      }
    }

    const summary = await this.generateSummary(sources, options.topics);

    return {
      scraped: sources.length,
      sources,
      summary,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Detect RSS feed URL from website
   */
  async detectRSSFeed(baseUrl: string): Promise<string[]> {
    try {
      const response = await this.httpClient.get(baseUrl, { cache: true });
      const content = response.data;

      // Look for RSS feed links in HTML
      const rssLinks: string[] = [];
      const feedPattern = /<link[^>]*(?:rel=["'](?:alternate|feed)["']|type=["']application\/rss\+xml["']|type=["']application\/atom\+xml["'])[^>]*href=["']([^"']+)["']/gi;

      let match;
      while ((match = feedPattern.exec(content)) !== null) {
        let href = match[1];
        if (href && !href.startsWith('http')) {
          // Convert relative URL to absolute
          const base = new URL(baseUrl);
          href = new URL(href, base).toString();
        }
        if (href && !rssLinks.includes(href)) {
          rssLinks.push(href);
        }
      }

      return rssLinks;
    } catch {
      return [];
    }
  }
}
