import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Filter, FileText, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { briefService } from '@/services/briefService'
import { usePageMeta } from '@/hooks/usePageMeta'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { regionColors, impactColors, regionAbbr } from '@/lib/domainColors'
import type { Paparan } from '@/types/paparan'
import { cn } from '@/utils/cn'

type ReportType = 'all' | 'flagship' | 'standard'

const FLAGSHIP_THRESHOLD = 6 // briefs with >= this many sources / developments are 'flagship'

export function ReportsPage() {
  usePageMeta({ title: 'Publications', description: 'Long-form policy briefs and weekly digests across ASEAN.' })
  const [yearFilter, setYearFilter]     = useState<string>('All')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter]     = useState<ReportType>('all')

  const { data: briefs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
    retry: 1,
  })

  const { years, regions } = useMemo(() => {
    const ySet = new Set<string>()
    const rSet = new Set<string>()
    for (const b of briefs) {
      ySet.add(new Date(b.date).getFullYear().toString())
      rSet.add(b.region)
    }
    return {
      years:   ['All', ...Array.from(ySet).sort().reverse()],
      regions: ['All', ...Array.from(rSet).sort()],
    }
  }, [briefs])

  const reports = useMemo(() => {
    return briefs
      .filter(b => {
        if (yearFilter !== 'All'   && new Date(b.date).getFullYear().toString() !== yearFilter) return false
        if (regionFilter !== 'All' && b.region !== regionFilter) return false
        if (typeFilter === 'flagship' && !isFlagship(b)) return false
        if (typeFilter === 'standard' && isFlagship(b))  return false
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [briefs, yearFilter, regionFilter, typeFilter])

  const featured = reports.find(isFlagship) ?? reports[0]
  const rest = reports.filter(b => b.id !== featured?.id)

  const hasFilters = yearFilter !== 'All' || regionFilter !== 'All' || typeFilter !== 'all'
  const clearFilters = () => { setYearFilter('All'); setRegionFilter('All'); setTypeFilter('all') }

  return (
    <div className="px-4 lg:px-8 py-10 max-w-7xl mx-auto">
      {/* Masthead */}
      <header className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-text-tertiary" />
          <p className="editorial-eyebrow text-text-muted">Discover</p>
        </div>
        <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-3">
          Publications
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed font-serif max-w-2xl">
          The PaparanBrief publications hub — long-form briefs, weekly digests, and quarterly reports across ASEAN policy intelligence.
        </p>
      </header>

      {error ? (
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load reports.'} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ReportsSkeleton />
      ) : reports.length === 0 ? (
        <EmptyReports hasFilters={hasFilters} onClear={clearFilters} />
      ) : (
        <div className="grid lg:grid-cols-[1fr_220px] gap-8">
          {/* Main column */}
          <div className="min-w-0">
            {/* Featured */}
            {featured && (
              <FeaturedReport brief={featured} />
            )}

            {/* Grid of remaining */}
            {rest.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display font-semibold text-text mb-5 flex items-baseline justify-between gap-3">
                  <span>More publications</span>
                  <span className="text-xs font-ui font-normal text-text-tertiary tabular-nums">{rest.length} {rest.length === 1 ? 'report' : 'reports'}</span>
                </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
                  {rest.map((b, i) => <ReportCard key={b.id} brief={b} index={i} />)}
                </div>
              </section>
            )}
          </div>

          {/* Filter rail */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-6 lg:order-last order-first">
            <div className="bg-bg-elevated border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted font-ui flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-text-tertiary hover:text-text font-ui">
                    Clear
                  </button>
                )}
              </div>

              <FilterGroup label="Type">
                <FilterChip active={typeFilter === 'all'}      onClick={() => setTypeFilter('all')}>All</FilterChip>
                <FilterChip active={typeFilter === 'flagship'} onClick={() => setTypeFilter('flagship')}>Flagship</FilterChip>
                <FilterChip active={typeFilter === 'standard'} onClick={() => setTypeFilter('standard')}>Standard</FilterChip>
              </FilterGroup>

              <FilterGroup label="Year">
                <div className="flex flex-wrap gap-1.5">
                  {years.map(y => (
                    <FilterChip key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
                      {y}
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Region">
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto -mx-1 px-1">
                  {regions.map(r => (
                    <FilterChip key={r} active={regionFilter === r} onClick={() => setRegionFilter(r)}>
                      {r}
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function isFlagship(b: Paparan): boolean {
  return (b.sources?.length ?? 0) >= FLAGSHIP_THRESHOLD || (b.developments?.length ?? 0) >= FLAGSHIP_THRESHOLD
}

function FeaturedReport({ brief }: { brief: Paparan }) {
  const ic = impactColors(topImpact(brief))
  const rg = regionColors(brief.region)
  return (
    <Link to={`/briefs/${brief.id}`} className="group block">
      <article className="grid md:grid-cols-[3fr_4fr] gap-6 lg:gap-10 items-start bg-bg-elevated border border-border rounded-2xl overflow-hidden card-lift card-glow-primary">
        {/* Cover (3:4 editorial aspect) */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/12 via-bg-elevated to-accent/12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between p-6 overflow-hidden">
          {/* Decorative floating blob */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-accent/12 blur-2xl motion-safe:animate-float pointer-events-none" aria-hidden="true" />
          {/* Ribbon-shine top strip */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent motion-safe:animate-ribbon-shine" aria-hidden="true" />
          {/* Classification banner */}
          <div className="relative flex items-center justify-between">
            <ClassificationBadge level={brief.classification ?? 'unclassified'} variant="banner" />
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', rg.bg, rg.text, rg.border)}>
              {regionAbbr(brief.region)}
            </span>
          </div>

          {/* Big serif quote-letter */}
          <div className="relative flex items-end">
            <span className="font-display text-[10rem] leading-none text-primary/20 select-none">
              ¶
            </span>
          </div>

          {/* Bottom strip */}
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-text-muted">
            <span>Vol. I</span>
            <span className="w-1 h-1 rounded-full bg-text-muted" />
            <span>PaparanBrief</span>
            <span className="w-1 h-1 rounded-full bg-text-muted" />
            <span className="tabular-nums">{brief.date}</span>
          </div>
        </div>

        {/* Editorial copy */}
        <div className="p-6 lg:p-8 flex flex-col gap-4">
          <p className="editorial-eyebrow text-text-muted">Featured publication</p>
          <h2 className="font-display font-bold text-text text-balance text-3xl lg:text-4xl leading-tight group-hover:text-primary transition-colors">
            {brief.title}
          </h2>
          {brief.executiveSummary?.[0] && (
            <p className="text-text-secondary text-base lg:text-lg leading-relaxed font-serif line-clamp-4">
              {brief.executiveSummary[0]}
            </p>
          )}
          <div className="flex items-center gap-4 flex-wrap text-xs font-ui text-text-tertiary mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <time className="font-mono tabular-nums">{brief.date}</time>
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              {brief.sources?.length ?? 0} sources
            </span>
            <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border', ic.bg, ic.text, ic.border)}>
              <TrendingUp className="w-3 h-3" />
              {topImpact(brief)} impact
            </span>
          </div>
          <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold font-ui text-primary group-hover:text-primary-hover transition-colors">
            Read the report <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </article>
    </Link>
  )
}

function ReportCard({ brief, index = 0 }: { brief: Paparan; index?: number }) {
  const rg = regionColors(brief.region)
  return (
    <Link
      to={`/briefs/${brief.id}`}
      className="group bg-bg-elevated border border-border rounded-xl overflow-hidden card-lift card-glow-primary flex flex-col motion-safe:animate-slide-up"
      style={{ '--i': index } as React.CSSProperties}
    >
      {/* Cover block */}
      <div className="aspect-[3/4] relative bg-gradient-to-br from-bg-subtle to-primary/12 group-hover:to-primary/20 border-b border-border p-4 flex flex-col justify-between overflow-hidden transition-colors">
        <div className="flex items-start justify-between gap-2">
          <ClassificationBadge level={brief.classification ?? 'unclassified'} variant="inline" />
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', rg.bg, rg.text, rg.border)}>
            {regionAbbr(brief.region)}
          </span>
        </div>
        <h3 className="font-display font-bold text-text text-base leading-snug line-clamp-4 group-hover:text-primary transition-colors">
          {brief.title}
        </h3>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[11px] text-text-tertiary font-ui">
          <time className="font-mono tabular-nums">{brief.date}</time>
          <span className="w-1 h-1 rounded-full bg-text-muted" />
          <span>{brief.sources?.length ?? 0} sources</span>
        </div>
        {brief.executiveSummary?.[0] && (
          <p className="text-xs text-text-secondary leading-relaxed font-ui line-clamp-3">
            {brief.executiveSummary[0]}
          </p>
        )}
        <span className="inline-flex items-center gap-1 mt-auto pt-2 text-xs font-semibold font-ui text-primary group-hover:text-primary-hover transition-colors">
          Open <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  )
}

function topImpact(b: Paparan): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (b.developments?.some(d => d.impact === 'HIGH'))   return 'HIGH'
  if (b.developments?.some(d => d.impact === 'MEDIUM')) return 'MEDIUM'
  return 'LOW'
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium font-ui border transition-colors',
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text'
      )}
    >
      {children}
    </button>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-[3fr_4fr] gap-6 bg-bg-elevated border border-border rounded-2xl p-6">
        <Skeleton className="aspect-[3/4]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/5] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function EmptyReports({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-xl">
      <EmptyState
        icon={BookOpen}
        tone="primary"
        title="No reports yet"
        description={hasFilters ? 'No reports match the current filters.' : 'Once briefs are generated they will appear here as the editorial archive.'}
        action={hasFilters ? { label: 'Clear filters', onClick: onClear, variant: 'outline' } : undefined}
      />
    </div>
  )
}
