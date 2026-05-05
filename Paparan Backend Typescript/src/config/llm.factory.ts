import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, LLMProviderType, LLMMessage, LLMResponse, LLMStreamChunk, LLMConfig } from '@models/types/llm.types';
import { ZaiProvider } from '../providers/zai.provider';
import { AnthropicProvider } from '../providers/anthropic.provider';
import { ZhipuProvider } from '../providers/zhipu.provider';
import { z } from 'zod';

@Injectable()
export class LLMFactory {
  private static readonly logger = new Logger(LLMFactory.name);

  static createProvider(config: ConfigService): LLMProvider {
    const provider = (config.get<string>('DEFAULT_LLM_PROVIDER') || 'zai') as LLMProviderType;
    this.logger.log(`Creating LLM provider: ${provider}`);

    switch (provider) {
      case 'zai':
        return new ZaiProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'zhipu':
        return new ZhipuProvider(config);
      default:
        this.logger.warn(`Unknown provider "${provider}", falling back to Z.AI`);
        return new ZaiProvider(config);
    }
  }

  static createProviderWithType(type: LLMProviderType, config: ConfigService): LLMProvider {
    switch (type) {
      case 'zai':
        return new ZaiProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'zhipu':
        return new ZhipuProvider(config);
      default:
        return new ZaiProvider(config);
    }
  }
}

// Custom error classes
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: LLMProviderType,
    public readonly code?: string,
    public readonly originalError?: any,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(provider: LLMProviderType, originalError?: any) {
    super('Request timeout', provider, 'TIMEOUT', originalError);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(
    provider: LLMProviderType,
    public readonly retryAfter?: number,
  ) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT');
    this.name = 'LLMRateLimitError';
  }
}

export class LLMValidationError extends LLMError {
  constructor(provider: LLMProviderType, public readonly validationErrors: z.ZodError) {
    super('Structured output validation failed', provider, 'VALIDATION_ERROR');
    this.name = 'LLMValidationError';
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'RATE_LIMIT'],
};

// Base provider class with retry logic
export abstract class BaseLLMProvider implements LLMProvider {
  protected readonly logger = new Logger(this.constructor.name);
  protected config: LLMConfig;
  protected retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  constructor(protected configService: ConfigService) {
    this.config = this.loadConfig();
  }

  protected abstract loadConfig(): LLMConfig;
  abstract chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
  abstract stream(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncIterable<LLMStreamChunk>;

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const errorCode = error.code || error?.response?.data?.error?.code;
        const isRetryable = this.retryConfig.retryableErrors.includes(errorCode) ||
                          error instanceof LLMRateLimitError;

        if (!isRetryable || attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay,
        );

        // If rate limit error, use retry-after if available
        const finalDelay = error instanceof LLMRateLimitError && error.retryAfter
          ? error.retryAfter * 1000
          : delay;

        this.logger.warn(
          `${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), ` +
          `retrying after ${finalDelay}ms: ${error.message}`
        );

        await this.sleep(finalDelay);
      }
    }

    throw lastError;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateStructured<T extends z.ZodType>(
    prompt: string,
    schema: T,
    config?: Partial<LLMConfig>,
  ): Promise<z.infer<T>> {
    const schemaString = this.zodToJsonSchema(schema);
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.getStructuredOutputPrompt(schemaString),
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.chat(messages, config);
    const parsed = this.extractJson(response.content);

    try {
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new LLMValidationError(this.type, error);
      }
      throw error;
    }
  }

  async generateStructuredWithRetry<T extends z.ZodType>(
    prompt: string,
    schema: T,
    config?: Partial<LLMConfig>,
    maxAttempts: number = 3,
  ): Promise<z.infer<T>> {
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.generateStructured(prompt, schema, config);
      } catch (error) {
        lastError = error;

        if (error instanceof LLMValidationError && attempt < maxAttempts - 1) {
          // Provide the validation errors in a retry prompt
          const correctedPrompt = this.buildRetryPrompt(
            prompt,
            error.validationErrors,
          );
          try {
            return await this.generateStructured(correctedPrompt, schema, config);
          } catch {
            // Continue to next attempt
          }
        }
      }
    }

    throw lastError;
  }

  private getStructuredOutputPrompt(schema: string): string {
    return `You are a data extraction assistant. Extract information from the user's input and return it as JSON.

IMPORTANT: Return ONLY valid JSON, without any additional text, markdown formatting, or explanation.

Schema:
${schema}

Your response must be valid JSON that conforms to this schema.`;
  }

  private zodToJsonSchema(schema: z.ZodType): string {
    // Convert Zod schema to JSON schema description
    const description: string[] = [];

    const describe = (s: z.ZodType, path: string = ''): void => {
      if (s instanceof z.ZodObject) {
        const shape = s.shape;
        description.push(`{`);
        for (const [key, value] of Object.entries(shape)) {
          describe(value as z.ZodType, key);
        }
        description.push(`}`);
      } else if (s instanceof z.ZodString) {
        description.push(`${path}: string`);
      } else if (s instanceof z.ZodNumber) {
        description.push(`${path}: number`);
      } else if (s instanceof z.ZodBoolean) {
        description.push(`${path}: boolean`);
      } else if (s instanceof z.ZodArray) {
        description.push(`${path}: array`);
      } else if (s instanceof z.ZodEnum) {
        description.push(`${path}: enum (${s.options.join(', ')})`);
      } else if (s instanceof z.ZodOptional) {
        describe(s._def.type, `${path}?`);
      } else if (s instanceof z.ZodDefault) {
        describe(s._def.innerType, `${path} (default: ${JSON.stringify(s._def.defaultValue())})`);
      } else {
        description.push(`${path}: any`);
      }
    };

    describe(schema);
    return description.join('\n');
  }

  private extractJson(content: string): any {
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

  private buildRetryPrompt(originalPrompt: string, validationError: z.ZodError): string {
    const errorDetails = validationError.errors.map(e =>
      `- ${e.path.join('.')}: ${e.message}`
    ).join('\n');

    return `${originalPrompt}

Your previous response had validation errors:
${errorDetails}

Please correct your response and ensure it conforms to the schema.`;
  }

  // Helper method to format messages for logging
  protected formatMessagesForLog(messages: LLMMessage[]): string {
    return messages.map(m =>
      `[${m.role}] ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''}`
    ).join('\n');
  }
}
