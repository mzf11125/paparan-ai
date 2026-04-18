/**
 * Debug script to see actual GLM response for Paparan generation
 */

import dotenv from 'dotenv'
import { generateGLM } from '../src/lib/glm-client.js'
import { normalizePaparanOutput } from '../src/lib/schema.js'

dotenv.config({ path: '.env.local' })

const mockSources = [
  {
    title: 'Indonesia Nickel Export Policy Update',
    url: 'https://www.kemendag.go.id',
    content: 'Indonesia has maintained its ban on raw nickel ore exports since 2020, requiring domestic processing. This policy has attracted significant foreign investment in smelting facilities.',
    score: 0.95,
  },
  {
    title: 'ASEAN Response to Indonesia Policy',
    url: 'https://asean.org',
    content: 'ASEAN member states have expressed mixed reactions to Indonesia nickel policy, with some supporting resource sovereignty while others raising trade concerns.',
    score: 0.85,
  },
]

async function testGLMPaparanResponse() {
  console.log('Testing GLM-4.6 Paparan Response with Sources...\n')

  const prompt = `TOPIC: Indonesia nickel export policy impact on ASEAN
REGION: ASEAN

SOURCES (2 items):
[1] Indonesia Nickel Export Policy Update
URL: https://www.kemendag.go.id
Relevance Score: 0.95
Content: Indonesia has maintained its ban on raw nickel ore exports since 2020, requiring domestic processing. This policy has attracted significant foreign investment in smelting facilities.

[2] ASEAN Response to Indonesia Policy
URL: https://asean.org
Relevance Score: 0.85
Content: ASEAN member states have expressed mixed reactions to Indonesia nickel policy, with some supporting resource sovereignty while others raising trade concerns.

REQUIREMENTS:
1. Use institutional, professional tone throughout
2. Follow the exact 7-section structure defined in the schema
3. Prioritize quantified data (numbers, dates, percentages, specific figures)
4. Include entity names (countries, ministries, organizations, officials)
5. Classify developments by impact: HIGH / MEDIUM / LOW
6. Provide concrete, specific recommended actions (not generic advice)
7. Every claim must be attributable to a provided source
8. Executive summary: maximum 5 bullets, high-signal only
9. Current Situation: Provide context and background
10. Key Developments: List in chronological order where possible
11. Strategic Implications: Analyze broader impact
12. Risks and Opportunities: Be specific and actionable
13. Sources: List all sources referenced with confidence levels

Generate the Paparan brief now. Return ONLY valid JSON.`

  try {
    const result = await generateGLM({
      model: 'glm-4.6',
      messages: [
        {
          role: 'system',
          content: 'You are a senior policy analyst generating a structured intelligence brief ("Paparan") for a government policymaker. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    console.log('GLM Response:')
    console.log(JSON.stringify(result, null, 2))

    // Handle nested response (GLM wraps in "paparan" key)
    const resultToNormalize = (result as any).paparan ?? result

    console.log('\n\n=== Normalizing Output ===')
    const paparan = normalizePaparanOutput(resultToNormalize)

    console.log('executiveSummary:', paparan.executiveSummary?.length || 0, 'items')
    console.log('currentSituation:', paparan.currentSituation?.length || 0, 'chars')
    console.log('keyDevelopments:', paparan.keyDevelopments?.length || 0, 'items')
    console.log('strategicImplications:', paparan.strategicImplications?.length || 0, 'chars')
    console.log('risksAndOpportunities:', paparan.risksAndOpportunities?.length || 0, 'items')
    console.log('recommendedActions:', paparan.recommendedActions?.length || 0, 'items')
    console.log('sources:', paparan.sources?.length || 0, 'items')

    console.log('\n=== Normalized Paparan ===')
    console.log(JSON.stringify(paparan, null, 2))

  } catch (error) {
    console.error('Error:', error)
  }
}

testGLMPaparanResponse().catch(console.error)
