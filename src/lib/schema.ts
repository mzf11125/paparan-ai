import { z } from 'zod'

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
