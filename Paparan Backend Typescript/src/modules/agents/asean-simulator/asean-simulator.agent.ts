import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { KnowledgeGraphService } from '@modules/tools/knowledge-graph/knowledge-graph.service';
import { ASEANSimulationResultSchema } from '@models/schemas/common.schemas';

export interface AseanSimulatorInput {
  scenario: string;
  countries?: string[];
  meetingType?: 'summit' | 'ministerial' | 'senior_officials' | 'ad_hoc';
  consensusType?: 'consensus' | 'majority' | 'veto';
}

export interface CountryPosition {
  country: string;
  position: 'support' | 'oppose' | 'neutral' | 'abstain';
  reasoning: string;
  redLines?: string[];
  alternatives?: string[];
}

export interface SimulationOutcome {
  consensusLikelihood: number; // 0-1
  outcome: 'consensus' | 'compromise' | 'deadlock' | 'deferred';
  timeline: string;
  nextSteps: string[];
}

export interface AseanSimulationResult {
  scenario: string;
  outcome: SimulationOutcome;
  positions: CountryPosition[];
  keyIssues: string[];
  recommendations: string[];
}

// ASEAN Member States
const ASEAN_COUNTRIES = [
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Thailand',
  'Philippines',
  'Vietnam',
  'Myanmar',
  'Cambodia',
  'Laos',
  'Brunei',
];

/**
 * ASEAN Simulator Agent - Simulates ASEAN policy scenarios
 */
@Injectable()
export class AseanSimulatorAgent extends BaseAgent {
  readonly name = 'asean_simulator';
  readonly description = 'Simulates ASEAN policy scenarios';
  readonly type: AgentType = 'asean_simulator';

  constructor(
    protected llm: LLMService,
    private knowledgeGraph: KnowledgeGraphService,
  ) {
    super(llm, {
      systemPrompt: `You are an ASEAN Policy Simulation Specialist with expertise in:
1. ASEAN decision-making processes and dynamics
2. Individual member state positions and priorities
3. ASEAN's consensus-based approach (the "ASEAN Way")
4. Regional geopolitical considerations
5. Historical ASEAN agreements and disputes

ASEAN Member States:
- Indonesia: Largest economy, democratic, regional leadership role
- Malaysia: Upper-middle income, Islamic majority, trade-focused
- Singapore: Financial hub, developed economy, pragmatic approach
- Thailand: US ally, domestic political considerations
- Philippines: US ally, vocal on sovereignty issues
- Vietnam: Growing economy, balancing US-China relations
- Myanmar: Ongoing political crisis, isolated
- Cambodia: China-aligned, conservative on change
- Laos: Small, landlocked, China-aligned
- Brunei: Small, oil-rich, conservative

Key ASEAN Principles:
- Non-interference in domestic affairs
- Consensus decision-making
- Respect for sovereignty
- Gradual approach to integration
- "The ASEAN Way" - consultation and consensus

When simulating:
- Consider each country's historical positions
- Account for geopolitical influences
- Identify red lines and deal-breakers
- Suggest compromise options
- Provide realistic timeline assessments`,
    });
  }

