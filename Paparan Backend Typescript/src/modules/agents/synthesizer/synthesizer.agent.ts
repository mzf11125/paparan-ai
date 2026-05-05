import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';

export interface SynthesizerInput {
  briefIds: string[];
  topic?: string;
  synthesisType?: 'comprehensive' | 'comparative' | 'trend' | 'gaps';
  focusAreas?: string[];
}

export interface BriefReference {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  relevanceScore: number;
}

export interface SynthesisResult {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  trends?: string[];
  gaps?: string[];
  briefReferences: BriefReference[];
  metadata: {
    briefsAnalyzed: number;
    synthesisType: string;
    timestamp: string;
  };
}

/**
 * Synthesizer Agent - Synthesizes insights across multiple briefs
 */
@Injectable()
export class SynthesizerAgent extends BaseAgent {
  readonly name = 'synthesizer';
  readonly description = 'Synthesizes insights across multiple briefs';
  readonly type: AgentType = 'synthesizer';

  constructor(protected llm: LLMService) {
    super(llm, {
      systemPrompt: `You are a Policy Synthesis Specialist for Indonesian policy intelligence.

Your role is to:
1. Synthesize insights from multiple policy briefs
2. Identify common themes and patterns
3. Highlight divergences and conflicts
4. Extract actionable recommendations
5. Identify trends across time or topics
6. Surface gaps in knowledge or policy coverage

When synthesizing:
- Maintain objectivity and balance
- Preserve attribution of ideas to source briefs
- Identify consensus and disagreement areas
- Prioritize actionable insights
- Consider Indonesian policy context
- Note data limitations or uncertainties`,
    });
  }

