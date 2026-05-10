import { useState, useMemo } from 'react'
import { Search, BookOpen, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { usePageMeta } from '@/hooks/usePageMeta'
import { EmptyState } from '@/components/ui/EmptyState'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

interface Term {
  term: string
  full?: string
  category: 'RDTII' | 'RPJMN' | 'ASEAN' | 'Indonesia' | 'Multilateral' | 'Editorial'
  definition: string
}

const TERMS: Term[] = [
  { term: 'AANZFTA',  full: 'ASEAN-Australia-New Zealand FTA',                category: 'ASEAN',        definition: 'Multilateral free-trade agreement covering goods, services, investment, and IP between ASEAN, Australia, and New Zealand. In force since 2010.' },
  { term: 'AEC',      full: 'ASEAN Economic Community',                       category: 'ASEAN',        definition: 'Single-market and production-base initiative integrating goods, services, investment, capital, and labour across the ten ASEAN economies.' },
  { term: 'ADB',      full: 'Asian Development Bank',                         category: 'Multilateral', definition: 'Regional development financial institution headquartered in Manila. Funds infrastructure, climate, and policy reform across Asia-Pacific.' },
  { term: 'Asta Cita',                                                        category: 'Indonesia',    definition: 'The eight strategic priorities of Indonesia\'s 2024-2029 administration, ranging from human-capital investment to industrial downstream policy. Briefs are scored against Asta Cita alignment.' },
  { term: 'Bappenas',                                                         category: 'Indonesia',    definition: 'Ministry of National Development Planning. Coordinates RPJMN/RPJPN, macroeconomic frameworks, infrastructure PPPs, and SDG/SDI indicators.' },
  { term: 'BI',       full: 'Bank Indonesia',                                 category: 'Indonesia',    definition: 'Indonesia\'s central bank. Sets the BI Rate and oversees monetary, payment-system, and macroprudential policy.' },
  { term: 'CPTPP',    full: 'Comprehensive and Progressive TPP',              category: 'ASEAN',        definition: 'Successor to the original Trans-Pacific Partnership; an 11-country trade agreement covering tariffs, services, IP, and digital trade.' },
  { term: 'Diplomat brief',                                                   category: 'Editorial',    definition: 'Paparan brief variant tuned for embassy desks: concise framing, ASEAN drafting conventions, and humanizer-zh tone applied for diplomatic register.' },
  { term: 'Delta',                                                            category: 'Editorial',    definition: 'Change-status flag attached to a development. Values: NEW, UPDATED, ESCALATED, DE-ESCALATED — set automatically when re-running a brief.' },
  { term: 'DPR',      full: 'Dewan Perwakilan Rakyat',                        category: 'Indonesia',    definition: 'Indonesia\'s House of People\'s Representatives. Records legislative bills and committee proceedings on dpr.go.id.' },
  { term: 'ERIA',     full: 'Economic Research Institute for ASEAN',          category: 'ASEAN',        definition: 'Jakarta-based regional think tank producing policy research for ASEAN integration and East Asian cooperation.' },
  { term: 'Hari Hakim',                                                       category: 'Indonesia',    definition: 'Judicial-decision day. Often referenced when supreme-court rulings affect commercial regulation.' },
  { term: 'Humanizer-zh',                                                     category: 'Editorial',    definition: 'Editorial post-processing applied to AI-drafted text to remove machine-cadence and align with diplomatic register before export.' },
  { term: 'JDIH',     full: 'Jaringan Dokumentasi & Informasi Hukum',         category: 'Indonesia',    definition: 'Indonesian legal information network. Indexes laws, regulations, and ministerial decrees at jdih.go.id.' },
  { term: 'Kemlu',    full: 'Kementerian Luar Negeri',                        category: 'Indonesia',    definition: 'Indonesia\'s Ministry of Foreign Affairs. Coordinates bilateral, regional, and multilateral diplomatic engagement.' },
  { term: 'OJK',      full: 'Otoritas Jasa Keuangan',                         category: 'Indonesia',    definition: 'Financial Services Authority. Supervises banking, capital markets, and non-bank financial industries in Indonesia.' },
  { term: 'Perpres',                                                          category: 'Indonesia',    definition: 'Peraturan Presiden — Presidential Regulation. Implementing instrument issued under presidential authority.' },
  { term: 'Pillar 6',                                                         category: 'RDTII',        definition: 'RDTII Pillar 6 — Digital Trade Facilitation. Covers paperless trade, single-window, electronic certificates, and cross-border data movement enabling commerce.' },
  { term: 'Pillar 7',                                                         category: 'RDTII',        definition: 'RDTII Pillar 7 — E-Commerce Legal Framework. Covers consumer protection, electronic transactions law, online dispute resolution, and platform liability.' },
  { term: 'PPP',      full: 'Public-Private Partnership',                     category: 'Multilateral', definition: 'Long-term contractual collaboration between government and private sector to finance, design, build, or operate public infrastructure or services.' },
  { term: 'RDTII',    full: 'Regional Digital Trade Integration Index',       category: 'RDTII',        definition: 'UN ESCAP framework measuring digital-trade readiness across seven pillars covering connectivity, regulation, payment, and consumer protection.' },
  { term: 'RPJMN',    full: 'Rencana Pembangunan Jangka Menengah Nasional',   category: 'Indonesia',    definition: 'Indonesia\'s five-year medium-term development plan. Briefs are scored against RPJMN alignment.' },
  { term: 'RPJPN',    full: 'Rencana Pembangunan Jangka Panjang Nasional',    category: 'Indonesia',    definition: 'Indonesia\'s 20-year long-term development plan, currently spanning 2025-2045 (Indonesia Emas vision).' },
  { term: 'SDI',      full: 'Satu Data Indonesia',                            category: 'Indonesia',    definition: 'Single-data initiative under Perpres 39/2019 standardising government statistics, metadata, and data-sharing.' },
  { term: 'SDG',      full: 'Sustainable Development Goals',                  category: 'Multilateral', definition: 'UN 2030 Agenda — 17 goals tracking poverty, climate, education, and equality. Briefs map relevant policy work to SDG indicators.' },
  { term: 'TKDN',                                                             category: 'Indonesia',    definition: 'Tingkat Kandungan Dalam Negeri — local-content requirement. Mandates a minimum share of domestic inputs in government procurement and certain regulated industries.' },
  { term: 'Tavily',                                                           category: 'Editorial',    definition: 'AI-search API used by the retrieval layer to surface tier-1 and tier-2 sources for live brief generation.' },
  { term: 'WIB',      full: 'Waktu Indonesia Barat',                          category: 'Editorial',    definition: 'Western Indonesia Time (UTC+7). Default timezone shown in the masthead.' },
]

const CATEGORY_TONE: Record<Term['category'], string> = {
  RDTII:        'bg-primary/10 text-primary border-primary/25',
  RPJMN:        'bg-accent/10 text-accent border-accent/25',
  ASEAN:        'bg-primary/10 text-primary border-primary/25',
  Indonesia:    'bg-accent/10 text-accent border-accent/25',
  Multilateral: 'bg-gold/10 text-gold border-gold/25',
  Editorial:    'bg-bg-subtle text-text-secondary border-border',
}

const CATEGORIES: (Term['category'] | 'All')[] = ['All', 'RDTII', 'RPJMN', 'ASEAN', 'Indonesia', 'Multilateral', 'Editorial']

export function GlossaryPage() {
  usePageMeta({ title: 'Glossary', description: 'Policy acronyms and key concepts — RDTII, ASEAN, RPJMN, and more.' })
  const [query, setQuery]       = useState('')
  const [category, setCategory] = useState<Term['category'] | 'All'>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TERMS.filter(t => {
      if (category !== 'All' && t.category !== category) return false
      if (!q) return true
      return (
        t.term.toLowerCase().includes(q) ||
        t.full?.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  const groups = useMemo(() => {
    const map = new Map<string, Term[]>()
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(t)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <article className="px-4 lg:px-8 py-10 max-w-3xl mx-auto">
      {/* Masthead */}
      <header className="mb-10 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-text-tertiary" />
          <p className="editorial-eyebrow text-text-muted">Reference</p>
        </div>
        <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-3">
          Policy Glossary
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed font-serif max-w-2xl">
          Acronyms and key concepts used across PaparanBrief briefs — RDTII pillars, ASEAN bodies, and Indonesia-specific terms.
        </p>
      </header>

      {/* Search + filter */}
      <div className="sticky top-14 z-10 bg-bg/95 backdrop-blur-md border-b border-border -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 mb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search terms, definitions…"
            className="input-base pl-9 pr-9"
            aria-label="Search glossary"
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
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium font-ui border transition-colors',
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-bg-elevated text-text-secondary border-border hover:border-border-strong hover:text-text'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* A-Z list */}
      {groups.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl">
          <EmptyState
            icon={BookOpen}
            tone="neutral"
            title="No matching terms"
            description="Try a different keyword or clear the category filter."
          />
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(([letter, terms]) => (
            <section key={letter}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-bold text-3xl text-primary/80 tabular-nums">{letter}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-border/40 to-transparent" />
              </div>
              <dl className="space-y-4">
                {terms.map((t, i) => (
                  <div
                    key={t.term}
                    className="group p-4 rounded-xl border border-border bg-bg-elevated card-lift card-glow-primary motion-safe:animate-slide-up"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1.5">
                      <dt className="flex items-baseline gap-2 min-w-0">
                        <span className="font-display font-bold text-text text-base">{t.term}</span>
                        {t.full && <span className="text-sm text-text-tertiary font-ui truncate">— {t.full}</span>}
                      </dt>
                      <span className={cn(
                        'flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-ui',
                        CATEGORY_TONE[t.category]
                      )}>
                        {t.category}
                      </span>
                    </div>
                    <dd className="text-sm text-text-secondary leading-relaxed font-ui group-hover:text-text transition-colors">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-14 pt-6 border-t border-border text-xs text-text-tertiary font-ui">
        <p>
          <AnimatedCounter value={filtered.length} /> {filtered.length === 1 ? 'term' : 'terms'} shown · {TERMS.length} total
        </p>
      </footer>
    </article>
  )
}
