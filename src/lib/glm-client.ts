/**
 * GLM (Zhipu AI) Client
 * JWT-based authentication for Zhipu AI GLM models
 */

import OpenAI from 'openai'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

/**
 * Generate JWT token for Zhipu AI API
 * Format: API Key is "id.secret"
 */
function generateToken(apiKey: string): string {
  const [id, secret] = apiKey.split('.')

  if (!id || !secret) {
    throw new Error('Invalid ZHIPU_API_KEY format. Expected: "id.secret"')
  }

  const now = Date.now()
  const payload = {
    api_key: id,
    exp: now + 3600 * 1000, // 1 hour expiration
    timestamp: now,
  }

  return jwt.sign(payload, secret, { header: { alg: 'HS256', sign_type: 'SIGN' } } as jwt.SignOptions)
}

/**
 * Get a fresh JWT token for API requests
 */
function getAuthToken(): string {
  const apiKey = process.env.ZHIPU_API_KEY

  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY is not set in environment variables')
  }

  return generateToken(apiKey)
}

/**
 * Create an OpenAI client with JWT authentication
 */
function createGLMClient(): OpenAI {
  const token = getAuthToken()

  return new OpenAI({
    apiKey: token,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    defaultHeaders: {
      'Authorization': `Bearer ${token}`,
    },
  })
}

// Available GLM models (as of 2026)
export type GLMModel =
  | 'glm-4.5'       // Standard model
  | 'glm-4.5-air'   // Lightweight
  | 'glm-4.6'       // Latest stable
  | 'glm-4.7'       // Advanced
  | 'glm-5'         // Next generation
  | 'glm-5-turbo'   // Fast variant
  | 'glm-5.1'       // Latest

export interface GLMGenerateOptions {
  model?: GLMModel
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}

/**
 * Generate text with structured output using GLM
 * Note: Returns raw parsed JSON. Use normalizePaparanOutput for validation.
 */
export async function generateGLM<T = any>({
  model = 'glm-4.6',
  messages,
  schema,
  temperature = 0.3,
  maxTokens = 4096,
}: {
  model?: GLMModel
  messages: OpenAI.ChatCompletionMessageParam[]
  schema?: z.ZodSchema<any>
  temperature?: number
  maxTokens?: number
}): Promise<T> {
  const client = createGLMClient()

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    // Always use JSON mode for structured output
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content

  if (!content) {
    throw new Error('GLM returned empty response')
  }

  const parsed = JSON.parse(content)

  if (schema) {
    return schema.parse(parsed) as T
  }

  return parsed as T
}

/**
 * Stream text generation with GLM
 */
export async function streamGLM({
  model = 'glm-4.6',
  messages,
  temperature = 0.3,
  onChunk,
}: {
  model?: GLMModel
  messages: OpenAI.ChatCompletionMessageParam[]
  temperature?: number
  onChunk: (chunk: string) => void
}): Promise<string> {
  const client = createGLMClient()

  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    stream: true,
  })

  let fullContent = ''

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) {
      fullContent += content
      onChunk(content)
    }
  }

  return fullContent
}

// Export the token generator for testing
export { generateToken, getAuthToken }