  async execute(input: SynthesizerInput, context: AgentContext): Promise<AgentResponse<SynthesisResult>> {
    this.validateInput(input, ['briefIds']);

    if (input.briefIds.length === 0) {
      throw new Error('At least one brief ID is required');
    }

    if (input.briefIds.length === 1) {
      // Single brief - just return its content
      return this.synthesizeSingle(input.briefIds[0], input);
    }

    try {
      // Fetch brief contents (TODO: implement repository lookup)
      const briefs = await this.fetchBriefs(input.briefIds);

      if (briefs.length === 0) {
        throw new Error('No briefs found with provided IDs');
      }

      // Perform synthesis based on type
      const synthesisType = input.synthesisType || 'comprehensive';
      let synthesis: SynthesisResult;

      switch (synthesisType) {
        case 'comparative':
          synthesis = await this.comparativeSynthesis(briefs, input);
          break;
        case 'trend':
          synthesis = await this.trendSynthesis(briefs, input);
          break;
        case 'gaps':
          synthesis = await this.gapSynthesis(briefs, input);
          break;
        case 'comprehensive':
        default:
          synthesis = await this.comprehensiveSynthesis(briefs, input);
          break;
      }

      return {
        success: true,
        data: synthesis,
      };
    } catch (error) {
      this.logger.error(`Synthesis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle single brief synthesis
   */
  private async synthesizeSingle(briefId: string, input: SynthesizerInput): Promise<AgentResponse<SynthesisResult>> {
    const brief = await this.fetchBrief(briefId);

    return {
      success: true,
      data: {
        summary: brief.summary || '',
        keyInsights: brief.keyInsights || brief.keyPoints || [],
        recommendations: brief.recommendations || [],
        briefReferences: [{
          id: brief.id,
          title: brief.title,
          summary: brief.summary || '',
          keyPoints: brief.keyPoints || [],
          relevanceScore: 1,
        }],
        metadata: {
          briefsAnalyzed: 1,
          synthesisType: input.synthesisType || 'single',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * Comprehensive synthesis across all briefs
   */
  private async comprehensiveSynthesis(briefs: any[], input: SynthesizerInput): Promise<SynthesisResult> {
    const prompt = this.buildSynthesisPrompt(briefs, {
      type: 'comprehensive',
      topic: input.topic,
      focusAreas: input.focusAreas,
    });

    const response = await this.llm.chat(this.formatMessages(prompt), {
      temperature: 0.6,
      maxTokens: 3000,
    });

    return this.parseSynthesisResponse(response.content, briefs, 'comprehensive');
  }

  /**
   * Comparative synthesis highlighting differences
   */
  private async comparativeSynthesis(briefs: any[], input: SynthesizerInput): Promise<SynthesisResult> {
    const prompt = this.buildSynthesisPrompt(briefs, {
      type: 'comparative',
      topic: input.topic,
      focusAreas: input.focusAreas,
    });

    const response = await this.llm.chat(this.formatMessages(prompt), {
      temperature: 0.5,
      maxTokens: 3000,
    });

    return this.parseSynthesisResponse(response.content, briefs, 'comparative');
  }

  /**
   * Trend synthesis across time
   */
  private async trendSynthesis(briefs: any[], input: SynthesizerInput): Promise<SynthesisResult> {
    // Sort by date if available
    const sortedBriefs = [...briefs].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });

    const prompt = this.buildSynthesisPrompt(sortedBriefs, {
      type: 'trend',
      topic: input.topic,
      focusAreas: input.focusAreas,
    });

    const response = await this.llm.chat(this.formatMessages(prompt), {
      temperature: 0.5,
      maxTokens: 3000,
    });

    const result = this.parseSynthesisResponse(response.content, sortedBriefs, 'trend');

    // Add trends specific analysis
    result.trends = await this.extractTrends(sortedBriefs);

    return result;
  }

  /**
   * Gap synthesis identifying missing areas
   */
  private async gapSynthesis(briefs: any[], input: SynthesizerInput): Promise<SynthesisResult> {
    const prompt = this.buildSynthesisPrompt(briefs, {
      type: 'gaps',
      topic: input.topic,
      focusAreas: input.focusAreas,
    });

    const response = await this.llm.chat(this.formatMessages(prompt), {
      temperature: 0.6,
      maxTokens: 3000,
    });

    const result = this.parseSynthesisResponse(response.content, briefs, 'gaps');

    // Add gaps specific analysis
    result.gaps = await this.identifyGaps(briefs, input.topic);

    return result;
  }

  /**
   * Build synthesis prompt
   */
  private buildSynthesisPrompt(briefs: any[], options: {
    type: string;
    topic?: string;
    focusAreas?: string[];
  }): string {
    let prompt = `Synthesize insights from the following ${briefs.length} policy briefs.\n\n`;

    if (options.topic) {
      prompt += `**Overall Topic:** ${options.topic}\n\n`;
    }

    prompt += `**Briefs:**\n\n`;
    briefs.forEach((brief, i) => {
      prompt += `### Brief ${i + 1}: ${brief.title || 'Untitled'}\n`;
      if (brief.id) prompt += `ID: ${brief.id}\n`;
      if (brief.date) prompt += `Date: ${brief.date}\n`;
      if (brief.summary) prompt += `Summary: ${brief.summary}\n`;
      if (brief.keyPoints && brief.keyPoints.length > 0) {
        prompt += `Key Points:\n${brief.keyPoints.map((p: string) => `- ${p}`).join('\n')}\n`;
      }
      prompt += '\n';
    });

    if (options.focusAreas && options.focusAreas.length > 0) {
      prompt += `**Focus Areas:** ${options.focusAreas.join(', ')}\n\n`;
    }

    switch (options.type) {
      case 'comparative':
        prompt += `Provide a comparative analysis highlighting:
1. Areas of agreement and consensus
2. Key differences and divergences
3. Conflicting recommendations
4. Relative strengths of each brief
5. Which brief provides the most comprehensive coverage`;
        break;
      case 'trend':
        prompt += `Analyze trends across these briefs:
1. How perspectives have evolved over time
2. Emerging themes gaining prominence
3. Declining or resolved issues
4. Shifting recommendations
5. Predictions for future developments`;
        break;
      case 'gaps':
        prompt += `Identify gaps and missing elements:
1. Topics not covered by any brief
2. Underexplored areas
3. Missing data or evidence
4. Questions left unanswered
5. Recommendations for additional research`;
        break;
      case 'comprehensive':
      default:
        prompt += `Provide a comprehensive synthesis including:
1. Executive summary (2-3 sentences)
2. 5-7 key insights across all briefs
3. Consolidated recommendations (prioritized)
4. Areas of consensus and disagreement
5. Important caveats or limitations`;
        break;
    }

    return prompt;
  }