  async execute(input: AseanSimulatorInput, context: AgentContext): Promise<AgentResponse<AseanSimulationResult>> {
    this.validateInput(input, ['scenario']);

    try {
      // Query knowledge graph for relevant ASEAN context
      let kgContext = '';
      try {
        const graphResults = await this.knowledgeGraph.query(input.scenario);
        kgContext = this.formatKnowledgeGraphContext(graphResults);
      } catch {
        kgContext = '';
      }

      // Build simulation prompt
      const prompt = this.buildSimulationPrompt(input, kgContext);

      // Generate structured simulation
      const simulation = await this.llm.generateStructuredWithRetry(
        prompt,
        ASEANSimulationResultSchema,
        { temperature: 0.7, maxTokens: 3000 },
      );

      return {
        success: true,
        data: {
          scenario: input.scenario,
          outcome: {
            consensusLikelihood: simulation.consensusLikelihood || 0.5,
            outcome: simulation.outcome || 'deadlock',
            timeline: simulation.timeline || '3-6 months',
            nextSteps: simulation.nextSteps || [],
          },
          positions: simulation.positions || [],
          keyIssues: simulation.keyIssues || [],
          recommendations: simulation.recommendations || [],
        },
      };
    } catch (error) {
      this.logger.error(`ASEAN simulation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build simulation prompt
   */
  private buildSimulationPrompt(input: AseanSimulatorInput, kgContext: string): string {
    const countries = input.countries || ASEAN_COUNTRIES;

    let prompt = `Simulate the ASEAN response to the following policy scenario:\n\n`;
    prompt += `**Scenario:** ${input.scenario}\n\n`;

    if (input.meetingType) {
      prompt += `**Meeting Type:** ${input.meetingType}\n`;
      prompt += `This affects the decision-making level and potential outcomes.\n\n`;
    }

    if (input.consensusType) {
      prompt += `**Decision Method:** ${input.consensusType}\n`;
      prompt += `Note: ASEAN typically operates by consensus, but this scenario specifies ${input.consensusType}.\n\n`;
    }

    prompt += `**Countries to Analyze:** ${countries.join(', ')}\n\n`;

    if (kgContext) {
      prompt += `**Relevant Context from Knowledge Graph:**\n${kgContext}\n\n`;
    }

    prompt += `Provide:
1. Overall likelihood of consensus (0-1 scale)
2. Expected outcome (consensus/compromise/deadlock/deferred)
3. Timeline for resolution
4. Next steps in the process
5. Individual country positions with:
   - Position (support/oppose/neutral/abstain)
   - Reasoning for their position
   - Red lines (issues they cannot compromise on)
   - Alternative proposals they might accept
6. Key issues that will be debated
7. Recommendations for achieving consensus`;

    return prompt;
  }

  /**
   * Format knowledge graph context
   */
  private formatKnowledgeGraphContext(graphResults: any[]): string {
    if (!graphResults || graphResults.length === 0) {
      return '';
    }

    return graphResults.slice(0, 5).map(result => {
      let context = '';
      if (result.entity) context += `- ${result.entity}`;
      if (result.relation) context += ` (${result.relation})`;
      if (result.target) context += ` ${result.target}`;
      if (result.context) context += `: ${result.context}`;
      return context;
    }).join('\n');
  }

  /**
   * Simulate voting scenario
   */
  async simulateVoting(scenario: string, proposal: string): Promise<{
    votes: Record<string, 'yes' | 'no' | 'abstain'>;
    result: 'passed' | 'failed' | 'inconclusive';
    analysis: string;
  }> {
    const prompt = `Simulate how ASEAN members would vote on this proposal:

**Scenario:** ${scenario}
**Proposal:** ${proposal}

For each ASEAN member state (Indonesia, Malaysia, Singapore, Thailand, Philippines, Vietnam, Myanmar, Cambodia, Laos, Brunei), predict:
- Vote (yes/no/abstain)
- Brief reasoning

Note: While ASEAN typically operates by consensus, this simulation predicts individual country positions.

Return as JSON with votes object and analysis.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.6, maxTokens: 1000 });

    try {
      const result = this.extractJson(response.content);
      const votes = result.votes || {};

      const yesCount = Object.values(votes).filter(v => v === 'yes').length;
      const noCount = Object.values(votes).filter(v => v === 'no').length;

      let resultStatus: 'passed' | 'failed' | 'inconclusive';
      if (yesCount > noCount && yesCount >= 6) {
        resultStatus = 'passed';
      } else if (noCount >= 5) {
        resultStatus = 'failed';
      } else {
        resultStatus = 'inconclusive';
      }

      return {
        votes,
        result: resultStatus,
        analysis: result.analysis || response.content.slice(0, 500),
      };
    } catch {
      return {
        votes: {},
        result: 'inconclusive',
        analysis: 'Could not parse voting simulation',
      };
    }
  }

