import { Link } from 'react-router-dom'
import {
  Database, Globe, Shield, Workflow, FileText, ScrollText,
  CheckCircle2, ExternalLink, BookOpen, Newspaper,
} from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { toneClasses, type Tone } from '@/lib/domainColors'
import { usePageMeta } from '@/hooks/usePageMeta'

const SOURCE_TIERS = [
  {
    tier: 'Tier 1 — Primary',
    description: 'Official statements, regulations, and parliamentary records.',
    icon: Shield,
    tone: 'primary' as Tone,
    sources: [
      { name: 'Parliament Malaysia',     domain: 'parliament.gov.my' },
      { name: 'Parliament Singapore',    domain: 'parliament.gov.sg' },
      { name: 'DPR Indonesia',           domain: 'dpr.go.id' },
      { name: 'Bank Indonesia',          domain: 'bi.go.id' },
      { name: 'OJK',                     domain: 'ojk.go.id' },
      { name: 'Bappenas',                domain: 'bappenas.go.id' },
      { name: 'Kemlu Indonesia',         domain: 'kemlu.go.id' },
      { name: 'ASEAN Secretariat',       domain: 'asean.org' },
      { name: 'Congress Philippines',    domain: 'congress.gov.ph' },
      { name: 'Quoc Hoi Vietnam',        domain: 'quochoi.vn' },
    ],
  },
  {
    tier: 'Tier 2 — Multilateral',
    description: 'IFI publications, treaty bodies, regional development banks.',
    icon: Globe,
    tone: 'accent' as Tone,
    sources: [
      { name: 'World Bank',              domain: 'worldbank.org' },
      { name: 'IMF',                     domain: 'imf.org' },
      { name: 'Asian Development Bank',  domain: 'adb.org' },
      { name: 'UN ESCAP',                domain: 'unescap.org' },
      { name: 'UNCTAD',                  domain: 'unctad.org' },
      { name: 'ERIA',                    domain: 'eria.org' },
    ],
  },
  {
    tier: 'Tier 3 — Editorial',
    description: 'Reuters / Bloomberg / FT and regional newsroom desks.',
    icon: Newspaper,
    tone: 'gold' as Tone,
    sources: [
      { name: 'Reuters',         domain: 'reuters.com' },
      { name: 'AP News',         domain: 'apnews.com' },
      { name: 'Bloomberg',       domain: 'bloomberg.com' },
      { name: 'Financial Times', domain: 'ft.com' },
      { name: 'Antara',          domain: 'antaranews.com' },
      { name: 'Kontan',          domain: 'kontan.co.id' },
      { name: 'Bisnis',          domain: 'bisnis.com' },
      { name: 'Salaam Gateway',  domain: 'salaamgateway.com' },
    ],
  },
]

const PIPELINE_STAGES = [
  {
    no: '01',
    title: 'Retrieval',
    body: 'Continuous polling and webhook ingestion from 200+ official, multilateral, and tier-1 editorial sources. Tavily search supplements coverage on demand.',
  },
  {
    no: '02',
    title: 'Extraction',
    body: 'LLM clause extractors and OCR pipelines transform PDFs and HTML into structured records. Each fact is linked back to its source URL with retrieval timestamp.',
  },
  {
    no: '03',
    title: 'Synthesis',
    body: 'A LangGraph orchestrator coordinates four specialised agents — Gov Intel, Financial Analyst, Deep Research, and Conversational RAG — into a single coherent brief.',
  },
  {
    no: '04',
    title: 'Verification',
    body: 'Citation verifier confirms every claim has at least one tier-1 or tier-2 source. RDTII pillar mapping provides a regulatory cross-check.',
  },
  {
    no: '05',
    title: 'Editorial review',
    body: 'Classification, delta, impact, and confidence are scored. Briefs are tagged for ASEAN region, RPJMN priority, and Asta Cita alignment.',
  },
]

const CLASSIFICATION_LEVELS: { level: 'unclassified' | 'official' | 'confidential' | 'secret'; description: string }[] = [
  { level: 'unclassified', description: 'Open-source intelligence. Distributable to partners and external stakeholders.' },
  { level: 'official',     description: 'Routine government business. Internal distribution within the organisation.' },
  { level: 'confidential', description: 'Material that could damage operational interests if disclosed without authorisation.' },
  { level: 'secret',       description: 'High-impact intelligence. Compartmented; need-to-know basis only.' },
]

