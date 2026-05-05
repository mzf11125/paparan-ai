import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { RpjmnService } from '@modules/tools/rpjmn/rpjmn.service';
import { RPJMNScoringResultSchema } from '@models/schemas/common.schemas';

export interface RpjmnScorerInput {
  briefId?: string;
  briefContent?: string;
  topic?: string;
  summary?: string;
  recommendations?: string[];
  keyDevelopments?: string[];
}

export interface RPJMNPillar {
  code: string;
  name: string;
  description: string;
  targets: RPJMNTarget[];
}

export interface RPJMNTarget {
  code: string;
  description: string;
  unit: string;
  baselineValue?: number;
  targetValue: number;
}

export interface RpjmnScoringResult {
  pillar: {
    code: string;
    name: string;
  };
  target?: {
    code: string;
    description: string;
  };
  score: number; // 0-100
  rationale: string;
  alignment: 'high' | 'medium' | 'low';
  suggestions: string[];
  relatedPillars?: Array<{
    code: string;
    name: string;
    score: number;
  }>;
}

/**
 * RPJMN Scorer Agent - Scores policies against RPJMN 2025-2029 pillars
 */
@Injectable()
export class RpjmnScorerAgent extends BaseAgent {
  readonly name = 'rpjmn_scorer';
  readonly description = 'Scores policies against RPJMN 2025-2029 pillars';
  readonly type: AgentType = 'rpjmn_scorer';

  constructor(
    protected llm: LLMService,
    private rpjmn: RpjmnService,
  ) {
    super(llm, {
      systemPrompt: `You are an RPJMN (Rencana Pembangunan Jangka Menengah Nasional) Scoring Specialist for Indonesia's 2025-2029 National Medium-Term Development Plan.

Your role is to:
1. Analyze policy briefs and documents for RPJMN alignment
2. Identify the most relevant RPJMN pillar
3. Score alignment on a 0-100 scale
4. Provide specific rationale for the scoring
5. Suggest improvements for better alignment
6. Identify secondary pillar alignments

RPJMN 2025-2029 Eight Pillars:
1. Pembangunan Berkelanjutan (Sustainable Development) - Economic growth with environmental sustainability
2. Penguatan Pemerintahan (Strengthening Governance) - Institutional capacity and anti-corruption
3. Pembangunan Ekonomi (Economic Development) - Job creation, investment, MSME support
4. Pengurangan Kemiskinan (Poverty Reduction) - Social protection, inclusive growth
5. Peningkatan Pendidikan (Education Improvement) - Human capital development
6. Peningkatan Kesehatan (Health Improvement) - Healthcare access and quality
7. Pembangunan Infrastruktur (Infrastructure Development) - Connectivity and basic infrastructure
8. Pembangunan Daerah (Regional Development) - Reducing regional disparities

When scoring:
- Consider the policy's direct impact on pillar goals
- Assess alignment with specific targets within pillars
- Evaluate measurement and accountability mechanisms
- Identify synergies with other pillars
- Provide actionable suggestions for improvement`,
    });
  }

