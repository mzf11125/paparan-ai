import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote, ScrollText, Globe2, Leaf, Cpu, ShieldCheck, GraduationCap,
  Heart, Truck, Factory, Search, ArrowRight, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
// framer-motion reserved for future topic card animations
import { useAppStore } from '@/contexts/AppContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'

interface Topic {
  slug: string
  title: string
  category: 'RDTII' | 'RPJMN' | 'ASEAN' | 'Sectoral'
  description: string
  icon: LucideIcon
  tags: string[]
}

const TOPICS: Topic[] = [
  // RDTII Pillars
  { slug: 'digital-trade-facilitation', title: 'Digital Trade Facilitation',  category: 'RDTII', icon: Truck,        description: 'Paperless trade, single-window, e-certificates, and cross-border data movement enabling commerce. RDTII Pillar 6.', tags: ['Pillar 6','Trade','Customs'] },
  { slug: 'ecommerce-legal',            title: 'E-Commerce Legal Framework', category: 'RDTII', icon: ScrollText,   description: 'Consumer protection, electronic transactions law, ODR, and platform liability. RDTII Pillar 7.', tags: ['Pillar 7','Consumer','Platforms'] },
  { slug: 'digital-infrastructure',     title: 'Digital Infrastructure',     category: 'RDTII', icon: Cpu,          description: 'Connectivity, data centres, cloud sovereignty, and 5G policy across ASEAN markets.', tags: ['Connectivity','Data','Cloud'] },
  { slug: 'cybersecurity',              title: 'Cybersecurity & Trust',      category: 'RDTII', icon: ShieldCheck,  description: 'Critical-infrastructure protection, breach disclosure, identity, and platform integrity rules.', tags: ['Trust','Identity','CIIP'] },

  // ASEAN integration
  { slug: 'asean-economic-community',   title: 'ASEAN Economic Community',   category: 'ASEAN', icon: Globe2,       description: 'Single-market and production-base policy: goods, services, capital, and labour mobility.', tags: ['AEC','Integration','Mobility'] },
  { slug: 'rcep-cptpp',                 title: 'RCEP & CPTPP',               category: 'ASEAN', icon: Globe2,       description: 'Mega-FTAs covering tariffs, services, IP, and digital trade across Asia-Pacific.', tags: ['Trade','RCEP','CPTPP'] },
  { slug: 'asean-financial-integration',title: 'ASEAN Financial Integration',category: 'ASEAN', icon: Banknote,     description: 'Cross-border payments, capital-market harmonisation, and banking-sector liberalisation.', tags: ['Banking','Payments','BIs'] },

  // RPJMN priorities
  { slug: 'human-capital',              title: 'Human Capital & Education',  category: 'RPJMN', icon: GraduationCap,description: 'Vocational training, university reform, and workforce-readiness programmes under Asta Cita.', tags: ['Asta Cita','Education','Skills'] },
  { slug: 'public-health',              title: 'Public Health & UHC',        category: 'RPJMN', icon: Heart,        description: 'Universal health coverage, BPJS reform, pharmaceutical-supply security, stunting prevention.', tags: ['UHC','BPJS','Stunting'] },
  { slug: 'climate-energy',             title: 'Climate & Energy Transition',category: 'RPJMN', icon: Leaf,         description: 'JETP, renewables, carbon market, and palm-oil sustainability commitments.', tags: ['JETP','Renewables','Carbon'] },
  { slug: 'industrial-downstream',      title: 'Industrial Downstream',      category: 'RPJMN', icon: Factory,      description: 'Hilirisasi: nickel, copper, bauxite downstream policy and TKDN local-content rules.', tags: ['Hilirisasi','TKDN','Critical Minerals'] },

  // Sectoral
  { slug: 'monetary-policy',            title: 'Monetary Policy',            category: 'Sectoral',icon: Banknote,    description: 'Central-bank rate decisions, FX-stability tools, and macroprudential guidance.', tags: ['BI Rate','Inflation','FX'] },
  { slug: 'capital-markets',            title: 'Capital Markets',            category: 'Sectoral',icon: Banknote,    description: 'IPO pipeline, OJK rules, sukuk markets, and exchange-traded fund development.', tags: ['IPO','OJK','Sukuk'] },
  { slug: 'islamic-finance',            title: 'Islamic Finance',            category: 'Sectoral',icon: Banknote,    description: 'Sharia banking, halal economy supply chains, and Islamic capital-market growth.', tags: ['Halal','Sharia','BSI'] },
]

const CATEGORY_TONE: Record<Topic['category'], string> = {
  RDTII:     'border-l-primary',
  ASEAN:     'border-l-accent',
  RPJMN:     'border-l-gold',
  Sectoral:  'border-l-text-tertiary',
}

const CATEGORY_LABEL_TONE: Record<Topic['category'], string> = {
  RDTII:    'bg-primary/10 text-primary border-primary/25',
  ASEAN:    'bg-accent/10 text-accent border-accent/25',
  RPJMN:    'bg-gold/10 text-gold border-gold/25',
  Sectoral: 'bg-bg-subtle text-text-secondary border-border',
}

const CATEGORY_DESCRIPTIONS: Record<Topic['category'], string> = {
  RDTII:    'Regional Digital Trade Integration Index pillars',
  ASEAN:    'Cross-bloc integration agendas',
  RPJMN:    'Indonesia 2024–2029 development priorities',
  Sectoral: 'Cross-cutting industry verticals',
}

