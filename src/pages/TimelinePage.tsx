import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, ArrowRight, Filter, X } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { briefService } from '@/services/briefService'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { regionColors, impactColors, deltaColors, regionAbbr } from '@/lib/domainColors'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { Paparan, Delta, Impact } from '@/types/paparan'
import { cn } from '@/utils/cn'

interface TimelineEvent {
  id: string
  briefId: string
  briefTitle: string
  region: string
  date: Date
  text: string
  delta: Delta
  impact: Impact
}

const DELTA_FILTERS: (Delta | 'ALL')[] = ['ALL', 'NEW', 'UPDATED', 'ESCALATED', 'DE-ESCALATED']
const IMPACT_FILTERS: (Impact | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW']

function flattenBriefsToEvents(briefs: Paparan[]): TimelineEvent[] {
  const events: TimelineEvent[] = []
  for (const brief of briefs) {
    const developments = brief.developments ?? []
    if (developments.length === 0) {
      events.push({
        id: `${brief.id}-summary`,
        briefId: brief.id,
        briefTitle: brief.title,
        region: brief.region,
        date: new Date(brief.date),
        text: brief.executiveSummary?.[0] ?? brief.currentSituation?.slice(0, 160) ?? brief.title,
        delta: 'NEW',
        impact: 'MEDIUM',
      })
      continue
    }
    for (const dev of developments) {
      events.push({
        id: `${brief.id}-${dev.id}`,
        briefId: brief.id,
        briefTitle: brief.title,
        region: brief.region,
        date: new Date(dev.date ?? brief.date),
        text: dev.text,
        delta: dev.delta,
        impact: dev.impact,
      })
    }
  }
  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function bucketKey(date: Date): { key: string; label: string } {
  const now = new Date()
  const ms = now.getTime() - date.getTime()
  const day = 1000 * 60 * 60 * 24
  if (ms < day)        return { key: 'today',     label: 'Today' }
  if (ms < 2 * day)    return { key: 'yesterday', label: 'Yesterday' }
  if (ms < 7 * day)    return { key: 'this-week', label: 'Earlier this week' }
  if (ms < 14 * day)   return { key: 'last-week', label: 'Last week' }
  if (ms < 31 * day)   return { key: 'this-month',label: 'This month' }
  // Group by month
  const monthKey = `${date.getFullYear()}-${date.getMonth()}`
  const monthLabel = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return { key: monthKey, label: monthLabel }
}

export function TimelinePage() {
  usePageMeta({ title: 'Timeline', description: 'Chronological feed of policy developments grouped by week and month.' })
  const [deltaFilter, setDeltaFilter]   = useState<Delta | 'ALL'>('ALL')
  const [impactFilter, setImpactFilter] = useState<Impact | 'ALL'>('ALL')
  const [regionFilter, setRegionFilter] = useState<string>('All')

  const { data: briefs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
    retry: 1,
  })

  const allEvents = useMemo(() => flattenBriefsToEvents(briefs), [briefs])

  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const e of allEvents) set.add(e.region)
    return ['All', ...Array.from(set).sort()]
  }, [allEvents])

  const events = useMemo(() => allEvents.filter(e => {
    if (deltaFilter !== 'ALL'  && e.delta !== deltaFilter)   return false
    if (impactFilter !== 'ALL' && e.impact !== impactFilter) return false
    if (regionFilter !== 'All' && e.region !== regionFilter) return false
    return true
  }), [allEvents, deltaFilter, impactFilter, regionFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; events: TimelineEvent[] }>()
    for (const e of events) {
      const { key, label } = bucketKey(e.date)
      if (!map.has(key)) map.set(key, { label, events: [] })
      map.get(key)!.events.push(e)
    }
    return Array.from(map.values())
  }, [events])

  const hasFilters = deltaFilter !== 'ALL' || impactFilter !== 'ALL' || regionFilter !== 'All'
  const clearFilters = () => { setDeltaFilter('ALL'); setImpactFilter('ALL'); setRegionFilter('All') }

  return (
    <div className="px-4 lg:px-8 py-10 max-w-4xl mx-auto">
      {/* Masthead */}
      <header className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-text-tertiary" />
          <p className="editorial-eyebrow text-text-muted">Discover</p>
        </div>
        <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-3">
          Policy Timeline
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed font-serif max-w-2xl">
          Chronological feed of developments across briefs, grouped by week and month. Drill into any event to read the source brief.
        </p>
      </header>

      {/* Filter rail */}
      <div className="flex flex-wrap items-center gap-2 mb-8 pb-5 border-b border-border">
        <Filter className="w-4 h-4 text-text-tertiary" />
        <FilterPills label="Delta"   options={DELTA_FILTERS}  value={deltaFilter}  onChange={setDeltaFilter}  />
        <FilterPills label="Impact"  options={IMPACT_FILTERS} value={impactFilter} onChange={setImpactFilter} />
        <FilterPills label="Region"  options={regions}        value={regionFilter} onChange={setRegionFilter} />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-ui text-text-tertiary hover:text-text transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load timeline.'} onRetry={() => refetch()} />
      ) : isLoading ? (
        <TimelineSkeleton />
      ) : events.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl">
          <EmptyState
            icon={Clock}
            tone="accent"
            title="No events match the current filters"
            description="Adjust filters or check back when new briefs are published."
          />
        </div>
      ) : (
        <div className="relative">
          {/* The vertical rail — gradient from primary via neutral to accent */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-border to-accent/30" aria-hidden="true" />

          <div className="space-y-12">
            {grouped.map(group => (
              <section key={group.label}>
                <h2 className="relative pl-10 mb-5">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[31px] h-px bg-gradient-to-r from-border to-primary/30" aria-hidden="true" />
                  <span className="inline-flex bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest font-mono">
                    {group.label}
                  </span>
                </h2>
                <ul className="space-y-3">
                  {group.events.map((event, i) => <TimelineRow key={event.id} event={event} index={i} />)}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterPills<T extends string>({ label, options, value, onChange }: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded-full p-0.5">
      <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui">{label}</span>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium font-ui transition-colors capitalize',
            value === opt
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text hover:bg-bg-subtle'
          )}
        >
          {opt.toLowerCase()}
        </button>
      ))}
    </div>
  )
}