  async execute(input: RpjmnScorerInput, context: AgentContext): Promise<AgentResponse<RpjmnScoringResult>> {
    this.validateInput(input, ['briefContent']);

    if (!input.briefContent && !input.briefId) {
      throw new Error('Must provide either briefContent or briefId');
    }

    try {
      let content = input.briefContent;

      // If briefId provided, fetch content
      if (!content && input.briefId) {
        // TODO: Implement repository lookup
        // content = await this.repository.getBriefContent(input.briefId);
        throw new Error('Brief content retrieval by ID not yet implemented');
      }

      // Get RPJMN pillars for reference
      const pillars = await this.rpjmn.getPillars();

      // Build scoring prompt with pillar context
      const prompt = this.buildScoringPrompt(input, pillars);

      // Generate structured scoring
      const scoring = await this.llm.generateStructuredWithRetry(
        prompt,
        RPJMNScoringResultSchema,
        { temperature: 0.5, maxTokens: 2048 },
      );

      return {
        success: true,
        data: {
          pillar: {
            code: scoring.pillarCode || 'K99',
            name: scoring.pillarName || 'Unknown',
          },
          target: scoring.targetCode ? {
            code: scoring.targetCode,
            description: scoring.targetDescription || '',
          } : undefined,
          score: scoring.score || 0,
          rationale: scoring.rationale || '',
          alignment: this.determineAlignment(scoring.score || 0),
          suggestions: scoring.suggestions || [],
          relatedPillars: scoring.relatedPillars || [],
        },
      };
    } catch (error) {
      this.logger.error(`RPJMN scoring failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build scoring prompt with pillar context
   */
  private buildScoringPrompt(input: RpjmnScorerInput, pillars: RPJMNPillar[]): string {
    let prompt = `Analyze the following policy brief and score its alignment with Indonesia's RPJMN 2025-2029.\n\n`;

    prompt += `**Topic:** ${input.topic || 'Not specified'}\n\n`;

    if (input.summary) {
      prompt += `**Summary:** ${input.summary}\n\n`;
    }

    if (input.keyDevelopments && input.keyDevelopments.length > 0) {
      prompt += `**Key Developments:**\n`;
      input.keyDevelopments.forEach((dev, i) => {
        prompt += `${i + 1}. ${dev}\n`;
      });
      prompt += '\n';
    }

    if (input.recommendations && input.recommendations.length > 0) {
      prompt += `**Recommendations:**\n`;
      input.recommendations.forEach((rec, i) => {
        prompt += `${i + 1}. ${rec}\n`;
      });
      prompt += '\n';
    }

    prompt += `**RPJMN 2025-2029 Pillars for Reference:**\n`;
    pillars.forEach(pillar => {
      prompt += `- ${pillar.code}: ${pillar.name}\n`;
      prompt += `  ${pillar.description}\n`;
    });

    prompt += `\nProvide:
1. The most relevant pillar code and name
2. Specific target within that pillar (if applicable)
3. Alignment score (0-100)
4. Clear rationale for the score
5. 3-5 specific suggestions to improve RPJMN alignment
6. Related pillars with their alignment scores (secondary alignments)`;

    return prompt;
  }

  /**
   * Determine alignment level from score
   */
  private determineAlignment(score: number): 'high' | 'medium' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Score multiple briefs in batch
   */
  async batchScore(briefs: Array<{
    id: string;
    topic: string;
    summary: string;
    recommendations?: string[];
  }>): Promise<Map<string, RpjmnScoringResult>> {
    const results = new Map<string, RpjmnScoringResult>();

    for (const brief of briefs) {
      try {
        const result = await this.execute({
          briefId: brief.id,
          topic: brief.topic,
          summary: brief.summary,
          recommendations: brief.recommendations,
        }, { userId: 'system' });

        if (result.success && result.data) {
          results.set(brief.id, result.data);
        }
      } catch (error) {
        this.logger.warn(`Failed to score brief ${brief.id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get pillar distribution across multiple briefs
   */
  async analyzePillarDistribution(briefIds: string[]): Promise<{
    distribution: Map<string, number>;
    totalBriefs: number;
    mostAligned: string;
    leastAligned: string;
  }> {
    // Score all briefs
    const scores = await this.batchScore(
      briefIds.map(id => ({ id, topic: '', summary: '' })),
    );

    // Count by pillar
    const distribution = new Map<string, number>();
    for (const result of scores.values()) {
      const pillarCode = result.pillar.code;
      distribution.set(pillarCode, (distribution.get(pillarCode) || 0) + 1);
    }

    // Find most and least aligned
    let mostAligned = '';
    let leastAligned = '';
    let maxCount = 0;
    let minCount = Infinity;

    for (const [pillar, count] of distribution) {
      if (count > maxCount) {
        maxCount = count;
        mostAligned = pillar;
      }
      if (count < minCount) {
        minCount = count;
        leastAligned = pillar;
      }
    }

    return {
      distribution,
      totalBriefs: scores.size,
      mostAligned,
      leastAligned,
    };
  }

  /**
   * Generate RPJMN alignment report
   */
  async generateAlignmentReport(briefs: Array<{
    id: string;
    topic: string;
    summary: string;
  }>): Promise<string> {
    const scores = await this.batchScore(briefs);

    let report = '# RPJMN Alignment Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `**Total Briefs Analyzed:** ${scores.size}\n\n`;

    // Calculate statistics
    const pillarGroups = new Map<string, RpjmnScoringResult[]>();
    let totalScore = 0;

    for (const [id, score] of scores) {
      const pillarCode = score.pillar.code;
      if (!pillarGroups.has(pillarCode)) {
        pillarGroups.set(pillarCode, []);
      }
      pillarGroups.get(pillarCode)!.push(score);
      totalScore += score.score;
    }

    report += '## Overall Statistics\n\n';
    report += `- **Average Alignment Score:** ${Math.round(totalScore / scores.size)}/100\n`;
    report += `- **Pillars Represented:** ${pillarGroups.size}\n\n`;

    report += '## Pillar Distribution\n\n';
    for (const [pillarCode, pillarScores] of pillarGroups) {
      const avgScore = Math.round(
        pillarScores.reduce((sum, s) => sum + s.score, 0) / pillarScores.length
      );
      report += `### ${pillarCode}: ${pillarScores[0].pillar.name}\n`;
      report += `- Briefs: ${pillarScores.length}\n`;
      report += `- Average Score: ${avgScore}/100\n\n`;
    }

    report += '## Detailed Brief Scores\n\n';
    for (const [id, score] of scores) {
      report += `### ${id}\n`;
      report += `- **Pillar:** ${score.pillar.code} - ${score.pillar.name}\n`;
      report += `- **Alignment Score:** ${score.score}/100 (${score.alignment})\n`;
      report += `- **Rationale:** ${score.rationale}\n\n`;
    }

    return report;
  }

  /**
   * Suggest RPJMN-aligned improvements
   */
  async suggestImprovements(briefContent: string, currentScore: number): Promise<string[]> {
    if (currentScore >= 80) {
      return ['Brief already has strong RPJMN alignment'];
    }

    const prompt = `The following policy brief has an RPJMN alignment score of ${currentScore}/100.

Brief content:
${this.truncateText(briefContent, 3000)}

Suggest 3-5 specific improvements to increase RPJMN alignment. Focus on:
1. Explicit connections to RPJMN pillars
2. Specific targets within pillars
3. Measurable outcomes aligned with RPJMN
4. Implementation considerations for RPJMN alignment

Return as a JSON array of improvement suggestions.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.7, maxTokens: 500 });

    try {
      const result = this.extractJson(response.content);
      return Array.isArray(result) ? result : [response.content];
    } catch {
      return [
        'Add explicit references to relevant RPJMN pillars',
        'Include specific RPJMN target codes',
        'Define measurable outcomes aligned with RPJMN',
      ];
    }
  }

  /**
   * Compare two briefs' RPJMN alignment
   */
  async compareAlignment(brief1: { content: string; topic: string }, brief2: { content: string; topic: string }): Promise<{
    brief1Score: number;
    brief2Score: number;
    brief1Pillar: string;
    brief2Pillar: string;
    comparison: string;
    recommendation: string;
  }> {
    const result1 = await this.execute({ briefContent: brief1.content, topic: brief1.topic }, { userId: 'system' });
    const result2 = await this.execute({ briefContent: brief2.content, topic: brief2.topic }, { userId: 'system' });

    const prompt = `Compare these two policy briefs in terms of RPJMN alignment:

Brief 1: ${brief1.topic}
Score: ${result1.data?.score || 0}/100
Pillar: ${result1.data?.pillar.code || 'N/A'} - ${result1.data?.pillar.name || 'N/A'}

Brief 2: ${brief2.topic}
Score: ${result2.data?.score || 0}/100
Pillar: ${result2.data?.pillar.code || 'N/A'} - ${result2.data?.pillar.name || 'N/A'}

Provide a brief comparison and recommendation for which brief better serves RPJMN goals.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.5, maxTokens: 300 });

    return {
      brief1Score: result1.data?.score || 0,
      brief2Score: result2.data?.score || 0,
      brief1Pillar: result1.data?.pillar.name || 'Unknown',
      brief2Pillar: result2.data?.pillar.name || 'Unknown',
      comparison: response.content,
      recommendation: result1.data && result1.data.score > (result2.data?.score || 0)
        ? brief1.topic
        : brief2.topic,
    };
  }
}
