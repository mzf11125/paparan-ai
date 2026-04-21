import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, NavLink } from 'react-router-dom'
import { Search, PlusCircle, ArrowRight, Radio, Globe, AlertTriangle, Clock, TrendingUp, FileText, Zap } from 'lucide-react'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { Paparan } from '@/types/paparan'
import { cn } from '@/utils/formatters'

initializeBriefStore(mockBriefs)

const REGION_COLORS: Record<string, string> = {
  APAC: 'text-blue bg-blue/10 border-blue/20',
  EMEA: 'text-green bg-green/10 border-green/20',
  Americas: 'text-amber bg-amber/10 border-amber/20',
  ASEAN: 'text-primary bg-primary-light border-primary/20',
  Global: 'text-text-secondary bg-bg-surface border-border',
}

const IMPACT_STYLES: Record<string, string> = {
  HIGH: 'bg-red/15 text-red border border-red/30',
  MEDIUM: 'bg-amber/15 text-amber border border-amber/30',
  LOW: 'bg-green/15 text-green border border-green/30',
}

function getTopImpact(brief: Paparan) {
  if (brief.developments.some(d => d.impact === 'HIGH')) return 'HIGH'
  if (brief.developments.some(d => d.impact === 'MEDIUM')) return 'MEDIUM'
  return 'LOW'
}

