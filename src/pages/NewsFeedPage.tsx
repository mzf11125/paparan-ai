import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, NavLink } from 'react-router-dom'
import {
  Search, PlusCircle, ArrowRight, Radio, Globe, AlertTriangle,
  Clock, TrendingUp, FileText, Zap, Newspaper, RefreshCw,
} from 'lucide-react'
import { briefService } from '@/services/briefService'
import { Paparan } from '@/types/paparan'
import { cn } from '@/utils/cn'
import { ErrorState } from '@/components/ui/ErrorState'
import { regionColors, impactColors } from '@/lib/domainColors'
import { usePageMeta } from '@/hooks/usePageMeta'

/* ── helpers ── */
function regionBadge(region?: string) {
  const t = regionColors(region)
  return cn(t.text, t.bg, 'border', t.border)
}

function impactBadge(impact?: 'HIGH' | 'MEDIUM' | 'LOW') {
  const t = impactColors(impact)
  return cn(t.bg, t.text, 'border', t.border)
}

function getTopImpact(brief: Paparan) {
  if (brief.developments.some(d => d.impact === 'HIGH')) return 'HIGH'
  if (brief.developments.some(d => d.impact === 'MEDIUM')) return 'MEDIUM'
  return 'LOW'
}

/* ── News Ticker ── */
function NewsTicker({ briefs }: { briefs: Paparan[] }) {
  const items = briefs.slice(0, 10)
  return (
    <div className="bg-primary/5 border-b border-primary/15 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest font-ui">
          <Radio className="w-3 h-3 animate-pulse-slow" aria-hidden="true" />
          Live
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex whitespace-nowrap">
            {[...items, ...items].map((brief, i) => (
              <NavLink
                key={`${brief.id}-${i}`}
                to={`/briefs/${brief.id}`}
                className="inline-flex items-center gap-3 px-6 py-2 text-sm text-text-secondary hover:text-text transition-colors"
              >
                <span className={cn('badge border', regionBadge(brief.region))}>
                  {brief.region}
                </span>
                <span className="font-medium text-text">{brief.title}</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-tertiary text-xs">{brief.date}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Featured Story ── */
function FeaturedStory({ brief }: { brief: Paparan }) {
  const impact = getTopImpact(brief)
  return (
    <article className="relative surface-card overflow-hidden group hover-card">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="badge bg-error/10 text-error border border-error/25">
            <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
            Top Story
          </span>
          <span className={cn('badge border', regionBadge(brief.region))}>
            {brief.region}
          </span>
          <span className={cn('badge', impactBadge(impact as 'HIGH' | 'MEDIUM' | 'LOW'))}>
            {impact} Impact
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-text-tertiary font-ui">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {brief.date}
          </span>
        </div>

        <NavLink to={`/briefs/${brief.id}`} className="block group/link">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-text leading-tight mb-3 group-hover/link:text-primary transition-colors duration-150">
            {brief.title}
          </h2>
        </NavLink>

        <p className="text-text-secondary leading-relaxed mb-6 max-w-3xl text-sm lg:text-base">
          {brief.executiveSummary[0]}
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <NavLink
            to={`/briefs/${brief.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal hover:-translate-y-px"
          >
            Read Full Brief
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </NavLink>
          <span className="text-sm text-text-tertiary font-ui">
            {brief.developments.length} developments
          </span>
        </div>
      </div>
    </article>
  )
}

/* ── News Card ── */
function NewsCard({ brief }: { brief: Paparan }) {
  const impact = getTopImpact(brief)
  const hasNew = brief.developments.some(d => d.delta === 'NEW')

  return (
    <article className="surface-card overflow-hidden hover-card group flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('badge border', regionBadge(brief.region))}>
            {brief.region}
          </span>
          {hasNew && (
            <span className="badge bg-primary/10 text-primary border border-primary/25">New</span>
          )}
          <span className={cn('badge ml-auto', impactBadge(impact as 'HIGH' | 'MEDIUM' | 'LOW'))}>
            {impact}
          </span>
        </div>

        <NavLink to={`/briefs/${brief.id}`} className="block group/link flex-1">
          <h3 className="font-display font-bold text-text leading-snug mb-2 group-hover/link:text-primary transition-colors duration-150 line-clamp-2">
            {brief.title}
          </h3>
        </NavLink>

        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-4 flex-1">
          {brief.executiveSummary[0]}
        </p>

        <div className="flex items-center justify-between text-xs text-text-tertiary font-ui pt-3 border-t border-border">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {brief.date}
          </span>
          <span>{brief.developments.length} developments</span>
        </div>
      </div>
    </article>
  )
}

/* ── Sidebar ── */
function NewsSidebar({ briefs, activeRegion, onRegionChange }: {
  briefs: Paparan[]
  activeRegion: string
  onRegionChange: (r: string) => void
}) {
  const navigate = useNavigate()
  const regions  = ['All', ...Array.from(new Set(briefs.map(b => b.region)))]
  const tags     = Array.from(new Set(briefs.flatMap(b => b.tags || []))).slice(0, 10)
  const highCount = briefs.filter(b => b.developments.some(d => d.impact === 'HIGH')).length

  return (
    <aside className="space-y-4">
      {/* Stats */}
      <div className="surface-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3">Overview</h3>
        <div className="space-y-3">
          {[
            { icon: <FileText className="w-4 h-4 text-primary" />, label: 'Total Briefs', value: briefs.length, cls: 'text-text' },
            { icon: <AlertTriangle className="w-4 h-4 text-error" />, label: 'High Impact', value: highCount, cls: 'text-error' },
            { icon: <Globe className="w-4 h-4 text-success" />, label: 'Regions', value: regions.length - 1, cls: 'text-text' },
          ].map(({ icon, label, value, cls }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-text-secondary font-ui">{icon}{label}</span>
              <span className={cn('font-bold tabular-nums text-sm font-mono', cls)}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/editor')}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm font-ui transition-all duration-150 shadow-teal hover:-translate-y-px"
      >
        <Zap className="w-4 h-4" aria-hidden="true" />
        Generate Brief
      </button>

      {/* Region filter */}
      <div className="surface-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          Filter by Region
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui border transition-all duration-150',
                activeRegion === region
                  ? 'bg-primary text-white border-primary'
                  : 'text-text-secondary border-border hover:border-primary/40 hover:text-text'
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Trending topics */}
      {tags.length > 0 && (
        <div className="surface-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <NavLink
                key={tag}
                to="/briefs"
                className="px-2.5 py-1 bg-bg-subtle hover:bg-primary/10 hover:text-primary text-text-secondary border border-border hover:border-primary/30 rounded-md text-xs font-medium font-ui transition-all duration-150"
              >
                {tag}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

/* ── Loading skeleton ── */
function FeedSkeleton() {
  return (
    <div className="px-4 lg:px-6 py-6 space-y-6 animate-pulse">
      <div className="h-7 skeleton w-48 rounded-lg" />
      <div className="h-48 skeleton rounded-xl" />
      <div className="grid sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)}
      </div>
    </div>
  )
}

/* ── Main Page ── */
export function NewsFeedPage() {
  usePageMeta({ title: 'Intelligence Feed' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState('All')
  const navigate = useNavigate()

  const { data: briefs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: async () => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 8000)
      )
      return Promise.race([briefService.getAllBriefs(), timeout]) as Promise<Paparan[]>
    },
    retry: 1,
  })

  const featuredBrief = useMemo(
    () => briefs.find(b => b.developments.some(d => d.impact === 'HIGH')) || briefs[0],
    [briefs]
  )

  const feedBriefs = useMemo(() => {
    let result = briefs.filter(b => b.id !== featuredBrief?.id)
    if (activeRegion !== 'All') result = result.filter(b => b.region === activeRegion)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.executiveSummary.some(s => s.toLowerCase().includes(q))
      )
    }
    return result
  }, [briefs, featuredBrief, activeRegion, searchQuery])

  if (error) {
    return (
      <div className="px-4 lg:px-6 py-12">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load briefs.'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (isLoading) return <FeedSkeleton />

  if (briefs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center mb-4">
          <Newspaper className="w-8 h-8 text-text-tertiary" />
        </div>
        <h3 className="text-xl font-display font-bold text-text mb-2">No briefs yet</h3>
        <p className="text-text-secondary text-sm max-w-sm mb-6 font-ui">
          Generate your first policy intelligence brief to get started.
        </p>
        <button
          onClick={() => navigate('/editor')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal"
        >
          <PlusCircle className="w-4 h-4" />
          Generate Brief
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Ticker */}
      {briefs.length > 0 && <NewsTicker briefs={briefs} />}

      <div className="flex-1 px-4 lg:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-text">Intelligence Feed</h1>
            <p className="text-sm text-text-secondary mt-0.5 font-ui">
              {briefs.length} briefs across {Array.from(new Set(briefs.map(b => b.region))).length} regions
            </p>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); navigate('/briefs') }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search briefs…"
                className="input-base pl-9 pr-4"
                aria-label="Search briefs"
              />
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2.5 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors"
              aria-label="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Generate</span>
            </button>
          </form>
        </div>

        {/* Featured */}
        {featuredBrief && <FeaturedStory brief={featuredBrief} />}

        {/* Grid + Sidebar */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Latest Updates
                {activeRegion !== 'All' && (
                  <span className="text-primary normal-case tracking-normal text-xs">— {activeRegion}</span>
                )}
              </h2>
              <span className="text-xs text-text-tertiary tabular-nums font-ui">{feedBriefs.length} stories</span>
            </div>

            {feedBriefs.length === 0 ? (
              <div className="py-16 text-center text-text-tertiary text-sm font-ui surface-card rounded-xl">
                No briefs found for this filter.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {feedBriefs.map((brief, i) => (
                  <div key={brief.id} className={cn('animate-fade-in-up', `stagger-${Math.min(i + 1, 8)}`)}>
                    <NewsCard brief={brief} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <NewsSidebar
            briefs={briefs}
            activeRegion={activeRegion}
            onRegionChange={setActiveRegion}
          />
        </div>
      </div>
    </div>
  )
}
