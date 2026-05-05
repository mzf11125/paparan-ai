import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic, { APIError } from '@anthropic-ai/sdk';
import {
  BaseLLMProvider,
  LLMMessage,
  LLMResponse,
  LLMStreamChunk,
  LLMConfig,
  LLMError,
  LLMTimeoutError,
  LLMRateLimitError,
} from '../config/llm.factory';
import { LLMProviderType } from '@models/types/llm.types';

@Injectable()
export class AnthropicProvider extends BaseLLMProvider {
  readonly type: LLMProviderType = 'anthropic';
  private client: Anthropic;
  private readonly timeout: number = 60000;

  constructor(protected configService: ConfigService) {
    super(configService);
    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: this.timeout,
      maxRetries: 0, // We handle retries ourselves
    });
  }

  protected loadConfig(): LLMConfig {
    return {
      provider: 'anthropic',
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY') || '',
      model: this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-opus-20240229',
      temperature: parseFloat(this.configService.get<string>('LLM_TEMPERATURE') || '0.7'),
      maxTokens: parseInt(this.configService.get<string>('LLM_MAX_TOKENS') || '4096', 10),
    };
  }

  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.retryWithBackoff(async () => {
      try {
        this.logger.debug(`Sending chat request to Anthropic: ${this.formatMessagesForLog(messages)}`);

        // Separate system message from user/assistant messages
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        const response = await this.client.messages.create({
          model: config?.model || this.config.model,
          system: systemMessage?.content,
          messages: chatMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          max_tokens: config?.maxTokens ?? this.config.maxTokens,
          temperature: config?.temperature ?? this.config.temperature,
          top_p: config?.topP,
        });

        const content = response.content[0];
        const text = content.type === 'text' ? content.text : '';

        this.logger.debug(`Received response from Anthropic: ${text.slice(0, 100)}...`);

        return {
          content: text,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
          model: response.model,
          finishReason: this.mapStopReason(response.stop_reason),
        };
      } catch (error) {
        throw this.handleError(error);
      }
    }, 'Anthropic Chat');
  }

  async* stream(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncIterable<LLMStreamChunk> {
    this.logger.debug(`Starting stream request to Anthropic`);

    try {
      const systemMessage = messages.find(m => m.role === 'system');
      const chatMessages = messages.filter(m => m.role !== 'system');

      const stream = await this.client.messages.create({
        model: config?.model || this.config.model,
        system: systemMessage?.content,
        messages: chatMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        max_tokens: config?.maxTokens ?? this.config.maxTokens,
        temperature: config?.temperature ?? this.config.temperature,
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { content: event.delta.text, done: false };
        } else if (event.type === 'message_stop') {
          yield { content: '', done: true };
          this.logger.debug('Anthropic stream completed');
        }
      }
    } catch (error) {
      this.logger.error(`Anthropic stream error: ${error.message}`);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): LLMError {
    if (error instanceof APIError) {
      if (error.status === 429) {
        return new LLMRateLimitError(this.type);
      }

      return new LLMError(
        `Anthropic API error: ${error.message}`,
        this.type,
        error.error?.type,
        error,
      );
    }

    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return new LLMTimeoutError(this.type, error);
    }

    return new LLMError(
      `Unexpected error: ${error.message}`,
      this.type,
      'UNKNOWN',
      error,
    );
  }

  private mapStopReason(reason: string | null): 'stop' | 'length' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}
