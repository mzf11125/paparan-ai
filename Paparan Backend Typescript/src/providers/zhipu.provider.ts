import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
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
import * as crypto from 'crypto';

@Injectable()
export class ZhipuProvider extends BaseLLMProvider {
  readonly type: LLMProviderType = 'zhipu';
  private client: AxiosInstance;
  private readonly timeout: number = 60000;

  constructor(protected configService: ConfigService) {
    super(configService);
    this.client = axios.create({
      baseURL: this.config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
      timeout: this.timeout,
    });
  }

  protected loadConfig(): LLMConfig {
    return {
      provider: 'zhipu',
      apiKey: this.configService.get<string>('ZHIPU_API_KEY') || '',
      model: this.configService.get<string>('ZHIPU_MODEL') || 'glm-4',
      temperature: parseFloat(this.configService.get<string>('LLM_TEMPERATURE') || '0.7'),
      maxTokens: parseInt(this.configService.get<string>('LLM_MAX_TOKENS') || '4096', 10),
    };
  }

  private generateToken(): string {
    // Zhipu uses JWT tokens from API key
    // Format: {id}.{secret}
    const apiKey = this.config.apiKey || '';
    const parts = apiKey.split('.');

    if (parts.length !== 2) {
      this.logger.warn('Invalid Zhipu API key format');
      return apiKey;
    }

    const [id, secret] = parts;
    const now = Date.now();
    const exp = now + 3600000; // 1 hour expiry

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ api_key: id, exp, timestamp: now })).toString('base64');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64');

    return `${header}.${payload}.${signature}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.generateToken()}`,
      'Content-Type': 'application/json',
    };
  }

  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.retryWithBackoff(async () => {
      try {
        this.logger.debug(`Sending chat request to Zhipu: ${this.formatMessagesForLog(messages)}`);

        const response = await this.client.post('/chat/completions', {
          model: config?.model || this.config.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: config?.temperature ?? this.config.temperature,
          max_tokens: config?.maxTokens ?? this.config.maxTokens,
        }, {
          headers: this.getHeaders(),
        });

        const choice = response.data.choices[0];

        this.logger.debug(`Received response from Zhipu: ${choice.message.content?.slice(0, 100)}...`);

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
    }, 'Zhipu Chat');
  }

  async* stream(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncIterable<LLMStreamChunk> {
    this.logger.debug(`Starting stream request to Zhipu`);

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
        headers: this.getHeaders(),
        responseType: 'stream',
        timeout: this.timeout * 2,
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              yield { content: '', done: true };
              this.logger.debug('Zhipu stream completed');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';

              if (content) {
                yield { content, done: false };
              }
            } catch (parseError) {
              this.logger.warn(`Failed to parse Zhipu stream chunk: ${parseError.message}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Zhipu stream error: ${error.message}`);
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
        `Zhipu API error: ${message}`,
        this.type,
        code,
        error,
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new LLMError(
        `Failed to connect to Zhipu: ${error.message}`,
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
      default:
        return 'stop';
    }
  }
}
