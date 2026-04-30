/**
 * Debug script to test Zhipu AI GLM API
 */

import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.ZHIPU_API_KEY

if (!apiKey) {
  console.error('ZHIPU_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('='.repeat(60))
console.log('ZHIPU AI GLM API DEBUG')
console.log('='.repeat(60))

// Parse API key
const [id, secret] = apiKey.split('.')
console.log(`\nAPI Key ID: ${id}`)
console.log(`API Key Secret: ${secret ? secret.substring(0, 10) + '...' : 'INVALID'}`)

// Generate JWT token
const now = Date.now()
const payload = {
  api_key: id,
  exp: now + 3600 * 1000,
  timestamp: now,
}

const token = jwt.sign(payload, secret, { header: { alg: 'HS256', sign_type: 'SIGN' } } as jwt.SignOptions)
console.log(`\nJWT Token generated: ${token.substring(0, 50)}...`)

// Test API endpoints
async function testAPI() {
  const endpoints = [
    { url: 'https://open.bigmodel.cn/api/paas/v4/models', name: 'V4 Models (OpenAI-compatible)' },
    { url: 'https://open.bigmodel.cn/api/paas/v3/models', name: 'V3 Models (Native)' },
    { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', name: 'V4 Chat Completions' },
  ]

  for (const endpoint of endpoints) {
    console.log(`\n--- Testing ${endpoint.name} ---`)
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log(`Status: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`Response:`, JSON.stringify(data, null, 2))
      } else {
        const error = await response.text()
        console.log(`Error:`, error)
      }
    } catch (err) {
      console.log(`Exception:`, err instanceof Error ? err.message : String(err))
    }
  }

  // Test chat completion with different models
  const models = ['glm-4', 'glm-3-turbo', 'chatglm3', 'glm-4-turbo']

  for (const model of models) {
    console.log(`\n--- Testing model: ${model} ---`)
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      })

      console.log(`Status: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`SUCCESS! Response:`, data.choices?.[0]?.message?.content || data)
        break // Found a working model
      } else {
        const error = await response.json()
        console.log(`Error:`, error.error?.message || error)
      }
    } catch (err) {
      console.log(`Exception:`, err instanceof Error ? err.message : String(err))
    }
  }
}

testAPI().catch(console.error)
