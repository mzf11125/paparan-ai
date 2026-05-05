import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { RdtiiService } from '@modules/tools/rdtii/rdtii.service';
import { SupabaseToolsService } from '@modules/tools/supabase-tools/supabase-tools.service';

export interface RdtiiExtractorInput {
  topic: string;
  region?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  regulationTypes?: string[];
  includeEvidence?: boolean;
}

export interface RegulationReference {
  id: string;
  type: string; // UU, PP, Perpres, Kepres, Permen, etc.
  number: string;
  year: number;
  title: string;
  relevance: number; // 0-1
  excerpt?: string;
  url?: string;
}

export interface RegulatoryEvidence {
  regulationId: string;
  provision: string;
  application: string;
  impact: string;
}

export interface RdtiiExtractionResult {
  regulations: RegulationReference[];
  evidence: RegulatoryEvidence[];
  summary: {
    totalRegulations: number;
    byType: Record<string, number>;
    timeframe: string;
    keyThemes: string[];
  };
  gaps?: string[];
}

/**
 * RDTII Extractor Agent - Extracts regulatory evidence from Indonesian regulations
 */
@Injectable()
export class RdtiiExtractorAgent extends BaseAgent {
  readonly name = 'rdtii_extractor';
  readonly description = 'Extracts RDTII regulatory evidence';
  readonly type: AgentType = 'rdtii_extractor';

  constructor(
    protected llm: LLMService,
    private rdtii: RdtiiService,
    private supabaseTools: SupabaseToolsService,
  ) {
    super(llm, {
      systemPrompt: `You are a Regulatory Evidence Extractor for Indonesian policy documents (RDTII - Regulasi Daerah dan Tata Kelola Investasi).

Your role is to:
1. Identify relevant Indonesian regulations for policy topics
2. Extract specific provisions and articles that apply
3. Connect regulations to policy recommendations
4. Identify regulatory gaps or conflicts
5. Provide proper legal citations

Types of Indonesian Regulations:
- UU (Undang-Undang): Laws passed by DPR
- PP (Peraturan Pemerintah): Government Regulations
- Perpres (Peraturan Presiden): Presidential Regulations
- Kepres (Keputusan Presiden): Presidential Decrees
- Permen (Peraturan Menteri): Ministerial Regulations
- Perda (Peraturan Daerah): Regional Regulations

When extracting:
- Provide accurate regulation numbers and years
- Quote relevant articles when possible
- Explain the practical application
- Note any amendments or revisions
- Identify implementation requirements`,
    });
  }

