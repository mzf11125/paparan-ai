import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { TavilyService, SourceTier } from '@modules/tools/tavily/tavily.service';
import { SupabaseToolsService } from '@modules/tools/supabase-tools/supabase-tools.service';

export interface ResearchInput {
  topic: string;
  region?: string;
  focus?: string;
  useVectorSearch?: boolean;
}

export interface ResearchResult {
  sources: ResearchSource[];
  keyFindings: string[];
  summary: string;
}

export interface ResearchSource {
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  publishedAt?: string;
  tier: SourceTier;
  score?: number;
}

/**
 * Researcher Agent - Conducts research using Tavily search and vector store queries
 */
@Injectable()
export class ResearcherAgent extends BaseAgent {
  readonly name = 'researcher';
  readonly description = 'Conducts research using Tavily search and vector store queries';
  readonly type: AgentType = 'researcher';

  constructor(
    protected llm: LLMService,
    private tavily: TavilyService,
    private supabaseTools: SupabaseToolsService,
  ) {
    super(llm, {
      systemPrompt: `You are a Research Agent specializing in policy research. Your role is to:
1. Find relevant and recent information on policy topics
2. Prioritize authoritative sources (government, think tanks, academic)
3. Synthesize findings into clear summaries
4. Extract key points from each source`,
    });
  }

  async execute(input: ResearchInput, context: AgentContext): Promise<AgentResponse<ResearchResult>> {
    this.validateInput(input, ['topic']);

    // Conduct searches based on focus
    const searchResults = await this.conductSearch(input);

    // Also check vector database if enabled
    let vectorResults: ResearchSource[] = [];
    if (input.useVectorSearch !== false) {
      vectorResults = await this.searchVector(input.topic, input.region);
    }

    // Combine and deduplicate results
    const allSources = this.combineResults(searchResults, vectorResults);

    // Synthesize research findings
    const synthesis = await this.synthesizeResearch(input.topic, allSources);

    return {
      success: true,
      data: {
        sources: allSources,
        keyFindings: synthesis.keyFindings,
        summary: synthesis.summary,
      },
    };
  }

  /**
   * Conduct web search using Tavily
   */
  private async conductSearch(input: ResearchInput): Promise<ResearchSource[]> {
    const topic = this.buildSearchQuery(input);

    const results = await this.tavily.search({
      query: topic,
      maxResults: 10,
      daysAgo: 30,
      topic: input.focus === 'finance' ? 'finance' : 'general',
    });

    return results.map(r => ({
      url: r.url,
      title: r.title,
      summary: r.content,
      keyPoints: [],
      publishedAt: r.publishedDate || undefined,
      tier: r.tier,
      score: r.score,
    }));
  }

  /**
   * Build optimized search query
   */
  private buildSearchQuery(input: ResearchInput): string {
    let query = input.topic;

    if (input.region) {
      query += ` ${input.region}`;
    }

    if (input.focus) {
      query += ` ${input.focus} policy`;
    }

    return query;
  }

  /**
   * Search vector database for relevant documents
   */
  private async searchVector(topic: string, region?: string): Promise<ResearchSource[]> {
    try {
      const query = region ? `${topic} ${region}` : topic;

      const results = await this.supabaseTools.vectorSearch({
        query,
        limit: 5,
        threshold: 0.7,
      });

      return results.map(r => ({
        url: r.metadata?.url || '',
        title: r.metadata?.title || 'Document',
        summary: r.content.slice(0, 200),
        keyPoints: [],
        tier: 'primary' as SourceTier,
        score: r.similarity,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Combine and deduplicate search results
   */
  private combineResults(webResults: ResearchSource[], vectorResults: ResearchSource[]): ResearchSource[] {
    const seen = new Set<string>();
    const combined: ResearchSource[] = [];

    for (const result of [...webResults, ...vectorResults]) {
      if (!seen.has(result.url)) {
        seen.add(result.url);
        combined.push(result);
      }
    }

    // Sort by tier priority and score
    return combined.sort((a, b) => {
      const tierPriority = (tier: SourceTier) => {
        const priorities: Record<SourceTier, number> = {
          primary: 1,
          tier_1: 2,
          indonesia: 3,
          islamic_web3: 4,
          general: 5,
        };
        return priorities[tier] || 5;
      };

      const aPriority = tierPriority(a.tier);
      const bPriority = tierPriority(b.tier);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return (b.score || 0) - (a.score || 0);
    });
  }

  /**
   * Synthesize research findings
   */
  private async synthesizeResearch(topic: string, sources: ResearchSource[]): Promise<{
    summary: string;
    keyFindings: string[];
  }> {
    if (sources.length === 0) {
      return {
        summary: `No direct sources found for "${topic}". Consider broadening the search or using related terms.`,
        keyFindings: [],
      };
    }

    const messages = this.formatMessages(
      `Synthesize the following research findings into a concise summary.

Topic: ${topic}

Sources:
${sources.map((s, i) => `${i + 1}. ${s.title}
   URL: ${s.url}
   Summary: ${s.summary.slice(0, 200)}
   Tier: ${s.tier}`).join('\n\n')}

Provide:
1. A 2-3 sentence summary of findings
2. 3-5 key findings as bullet points`
    );

    const response = await this.llm.chat(messages);

    // Parse response into summary and key findings
    return this.parseSynthesis(response.content);
  }

  /**
   * Parse synthesis response
   */
  private parseSynthesis(content: string): { summary: string; keyFindings: string[] } {
    const lines = content.split('\n').filter(l => l.trim());

    const summary: string[] = [];
    const keyFindings: string[] = [];
    let currentSection: 'summary';

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect bullet points
      if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        currentSection = 'keyFindings';
        keyFindings.push(trimmed.replace(/^[-•*\d.]\s*/, ''));
      } else if (currentSection === 'summary' && trimmed.length > 0) {
        summary.push(trimmed);
      }
    }

    return {
      summary: summary.join(' ') || 'No summary available',
      keyFindings: keyFindings.length > 0 ? keyFindings : ['Unable to extract key findings'],
    };
  }

  /**
   * Get research statistics
   */
  async getStats(topic: string): Promise<{
    webSources: number;
    vectorSources: number;
    totalSources: number;
  }> {
    const webResults = await this.tavily.search({ query: topic, maxResults: 10 });
    const vectorResults = await this.supabaseTools.vectorSearch({ query: topic, limit: 5 });

    return {
      webSources: webResults.length,
      vectorSources: vectorResults.length,
      totalSources: new Set([
        ...webResults.map(r => r.url),
        ...vectorResults.map(r => r.id),
      ]).size,
    };
  }
}
