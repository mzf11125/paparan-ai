import { z } from 'zod'

// More flexible schemas for AI output (before normalization)
const FlexibleDeltaType = z.enum(['NEW', 'UPDATED', 'ESCALATED', 'DE-ESCALATED', 'EXISTING', 'UNCHANGED'])
const FlexibleSourceType = z.enum(['government', 'news', 'research', 'uploaded', 'organization', 'report', 'other'])

// Normalization functions
function normalizeDeltaType(value: string): 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED' {
  const upper = value.toUpperCase()
  if (upper === 'EXISTING' || upper === 'UNCHANGED') return 'UPDATED'
  return upper as 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'
}

function normalizeSourceType(value: string): 'government' | 'news' | 'research' | 'uploaded' {
  const lower = value.toLowerCase()
  if (lower === 'organization') return 'government'
  if (lower === 'report') return 'research'
  if (lower === 'other') return 'news'
  return lower as 'government' | 'news' | 'research' | 'uploaded'
}

function normalizeConfidence(value: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const upper = value.toUpperCase()
  if (upper === 'HIGH') return 'HIGH'
  if (upper === 'MEDIUM') return 'MEDIUM'
  return 'LOW'
}

// Raw schema from AI (flexible - handles both camelCase and snake_case)
const RawPaparanSchema = z.object({
  // Handle both camelCase and snake_case for executiveSummary
  executiveSummary: z.array(z.string()).max(5).optional(),
  executive_summary: z.array(z.string()).max(5).optional(),
  // Handle both for currentSituation
  currentSituation: z.string().optional(),
  current_situation: z.string().optional(),
  // Handle both for keyDevelopments
  keyDevelopments: z.array(z.object({
    description: z.string(),
    deltaType: FlexibleSourceType.optional(), // Optional because AI might use different fields
    delta_type: FlexibleSourceType.optional(),
    impactLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    impact_level: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    entities: z.array(z.string()).optional(),
  })).optional(),
  key_developments: z.array(z.object({
    description: z.string().optional(),
    deltaType: FlexibleSourceType.optional(),
    delta_type: FlexibleSourceType.optional(),
    impactLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    impact_level: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    entities: z.array(z.string()).optional(),
    date: z.string().optional(),
    event: z.string().optional(),
    impact: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    source: z.string().optional(),
  })).optional(),
  // Handle both for strategicImplications
  strategicImplications: z.string().optional().default(''),
  strategic_implications: z.union([z.string(), z.object({
    analysis: z.string(),
    affected_regions: z.array(z.string()).optional(),
  })]).optional(),
  // Handle both for risksAndOpportunities
  risksAndOpportunities: z.array(z.object({
    type: z.enum(['RISK', 'OPPORTUNITY']).optional(),
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    description: z.string(),
  })).optional(),
  risks_and_opportunities: z.object({
    risks: z.array(z.object({
      description: z.string(),
      source: z.string().optional(),
    })).optional(),
    opportunities: z.array(z.object({
      description: z.string(),
      source: z.string().optional(),
    })).optional(),
  }).optional(),
  // Handle both for recommendedActions
  recommendedActions: z.array(z.string()).optional(),
  recommended_actions: z.array(z.union([
    z.string(),
    z.object({
      action: z.string(),
      target_entity: z.string().optional(),
    })
  ])).optional(),
  // Handle both for sources
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: FlexibleSourceType.optional(),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  })).optional(),
})