const CATEGORY_SECTION_BG: Record<Topic['category'], string> = {
  RDTII:    'bg-primary/4',
  ASEAN:    'bg-accent/4',
  RPJMN:    'bg-gold/4',
  Sectoral: 'bg-success/4',
}

const CATEGORY_DOT_COLOR: Record<Topic['category'], string> = {
  RDTII:    'bg-primary',
  ASEAN:    'bg-accent',
  RPJMN:    'bg-gold',
  Sectoral: 'bg-success',
}

const CATEGORY_ICON_BG: Record<Topic['category'], string> = {
  RDTII:    'bg-primary/12 text-primary',
  ASEAN:    'bg-accent/12 text-accent',
  RPJMN:    'bg-gold/12 text-gold',
  Sectoral: 'bg-success/12 text-success',
}

const CATEGORY_CARD_GLOW: Record<Topic['category'], string> = {
  RDTII:    'card-glow-primary',
  ASEAN:    'card-glow-accent',
  RPJMN:    'card-glow-gold',
  Sectoral: 'card-glow-success',
}

export function TopicsPage() {
  usePageMeta({ title: 'Topics', description: 'A-to-Z taxonomy of policy themes — RDTII pillars, ASEAN integration, and RPJMN priorities.' })
  const [query, setQuery] = useState('')
  const briefs = useAppStore(s => s.briefs)

  const briefCountByTag = useMemo(() => {
    const counts = new Map<string, number>()
    for (const b of briefs) {
      for (const tag of b.tags ?? []) {
        const key = tag.toLowerCase()
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return counts
  }, [briefs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TOPICS
    return TOPICS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
  }, [query])

  const grouped = useMemo(() => {
    const groups = new Map<Topic['category'], Topic[]>()
    for (const t of filtered) {
      if (!groups.has(t.category)) groups.set(t.category, [])
      groups.get(t.category)!.push(t)
    }
    const order: Topic['category'][] = ['RDTII', 'ASEAN', 'RPJMN', 'Sectoral']
    return order
      .map(c => [c, groups.get(c) ?? []] as const)
      .filter(([, list]) => list.length > 0)
  }, [filtered])

  return (
    <div className="px-4 lg:px-8 py-10 max-w-6xl mx-auto">
      {/* Masthead */}
      <header className="mb-10 pb-6 border-b border-border">
        <p className="editorial-eyebrow text-text-muted mb-3">Discover</p>
        <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-3">
          Topics Index
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed font-serif max-w-2xl">
          The taxonomy spine of Paparan briefs — RDTII pillars, ASEAN integration agendas, and Indonesia&rsquo;s RPJMN priorities. Each topic opens a filtered library view.
        </p>
      </header>

      {/* Search */}
      <div className="mb-10">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search topics, tags…"
            className="input-base pl-9 pr-9"
            aria-label="Search topics"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-tertiary hover:text-text"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={Search}
          tone="primary"
          title="No topics match"
          description="Try a different keyword."
        />
      ) : (
        <div className="space-y-12">
          {grouped.map(([category, list]) => (
            <div
              key={category}
              className={cn(
                '-mx-4 lg:-mx-8 px-4 lg:px-8 py-8 rounded-2xl mb-3',
                CATEGORY_SECTION_BG[category]
              )}
            >
              <section>
                <div className="flex items-baseline justify-between mb-5 gap-4 flex-wrap">
                  <div>
                    <h2 className="font-display font-bold text-text text-2xl">{category}</h2>
                    <p className="text-sm text-text-tertiary font-ui mt-0.5">{CATEGORY_DESCRIPTIONS[category]}</p>
                  </div>
                  <span className={cn(
                    'flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-ui inline-flex items-center gap-1',
                    CATEGORY_LABEL_TONE[category]
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full mr-1.5 inline-block animate-glow-pulse',
                      CATEGORY_DOT_COLOR[category]
                    )} />
                    {list.length} {list.length === 1 ? 'topic' : 'topics'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {list.map((topic, i) => {
                    const briefCount = topic.tags.reduce((sum, tag) => sum + (briefCountByTag.get(tag.toLowerCase()) ?? 0), 0)
                    return (
                      <Link
                        key={topic.slug}
                        to={`/briefs?topic=${encodeURIComponent(topic.slug)}`}
                        className={cn(
                          'group relative bg-bg-elevated border border-border border-l-2 rounded-xl p-5 hover:border-border-strong transition-all flex flex-col gap-3 card-lift motion-safe:animate-slide-up',
                          CATEGORY_TONE[topic.category],
                          CATEGORY_CARD_GLOW[topic.category]
                        )}
                        style={{ '--i': i } as React.CSSProperties}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'flex-shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center transition-colors',
                            CATEGORY_ICON_BG[topic.category]
                          )}>
                            <topic.icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-display font-semibold text-text text-base leading-snug flex-1 min-w-0 group-hover:text-primary transition-colors">
                            {topic.title}
                          </h3>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed font-ui line-clamp-3">
                          {topic.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {topic.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-subtle text-text-tertiary border border-border font-ui">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border text-xs font-ui">
                          <span className="text-text-tertiary tabular-nums">{briefCount} brief{briefCount === 1 ? '' : 's'}</span>
                          <span className="flex items-center gap-1 text-text-tertiary group-hover:text-primary transition-colors">
                            Open <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
