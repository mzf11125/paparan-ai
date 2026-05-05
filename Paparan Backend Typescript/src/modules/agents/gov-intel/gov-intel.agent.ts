import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { PolicyBriefSchema } from '@models/schemas/common.schemas';

export interface GovIntelInput {
  topic: string;
  region?: string;
  classification?: string;
  research?: {
    sources: any[];
    keyFindings: string[];
    summary: string;
  };
  analysis?: {
    implications: string[];
    recommendations: string[];
    riskLevel?: 'low' | 'medium' | 'high';
  };
}

/**
 * Government Intelligence Agent - Generates comprehensive policy briefs
 */
@Injectable()
export class GovIntelAgent extends BaseAgent {
  readonly name = 'gov_intel';
  readonly description = 'Government intelligence agent for policy analysis';
  readonly type: AgentType = 'gov_intel';

  constructor(protected llm: LLMService) {
    super(llm, {
      systemPrompt: `You are a Government Intelligence Analyst for Indonesia. Your role is to:
1. Generate comprehensive policy briefs on various topics
2. Synthesize research findings and analysis into actionable insights
3. Provide clear policy recommendations with priority levels
4. Identify key stakeholders and implementation considerations
5. Consider both domestic and international implications

Your briefs should be:
- Comprehensive yet concise
- Evidence-based and well-sourced
- Actionable and specific
- Tailored to Indonesian policy context where applicable
- Objective and balanced`,
    });
  }

  async execute(input: GovIntelInput, context: AgentContext): Promise<AgentResponse> {
    this.validateInput(input, ['topic']);

    try {
      // Use structured output generation for policy briefs
      const brief = await this.llm.generateStructuredWithRetry(
        this.buildBriefPrompt(input),
        PolicyBriefSchema,
        { temperature: 0.7, maxTokens: 8000 },
      );

      return {
        success: true,
        data: {
          ...brief,
          topic: input.topic,
          region: input.region,
          classification: input.classification || 'general',
        },
      };
    } catch (error) {
      this.logger.error(`Policy brief generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build prompt for brief generation
   */
  private buildBriefPrompt(input: GovIntelInput): string {
    let prompt = `Generate a comprehensive policy brief on: ${input.topic}`;

    if (input.region) {
      prompt += `\nRegion: ${input.region}`;
    }

    if (input.classification) {
      prompt += `\nClassification: ${input.classification}`;
    }

    if (input.research) {
      prompt += `\n\nResearch Summary:\n${input.research.summary}`;
      prompt += `\n\nKey Findings:\n${input.research.keyFindings.map(f => `- ${f}`).join('\n')}`;
    }

    if (input.analysis) {
      prompt += `\n\nAnalysis Implications:\n${input.analysis.implications.map(i => `- ${i}`).join('\n')}`;
      prompt += `\n\nRecommended Actions:\n${input.analysis.recommendations.map(r => `- ${r}`).join('\n')}`;
    }

    prompt += `\n\nProvide:
1. A clear and action-oriented title
2. A concise executive summary (2-3 sentences)
3. 3-5 key developments with significance assessment
4. Policy implications (3-5 specific implications)
5. Recommended actions with priorities (high/medium/low)
6. Relevant sources with proper attribution`;

    return prompt;
  }

  /**
   * Generate diplomatic memo format
   */
  async generateDiplomaticMemo(input: {
    brief: any;
    recipient: string;
    sender: string;
    date?: string;
    classification?: string;
  }): Promise<string> {
    const prompt = `Convert this policy brief into a diplomatic memo format:

TO: ${input.recipient}
FROM: ${input.sender}
DATE: ${input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
SUBJECT: ${input.brief.title || 'Policy Brief'}

BRIEF SUMMARY:
${input.brief.summary}

KEY DEVELOPMENTS:
${(input.brief.keyDevelopments || []).map((d: any) => `- ${d.title}: ${d.significance}`).join('\n')}

RECOMMENDED ACTIONS:
${(input.brief.recommendations || []).map((r: any) => `${r.priority.toUpperCase()}: ${r.action} - ${r.rationale}`).join('\n')}

Generate a professional diplomatic memo in proper format.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    return response.content;
  }

  /**
   * Generate talking points for brief
   */
  async generateTalkingPoints(brief: any): Promise<string[]> {
    const prompt = `Generate 5-7 key talking points for this policy brief:

Title: ${brief.title}
Summary: ${brief.summary}

Key Developments:
${(brief.keyDevelopments || []).map((d: any) => `- ${d.title}: ${d.description}`).join('\n')}

Talking points should be:
- Concise and actionable
- Suitable for presentations or meetings
- Ordered by priority
- Include supporting data where relevant`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    // Parse talking points (one per line or bullet)
    return this.extractTalkingPoints(response.content);
  }

  /**
   * Extract talking points from response
   */
  private extractTalkingPoints(content: string): string[] {
    const lines = content.split('\n');
    const points: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        points.push(trimmed.replace(/^[\d\.\-*•]+\s*/, ''));
      } else if (trimmed.length > 0 && points.length > 0 && points.length < 10) {
        points.push(trimmed);
      }
    }

    return points.slice(0, 7); // Max 7 points
  }

  /**
   * Generate implementation roadmap
   */
  async generateImplementationRoadmap(brief: any, options: {
    timeframe?: string;
    responsibleParty?: string;
  } = {}): Promise<{
    phases: Array<{
      phase: number;
      title: string;
      timeline: string;
      actions: string[];
      stakeholders: string[];
    }>;
  }> {
    const prompt = `Create an implementation roadmap for this policy brief:

Title: ${brief.title}
Summary: ${brief.summary}

Key Recommendations:
${(brief.recommendations || []).map((r: any) => `- ${r.action} (${r.priority})`).join('\n')}

${options.timeframe ? `Timeframe: ${options.timeframe}` : ''}
${options.responsibleParty ? `Responsible Party: ${options.responsibleParty}` : ''}

Break down into phases with:
1. Phase number and title
2. Timeline for each phase
3. Key actions per phase
4. Key stakeholders to involve`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    return this.parseRoadmap(response.content);
  }

  /**
   * Parse roadmap from response
   */
  private parseRoadmap(content: string): {
    phases: Array<{
      phase: number;
      title: string;
      timeline: string;
      actions: string[];
      stakeholders: string[];
    }>;
  } {
    const phases: any[] = [];
    const lines = content.split('\n');
    let currentPhase: any = null;
    let phaseNum = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect phase header
      if (/^phase\s+\d+/i.test(trimmed)) {
        if (currentPhase) {
          phases.push(currentPhase);
        }
        phaseNum++;
        currentPhase = {
          phase: phaseNum,
          title: trimmed.replace(/^phase\s+\d+:\s*/i, ''),
          timeline: '',
          actions: [],
          stakeholders: [],
        };
      } else if (currentPhase) {
        if (/timeline:|timeframe:/i.test(trimmed)) {
          currentPhase.timeline = trimmed.split(/:/)[1]?.trim() || trimmed;
        } else if (/actions?|steps?|tasks:/i.test(trimmed)) {
          // Start capturing actions
        } else if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
          currentPhase.actions.push(trimmed.replace(/^[\d\.\-*•]+\s*/, ''));
        }
      }
    }

