/**
 * GLM (Zhipu AI) Client
 * OpenAI-compatible client for Zhipu AI GLM models
 */

import OpenAI from 'openai'
import { z } from 'zod'

const glmClient = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY || '',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
})

export type GLMModel =
  | 'glm-4-flash'
  | 'glm-4-plus'
  | 'glm-4-air'
  | 'glm-4-alltools'

export interface GLMGenerateOptions {
  model?: GLMModel
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}

/**
 * Generate text with structured output using GLM-4
 */
export async function generateGLM<T = any>({
  model = 'glm-4-flash',
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
  const response = await glmClient.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    // GLM-4 supports JSON mode via response_format
    response_format: schema ? { type: 'json_object' } : { type: 'text' },
  })

  const content = response.choices[0]?.message?.content

  if (!content) {
    throw new Error('GLM returned empty response')
  }

  // Parse JSON response
  const parsed = JSON.parse(content)

  if (schema) {
    // Validate against schema if provided
    return schema.parse(parsed) as T
  }

  return parsed as T
}

/**
 * Stream text generation with GLM
 */
export async function streamGLM({
  model = 'glm-4-flash',
  messages,
  temperature = 0.3,
  onChunk,
}: {
  model?: GLMModel
  messages: OpenAI.ChatCompletionMessageParam[]
  temperature?: number
  onChunk: (chunk: string) => void
}): Promise<string> {
  const stream = await glmClient.chat.completions.create({
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

export { glmClient }
