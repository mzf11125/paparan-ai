import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Stream } from 'stream';
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
export class ZaiProvider extends BaseLLMProvider {
  readonly type: LLMProviderType = 'zai';
  private client: AxiosInstance;
  private readonly timeout: number = 60000; // 60 seconds

  constructor(protected configService: ConfigService) {
    super(configService);
    this.client = axios.create({
      baseURL: this.config.baseUrl || 'https://api.z.ai/v1',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    });
  }

  protected loadConfig(): LLMConfig {
    return {
      provider: 'zai',
      apiKey: this.configService.get<string>('ZAI_API_KEY') || '',
      baseUrl: this.configService.get<string>('ZAI_BASE_URL') || 'https://api.z.ai/v1',
      model: this.configService.get<string>('ZAI_MODEL') || 'gpt-4',
      temperature: parseFloat(this.configService.get<string>('LLM_TEMPERATURE') || '0.7'),
      maxTokens: parseInt(this.configService.get<string>('LLM_MAX_TOKENS') || '4096', 10),
    };
  }

  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.retryWithBackoff(async () => {
      try {
        this.logger.debug(`Sending chat request to Z.AI: ${this.formatMessagesForLog(messages)}`);

        const response = await this.client.post('/chat/completions', {
          model: config?.model || this.config.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: config?.temperature ?? this.config.temperature,
          max_tokens: config?.maxTokens ?? this.config.maxTokens,
          top_p: config?.topP,
          frequency_penalty: config?.frequencyPenalty,
          presence_penalty: config?.presencePenalty,
        });

        const choice = response.data.choices[0];

        this.logger.debug(`Received response from Z.AI: ${choice.message.content?.slice(0, 100)}...`);

        return {
          content: choice.message.content,
          usage: {
            promptTokens: response.data.usage?.prompt_tokens || 0,
            completionTokens: response.data.usage?.completion_tokens || 0,
            totalTokens: response.data.usage?.total_tokens || 0,
          },
          model: response.data.model,
          finishReason: this.mapFinishReason(choice.finish_reason),
        };
      } catch (error) {
        throw this.handleError(error);
      }
    }, 'Z.AI Chat');
  }

  async* stream(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncIterable<LLMStreamChunk> {
    this.logger.debug(`Starting stream request to Z.AI`);

    try {
      const response = await this.client.post('/chat/completions', {
        model: config?.model || this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: config?.temperature ?? this.config.temperature,
        max_tokens: config?.maxTokens ?? this.config.maxTokens,
        stream: true,
      }, {
        responseType: 'stream',
        timeout: this.timeout * 2, // Longer timeout for streaming
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              yield { content: '', done: true };
              this.logger.debug('Stream completed');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';

              if (content) {
                yield { content, done: false };
              }
            } catch (parseError) {
              this.logger.warn(`Failed to parse stream chunk: ${parseError.message}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Stream error: ${error.message}`);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): LLMError {
    if (axios.isCancel(error) || error.code === 'ECONNABORTED') {
      return new LLMTimeoutError(this.type, error);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        return new LLMRateLimitError(
          this.type,
          retryAfter ? parseInt(retryAfter) : undefined,
        );
      }

      const message = data?.error?.message || data?.message || error.message;
      const code = data?.error?.code;

      return new LLMError(
        `Z.AI API error: ${message}`,
        this.type,
        code,
        error,
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new LLMError(
        `Failed to connect to Z.AI: ${error.message}`,
        this.type,
        error.code,
        error,
      );
    }

    return new LLMError(
      `Unexpected error: ${error.message}`,
      this.type,
      'UNKNOWN',
      error,
    );
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