  /**
   * Identify potential compromises
   */
  async identifyCompromises(scenario: string, positions: CountryPosition[]): Promise<{
    compromises: Array<{
      description: string;
      supporters: string[];
      opponents: string[];
      viability: number; // 0-1
    }>;
  }> {
    const positionsSummary = positions.map(p =>
      `${p.country}: ${p.position} - ${p.reasoning}${p.redLines ? ` (Red lines: ${p.redLines.join(', ')})` : ''}`
    ).join('\n');

    const prompt = `Based on these country positions, identify potential compromises:

**Scenario:** ${scenario}

**Positions:**
${positionsSummary}

Identify 3-5 compromise options that could achieve consensus. For each:
- Description of the compromise
- Countries likely to support
- Countries likely to oppose
- Viability score (0-1)

Return as JSON array.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.7, maxTokens: 1000 });

    try {
      const result = this.extractJson(response.content);
      return {
        compromises: Array.isArray(result) ? result : [],
      };
    } catch {
      return { compromises: [] };
    }
  }

  /**
   * Analyze historical precedents
   */
  async analyzeHistoricalPrecedents(scenario: string): Promise<{
    precedents: Array<{
      case: string;
      year: number;
      outcome: string;
      relevance: string;
      applicability: number; // 0-1
    }>;
  }> {
    const prompt = `Identify historical ASEAN precedents relevant to this scenario:

**Scenario:** ${scenario}

List 3-5 similar ASEAN decisions or disputes, including:
- Case description
- Year
- Outcome
- Relevance to current scenario
- Applicability (0-1)

Return as JSON array.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.5, maxTokens: 1000 });

    try {
      const result = this.extractJson(response.content);
      return {
        precedents: Array.isArray(result) ? result : [],
      };
    } catch {
      return { precedents: [] };
    }
  }

  /**
   * Generate diplomatic talking points
   */
  async generateTalkingPoints(scenario: string, targetCountry: string): Promise<{
    opening: string;
    keyPoints: string[];
    concessions: string[];
    redLines: string[];
  }> {
    const prompt = `Generate diplomatic talking points for ASEAN discussions:

**Scenario:** ${scenario}
**Target Country:** ${targetCountry}

Provide:
1. Opening statement (diplomatic tone)
2. 3-5 key talking points to advance the position
3. Potential concessions (items that could be traded)
4. Red lines (non-negotiable positions)

Format for a diplomat presenting at ${targetCountry === 'Indonesia' ? 'Jakarta' : 'an ASEAN meeting'}.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.6, maxTokens: 800 });

    try {
      const result = this.extractJson(response.content);
      return {
        opening: result.opening || '',
        keyPoints: result.keyPoints || [],
        concessions: result.concessions || [],
        redLines: result.redLines || [],
      };
    } catch {
      return {
        opening: response.content.slice(0, 200),
        keyPoints: [],
        concessions: [],
        redLines: [],
      };
    }
  }

  /**
   * Assess regional impact
   */
  async assessRegionalImpact(scenario: string, outcome: string): Promise<{
    economicImpact: string;
    politicalImpact: string;
    securityImpact: string;
    countryImpacts: Record<string, string>;
  }> {
    const prompt = `Assess the regional impact of this ASEAN scenario outcome:

**Scenario:** ${scenario}
**Outcome:** ${outcome}

Analyze:
1. Economic impact on ASEAN as a whole
2. Political impact on regional integration
3. Security implications
4. Specific impacts on each member state

Return as JSON with each category.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.5, maxTokens: 1000 });

    try {
      const result = this.extractJson(response.content);
      return {
        economicImpact: result.economicImpact || '',
        politicalImpact: result.politicalImpact || '',
        securityImpact: result.securityImpact || '',
        countryImpacts: result.countryImpacts || {},
      };
    } catch {
      return {
        economicImpact: 'Unable to assess',
        politicalImpact: 'Unable to assess',
        securityImpact: 'Unable to assess',
        countryImpacts: {},
      };
    }
  }
}