  async execute(input: RdtiiExtractorInput, context: AgentContext): Promise<AgentResponse<RdtiiExtractionResult>> {
    this.validateInput(input, ['topic']);

    try {
      // Search for relevant regulations using RDTII service
      let regulations: RegulationReference[] = [];

      try {
        const rdtiiResults = await this.rdtii.searchRegulations({
          topic: input.topic,
          region: input.region,
          types: input.regulationTypes,
          limit: 10,
        });

        regulations = rdtiiResults.map(r => ({
          id: r.id || `${r.type}_${r.number}_${r.year}`,
          type: r.type,
          number: r.number,
          year: r.year,
          title: r.title,
          relevance: r.relevance || 0.5,
          excerpt: r.excerpt,
          url: r.url,
        }));
      } catch (error) {
        this.logger.warn(`RDTII search failed: ${error.message}, using LLM fallback`);
      }

      // If no results or fallback needed, use LLM to suggest regulations
      if (regulations.length === 0) {
        regulations = await this.suggestRegulations(input);
      }

      // Extract evidence from regulations
      let evidence: RegulatoryEvidence[] = [];
      if (input.includeEvidence !== false && regulations.length > 0) {
        evidence = await this.extractEvidence(input.topic, regulations);
      }

      // Generate summary
      const summary = this.generateSummary(regulations, input);

      // Identify regulatory gaps
      const gaps = await this.identifyGaps(input.topic, regulations);

      return {
        success: true,
        data: {
          regulations,
          evidence,
          summary,
          gaps,
        },
      };
    } catch (error) {
      this.logger.error(`RDTII extraction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Suggest regulations using LLM when database search fails
   */
  private async suggestRegulations(input: RdtiiExtractorInput): Promise<RegulationReference[]> {
    const prompt = `Identify relevant Indonesian regulations for the following policy topic:

Topic: ${input.topic}
${input.region ? `Region: ${input.region}` : ''}
${input.timeRange ? `Time Range: ${input.timeRange.start} to ${input.timeRange.end}` : ''}

Return a JSON array of regulations with:
- type: Regulation type (UU, PP, Perpres, etc.)
- number: Regulation number
- year: Year enacted
- title: Full title
- relevance: Score 0-1

Focus on the most relevant and recent regulations.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.3, maxTokens: 1500 });

    try {
      const result = this.extractJson(response.content);
      const regulations = Array.isArray(result) ? result : [];

      return regulations.map((r, i) => ({
        id: `suggested_${i}`,
        type: r.type || 'UU',
        number: r.number || '1',
        year: r.year || 2024,
        title: r.title || 'Untitled Regulation',
        relevance: r.relevance || 0.5,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Extract specific evidence from regulations
   */
  private async extractEvidence(topic: string, regulations: RegulationReference[]): Promise<RegulatoryEvidence[]> {
    const evidence: RegulatoryEvidence[] = [];

    // Process top 5 most relevant regulations
    const topRegs = regulations.slice(0, 5);

    for (const reg of topRegs) {
      try {
        // Try to get full content from RDTII or vector store
        let content = reg.excerpt || '';

        if (!content) {
          // Search for regulation content
          const searchResults = await this.supabaseTools.vectorSearch({
            query: `${reg.type} ${reg.number} ${reg.year} ${reg.title}`,
            limit: 3,
            threshold: 0.6,
          });

          content = searchResults.map(r => r.content).join('\n\n');
        }

        if (content) {
          // Extract specific provisions using LLM
          const provision = await this.extractProvision(topic, reg, content);
          if (provision) {
            evidence.push(provision);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to extract evidence from ${reg.id}: ${error.message}`);
      }
    }

    return evidence;
  }

  /**
   * Extract specific provision from regulation content
   */
  private async extractProvision(
    topic: string,
    regulation: RegulationReference,
    content: string,
  ): Promise<RegulatoryEvidence | null> {
    const prompt = `Extract the specific provision from this regulation that relates to the topic:

**Topic:** ${topic}
**Regulation:** ${regulation.type} No. ${regulation.number} Year ${regulation.year}
**Title:** ${regulation.title}

**Content:**
${this.truncateText(content, 2000)}

Extract:
1. The specific article or provision (pasal/ayat)
2. How it applies to the topic
3. The practical impact

Return as JSON with provision, application, and impact fields.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.3, maxTokens: 500 });

    try {
      const result = this.extractJson(response.content);
      return {
        regulationId: regulation.id,
        provision: result.provision || 'General provisions',
        application: result.application || 'Applies to related policies',
        impact: result.impact || 'Supports policy implementation',
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate summary of regulations
   */
  private generateSummary(regulations: RegulationReference[], input: RdtiiExtractorInput): {
    totalRegulations: number;
    byType: Record<string, number>;
    timeframe: string;
    keyThemes: string[];
  } {
    // Count by type
    const byType: Record<string, number> = {};
    for (const reg of regulations) {
      byType[reg.type] = (byType[reg.type] || 0) + 1;
    }

    // Determine timeframe
    const years = regulations.map(r => r.year).filter(y => y > 0);
    const timeframe = years.length > 0
      ? `${Math.min(...years)}-${Math.max(...years)}`
      : 'Various';

    // Extract themes (simplified - could use LLM)
    const keyThemes = this.extractThemes(input.topic, regulations);

    return {
      totalRegulations: regulations.length,
      byType,
      timeframe,
      keyThemes,
    };
  }

  /**
   * Extract key themes from regulations
   */
  private extractThemes(topic: string, regulations: RegulationReference[]): string[] {
    const themes = new Set<string>();
    const topicLower = topic.toLowerCase();

    // Simple keyword-based theme extraction
    const themeKeywords = {
      'Investment': ['investasi', 'investment', 'penanaman modal'],
      'Environment': ['lingkungan', 'environment', 'alam'],
      'Digital': ['digital', 'teknologi', 'technology', 'elektronik'],
      'Health': ['kesehatan', 'health', 'medis'],
      'Education': ['pendidikan', 'education', 'sekolah'],
      'Infrastructure': ['infrastruktur', 'infrastructure', 'bangunan'],
      'Governance': ['tata kelola', 'governance', 'pemerintahan'],
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      for (const reg of regulations) {
        const titleLower = reg.title.toLowerCase();
        for (const keyword of keywords) {
          if (titleLower.includes(keyword) || topicLower.includes(keyword)) {
            themes.add(theme);
            break;
          }
        }
      }
    }

    return Array.from(themes).slice(0, 5);
  }

  /**
   * Identify regulatory gaps
   */
  private async identifyGaps(topic: string, regulations: RegulationReference[]): Promise<string[]> {
    if (regulations.length === 0) {
      return ['No relevant regulations found - comprehensive legal framework review needed'];
    }

    const prompt = `Analyze these Indonesian regulations for the policy topic and identify gaps:

Topic: ${topic}

Regulations:
${regulations.map(r => `- ${r.type} ${r.number}/${r.year}: ${r.title}`).join('\n')}

Identify:
1. Legal gaps (areas not covered by existing regulations)
2. Outdated provisions (needs updating/revising)
3. Conflicting requirements
4. Implementation challenges

Return as JSON array of gap descriptions.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.5, maxTokens: 500 });

    try {
      const result = this.extractJson(response.content);
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate regulatory compliance checklist
   */
  async generateComplianceChecklist(topic: string, regulations: RegulationReference[]): Promise<{
    requirements: Array<{
      regulation: string;
      requirement: string;
      status: 'required' | 'recommended' | 'optional';
    }>;
  }> {
    const prompt = `Based on these regulations, create a compliance checklist for the topic:

Topic: ${topic}

Regulations:
${regulations.slice(0, 5).map(r => `- ${r.type} ${r.number}/${r.year}: ${r.title}`).join('\n')}

Return JSON array with:
- regulation: Citation
- requirement: What needs to be done
- status: required/recommended/optional`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.3, maxTokens: 800 });

    try {
      const result = this.extractJson(response.content);
      return {
        requirements: Array.isArray(result) ? result : [],
      };
    } catch {
      return { requirements: [] };
    }
  }

  /**
   * Track regulation amendments
   */
  async trackAmendments(regulationId: string): Promise<{
    original: RegulationReference;
    amendments: RegulationReference[];
    currentStatus: 'valid' | 'amended' | 'revoked' | 'superseded';
  }> {
    // This would query the RDTII database for amendment history
    // For now, return placeholder
    return {
      original: {
        id: regulationId,
        type: 'UU',
        number: '1',
        year: 2024,
        title: 'Sample Regulation',
        relevance: 1,
      },
      amendments: [],
      currentStatus: 'valid',
    };
  }
}