// Strict schema for final output
export const PaparanSchema = z.object({
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

export type Paparan = z.infer<typeof PaparanSchema>

/**
 * Normalize and validate AI output to Paparan schema
 * Handles both camelCase and snake_case field names from different AI models
 */
export function normalizePaparanOutput(raw: unknown): Paparan {
  const data = raw as Record<string, unknown>

  // Helper to get value from multiple possible field name formats
  function getValue(camelCase: string, snakeCase: string, titleCase?: string): unknown {
    return data[camelCase] ?? data[snakeCase] ?? (titleCase ? data[titleCase] : undefined)
  }

  // Helper to find a key case-insensitively
  function findKeyInsensitive(searchKey: string): unknown {
    const lowerKey = searchKey.toLowerCase()
    for (const key of Object.keys(data)) {
      if (key.toLowerCase() === lowerKey) {
        return data[key]
      }
    }
    return undefined
  }

  // Extract executive summary (handle camelCase, snake_case, Title Case)
  let execSummaryRaw = getValue('executiveSummary', 'executive_summary', 'Executive Summary')
  if (execSummaryRaw === undefined) execSummaryRaw = findKeyInsensitive('executiveSummary')
  const executiveSummary = Array.isArray(execSummaryRaw) ? execSummaryRaw.map(String) : []

  // Extract current situation - might be an object or string
  let currentSituationRaw = getValue('currentSituation', 'current_situation', 'Current Situation')
  if (currentSituationRaw === undefined) currentSituationRaw = findKeyInsensitive('currentSituation')
  let currentSituation = ''
  if (typeof currentSituationRaw === 'string') {
    currentSituation = currentSituationRaw
  } else if (currentSituationRaw && typeof currentSituationRaw === 'object') {
    const obj = currentSituationRaw as Record<string, unknown>
    currentSituation = String(obj.background ?? obj.description ?? JSON.stringify(currentSituationRaw))
  }
  currentSituation = currentSituation || ''

  // Extract key developments - handle both formats
  let rawKeyDevelopments = getValue('keyDevelopments', 'key_developments', 'Key Developments')
  if (rawKeyDevelopments === undefined) rawKeyDevelopments = findKeyInsensitive('keyDevelopments')
  const developmentsArray = Array.isArray(rawKeyDevelopments) ? rawKeyDevelopments : []

  // Transform different development formats to our standard format
  let keyDevelopments = developmentsArray.map((dev: unknown) => {
    const d = dev as Record<string, unknown>
    // GLM format has: date, (event OR description), impact, source
    const isGLMFormat = d.date !== undefined || d.source !== undefined || d.impact !== undefined

    if (isGLMFormat) {
      return {
        description: String(d.event ?? d.description ?? ''),
        deltaType: normalizeDeltaType(String(d.deltaType ?? d.delta_type ?? 'NEW')),
        impactLevel: (d.impactLevel ?? d.impact_level ?? d.impact ?? 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
        entities: Array.isArray(d.entities) ? d.entities.map(String) : (d.date ? [String(d.date)] : []),
      }
    }
    // Handle standard format
    return {
      description: String(d.description ?? ''),
      deltaType: normalizeDeltaType(String(d.deltaType ?? d.delta_type ?? 'NEW')),
      impactLevel: (d.impactLevel ?? d.impact_level ?? 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
      entities: Array.isArray(d.entities) ? d.entities.map(String) : [],
    }
  })

  // If we still don't have key developments, try alternative paths
  if (keyDevelopments.length === 0) {
    const directDevs = data.key_developments
    if (Array.isArray(directDevs) && directDevs.length > 0) {
      keyDevelopments = directDevs.map((dev: unknown) => {
        const d = dev as Record<string, unknown>
        return {
          description: String(d.event ?? d.description ?? ''),
          deltaType: normalizeDeltaType(String(d.delta_type ?? 'NEW')),
          impactLevel: (d.impact_level ?? d.impact ?? 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
          entities: Array.isArray(d.entities) ? d.entities.map(String) : [],
        }
      })
    }
  }

  // Extract strategic implications - might be object, string, or array (GLM returns array)
  let strategicImplicationsRaw = getValue('strategicImplications', 'strategic_implications', 'Strategic Implications')
  if (strategicImplicationsRaw === undefined) strategicImplicationsRaw = findKeyInsensitive('strategicImplications')
  strategicImplicationsRaw ??= ''
  let strategicImplications = ''
  if (typeof strategicImplicationsRaw === 'string') {
    strategicImplications = strategicImplicationsRaw
  } else if (Array.isArray(strategicImplicationsRaw)) {
    // GLM returns an array of strings
    strategicImplications = strategicImplicationsRaw.map(String).join(' ')
  } else if (strategicImplicationsRaw && typeof strategicImplicationsRaw === 'object') {
    const obj = strategicImplicationsRaw as Record<string, unknown>
    strategicImplications = String(obj.analysis ?? JSON.stringify(strategicImplicationsRaw))
  }

  // Extract risks and opportunities - might be object or array
  let risksRaw = getValue('risksAndOpportunities', 'risks_and_opportunities', 'Risks and Opportunities')
  if (risksRaw === undefined) risksRaw = findKeyInsensitive('risksAndOpportunities')
  let risksAndOpportunities: Array<{ type: 'RISK' | 'OPPORTUNITY'; severity: 'HIGH' | 'MEDIUM' | 'LOW'; description: string }> = []

  if (Array.isArray(risksRaw)) {
    // Standard format - array of objects
    risksAndOpportunities = risksRaw.map((r: unknown) => {
      const item = r as Record<string, unknown>
      return {
        type: (item.type === 'OPPORTUNITY' ? 'OPPORTUNITY' : 'RISK') as 'RISK' | 'OPPORTUNITY',
        severity: (item.severity ?? 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
        description: String(item.description ?? ''),
      }
    })
  } else if (typeof risksRaw === 'object' && risksRaw !== null) {
    // GLM format - object with risks/opportunities arrays
    const obj = risksRaw as Record<string, unknown>
    const risks = Array.isArray(obj.risks) ? obj.risks : []
    const opportunities = Array.isArray(obj.opportunities) ? obj.opportunities : []
    risksAndOpportunities = [
      ...risks.map((r: unknown) => {
        // Handle both string (GLM) and object formats
        if (typeof r === 'string') {
          return { type: 'RISK' as const, severity: 'HIGH' as const, description: r }
        }
        const item = r as Record<string, unknown>
        return { type: 'RISK' as const, severity: 'HIGH' as const, description: String(item.description ?? '') }
      }),
      ...opportunities.map((o: unknown) => {
        // Handle both string (GLM) and object formats
        if (typeof o === 'string') {
          return { type: 'OPPORTUNITY' as const, severity: 'HIGH' as const, description: o }
        }
        const item = o as Record<string, unknown>
        return { type: 'OPPORTUNITY' as const, severity: 'HIGH' as const, description: String(item.description ?? '') }
      }),
    ]
  }

  // Extract recommended actions - handle different formats (GLM uses recommendations or policy_recommendations)
  let actionsRaw = getValue('recommendedActions', 'recommended_actions', 'Recommended Actions')
  if (actionsRaw === undefined) actionsRaw = findKeyInsensitive('recommendedActions')
  if (actionsRaw === undefined) actionsRaw = getValue('policyRecommendations', 'policy_recommendations')
  if (actionsRaw === undefined) actionsRaw = getValue('recommendations', 'recommendations')
  if (actionsRaw === undefined) actionsRaw = findKeyInsensitive('recommendations')
  actionsRaw ??= []
  const actionsArray = Array.isArray(actionsRaw) ? actionsRaw : []
  const recommendedActions = actionsArray.map((a: unknown) => {
    if (typeof a === 'object' && a !== null) {
      const obj = a as Record<string, unknown>
      if (obj.action && typeof obj.action === 'string') {
        return obj.action
      }
      return JSON.stringify(a)
    }
    return String(a ?? '')
  })

  // Extract sources - normalize format
  let sourcesRaw = getValue('sources', 'sources')
  if (sourcesRaw === undefined) sourcesRaw = findKeyInsensitive('sources')
  sourcesRaw ??= []
  let sources = Array.isArray(sourcesRaw) ? sourcesRaw : []

  // If sources is empty, try to extract from data directly
  if (sources.length === 0) {
    const altSources = data.sources
    if (Array.isArray(altSources) && altSources.length > 0) {
      sources = altSources
    }
  }

  const normalizedSources = sources.map((s: unknown) => {
    const source = s as Record<string, unknown>
    // GLM uses confidence_level, standard uses confidence
    const confidenceValue = source.confidence ?? source.confidence_level ?? source.relevance_score ?? 'Medium'
    return {
      title: String(source.title ?? source.name ?? source.description ?? 'Unknown Source'),
      url: source.url ? String(source.url) : undefined,
      type: normalizeSourceType(String(source.type ?? 'news')),
      confidence: normalizeConfidence(String(confidenceValue)),
    }
  })

  return {
    executiveSummary,
    currentSituation,
    keyDevelopments: keyDevelopments.map(dev => ({
      ...dev,
      deltaType: normalizeDeltaType(dev.deltaType),
    })),
    strategicImplications,
    risksAndOpportunities,
    recommendedActions,
    sources: normalizedSources,
  }
}

// Extract the Development type from Paparan's keyDevelopments
export type Development = Paparan['keyDevelopments'][number]

export const CreatePaparanInput = z.object({
  topic: z.string().min(1),
  region: z.enum(['ASEAN', 'Indonesia', 'Malaysia', 'Philippines', 'Singapore', 'Thailand', 'Vietnam', 'Myanmar', 'Cambodia', 'Laos', 'Brunei']).default('ASEAN'),
  documentIds: z.array(z.string()).optional(),
})

export type CreatePaparanInput = z.infer<typeof CreatePaparanInput>

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  content: z.string().optional(),
  publishedDate: z.string().optional(),
  score: z.number().optional(),
})

export type Source = z.infer<typeof SourceSchema>

export const DeltaType = z.enum(['NEW', 'UPDATED', 'ESCALATED', 'DE-ESCALATED'])
export type DeltaType = z.infer<typeof DeltaType>

export const ImpactLevel = z.enum(['HIGH', 'MEDIUM', 'LOW'])
export type ImpactLevel = z.infer<typeof ImpactLevel>

export const RiskOrOpportunityType = z.enum(['RISK', 'OPPORTUNITY'])
export type RiskOrOpportunityType = z.infer<typeof RiskOrOpportunityType>

export const SeverityLevel = z.enum(['HIGH', 'MEDIUM', 'LOW'])
export type SeverityLevel = z.infer<typeof SeverityLevel>