function NewsTicker({ briefs }: { briefs: Paparan[] }) {
  const items = briefs.slice(0, 10)
  return (
    <div className="bg-primary/10 border-b border-primary/20 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest">
          <Radio className="w-3 h-3 animate-pulse" aria-hidden="true" />
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
                <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded border', REGION_COLORS[brief.region] || REGION_COLORS.Global)}>
                  {brief.region}
                </span>
                <span className="font-medium text-text">{brief.title}</span>
                <span className="text-text-tertiary mx-1">·</span>
                <span className="text-text-tertiary text-xs">{brief.date}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedStory({ brief }: { brief: Paparan }) {
  const impact = getTopImpact(brief)
  return (
    <div className="relative bg-bg-elevated border border-border rounded-xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue to-primary" />
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red/15 text-red border border-red/30 rounded text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            Top Story
          </span>
          <span className={cn('px-2.5 py-1 rounded text-xs font-semibold border', REGION_COLORS[brief.region] || REGION_COLORS.Global)}>
            {brief.region}
          </span>
          <span className="text-xs text-text-tertiary ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {brief.date}
          </span>
        </div>
        <NavLink to={`/briefs/${brief.id}`} className="block group">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-text leading-tight mb-3 group-hover:text-primary transition-colors">
            {brief.title}
          </h2>
        </NavLink>
        <p className="text-text-secondary leading-relaxed mb-6 max-w-3xl">
          {brief.executiveSummary[0]}
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <NavLink
            to={`/briefs/${brief.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Read Full Brief
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </NavLink>
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span>{brief.developments.length} developments</span>
            <span>·</span>
            <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', IMPACT_STYLES[impact])}>
              {impact} Impact
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewsCard({ brief }: { brief: Paparan }) {
  const impact = getTopImpact(brief)
  const hasNew = brief.developments.some(d => d.delta === 'NEW')
  return (
    <article className="bg-bg-elevated border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border', REGION_COLORS[brief.region] || REGION_COLORS.Global)}>
            {brief.region}
          </span>
          {hasNew && (
            <span className="px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded text-xs font-semibold">New</span>
          )}
          <span className={cn('ml-auto px-2 py-0.5 rounded text-xs font-semibold', IMPACT_STYLES[impact])}>
            {impact}
          </span>
        </div>
        <NavLink to={`/briefs/${brief.id}`} className="block group">
          <h3 className="font-display font-semibold text-text leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {brief.title}
          </h3>
        </NavLink>
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {brief.executiveSummary[0]}
        </p>
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {brief.date}
          </span>
          <span>{brief.developments.length} developments</span>
        </div>
      </div>
    </article>
  )
}

function NewsSidebar({ briefs, activeRegion, onRegionChange }: {
  briefs: Paparan[]
  activeRegion: string
  onRegionChange: (r: string) => void
}) {
  const regions = ['All', ...Array.from(new Set(briefs.map(b => b.region)))]
  const tags = Array.from(new Set(briefs.flatMap(b => b.tags || []))).slice(0, 8)
  const highCount = briefs.filter(b => b.developments.some(d => d.impact === 'HIGH')).length
  const navigate = useNavigate()

  return (
    <aside className="space-y-5">
      <div className="bg-bg-elevated border border-border rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Overview</h3>
        <div className="space-y-3">
          {[
            { icon: <FileText className="w-4 h-4 text-primary" />, label: 'Total Briefs', value: briefs.length, cls: 'text-text' },
            { icon: <AlertTriangle className="w-4 h-4 text-red" />, label: 'High Impact', value: highCount, cls: 'text-red' },
            { icon: <Globe className="w-4 h-4 text-green" />, label: 'Regions', value: regions.length - 1, cls: 'text-text' },
          ].map(({ icon, label, value, cls }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-text-secondary">{icon}{label}</span>
              <span className={cn('font-bold tabular-nums', cls)}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/editor')}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
      >
        <Zap className="w-4 h-4" aria-hidden="true" />
        Generate Instant Brief
      </button>

      <div className="bg-bg-elevated border border-border rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          Filter by Region
        </h3>
        <div className="flex flex-wrap gap-2">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                activeRegion === region
                  ? 'bg-primary text-white border-primary'
                  : 'text-text-secondary border-border hover:border-primary/50 hover:text-text'
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-bg-elevated border border-border rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
          Trending Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <NavLink
              key={tag}
              to="/briefs"
              className="px-2.5 py-1 bg-bg-surface hover:bg-primary-light hover:text-primary text-text-secondary border border-border hover:border-primary/30 rounded text-xs font-medium transition-all"
            >
              {tag}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  )
}

export function NewsFeedPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState('All')
  const navigate = useNavigate()

  const { data: briefs = [] } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
  })

  const featuredBrief = useMemo(
    () => briefs.find(b => b.developments.some(d => d.impact === 'HIGH')) || briefs[0],
    [briefs]
  )

  const feedBriefs = useMemo(() => {
    let result = briefs.filter(b => b.id !== featuredBrief?.id)
    if (activeRegion !== 'All') result = result.filter(b => b.region === activeRegion)
    return result
  }, [briefs, featuredBrief, activeRegion])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/briefs')
  }

  return (
    <div className="-mx-4 lg:-mx-8 -mt-6 lg:-mt-8">
      {briefs.length > 0 && <NewsTicker briefs={briefs} />}

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-text">Intelligence Feed</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Latest policy developments across {Array.from(new Set(briefs.map(b => b.region))).length} regions
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search briefs…"
                className="w-full pl-9 pr-4 py-2.5 bg-bg-elevated border border-border rounded-lg text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Generate Brief</span>
              <span className="sm:hidden">Brief</span>
            </button>
          </form>
        </div>

        {/* Featured Story */}
        {featuredBrief && <FeaturedStory brief={featuredBrief} />}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Latest Updates
                {activeRegion !== 'All' && <span className="text-primary">— {activeRegion}</span>}
              </h2>
              <span className="text-xs text-text-tertiary tabular-nums">{feedBriefs.length} stories</span>
            </div>
            {feedBriefs.length === 0 ? (
              <div className="py-12 text-center text-text-tertiary text-sm">No briefs found for this region.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {feedBriefs.map(brief => <NewsCard key={brief.id} brief={brief} />)}
              </div>
            )}
          </div>
          <NewsSidebar briefs={briefs} activeRegion={activeRegion} onRegionChange={setActiveRegion} />
        </div>
      </div>
    </div>
  )
}
