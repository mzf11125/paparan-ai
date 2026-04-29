import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, NavLink } from 'react-router-dom'
import { Search, PlusCircle, ArrowRight, Radio, Globe, AlertTriangle, Clock, TrendingUp, FileText, Zap } from 'lucide-react'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { Paparan } from '@/types/paparan'
import { cn } from '@/utils/formatters'
import { ErrorState } from '@/components/ui/ErrorState'
import { Newspaper } from 'lucide-react'

initializeBriefStore(mockBriefs)

const REGION_COLORS: Record<string, string> = {
  APAC: 'text-[#60A5FA] bg-[rgba(96,165,250,0.15)] border-[rgba(96,165,250,0.20)]',
  EMEA: 'text-[#4ADE80] bg-[rgba(74,222,128,0.15)] border-[rgba(74,222,128,0.20)]',
  Americas: 'text-[#FBBF24] bg-[rgba(251,191,36,0.15)] border-[rgba(251,191,36,0.20)]',
  ASEAN: 'text-[#3B82F6] bg-[rgba(59,130,246,0.15)] border-[rgba(59,130,246,0.20)]',
  Global: 'text-[#94A3B8] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
}

const IMPACT_STYLES: Record<string, string> = {
  HIGH: 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.30)]',
  MEDIUM: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.30)]',
  LOW: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.30)]',
}

function getTopImpact(brief: Paparan) {
  if (brief.developments.some(d => d.impact === 'HIGH')) return 'HIGH'
  if (brief.developments.some(d => d.impact === 'MEDIUM')) return 'MEDIUM'
  return 'LOW'
}

function NewsTicker({ briefs }: { briefs: Paparan[] }) {
  const items = briefs.slice(0, 10)
  return (
    <div className="bg-[rgba(59,130,246,0.10)] border-b border-[rgba(59,130,246,0.20)] overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-widest">
          <Radio className="w-3 h-3 animate-pulse" aria-hidden="true" />
          Live
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex whitespace-nowrap">
            {[...items, ...items].map((brief, i) => (
              <NavLink
                key={`${brief.id}-${i}`}
                to={`/briefs/${brief.id}`}
                className="inline-flex items-center gap-3 px-6 py-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              >
                <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded border', REGION_COLORS[brief.region] || REGION_COLORS.Global)}>
                  {brief.region}
                </span>
                <span className="font-medium text-[#F1F5F9]">{brief.title}</span>
                <span className="text-[#64748B] mx-1">·</span>
                <span className="text-[#64748B] text-xs">{brief.date}</span>
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
    <div className="relative bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6]" />
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.30)] rounded text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            Top Story
          </span>
          <span className={cn('px-2.5 py-1 rounded text-xs font-semibold border', REGION_COLORS[brief.region] || REGION_COLORS.Global)}>
            {brief.region}
          </span>
          <span className="text-xs text-[#64748B] ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {brief.date}
          </span>
        </div>
        <NavLink to={`/briefs/${brief.id}`} className="block group">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-[#F1F5F9] leading-tight mb-3 group-hover:text-[#3B82F6] transition-colors">
            {brief.title}
          </h2>
        </NavLink>
        <p className="text-[#94A3B8] leading-relaxed mb-6 max-w-3xl">
          {brief.executiveSummary[0]}
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <NavLink
            to={`/briefs/${brief.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Read Full Brief
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </NavLink>
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
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
    <article className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg overflow-hidden hover:border-[rgba(59,130,246,0.50)] transition-all duration-200">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border', REGION_COLORS[brief.region] || REGION_COLORS.Global)}>
            {brief.region}
          </span>
          {hasNew && (
            <span className="px-2 py-0.5 bg-[rgba(59,130,246,0.15)] text-[#3B82F6] border border-[rgba(59,130,246,0.30)] rounded text-xs font-semibold">New</span>
          )}
          <span className={cn('ml-auto px-2 py-0.5 rounded text-xs font-semibold', IMPACT_STYLES[impact])}>
            {impact}
          </span>
        </div>
        <NavLink to={`/briefs/${brief.id}`} className="block group">
          <h3 className="font-display font-semibold text-[#F1F5F9] leading-snug mb-2 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
            {brief.title}
          </h3>
        </NavLink>
        <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-2 mb-3">
          {brief.executiveSummary[0]}
        </p>
        <div className="flex items-center justify-between text-xs text-[#64748B]">
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
      <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">Overview</h3>
        <div className="space-y-3">
          {[
            { icon: <FileText className="w-4 h-4 text-[#3B82F6]" />, label: 'Total Briefs', value: briefs.length, cls: 'text-[#F1F5F9]' },
            { icon: <AlertTriangle className="w-4 h-4 text-[#EF4444]" />, label: 'High Impact', value: highCount, cls: 'text-[#EF4444]' },
            { icon: <Globe className="w-4 h-4 text-[#10B981]" />, label: 'Regions', value: regions.length - 1, cls: 'text-[#F1F5F9]' },
          ].map(({ icon, label, value, cls }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-[#94A3B8]">{icon}{label}</span>
              <span className={cn('font-bold tabular-nums', cls)}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/editor')}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
      >
        <Zap className="w-4 h-4" aria-hidden="true" />
        Generate Instant Brief
      </button>

      <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-2">
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
                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                  : 'text-[#94A3B8] border-[rgba(255,255,255,0.12)] hover:border-[rgba(59,130,246,0.50)] hover:text-[#F1F5F9]'
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
          Trending Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <NavLink
              key={tag}
              to="/briefs"
              className="px-2.5 py-1 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(59,130,246,0.15)] hover:text-[#3B82F6] text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(59,130,246,0.30)] rounded text-xs font-medium transition-all"
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

  const { data: briefs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: async () => {
      const timeout = new Promise((_, reject) =>
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
    return result
  }, [briefs, featuredBrief, activeRegion])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/briefs')
  }

  // Error state
  if (error) {
    return (
      <div className="-mx-4 lg:-mx-8 -mt-6 lg:-mt-8 px-4 lg:px-8 py-12">
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load briefs. Please try again.'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="-mx-4 lg:-mx-8 -mt-6 lg:-mt-8">
        <div className="px-4 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#111318] rounded w-1/3" />
            <div className="h-4 bg-[#111318] rounded w-1/4" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-[#111318] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (briefs.length === 0) {
    return (
      <div className="-mx-4 lg:-mx-8 -mt-6 lg:-mt-8 px-4 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Newspaper className="w-16 h-16 text-[#475569] mb-4" />
          <h3 className="text-xl font-semibold text-[#F1F5F9] mb-2">No briefs available</h3>
          <p className="text-[#94A3B8] text-sm max-w-md mb-6">
            Get started by generating your first policy intelligence brief.
          </p>
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Brief
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-4 lg:-mx-8 -mt-6 lg:-mt-8">
      {briefs.length > 0 && <NewsTicker briefs={briefs} />}

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-[#F1F5F9]">Intelligence Feed</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              Latest policy developments across {Array.from(new Set(briefs.map(b => b.region))).length} regions
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search briefs…"
                className="w-full pl-9 pr-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#3B82F6]" aria-hidden="true" />
                Latest Updates
                {activeRegion !== 'All' && <span className="text-[#3B82F6]">— {activeRegion}</span>}
              </h2>
              <span className="text-xs text-[#64748B] tabular-nums">{feedBriefs.length} stories</span>
            </div>
            {feedBriefs.length === 0 ? (
              <div className="py-12 text-center text-[#64748B] text-sm">No briefs found for this region.</div>
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