function TimelineRow({ event, index = 0 }: { event: TimelineEvent; index?: number }) {
  const dt = deltaColors(event.delta)
  const ic = impactColors(event.impact)
  const rg = regionColors(event.region)

  return (
    <li className="motion-safe:animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
      <Link
        to={`/briefs/${event.briefId}`}
        className="group relative flex gap-4 pl-10 py-3 pr-4 -ml-4 rounded-xl hover:bg-bg-elevated hover:shadow-sm transition-all"
      >
        {/* Marker — scales on hover to signal interaction */}
        <span
          className={cn(
            'absolute left-2 top-5 w-3 h-3 rounded-full border-2 border-bg-elevated',
            'group-hover:scale-125 transition-transform duration-150',
            dt.dot
          )}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', dt.bg, dt.text, dt.border)}>
              {event.delta}
            </span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', ic.bg, ic.text, ic.border)}>
              {event.impact}
            </span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', rg.bg, rg.text, rg.border)}>
              {regionAbbr(event.region)}
            </span>
            <span className="text-xs text-text-tertiary font-mono ml-auto tabular-nums">
              {event.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-sm text-text leading-relaxed font-serif group-hover:text-primary transition-colors">
            {event.text}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-text-tertiary font-ui">
            <span className="truncate">From <em className="not-italic font-medium">{event.briefTitle}</em></span>
            <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </Link>
    </li>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="pl-10 py-3 pr-4 -ml-4 flex gap-4">
          <Skeleton className="absolute left-2 top-5 w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
