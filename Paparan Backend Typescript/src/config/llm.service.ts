import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, LLMProviderType, LLMMessage, LLMResponse, LLMStreamChunk, LLMConfig } from '@models/types/llm.types';
import { LLMFactory, LLMError, LLMTimeoutError, LLMRateLimitError, LLMValidationError } from './llm.factory';
import { z } from 'zod';
import {
  PolicyBriefSchema,
  ResearchResultSchema,
  AnalysisResultSchema,
  TopicClassificationSchema,
  ChatResponseSchema,
  RPJMNScoringResultSchema,
  SDIMetadataExtractionSchema,
  ASEANSimulationResultSchema,
} from '@models/schemas/common.schemas';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private primaryProvider: LLMProvider;
  private fallbackProviders: Map<LLMProviderType, LLMProvider> = new Map();

  constructor(
    private configService: ConfigService,
    @Inject('LLM_PROVIDER') provider: LLMProvider,
  ) {
    this.primaryProvider = provider;
    this.initializeFallbackProviders();
  }

  private initializeFallbackProviders() {
    const availableProviders: LLMProviderType[] = ['zai', 'anthropic', 'zhipu'];

    for (const providerType of availableProviders) {
      if (providerType !== this.primaryProvider.type) {
        try {
          const provider = LLMFactory.createProviderWithType(providerType, this.configService);
          this.fallbackProviders.set(providerType, provider);
          this.logger.log(`Initialized fallback provider: ${providerType}`);
        } catch (error) {
          this.logger.warn(`Failed to initialize fallback provider ${providerType}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Simple chat completion
   */
  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.primaryProvider.chat(messages, config);
  }

  /**
   * Chat with automatic fallback
   */
  async chatWithFallback(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>,
  ): Promise<LLMResponse> {
    try {
      return await this.primaryProvider.chat(messages, config);
    } catch (error) {
      this.logger.warn(`Primary provider failed: ${error.message}, trying fallback...`);

      for (const [type, provider] of this.fallbackProviders) {
        try {
          this.logger.log(`Trying fallback provider: ${type}`);
          return await provider.chat(messages, config);
        } catch (fallbackError) {
          this.logger.warn(`Fallback provider ${type} also failed: ${fallbackError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Streaming chat completion
   */
  async* stream(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncIterable<LLMStreamChunk> {
    yield* this.primaryProvider.stream(messages, config);
  }

  /**
   * Generate structured output with Zod schema validation
   */
  async generateStructured<T extends z.ZodType>(
    prompt: string,
    schema: T,
    config?: Partial<LLMConfig>,
  ): Promise<z.infer<T>> {
    return this.primaryProvider.generateStructured(prompt, schema, config);
  }

  /**
   * Generate structured output with retries on validation errors
   */
  async generateStructuredWithRetry<T extends z.ZodType>(
    prompt: string,
    schema: T,
    config?: Partial<LLMConfig>,
    maxAttempts: number = 3,
  ): Promise<z.infer<T>> {
    return this.primaryProvider.generateStructuredWithRetry(prompt, schema, config, maxAttempts);
  }

  // ========================================================================
  // Specialized Methods for Common Use Cases
  // ========================================================================

  /**
   * Classify a policy topic
   */
  async classifyTopic(topic: string): Promise<z.infer<typeof TopicClassificationSchema>> {
    const prompt = `Classify the following policy topic into one of these categories:
- bappenas: Indonesian government development planning, SDI indicators, Bappenas-related
- financial: Economic policy, finance, monetary policy, fiscal policy
- asean: ASEAN regional cooperation, Southeast Asian policy
- general: General policy topics that don't fit other categories

Topic: ${topic}

Provide your classification with confidence score (0-1) and reasoning.`;

    return this.generateStructuredWithRetry(prompt, TopicClassificationSchema);
  }

  /**
   * Generate a complete policy brief
   */
  async generatePolicyBrief(input: {
    topic: string;
    region?: string;
    classification?: string;
    research?: string;
  }): Promise<z.infer<typeof PolicyBriefSchema>> {
    const prompt = this.buildPolicyBriefPrompt(input);
    return this.generateStructuredWithRetry(prompt, PolicyBriefSchema, {
      temperature: 0.7,
      maxTokens: 8000,
    });
  }

  private buildPolicyBriefPrompt(input: {
    topic: string;
    region?: string;
    classification?: string;
    research?: string;
  }): string {
    let prompt = `Generate a comprehensive policy brief on: ${input.topic}`;

    if (input.region) {
      prompt += `\nRegion: ${input.region}`;
    }

    if (input.classification) {
      prompt += `\nClassification: ${input.classification}`;
    }

    if (input.research) {
      prompt += `\n\nResearch Context:\n${input.research}`;
    }

    prompt += `

The policy brief should include:
1. A clear and concise title
2. An executive summary
3. Key developments with significance assessment
4. Policy implications
5. Recommended actions with priorities
6. Relevant sources with tier classification
7. Optional talking points
8. Optional RPJMN alignment (if applicable to Indonesian policy)`;

    return prompt;
  }

  /**
   * Conduct research on a topic
   */
  async conductResearch(topic: string, region?: string): Promise<z.infer<typeof ResearchResultSchema>> {
    const prompt = `Conduct comprehensive research on: ${topic}${region ? ` (focus on ${region})` : ''}

Your research should include:
1. Relevant and recent sources
2. Key findings from the research
3. A summary of the current state of knowledge

Provide sources with URLs when available.`;

    return this.generateStructuredWithRetry(prompt, ResearchResultSchema);
  }

  /**
   * Analyze research findings
   */
  async analyzeResearch(research: string, topic: string): Promise<z.infer<typeof AnalysisResultSchema>> {
    const prompt = `Analyze the following research findings on: ${topic}

Research:
${research}

Provide:
1. Policy implications of the research
2. Specific recommended actions
3. Risk level assessment (low/medium/high)`;

    return this.generateStructuredWithRetry(prompt, AnalysisResultSchema);
  }

  /**
   * Score a policy brief against RPJMN pillars
   */
  async scoreRPJMN(briefContent: string): Promise<z.infer<typeof RPJMNScoringResultSchema>> {
    const prompt = `Score the following policy brief against Indonesia's RPJMN 2025-2029 pillars:

${briefContent}

Identify:
1. The most relevant RPJMN pillar
2. The specific target within that pillar
3. Alignment score (0-100)
4. Rationale for the scoring
5. Suggestions for better alignment`;

    return this.generateStructuredWithRetry(prompt, RPJMNScoringResultSchema);
  }

  /**
   * Generate chat response with RAG context
   */
  async generateChatResponse(
    userMessage: string,
    context: {
      conversationHistory?: LLMMessage[];
      retrievedDocuments?: Array<{ content: string; source?: string }>;
      systemPrompt?: string;
    } = {},
  ): Promise<z.infer<typeof ChatResponseSchema>> {
    let prompt = userMessage;

    if (context.retrievedDocuments && context.retrievedDocuments.length > 0) {
      prompt += '\n\nRelevant context:\n';
      context.retrievedDocuments.forEach((doc, i) => {
        prompt += `\n[Source ${i + 1}]: ${doc.content}`;
        if (doc.source) {
          prompt += `\n(Source: ${doc.source})`;
        }
      });
    }

    const systemPrompt = context.systemPrompt || 'You are a helpful AI assistant for Paparan AI, a policy intelligence platform. Provide accurate, helpful responses about policy topics.';

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory || []),
      { role: 'user', content: prompt },
    ];

    return this.generateStructuredWithRetry(
      messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
      ChatResponseSchema,
    );
  }

  /**
   * Simulate ASEAN policy scenario
   */
  async simulateASEAN(scenario: string, countries?: string[]): Promise<z.infer<typeof ASEANSimulationResultSchema>> {
    let prompt = `Simulate the ASEAN response to the following policy scenario:\n${scenario}`;

    if (countries && countries.length > 0) {
      prompt += `\n\nFocus on these countries: ${countries.join(', ')}`;
    }

    prompt += `

Provide:
1. Overall likelihood of consensus (0-1)
2. Individual country positions
3. Potential consensus outcome
4. Countries likely to block
5. Estimated timeline for resolution`;

    return this.generateStructuredWithRetry(prompt, ASEANSimulationResultSchema);
  }

  /**
   * Extract SDI metadata from document content
   */
  async extractSDIMetadata(documentContent: string): Promise<z.infer<typeof SDIMetadataExtractionSchema>> {
    const prompt = `Extract SDI-compliant metadata from the following document content.

Document content:
${documentContent}

Extract:
1. All indicators with K/L codes (format: K## for sector, L## for indicator)
2. Document metadata (title, author, date, source, keywords)
3. Ensure all indicators have proper definitions and sector classifications`;

    return this.generateStructuredWithRetry(prompt, SDIMetadataExtractionSchema, {
      temperature: 0.3,
    });
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get the current provider type
   */
  getProviderType(): LLMProviderType {
    return this.primaryProvider.type;
  }

  /**
   * Switch to a different provider
   */
  switchProvider(providerType: LLMProviderType): void {
    const provider = LLMFactory.createProviderWithType(providerType, this.configService);
    this.primaryProvider = provider;
    this.logger.log(`Switched to provider: ${providerType}`);
  }

  /**
   * Check if a specific provider is available as fallback
   */
  hasFallback(providerType: LLMProviderType): boolean {
    return this.fallbackProviders.has(providerType);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return [this.primaryProvider.type, ...Array.from(this.fallbackProviders.keys())];
  }
}