    if (currentPhase) {
      phases.push(currentPhase);
    }

    return { phases };
  }

  /**
   * Brief risk assessment
   */
  async assessRisks(brief: any): Promise<{
    risks: Array<{
      risk: string;
      level: 'low' | 'medium' | 'high' | 'critical';
      mitigation: string;
    }>;
  }> {
    const prompt = `Assess risks for implementing this policy brief:

Title: ${brief.title}
Summary: ${brief.summary}

Key Recommendations:
${(brief.recommendations || []).map((r: any) => `- ${r.action} (${r.priority})`).join('\n')}

Identify:
1. Political risks
2. Implementation risks
3. Stakeholder resistance risks
4. Resource constraints
5. External factors

For each risk, provide the risk level and mitigation strategy.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    return this.parseRisks(response.content);
  }

  /**
   * Parse risks from response
   */
  private parseRisks(content: string): {
    risks: Array<{
      risk: string;
      level: 'low' | 'medium' | 'high' | 'critical';
      mitigation: string;
    }>;
  } {
    const risks = [];
    const lines = content.split('\n');
    let currentRisk: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Risk header
      if (/^[-•*]\s*\(?:(low|medium|high|critical)\)?/i.test(trimmed)) {
        if (currentRisk) {
          risks.push(currentRisk);
        }

        const match = trimmed.match(/:\s*(low|medium|high|critical)/i);
        const level = match ? match[1].toLowerCase() : 'medium';
        const risk = trimmed.replace(/^[-•*:\s]*|:\s*$/gi, '').trim();

        currentRisk = {
          risk,
          level: level as 'low' | 'medium' | 'high' | 'critical',
          mitigation: '',
        };
      } else if (currentRisk) {
        if (/mitigation:/i.test(trimmed)) {
          currentRisk.mitigation = trimmed.replace(/mitigation:\s*/i, '').trim();
        }
      }
    }

    if (currentRisk) {
      risks.push(currentRisk);
    }

    return { risks };
  }

  /**
   * Generate parliamentary questions
   */
  async generateParliamentaryQuestions(brief: any): Promise<string[]> {
    const prompt = `Generate 10 parliamentary questions that could be asked about this policy brief:

Title: ${brief.title}
Summary: ${brief.summary}
Key Developments: ${(brief.keyDevelopments || []).map((d: any) => d.title).join(', ')}

Questions should be:
- Formatted for parliamentary discussion
- Cover different aspects (budget, implementation, timeline, oversight)
- Suitable for written or oral questions`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages);

    return this.extractQuestions(response.content);
  }

  /**
   * Extract questions from response
   */
  private extractQuestions(content: string): string[] {
    const questions: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+\.\s/.test(trimmed) || /^[-•*]\s/.test(trimmed)) {
        questions.push(trimmed.replace(/^[\d\.\-*•]+\s*/, ''));
      } else if (trimmed.includes('?') && questions.length < 10) {
        questions.push(trimmed);
      }
    }

    return questions.slice(0, 10);
  }
}