  /**
   * Parse synthesis response
   */
  private parseSynthesisResponse(content: string, briefs: any[], synthesisType: string): SynthesisResult {
    // Extract sections
    const summary = this.extractSection(content, ['summary', 'executive summary', 'overview']) ||
                     content.slice(0, 500);

    const keyInsights = this.extractListItems(content, ['key insights', 'insights', 'findings']);
    const recommendations = this.extractListItems(content, ['recommendations', 'recommended actions']);

    // Build brief references
    const briefReferences: BriefReference[] = briefs.map((brief, i) => ({
      id: brief.id || `brief_${i}`,
      title: brief.title || `Brief ${i + 1}`,
      summary: brief.summary || '',
      keyPoints: brief.keyPoints || [],
      relevanceScore: 1, // Could be calculated based on content similarity
    }));

    return {
      summary,
      keyInsights,
      recommendations,
      briefReferences,
      metadata: {
        briefsAnalyzed: briefs.length,
        synthesisType,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract a section from content
   */
  private extractSection(content: string, headers: string[]): string {
    const lower = content.toLowerCase();
    let startIndex = -1;

    for (const header of headers) {
      const index = lower.indexOf(header.toLowerCase());
      if (index !== -1 && (startIndex === -1 || index < startIndex)) {
        startIndex = index;
      }
    }

    if (startIndex === -1) return '';

    // Find end of section (next header or end of content)
    let endIndex = content.length;
    const remainingContent = content.slice(startIndex + 50);
    const nextHeaderMatch = remainingContent.match(/^#{1,3}\s/m);
    if (nextHeaderMatch && nextHeaderMatch.index !== undefined) {
      endIndex = startIndex + 50 + nextHeaderMatch.index;
    }

    return content.slice(startIndex, endIndex).trim().slice(0, 1000);
  }

  /**
   * Extract list items from content
   */
  private extractListItems(content: string, sectionHeaders: string[]): string[] {
    const section = this.extractSection(content, sectionHeaders);
    const items: string[] = [];
    const lines = section.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        items.push(trimmed.replace(/^[-•*\d.]\s*/, '').trim());
      }
    }

    return items.slice(0, 10);
  }

  /**
   * Extract trends from briefs
   */
  private async extractTrends(briefs: any[]): Promise<string[]> {
    if (briefs.length < 2) return [];

    const prompt = `Analyze these policy briefs in chronological order and identify trends:

${briefs.map((b, i) => `${i + 1}. ${b.title || 'Brief'} (${b.date || 'unknown date'}): ${b.summary?.slice(0, 200) || ''}`).join('\n\n')}

List 3-5 key trends in how the topic has evolved.`;

    const response = await this.llm.chat(this.formatMessages(prompt), { temperature: 0.5, maxTokens: 500 });

    return this.extractListItems(response.content, ['trends']);
  }

  /**
   * Identify gaps across briefs
   */
  private async identifyGaps(briefs: any[], topic?: string): Promise<string[]> {
    const prompt = `Analyze these policy briefs and identify gaps - areas not covered or underdeveloped:

${briefs.map((b, i) => `${i + 1}. ${b.title || 'Brief'}: ${b.summary?.slice(0, 200) || ''}`).join('\n\n')}

${topic ? `Topic: ${topic}\n\n` : ''}List 3-5 significant gaps in coverage.`;

    const response = await this.llm.chat(this.formatMessages(prompt), { temperature: 0.6, maxTokens: 500 });

    return this.extractListItems(response.content, ['gaps', 'missing']);
  }

  /**
   * Fetch briefs by IDs (TODO: implement with repository)
   */
  private async fetchBriefs(ids: string[]): Promise<any[]> {
    // Placeholder - would implement actual database lookup
    return ids.map(id => ({
      id,
      title: `Policy Brief ${id}`,
      summary: 'Summary content would be loaded from database',
      keyPoints: [],
      recommendations: [],
    }));
  }

  /**
   * Fetch single brief
   */
  private async fetchBrief(id: string): Promise<any> {
    const briefs = await this.fetchBriefs([id]);
    return briefs[0];
  }

  /**
   * Generate executive summary for synthesis
   */
  async generateExecutiveSummary(synthesis: SynthesisResult): Promise<string> {
    const prompt = `Create an executive summary (2-3 sentences) for this policy synthesis:

**Key Insights:** ${synthesis.keyInsights.slice(0, 3).join('; ')}
**Recommendations:** ${synthesis.recommendations.slice(0, 3).join('; ')}
**Briefs Analyzed:** ${synthesis.metadata.briefsAnalyzed}

The summary should be concise, action-oriented, and suitable for policy makers.`;

    const response = await this.llm.chat(this.formatMessages(prompt), { temperature: 0.5, maxTokens: 200 });

    return response.content.trim();
  }

  /**
   * Create visualization data for synthesis
   */
  createVisualizationData(synthesis: SynthesisResult): {
    wordCloud?: { word: string; weight: number }[];
    briefRelationships?: { source: string; target: string; strength: number }[];
    themeDistribution?: { theme: string; count: number }[];
  } {
    // Placeholder for visualization data generation
    // In production, would analyze text and create actual visualizations
    return {
      themeDistribution: synthesis.keyInsights.map((insight, i) => ({
        theme: insight.slice(0, 30),
        count: synthesis.keyInsights.length - i,
      })),
    };
  }
}
