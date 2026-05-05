import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { z } from 'zod';
import { AnalysisSchema } from '@models/schemas/common.schemas';

export interface AnalysisInput {
  research: {
    sources: any[];
    keyFindings: string[];
    summary: string;
  };
  topic: string;
  region?: string;
}

/**
 * Analyst Agent - Analyzes research findings and generates policy implications
 */
@Injectable()
export class AnalystAgent extends BaseAgent {
  readonly name = 'analyst';
  readonly description = 'Analyzes research findings and generates policy implications';
  readonly type: AgentType = 'analyst';

  constructor(protected llm: LLMService) {
    super(llm, {
      systemPrompt: `You are a Policy Analyst Agent specializing in:
1. Analyzing research findings for policy implications
2. Identifying risks and opportunities
3. Recommending actionable policy interventions
4. Assessing impact on different stakeholders

Your analysis should be:
- Evidence-based and grounded in the provided research
- Balanced and objective
- Actionable and specific
- Tailored to the relevant policy context`,
    });
  }

  async execute(input: AnalysisInput, context: AgentContext): Promise<AgentResponse> {
    this.validateInput(input, ['research', 'topic']);

    try {
      // Use structured output generation
      const analysis = await this.llm.generateStructuredWithRetry(
        this.buildAnalysisPrompt(input),
        AnalysisSchema,
        { temperature: 0.7 },
      );

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      // Fallback to simple analysis
      this.logger.warn('Structured generation failed, using fallback');
      return this.fallbackAnalysis(input);
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(input: AnalysisInput): string {
    let prompt = `Analyze the following research findings and provide policy analysis.

Topic: ${input.topic}
${input.region ? `Region: ${input.region}` : ''}

Research Summary:
${input.research.summary}

Key Findings:
${input.research.keyFindings.map(f => `- ${f}`).join('\n')}

Sources:
${input.research.sources.slice(0, 5).map((s, i) => `${i + 1}. ${s.title || 'Untitled'}: ${s.summary?.slice(0, 100) || 'No summary'}`).join('\n')}

Provide a comprehensive analysis including:
1. Policy implications (3-5 specific implications)
2. Recommended actions with priorities (high/medium/low)
3. Risk level assessment (low/medium/high) with reasoning
4. Key stakeholders who should be involved`;

    return prompt;
  }

  /**
   * Fallback analysis when structured output fails
   */
  private async fallbackAnalysis(input: AnalysisInput): Promise<AgentResponse> {
    const messages = this.formatMessages(this.buildAnalysisPrompt(input));

    const response = await this.llm.chat(messages);

    // Parse the text response
    return {
      success: true,
      data: {
        implications: this.extractSection(response.content, 'implications'),
        recommendations: this.extractSection(response.content, 'recommendations'),
        riskLevel: this.extractRiskLevel(response.content),
      },
    };
  }

  /**
   * Extract a section from LLM response
   */
  private extractSection(content: string, sectionName: string): string[] {
    const lines = content.split('\n');
    const results: string[] = [];
    let inSection = false;

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes(sectionName.toLowerCase())) {
        inSection = true;
        continue;
      }

      if (inSection && line.trim().length > 0) {
        if (/^\d+\.\s/.test(line) || /^[-•*]\s/.test(line)) {
          results.push(line.replace(/^[\d\.\-*•]+\s*/, '').trim());
        } else if (results.length > 0) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Extract risk level from response
   */
  private extractRiskLevel(content: string): 'low' | 'medium' | 'high' {
    const lower = content.toLowerCase();

    if (lower.includes('high risk') || lower.includes('significant risk')) {
      return 'high';
    }
    if (lower.includes('low risk') || lower.includes('minimal risk')) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Analyze specific policy brief
   */
  async analyzeBrief(brief: {
    topic: string;
    summary: string;
    keyDevelopments: any[];
  }): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    const prompt = `Evaluate this policy brief:

Topic: ${brief.topic}
Summary: ${brief.summary}

Key Developments:
${brief.keyDevelopments.map(d => `- ${d.title}: ${d.description}`).join('\n')}

Provide:
1. Key strengths (3-5 points)
2. Potential weaknesses or gaps (3-5 points)
3. Recommendations for improvement (3-5 points)`;

    const messages = this.formatMessages(prompt);

    const response = await this.llm.chat(messages);

    return {
      strengths: this.extractSection(response.content, 'strengths'),
      weaknesses: this.extractSection(response.content, 'weakness'),
      recommendations: this.extractSection(response.content, 'recommendation'),
    };
  }

  /**
   * Compare two policy options
   */
  async compareOptions(options: {
    optionA: string;
    optionB: string;
    criteria: string[];
  }): Promise<{
    winner: 'A' | 'B' | 'tie';
    comparison: Record<string, { aScore: number; bScore: number; analysis: string }>;
  }> {
    const prompt = `Compare these two policy options:

Option A: ${options.optionA}
Option B: ${options.optionB}

Evaluation Criteria:
${options.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

For each criterion, provide:
- Score for Option A (1-10)
- Score for Option B (1-10)
- Brief analysis

Finally, declare a winner (A, B, or tie) with justification.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    // Parse comparison result
    return this.parseComparison(response.content, options.criteria);
  }

  /**
   * Parse comparison response
   */
  private parseComparison(content: string, criteria: string[]): {
    winner: 'A' | 'B' | 'tie';
    comparison: Record<string, { aScore: number; bScore: number; analysis: string }>;
  } {
    const comparison: Record<string, { aScore: number; bScore: number; analysis: string }> = {};

    // Extract scores and winner (simplified implementation)
    for (const criterion of criteria) {
      comparison[criterion] = {
        aScore: 5,
        bScore: 5,
        analysis: 'Not explicitly scored',
      };
    }

    const lower = content.toLowerCase();
    let winner: 'A' | 'B' | 'tie' = 'tie';

    if (lower.includes('option a is preferred') || lower.includes('a wins')) {
      winner = 'A';
    } else if (lower.includes('option b is preferred') || lower.includes('b wins')) {
      winner = 'B';
    }

    return { winner, comparison };
  }

  /**
   * Generate stakeholder analysis
   */
  async analyzeStakeholders(topic: string, region?: string): Promise<{
    primary: string[];
    secondary: string[];
    opponents: string[];
    keyConcerns: Record<string, string>;
  }> {
    const prompt = `Identify stakeholders for the following policy topic:
${region ? `Region: ${region}` : ''}

Topic: ${topic}

Categorize stakeholders as:
1. Primary stakeholders (directly affected)
2. Secondary stakeholders (indirectly affected)
3. Potential opponents
4. Key concerns for each stakeholder group`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    return this.parseStakeholders(response.content);
  }

  /**
   * Parse stakeholder analysis
   */
  private parseStakeholders(content: string): {
    primary: string[];
    secondary: string[];
    opponents: string[];
    keyConcerns: Record<string, string>;
  } {
    return {
      primary: this.extractSection(content, 'primary') || this.extractList(content, 'primary stakeholders'),
      secondary: this.extractSection(content, 'secondary') || this.extractList(content, 'secondary stakeholders'),
      opponents: this.extractSection(content, 'opponents') || this.extractList(content, 'opponents'),
      keyConcerns: {},
    };
  }

  /**
   * Extract list from content
   */
  private extractList(content: string, keyword: string): string[] {
    const lines = content.split('\n');
    const results: string[] = [];

    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        // Start capturing from next line
        continue;
      }
      if (/^[-•*]\s/.test(line) || /^\d+\.\s/.test(line)) {
        results.push(line.replace(/^[\d\.\-*•]+\s*/, '').trim());
      } else if (results.length > 0 && line.trim().length > 0) {
        break;
      }
    }

    return results;
  }
}
