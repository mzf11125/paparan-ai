/**
 * Paparan Generation with GLM (Zhipu AI)
 * Generates structured policy intelligence briefs
 */

import { z } from 'zod'
import { PaparanSchema, type Paparan, type Source } from './schema'
import { searchWithTavily } from './tavily'
import { generateGLM, type GLMModel } from './glm-client'

interface GeneratePaparanInput {
  topic: string
  region?: string
  documents?: string[]
  previousPaparan?: Paparan
  model?: GLMModel
}

const QuerySchema = z.object({
  queries: z.array(z.string()).min(3).max(5),
})

/**
 * Expand topic into multiple search queries using GLM
 */
export async function expandQuery(
  topic: string,
  region: string = 'ASEAN'
): Promise<string[]> {
  const result = await generateGLM({
    model: 'glm-4-flash',
    messages: [
      {
        role: 'system',
        content: 'You are a research assistant specializing in policy intelligence.',
      },
      {
        role: 'user',
        content: `Expand this topic into 3-5 specific search queries for policy intelligence: "${topic}" in the context of ${region}.

Focus on:
- Recent developments (last 30 days)
- Official government sources
- Trade and economic implications
- Regional cooperation or tensions
- Relevant policy changes

Return only JSON with a "queries" array containing the search query strings.`,
      },
    ],
    schema: QuerySchema,
  })

  return result.queries
}

/**
 * Generate a complete Paparan intelligence brief
 */
export async function generatePaparan(input: GeneratePaparanInput): Promise<Paparan> {
  // 1. Expand queries
  const queries = await expandQuery(input.topic, input.region)

  // 2. Retrieve sources using Tavily
  const sources = await searchWithTavily(queries)

  // 3. Generate Paparan using GLM-4
  const result = await generateGLM({
    model: input.model || 'glm-4-flash',
    messages: [
      {
        role: 'system',
        content: `You are a senior policy analyst generating a structured intelligence brief ("Paparan") for a government policymaker.

Your output must be valid JSON following this exact structure:
{
  "executiveSummary": ["string1", "string2", "string3", "string4", "string5"],
  "currentSituation": "string",
  "keyDevelopments": [
    {
      "description": "string",
      "deltaType": "NEW" | "UPDATED" | "ESCALATED" | "DE-ESCALATED",
      "impactLevel": "HIGH" | "MEDIUM" | "LOW",
      "entities": ["string1", "string2"]
    }
  ],
  "strategicImplications": "string",
  "risksAndOpportunities": [
    {
      "type": "RISK" | "OPPORTUNITY",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "description": "string"
    }
  ],
  "recommendedActions": ["string1", "string2", "string3"],
  "sources": [
    {
      "title": "string",
      "url": "string (optional)",
      "type": "government" | "news" | "research" | "uploaded",
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text.`,
      },
      {
        role: 'user',
        content: buildPaparanPrompt({
          topic: input.topic,
          region: input.region || 'ASEAN',
          sources,
          documents: input.documents,
          previousPaparan: input.previousPaparan,
        }),
      },
    ],
    schema: PaparanSchema,
  })

  return result as Paparan
}

function buildPaparanPrompt(context: {
  topic: string
  region: string
  sources: Source[]
  documents?: string[]
  previousPaparan?: Paparan
}): string {
  let prompt = `TOPIC: ${context.topic}
REGION: ${context.region}

${context.previousPaparan ? `PREVIOUS BRIEFING (for delta comparison):
A previous briefing exists. Focus on WHAT CHANGED since then. Classify developments as:
- NEW: Previously unreported information
- UPDATED: Known information with new details or figures
- ESCALATED: Situation has worsened or tensions increased
- DE-ESCALATED: Situation has improved or tensions decreased

` : ''}

SOURCES (${context.sources.length} items):
${context.sources.map((s, i) => `
[${i + 1}] ${s.title}
URL: ${s.url || 'N/A'}
Relevance Score: ${s.score?.toFixed(2) || 'N/A'}
Content: ${s.content?.slice(0, 500)}${s.content && s.content.length > 500 ? '...' : ''}
`).join('\n---\n')}

${context.documents?.length ? `UPLOADED DOCUMENTS (${context.documents.length}):
${context.documents.map((d, i) => `[Doc ${i + 1}]: ${d.slice(0, 300)}...`).join('\n')}

` : ''}

REQUIREMENTS:
1. Use institutional, professional tone throughout
2. Follow the exact 7-section structure defined in the schema
3. Prioritize quantified data (numbers, dates, percentages, specific figures)
4. Include entity names (countries, ministries, organizations, officials)
5. Classify developments by impact: HIGH / MEDIUM / LOW
6. If previous briefing exists, classify changes appropriately
7. Provide concrete, specific recommended actions (not generic advice)
8. Every claim must be attributable to a provided source
9. Executive summary: maximum 5 bullets, high-signal only
10. Current Situation: Provide context and background
11. Key Developments: List in chronological order where possible
12. Strategic Implications: Analyze broader impact
13. Risks and Opportunities: Be specific and actionable
14. Sources: List all sources referenced with confidence levels

Generate the Paparan brief now. Return ONLY valid JSON.`

  return prompt
}

/**
 * Detect delta between current and previous developments
 */
export function detectDelta(
  currentDevelopments: Paparan['keyDevelopments'],
  previousPaparan: Paparan
): Paparan['keyDevelopments'] {
  const previousDescriptions = new Set(
    previousPaparan.keyDevelopments.map(d => d.description)
  )

  return currentDevelopments.map(dev => {
    if (!previousDescriptions.has(dev.description)) {
      return { ...dev, deltaType: dev.deltaType === 'NEW' ? 'NEW' : 'UPDATED' }
    }
    return dev
  })
}

/**
 * Generate a summary of changes (delta) between two Paparan reports
 */
export function generateDeltaSummary(
  current: Paparan,
  _previous: Paparan // Reserved for future delta analysis
): string {
  const newDevelopments = current.keyDevelopments.filter(
    d => d.deltaType === 'NEW'
  )
  const escalated = current.keyDevelopments.filter(
    d => d.deltaType === 'ESCALATED'
  )
  const deescalated = current.keyDevelopments.filter(
    d => d.deltaType === 'DE-ESCALATED'
  )

  let summary = `DELTA SUMMARY:\n\n`

  if (newDevelopments.length > 0) {
    summary += `NEW DEVELOPMENTS (${newDevelopments.length}):\n`
    newDevelopments.forEach(d => {
      summary += `• [${d.impactLevel}] ${d.description}\n`
    })
    summary += '\n'
  }

  if (escalated.length > 0) {
    summary += `ESCALATED (${escalated.length}):\n`
    escalated.forEach(d => {
      summary += `• [${d.impactLevel}] ${d.description}\n`
    })
    summary += '\n'
  }

  if (deescalated.length > 0) {
    summary += `DE-ESCALATED (${deescalated.length}):\n`
    deescalated.forEach(d => {
      summary += `• [${d.impactLevel}] ${d.description}\n`
    })
  }

  return summary
}
