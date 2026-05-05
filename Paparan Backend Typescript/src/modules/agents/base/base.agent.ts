import { Logger } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { LLMMessage } from '@models/types/llm.types';
import { ToolDefinition } from '@modules/tools/tools.types';
import { AgentContext, AgentResponse } from '@models/types/agent.types';

/**
 * Base Agent Interface
 * All agents must implement this interface
 */
export interface IAgent {
  readonly name: string;
  readonly description: string;
  readonly type: AgentType;

  execute(input: any, context: AgentContext): Promise<AgentResponse>;
  stream?(input: any, context: AgentContext): AsyncIterable<AgentStreamChunk>;
}

/**
 * Agent Types
 */
export type AgentType =
  | 'orchestrator'
  | 'researcher'
  | 'analyst'
  | 'gov_intel'
  | 'metadata_extractor'
  | 'consistency_checker'
  | 'conversational'
  | 'scraper'
  | 'rpjmn_scorer'
  | 'rdtii_extractor'
  | 'synthesizer'
  | 'asean_simulator';

/**
 * Agent Execution Context
 */
export interface AgentContext {
  userId: string;
  threadId?: string;
  sessionId?: string;
  region?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent Response
 */
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    agent?: string;
  };
}

/**
 * Agent Stream Chunk
 */
export interface AgentStreamChunk {
  content: string;
  done: boolean;
  metadata?: Record<string, any>;
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  type: AgentType;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
  retryOnFailure?: boolean;
  timeout?: number;
}

/**
 * Agent Execution Result
 */
export interface AgentExecutionResult {
  agent: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  tokensUsed?: number;
}

/**
 * Abstract Base Agent Class
 * All agents should extend this class
 */
export abstract class BaseAgent implements IAgent {
  protected readonly logger: Logger;
  protected readonly llm: LLMService;

  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly type: AgentType;

  protected config: AgentConfig;

  constructor(llm: LLMService, config: Partial<AgentConfig> = {}) {
    this.llm = llm;
    this.logger = new Logger(this.name);

    this.config = {
      name: this.name,
      description: this.description,
      type: this.type,
      temperature: 0.7,
      maxTokens: 4096,
      retryOnFailure: true,
      timeout: 60000,
      ...config,
    };
  }

  /**
   * Execute the agent's primary function
   */
  abstract execute(input: any, context: AgentContext): Promise<AgentResponse>;

  /**
   * Execute with timing and error handling
   */
  async executeSafe(input: any, context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Executing agent: ${this.name}`);

      const result = await this.execute(input, context);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime: Date.now() - startTime,
          agent: this.name,
        },
      };
    } catch (error) {
      this.logger.error(`Agent ${this.name} failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          agent: this.name,
        },
      };
    }
  }

  /**
   * Build system prompt for the agent
   */
  protected buildSystemPrompt(additionalContext?: string): string {
    let prompt = this.config.systemPrompt || this.getDefaultSystemPrompt();

    if (additionalContext) {
      prompt += `\n\n${additionalContext}`;
    }

    return prompt;
  }

  /**
   * Get default system prompt for the agent
   */
  protected getDefaultSystemPrompt(): string {
    return `You are ${this.name}, ${this.description}.`;
  }

  /**
   * Format messages for LLM
   */
  protected formatMessages(userMessage: string, context?: {
    systemPrompt?: string;
    conversationHistory?: LLMMessage[];
  }): LLMMessage[] {
    const messages: LLMMessage[] = [];

    // Add system prompt
    const systemPrompt = context?.systemPrompt || this.buildSystemPrompt();
    messages.push({ role: 'system', content: systemPrompt });

    // Add conversation history if available
    if (context?.conversationHistory) {
      messages.push(...context.conversationHistory.filter(m => m.role !== 'system'));
    }

    // Add user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Execute with retry on failure
   */
  async executeWithRetry(
    input: any,
    context: AgentContext,
    maxRetries = 3,
  ): Promise<AgentResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(input, context);
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        this.logger.warn(`Attempt ${attempt + 1} failed, retrying...`);
        await this.sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    return {
      success: false,
      error: lastError.message,
    };
  }

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate input
   */
  protected validateInput(input: any, requiredFields: string[] = []): void {
    for (const field of requiredFields) {
      if (!input[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Extract JSON from LLM response
   */
  protected extractJson(content: string): any {
    // Try to find JSON in markdown code blocks
    const jsonCodeBlock = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlock) {
      return JSON.parse(jsonCodeBlock[1]);
    }

    // Try to find JSON in generic code blocks
    const codeBlock = content.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlock) {
      return JSON.parse(codeBlock[1]);
    }

    // Try to find JSON object directly
    const jsonObject = content.match(/\{[\s\S]*\}/);
    if (jsonObject) {
      return JSON.parse(jsonObject[0]);
    }

    // Try to parse entire content as JSON
    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`Could not extract valid JSON from response: ${content.slice(0, 200)}...`);
    }
  }

  /**
   * Truncate text to fit within token limit
   */
  protected truncateText(text: string, maxTokens = 3000): string {
    // Rough estimate: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;

    if (text.length <= maxChars) {
      return text;
    }

    return text.slice(0, maxChars) + '...';
  }

  /**
   * Generate a unique execution ID
   */
  protected generateExecutionId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
