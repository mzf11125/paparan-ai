import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LLMModule, LLMService, LLMFactory } from '../src/config/llm.module';
import { LLMProviderType } from '../src/models/types/llm.types';
import { z } from 'zod';

describe('LLM Integration', () => {
  let llmService: LLMService;
  let configService: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LLMModule.registerAsync(),
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          const config = {
            DEFAULT_LLM_PROVIDER: 'zai',
            ZAI_API_KEY: process.env.ZAI_API_KEY || 'test-key',
            ZAI_BASE_URL: process.env.ZAI_BASE_URL || 'https://api.z.ai/v1',
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'test-key',
            ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || 'test-key',
            LLM_TEMPERATURE: '0.7',
            LLM_MAX_TOKENS: '4096',
          };
          return config[key];
        },
      })
      .compile();

    llmService = module.get<LLMService>(LLMService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('LLM Factory', () => {
    it('should create provider from config', () => {
      const provider = LLMFactory.createProvider(configService);
      expect(provider).toBeDefined();
      expect(provider.type).toBe('zai');
    });

    it('should create specific provider type', () => {
      const anthropicProvider = LLMFactory.createProviderWithType('anthropic', configService);
      expect(anthropicProvider.type).toBe('anthropic');
    });
  });

  describe('LLM Service', () => {
    it('should be defined', () => {
      expect(llmService).toBeDefined();
    });

    it('should return provider type', () => {
      const providerType = llmService.getProviderType();
      expect(providerType).toBeDefined();
    });

    it('should list available providers', () => {
      const providers = llmService.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe('Structured Output Generation', () => {
    const TestSchema = z.object({
      title: z.string(),
      count: z.number(),
      tags: z.array(z.string()),
    });

    it('should generate structured output from schema', async () => {
      // This test requires actual API keys to run
      if (!process.env.ZAI_API_KEY || process.env.ZAI_API_KEY === 'test-key') {
        console.log('Skipping test: No valid API key provided');
        return;
      }

      const result = await llmService.generateStructured(
        'Generate a test response with title "Test", count 5, and tags ["a", "b", "c"]',
        TestSchema,
      );

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.tags)).toBe(true);
    }, 30000);
  });

  describe('Topic Classification', () => {
    it('should classify policy topics', async () => {
      if (!process.env.ZAI_API_KEY || process.env.ZAI_API_KEY === 'test-key') {
        console.log('Skipping test: No valid API key provided');
        return;
      }

      const result = await llmService.classifyTopic('Indonesia\'s RPJMN 2025-2029 development targets');

      expect(result).toBeDefined();
      expect(['bappenas', 'financial', 'asean', 'general']).toContain(result.classification);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }, 30000);
  });

  describe('Chat Completion', () => {
    it('should perform simple chat', async () => {
      if (!process.env.ZAI_API_KEY || process.env.ZAI_API_KEY === 'test-key') {
        console.log('Skipping test: No valid API key provided');
        return;
      }

      const response = await llmService.chat([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, test!"' },
      ]);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle structured output validation errors', async () => {
      const StrictSchema = z.object({
        value: z.number().int().positive(),
      });

      // This should trigger validation errors and retries
      if (!process.env.ZAI_API_KEY || process.env.ZAI_API_KEY === 'test-key') {
        console.log('Skipping test: No valid API key provided');
        return;
      }

      const result = await llmService.generateStructuredWithRetry(
        'Return the number 42',
        StrictSchema,
        undefined,
        3,
      );

      expect(result).toBeDefined();
      expect(result.value).toBe(42);
    }, 60000);
  });

  describe('Provider Switching', () => {
    it('should switch providers', () => {
      const originalProvider = llmService.getProviderType();
      llmService.switchProvider('anthropic');
      expect(llmService.getProviderType()).toBe('anthropic');

      // Switch back
      llmService.switchProvider(originalProvider);
      expect(llmService.getProviderType()).toBe(originalProvider);
    });

    it('should check fallback availability', () => {
      const hasAnthropic = llmService.hasFallback('anthropic');
      const hasZhipu = llmService.hasFallback('zhipu');

      expect(typeof hasAnthropic).toBe('boolean');
      expect(typeof hasZhipu).toBe('boolean');
    });
  });
});
