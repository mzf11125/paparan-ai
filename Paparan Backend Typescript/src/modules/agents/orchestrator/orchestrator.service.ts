import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import {
  OrchestratorState,
  PolicyBrief,
  RouteType,
  AgentContext,
  AgentResponse,
  Source,
  ResearchResult,
  AnalysisResult,
} from '@models/types/agent.types';
import { BaseAgent } from './base/base.agent';
import { ResearcherAgent } from '../researcher/researcher.agent';
import { AnalystAgent } from '../analyst/analyst.agent';
import { GovIntelAgent } from '../gov-intel/gov-intel.agent';
import { MetadataExtractorAgent } from '../metadata-extractor/metadata-extractor.agent';
import { RpjmnScorerAgent } from '../rpjmn-scorer/rpjmn-scorer.agent';
import { AseanSimulatorAgent } from '../asean-simulator/asean-simulator.agent';
import { RdtiiExtractorAgent } from '../rdtii-extractor/rdtii-extractor.agent';

/**
 * Agent Orchestrator - Routes and coordinates agent execution
 * Implements LangGraph-like state machine pattern for agent workflows
 */
@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private agents: Map<string, BaseAgent> = new Map();

  constructor(
    private llm: LLMService,
    private researcher: ResearcherAgent,
    private analyst: AnalystAgent,
    private govIntel: GovIntelAgent,
    private metadataExtractor: MetadataExtractorAgent,
    private rpjmnScorer: RpjmnScorerAgent,
    private aseanSimulator: AseanSimulatorAgent,
    private rdtiiExtractor: RdtiiExtractorAgent,
  ) {
    this.registerAgents();
  }

  /**
   * Register all available agents
   */
  private registerAgents(): void {
    this.agents.set('researcher', this.researcher);
    this.agents.set('analyst', this.analyst);
    this.agents.set('gov_intel', this.govIntel);
    this.agents.set('metadata_extractor', this.metadataExtractor);
    this.agents.set('rpjmn_scorer', this.rpjmnScorer);
    this.agents.set('asean_simulator', this.aseanSimulator);
    this.agents.set('rdtii_extractor', this.rdtiiExtractor);

    this.logger.debug(`Registered ${this.agents.size} agents`);
  }

  /**
   * Get an agent by name
   */
  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Generate a complete policy brief using the orchestrator
   */
  async generateBrief(input: {
    topic: string;
    region?: string;
    userId: string;
    options?: {
      route?: RouteType;
      includeRPJMN?: boolean;
      includeRDTII?: boolean;
      simulateASEAN?: boolean;
    };
  }): Promise<PolicyBrief> {
    const state = this.createInitialState(input.topic, input.userId, input.region);

    this.logger.debug(`Starting orchestration for topic: ${input.topic}`);

    try {
      // Step 1: Classify the topic
      state.classification = await this.classifyTopic(state);

      // Step 2: Determine route (use provided option or auto-detect)
      state.route = input.options?.route || this.determineRoute(state);

      this.logger.debug(`Classification: ${state.classification}, Route: ${state.route}`);

      // Step 3: Execute agent chain based on route
      const brief = await this.executeAgentChain(state, input.options);

      // Step 4: Add optional enhancements
      if (input.options?.includeRPJMN && state.route === 'bappenas') {
        brief.rpjmnAlignment = await this.addRPJMNAlignment(brief);
      }

      if (input.options?.includeRDTII) {
        brief.regulatoryContext = await this.addRegulatoryContext(brief);
      }

      if (input.options?.simulateASEAN && state.route === 'asean') {
        brief.aseanSimulation = await this.addASEANSimulation(brief);
      }

      return brief;
    } catch (error) {
      this.logger.error(`Orchestration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stream brief generation with real-time updates
   */
  async* streamBrief(input: {
    topic: string;
    region?: string;
    userId: string;
    options?: {
      route?: RouteType;
    };
  }): AsyncIterable<{
    content: string;
    stage: string;
    data?: any;
    done?: boolean;
  }> {
    yield { content: 'Starting analysis...', stage: 'init' };

    const state = this.createInitialState(input.topic, input.userId, input.region);

    try {
      // Classification
      yield { content: 'Classifying topic...', stage: 'classify' };
      state.classification = await this.classifyTopic(state);
      yield {
        content: `Classification: ${state.classification}`,
        stage: 'classify',
        data: { classification: state.classification },
        done: true,
      };

      // Determine route
      state.route = input.options?.route || this.determineRoute(state);
      yield {
        content: `Route: ${state.route}`,
        stage: 'route',
        data: { route: state.route },
      };

      // Research
      yield { content: 'Conducting research...', stage: 'research' };
      state.researchResult = await this.executeResearch(state, this.getFocusForRoute(state.route));
      yield {
        content: `Found ${state.researchResult.sources.length} sources`,
        stage: 'research',
        data: { sourceCount: state.researchResult.sources.length },
        done: true,
      };

      // Analysis
      yield { content: 'Analyzing findings...', stage: 'analysis' };
      state.analysisResult = await this.executeAnalysis(state);
      yield {
        content: 'Analysis complete',
        stage: 'analysis',
        data: { riskLevel: state.analysisResult.riskLevel },
        done: true,
      };

      // Generate final brief
      yield { content: 'Generating policy brief...', stage: 'brief' };
      const brief = await this.generateFinalBrief(state);
      yield {
        content: 'Brief complete',
        stage: 'brief',
        data: { brief },
        done: true,
      };

      yield {
        content: JSON.stringify(brief, null, 2),
        stage: 'done',
        data: { brief },
        done: true,
      };
    } catch (error) {
      yield {
        content: `Error: ${error.message}`,
        stage: 'error',
        done: true,
      };
      throw error;
    }
  }

  /**
   * Classify the topic using LLM with keyword fallback
   */
  private async classifyTopic(state: OrchestratorState): Promise<string> {
    try {
      const classification = await this.llm.classifyTopic(state.topic);
      return classification.classification;
    } catch (error) {
      this.logger.warn(`LLM classification failed: ${error.message}, using keyword fallback`);
      return this.keywordClassification(state.topic);
    }
  }

  /**
   * Keyword-based classification fallback
   */
  private keywordClassification(topic: string): string {
    const lower = topic.toLowerCase();

    // Bappenas/Indonesia development keywords
    if (lower.includes('bappenas') || lower.includes('sdi') || lower.includes('rpjmn') ||
        lower.includes('development plan') || lower.includes('indonesia development') ||
        lower.includes('national development') || lower.includes(' pembangunan')) {
      return 'bappenas';
    }

    // Financial/economic keywords
    if (lower.includes('financial') || lower.includes('economic') || lower.includes('fiscal') ||
        lower.includes('monetary') || lower.includes('inflation') || lower.includes('gdp') ||
        lower.includes('ekonomi') || lower.includes('keuangan')) {
      return 'financial';
    }

    // ASEAN/Regional keywords
    if (lower.includes('asean') || lower.includes('southeast asia') || lower.includes('regional') ||
        lower.includes('mitigasi') || lower.includes('regional cooperation')) {
      return 'asean';
    }

    return 'general';
  }

  /**
   * Determine the agent route based on classification
   */
  private determineRoute(state: OrchestratorState): RouteType {
    if (state.classification === 'bappenas') {
      return 'bappenas';
    }

    if (state.classification === 'financial') {
      return 'financial';
    }

    if (state.classification === 'asean') {
      return 'asean';
    }

    return 'default';
  }

  /**
   * Get research focus for a given route
   */
  private getFocusForRoute(route: RouteType): string | undefined {
    const focusMap: Record<RouteType, string> = {
      bappenas: 'indonesia',
      financial: 'finance',
      asean: 'asean',
      default: undefined,
    };
    return focusMap[route];
  }

  /**
   * Execute the agent chain based on route
   */
  private async executeAgentChain(
    state: OrchestratorState,
    options?: {
      includeRPJMN?: boolean;
      includeRDTII?: boolean;
      simulateASEAN?: boolean;
    },
  ): Promise<PolicyBrief> {
    switch (state.route) {
      case 'bappenas':
        return this.executeBappenasChain(state, options);

      case 'financial':
        return this.executeFinancialChain(state, options);

      case 'asean':
        return this.executeAseanChain(state, options);

      case 'default':
      default:
        return this.executeDefaultChain(state, options);
    }
  }

  /**
   * Execute default agent chain
   */
  private async executeDefaultChain(
    state: OrchestratorState,
    options?: { includeRDTII?: boolean },
  ): Promise<PolicyBrief> {
    // Research
    state.researchResult = await this.executeResearch(state);

    // Analysis
    state.analysisResult = await this.executeAnalysis(state);

    // Generate brief using GovIntel agent
    const brief = await this.generateFinalBrief(state);

    // Optional: Add regulatory context
    if (options?.includeRDTII) {
      brief.regulatoryContext = await this.addRegulatoryContext(brief);
    }

    return brief;
  }

  /**
   * Execute financial agent chain
   */
  private async executeFinancialChain(
    state: OrchestratorState,
    options?: { includeRDTII?: boolean },
  ): Promise<PolicyBrief> {
    // Research with financial focus
    state.researchResult = await this.executeResearch(state, 'finance');

    // Analysis
    state.analysisResult = await this.executeAnalysis(state);

    // Generate brief
    const brief = await this.generateFinalBrief(state);

    // Add regulatory context for financial policies
    if (options?.includeRDTII) {
      brief.regulatoryContext = await this.addRegulatoryContext(brief);
    }

    return brief;
  }

  /**
   * Execute Bappenas agent chain
   */
  private async executeBappenasChain(
    state: OrchestratorState,
    options?: { includeRPJMN?: boolean; includeRDTII?: boolean },
  ): Promise<PolicyBrief> {
    // Research with Indonesia focus
    state.researchResult = await this.executeResearch(state, 'indonesia');

    // Analysis
    state.analysisResult = await this.executeAnalysis(state);

    // Generate brief
    const brief = await this.generateFinalBrief(state);

    // Add RPJMN alignment
    if (options?.includeRPJMN) {
      brief.rpjmnAlignment = await this.addRPJMNAlignment(brief);
    }

    // Add regulatory context
    if (options?.includeRDTII) {
      brief.regulatoryContext = await this.addRegulatoryContext(brief);
    }

    return brief;
  }

  /**
   * Execute ASEAN agent chain
   */
  private async executeAseanChain(
    state: OrchestratorState,
    options?: { simulateASEAN?: boolean },
  ): Promise<PolicyBrief> {
    // Research with ASEAN focus
    state.researchResult = await this.executeResearch(state, 'asean');

    // Analysis
    state.analysisResult = await this.executeAnalysis(state);

    // Generate brief
    const brief = await this.generateFinalBrief(state);

    // Add ASEAN simulation
    if (options?.simulateASEAN) {
      brief.aseanSimulation = await this.addASEANSimulation(brief);
    }

    return brief;
  }

  /**
   * Execute research phase
   */
  private async executeResearch(state: OrchestratorState, focus?: string): Promise<ResearchResult> {
    const context: AgentContext = {
      userId: state.context.userId,
      region: state.region,
      metadata: { focus },
    };

    const response = await this.researcher.executeSafe(
      { topic: state.topic, region: state.region, useVectorSearch: true },
      context,
    );

    if (!response.success) {
      this.logger.warn(`Research failed: ${response.error}, using minimal research`);
      return {
        sources: [],
        keyFindings: [],
        summary: 'Research could not be completed',
      };
    }

    return response.data;
  }

  /**
   * Execute analysis phase
   */
  private async executeAnalysis(state: OrchestratorState): Promise<AnalysisResult> {
    const context: AgentContext = {
      userId: state.context.userId,
      region: state.region,
    };

    const response = await this.analyst.executeSafe(
      {
        research: state.researchResult,
        topic: state.topic,
      },
      context,
    );

    if (!response.success) {
      this.logger.warn(`Analysis failed: ${response.error}, using minimal analysis`);
      return {
        implications: [],
        recommendations: [],
        riskLevel: 'medium',
      };
    }

    return response.data;
  }

  /**
   * Generate final policy brief using GovIntel agent
   */
  private async generateFinalBrief(state: OrchestratorState): Promise<PolicyBrief> {
    const context: AgentContext = {
      userId: state.context.userId,
      region: state.region,
    };

    const response = await this.govIntel.executeSafe(
      {
        topic: state.topic,
        region: state.region,
        classification: state.classification,
        research: state.researchResult,
        analysis: state.analysisResult,
      },
      context,
    );

    if (!response.success) {
      throw new Error(`Brief generation failed: ${response.error}`);
    }

    const brief: PolicyBrief = {
      ...response.data,
      topic: state.topic,
      region: state.region,
      classification: state.classification || 'general',
      createdAt: new Date().toISOString(),
    };

    return brief;
  }

  /**
   * Add RPJMN alignment to brief
   */
  private async addRPJMNAlignment(brief: PolicyBrief): Promise<any> {
    try {
      const context: AgentContext = { userId: 'system' };
      const response = await this.rpjmnScorer.executeSafe(
        {
          briefContent: JSON.stringify(brief),
          topic: brief.topic,
          summary: brief.summary,
          keyDevelopments: brief.keyDevelopments?.map(d => d.title) || [],
        },
        context,
      );

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      this.logger.warn(`RPJMN scoring failed: ${error.message}`);
    }

    return {
      pillar: 'Unknown',
      score: 0,
      rationale: 'RPJMN alignment not available',
    };
  }

  /**
   * Add regulatory context to brief
   */
  private async addRegulatoryContext(brief: PolicyBrief): Promise<any> {
    try {
      const context: AgentContext = { userId: 'system' };
      const response = await this.rdtiiExtractor.executeSafe(
        {
          topic: brief.topic,
          region: brief.region,
          includeEvidence: true,
        },
        context,
      );

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      this.logger.warn(`RDTII extraction failed: ${error.message}`);
    }

    return {
      regulations: [],
      evidence: [],
    };
  }

  /**
   * Add ASEAN simulation to brief
   */
  private async addASEANSimulation(brief: PolicyBrief): Promise<any> {
    try {
      const context: AgentContext = { userId: 'system' };
      const response = await this.aseanSimulator.executeSafe(
        {
          scenario: brief.topic,
          meetingType: 'ministerial',
        },
        context,
      );

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      this.logger.warn(`ASEAN simulation failed: ${error.message}`);
    }

    return {
      outcome: { consensusLikelihood: 0.5 },
      positions: [],
    };
  }

  /**
   * Create a new state object
   */
  createInitialState(topic: string, userId: string, region?: string): OrchestratorState {
    return {
      messages: [
        {
          role: 'system',
          content: 'You are the orchestrator for Paparan AI.',
        },
        {
          role: 'user',
          content: `Generate a policy brief on: ${topic}`,
        },
      ],
      context: {
        userId,
        region,
      },
      topic,
      region,
    };
  }

  /**
   * Get orchestrator state summary
   */
  getStateSummary(state: OrchestratorState): Record<string, any> {
    return {
      topic: state.topic,
      region: state.region,
      classification: state.classification,
      route: state.route,
      hasResearch: !!state.researchResult,
      hasAnalysis: !!state.analysisResult,
      hasBrief: !!state.brief,
      sourceCount: state.researchResult?.sources.length || 0,
      riskLevel: state.analysisResult?.riskLevel || 'unknown',
    };
  }

  /**
   * Get available routes
   */
  getAvailableRoutes(): RouteType[] {
    return ['bappenas', 'financial', 'asean', 'default'];
  }

  /**
   * Get registered agents
   */
  getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Execute agents in parallel
   */
  async executeParallel(
    agentNames: string[],
    input: any,
    context: AgentContext,
  ): Promise<Map<string, AgentResponse>> {
    const results = new Map<string, AgentResponse>();

    const promises = agentNames.map(async (name) => {
      const agent = this.agents.get(name);
      if (!agent) {
        results.set(name, {
          success: false,
          error: `Agent ${name} not found`,
        });
        return;
      }

      try {
        const result = await agent.executeSafe(input, context);
        results.set(name, result);
      } catch (error) {
        results.set(name, {
          success: false,
          error: error.message,
        });
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Execute agents in sequence, passing results to next agent
   */
  async executeSequential(
    agentChain: Array<{ agent: string; inputMapper?: (prev: any) => any }>,
    initialInput: any,
    context: AgentContext,
  ): Promise<AgentResponse> {
    let currentInput = initialInput;
    let lastResponse: AgentResponse = { success: true };

    for (const link of agentChain) {
      const agent = this.agents.get(link.agent);
      if (!agent) {
        return {
          success: false,
          error: `Agent ${link.agent} not found`,
        };
      }

      const input = link.inputMapper ? link.inputMapper(currentInput) : currentInput;
      const response = await agent.executeSafe(input, context);

      if (!response.success) {
        return response;
      }

      lastResponse = response;
      currentInput = response.data;
    }

    return lastResponse;
  }
}
