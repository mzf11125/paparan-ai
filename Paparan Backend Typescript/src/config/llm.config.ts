import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  // Primary provider (Z.AI)
  zai: {
    apiKey: process.env.ZAI_API_KEY,
    baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/v1',
    model: process.env.ZAI_MODEL || 'gpt-4',
  },

  // Anthropic (Claude)
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
  },

  // Zhipu AI
  zhipu: {
    apiKey: process.env.ZHIPU_API_KEY,
    model: process.env.ZHIPU_MODEL || 'glm-4',
  },

  // Default settings
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'zai',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096', 10),
}));
