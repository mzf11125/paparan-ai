/**
 * Debug script to see actual GLM response
 */

import dotenv from 'dotenv'
import { generateGLM } from '../src/lib/glm-client.js'
import { z } from 'zod'

dotenv.config({ path: '.env.local' })

const TestSchema = z.object({
  executiveSummary: z.array(z.string()).max(5),
  currentSituation: z.string(),
  keyDevelopments: z.array(z.object({
    description: z.string(),
    deltaType: z.enum(['NEW', 'UPDATED', 'ESCALATED', 'DE-ESCALATED']),
    impactLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    entities: z.array(z.string()).optional(),
  })),
  strategicImplications: z.string(),
  risksAndOpportunities: z.array(z.object({
    type: z.enum(['RISK', 'OPPORTUNITY']),
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    description: z.string(),
  })),
  recommendedActions: z.array(z.string()),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.enum(['government', 'news', 'research', 'uploaded']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  })),
})

async function testGLMResponse() {
  console.log('Testing GLM-4.6 Response...\n')

  const result = await generateGLM({
    model: 'glm-4.6',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Generate a JSON response for a policy brief about "Indonesia nickel export policy".

Return JSON with this exact structure:
{
  "executiveSummary": ["point 1", "point 2", "point 3"],
  "currentSituation": "Description of the situation",
  "keyDevelopments": [
    {
      "description": "Development description",
      "deltaType": "NEW",
      "impactLevel": "HIGH",
      "entities": ["Indonesia", "ASEAN"]
    }
  ],
  "strategicImplications": "Strategic analysis",
  "risksAndOpportunities": [
    {
      "type": "RISK",
      "severity": "HIGH",
      "description": "Risk description"
    }
  ],
  "recommendedActions": ["action 1", "action 2"],
  "sources": [
    {
      "title": "Source Title",
      "url": "https://example.com",
      "type": "government",
      "confidence": "HIGH"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no additional text.`,
      },
    ],
  })

  console.log('GLM Response:')
  console.log(JSON.stringify(result, null, 2))
}

testGLMResponse().catch(console.error)
