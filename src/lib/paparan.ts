import { generateText, Output } from 'ai'
import { convertToModelMessages } from '@ai-sdk/react'
import { PaparanSchema, type Paparan, type Source } from './schema'
import { searchWithTavily } from './tavily'

interface GeneratePaparanInput {
  topic: string
  region?: string
  documents?: string[]
  previousPaparan?: Paparan
}

interface Development {
  description: string
  deltaType: 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  entities?: string[]
}

export async function expandQuery(topic: string, region: string = 'ASEAN'): Promise<string[]> {
  const { output } = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    output: Output.object({
      schema: {
        queries: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 5,
        },
      } as const,
    }),
    prompt: `Expand this topic into 3-5 specific search queries for policy intelligence: "${topic}" in the context of ${region}.

Focus on:
- Recent developments (last 30 days)
- Official government sources
- Trade and economic implications
- Regional cooperation or tensions
- Relevant policy changes

Return only JSON with a "queries" array containing the search query strings.`,
  })

  return output.queries as string[]
}

export async function generatePaparan(input: GeneratePaparanInput): Promise<Paparan> {
  // 1. Expand queries
  const queries = await expandQuery(input.topic, input.region)

  // 2. Retrieve sources using Tavily
  const sources = await searchWithTavily(queries)

  // 3. Generate Paparan using Claude
  const { output } = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    output: Output.object({
      name: 'Paparan',
      description: 'Structured policy intelligence brief',
      schema: PaparanSchema,
    }),
    prompt: buildPaparanPrompt({
      topic: input.topic,
      region: input.region || 'ASEAN',
      sources,
      documents: input.documents,
      previousPaparan: input.previousPaparan,
    }),
  })

  return output as Paparan
}

function buildPaparanPrompt(context: {
  topic: string
  region: string
  sources: Source[]
  documents?: string[]
  previousPaparan?: Paparan
}): string {
  let prompt = `You are a senior policy analyst generating a structured intelligence brief ("Paparan") for a government policymaker.

TOPIC: ${context.topic}
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

Generate the Paparan brief now.`

  return prompt
}

export function detectDelta(
  currentDevelopments: Development[],
  previousPaparan: Paparan
): Development[] {
  // Simple delta detection: compare with previous developments
  const previousDescriptions = new Set(
    previousPaparan.keyDevelopments.map(d => d.description)
  )

  return currentDevelopments.map(dev => {
    if (!previousDescriptions.has(dev.description)) {
      return { ...dev, deltaType: 'NEW' }
    }
    return dev
  })
}