export function SourcesPage() {
  usePageMeta({ title: 'Sources & Methodology', description: 'How PaparanBrief sources, verifies, and classifies policy intelligence.' })
  return (
    <article className="px-4 lg:px-8 py-10 max-w-4xl mx-auto">
      {/* Masthead */}
      <header className="mb-12 pb-8 border-b border-border">
        <p className="editorial-eyebrow text-text-muted mb-3">Methodology</p>
        <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-4">
          Sources, methods, and editorial guarantees
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed max-w-2xl font-serif">
          PaparanBrief briefs are sourced from a tiered network of primary, multilateral, and editorial publications. Every claim links back to its retrieval timestamp; every fact is auditable.
        </p>
      </header>

      {/* Source Tiers */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-4 h-4 text-text-tertiary" />
          <h2 className="font-display font-semibold text-text text-2xl">Source coverage</h2>
        </div>
        <div className="space-y-6">
          {SOURCE_TIERS.map(tier => {
            const t = toneClasses(tier.tone)
            return (
            <div key={tier.tier} className="bg-bg-elevated border border-border rounded-xl overflow-hidden card-lift">
              <div className="flex items-start gap-4 p-5 border-b border-border">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${t.bg} ${t.text} ${t.border}`}>
                  <tier.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-text">{tier.tier}</h3>
                  <p className="text-sm text-text-secondary font-ui mt-0.5">{tier.description}</p>
                </div>
              </div>
              <ul className="grid sm:grid-cols-2 gap-px bg-border">
                {tier.sources.map(s => (
                  <li key={s.domain} className="bg-bg-elevated p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate font-ui">{s.name}</p>
                      <p className="text-xs text-text-tertiary font-mono mt-0.5 truncate">{s.domain}</p>
                    </div>
                    <a
                      href={`https://${s.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-primary transition-colors rounded-lg hover:bg-bg-subtle group-hover:rotate-12"
                      aria-label={`Visit ${s.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            )
          })}
        </div>
      </section>

      {/* Pipeline */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <Workflow className="w-4 h-4 text-text-tertiary" />
          <h2 className="font-display font-semibold text-text text-2xl">Editorial pipeline</h2>
        </div>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, i) => {
            const stageTones = ['bg-primary/10 text-primary', 'bg-accent/10 text-accent', 'bg-gold/10 text-gold', 'bg-success/10 text-success', 'bg-primary/10 text-primary']
            return (
            <div key={stage.no} className="flex items-start gap-5 p-5 bg-bg-elevated border border-border rounded-xl card-lift motion-safe:animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-lg font-mono text-sm tabular-nums tracking-wider font-bold ${stageTones[i % stageTones.length]}`}>
                {stage.no}
              </span>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-text mb-1">{stage.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed font-ui">{stage.body}</p>
              </div>
            </div>
          )})}

        </div>
      </section>

      {/* Classification */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <ScrollText className="w-4 h-4 text-text-tertiary" />
          <h2 className="font-display font-semibold text-text text-2xl">Classification taxonomy</h2>
        </div>
        <div className="bg-bg-elevated border border-border rounded-xl divide-y divide-border">
          {CLASSIFICATION_LEVELS.map(({ level, description }) => {
            const clsBorder = { unclassified: 'border-l-success', official: 'border-l-primary', confidential: 'border-l-warning', secret: 'border-l-error' }[level]
            return (
            <div key={level} className={`p-5 flex items-start gap-5 border-l-2 ${clsBorder}`}>
              <ClassificationBadge level={level} variant="inline" />
              <p className="text-sm text-text-secondary leading-relaxed font-ui flex-1">
                {description}
              </p>
            </div>
          )})}
        </div>
      </section>

      {/* Editorial guarantees */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-4 h-4 text-text-tertiary" />
          <h2 className="font-display font-semibold text-text text-2xl">Editorial guarantees</h2>
        </div>
        <ul className="space-y-3">
          {[
            'Every fact links to a retrievable source URL with retrieval timestamp.',
            'Briefs labelled HIGH impact require at least two tier-1 corroborating sources.',
            'No claim is marked HIGH confidence without primary-source evidence.',
            'Classification escalations require human review and audit trail.',
            'RDTII Pillar 6 / Pillar 7 mapping is recorded for trade-relevant briefs.',
            'Diplomat briefs apply ASEAN drafting conventions and humaniser-zh tone.',
          ].map(line => (
            <li key={line} className="flex items-start gap-3 p-4 bg-bg-elevated border border-border rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-secondary font-ui leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* See also */}
      <section className="pt-8 border-t border-border">
        <p className="editorial-eyebrow text-text-muted mb-4">See also</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            to="/glossary"
            className="group flex items-center gap-3 p-4 bg-bg-elevated border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-text text-sm">Policy Glossary</p>
              <p className="text-xs text-text-tertiary font-ui">Acronyms and key concepts</p>
            </div>
          </Link>
          <Link
            to="/topics"
            className="group flex items-center gap-3 p-4 bg-bg-elevated border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-text text-sm">Topics Index</p>
              <p className="text-xs text-text-tertiary font-ui">Browse the taxonomy</p>
            </div>
          </Link>
        </div>
      </section>
    </article>
  )
}
