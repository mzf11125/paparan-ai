import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchHero } from '@/components/search/SearchHero'
import { BriefCard } from '@/components/brief/BriefCard'
import { KPICard } from '@/components/ui/KPICard'
import { useAppStore } from '@/contexts/AppContext'
import { useRecentSearches } from '@/components/search/SearchSuggestions'
import { TrendingUp, CheckCircle, Clock, FileText, MapPin } from 'lucide-react'
import { cn } from '@/utils/cn'
import { regionColors, classificationColors } from '@/lib/domainColors'
import { usePageMeta } from '@/hooks/usePageMeta'

// Mock trending data
const TRENDING_TOPICS = [
  { id: '1', topic: 'ASEAN Economic Integration', count: 47, trend: 'up' },
  { id: '2', topic: 'Indonesia Trade Policy', count: 32, trend: 'up' },
  { id: '3', topic: 'Philippines Infrastructure', count: 28, trend: 'stable' },
  { id: '4', topic: 'Singapore Digital Economy', count: 24, trend: 'up' },
  { id: '5', topic: 'Thailand Tourism Recovery', count: 19, trend: 'down' },
  { id: '6', topic: 'Vietnam Manufacturing', count: 17, trend: 'up' },
]

const REGIONS = [
  { id: 'asean',       name: 'ASEAN',        count: 1247 },
  { id: 'indonesia',   name: 'Indonesia',    count: 342  },
  { id: 'philippines', name: 'Philippines',  count: 287  },
  { id: 'singapore',   name: 'Singapore',    count: 234  },
  { id: 'thailand',    name: 'Thailand',     count: 198  },
  { id: 'vietnam',     name: 'Vietnam',      count: 176  },
  { id: 'malaysia',    name: 'Malaysia',     count: 154  },
  { id: 'myanmar',     name: 'Myanmar',      count: 89   },
] as const

const CLASSIFICATIONS = [
  { level: 'unclassified', label: 'Unclassified', count: 1823 },
  { level: 'official',     label: 'Official',     count: 654  },
  { level: 'confidential', label: 'Confidential', count: 234  },
  { level: 'secret',       label: 'Secret',       count: 136  },
] as const

export function SearchPage() {
  usePageMeta({ title: 'Search', description: 'Search briefs, sources, and policy developments across ASEAN.' })
  const navigate = useNavigate()
  const briefs = useAppStore((state) => state.briefs)
  const { recentSearches, addSearch, clearSearches } = useRecentSearches()
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate stats
  const stats = {
    totalBriefs: briefs.length || 2847,
    escalated: briefs.filter((b) =>
      b.developments?.some((d) => d.delta === 'ESCALATED')
    ).length || 47,
    updatedToday: briefs.filter((b) => {
      if (!b.lastUpdated) return false
      const updated = new Date(b.lastUpdated)
      const today = new Date()
      return updated.toDateString() === today.toDateString()
    }).length || 23,
    highImpact: briefs.filter((b) =>
      b.developments?.some((d) => d.impact === 'HIGH')
    ).length || 156,
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    addSearch(query)
    // Navigate to briefs with search query
    navigate(`/briefs?search=${encodeURIComponent(query)}`)
  }

  // Toggle filter
  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    )
  }

  // Get featured briefs (newest or escalated)
  const featuredBriefs = [...briefs]
    .sort((a, b) => {
      // Prioritize escalated briefs
      const aEscalated = a.developments?.some((d) => d.delta === 'ESCALATED')
      const bEscalated = b.developments?.some((d) => d.delta === 'ESCALATED')
      if (aEscalated && !bEscalated) return -1
      if (!aEscalated && bEscalated) return 1

      // Then sort by date
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-background">
      {/* Hero Section with Search */}
      <section className="relative py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <SearchHero onSearch={handleSearch} />
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-8 border-b border-border bg-white dark:bg-bg-elevated">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Briefs"
              value={stats.totalBriefs.toLocaleString()}
              change={12}
              changeLabel="+12%"
              color="primary"
              className="hover:shadow-md transition-shadow"
            />
            <KPICard
              title="Escalated"
              value={stats.escalated.toString()}
              change={3}
              changeLabel="+3"
              color="error"
              className="hover:shadow-md transition-shadow"
            />
            <KPICard
              title="Updated Today"
              value={stats.updatedToday.toString()}
              color="primary"
              className="hover:shadow-md transition-shadow"
            />
            <KPICard
              title="High Impact"
              value={stats.highImpact.toString()}
              change={8}
              changeLabel="+8%"
              color="error"
              className="hover:shadow-md transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Regions */}
              <div className="bg-bg-elevated rounded-lg border border-border p-4">
                <h3 className="editorial-eyebrow mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  Regions
                </h3>
                <div className="space-y-1">
                  {REGIONS.map((region) => {
                    const tone = regionColors(region.name)
                    const active = selectedFilters.includes(region.id)
                    return (
                      <button
                        key={region.id}
                        onClick={() => toggleFilter(region.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-bg-subtle text-text-secondary',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full', tone.dot)} aria-hidden="true" />
                          {region.name}
                        </span>
                        <span className="text-xs text-text-tertiary tabular">{region.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Classification */}
              <div className="bg-bg-elevated rounded-lg border border-border p-4">
                <h3 className="editorial-eyebrow mb-3 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                  Classification
                </h3>
                <div className="space-y-1">
                  {CLASSIFICATIONS.map((cls) => {
                    const tone = classificationColors(cls.level)
                    const active = selectedFilters.includes(cls.level)
                    return (
                      <button
                        key={cls.level}
                        onClick={() => toggleFilter(cls.level)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-bg-subtle text-text-secondary',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full', tone.dot)} aria-hidden="true" />
                          {cls.label}
                        </span>
                        <span className="text-xs text-text-tertiary tabular">{cls.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="bg-white dark:bg-bg-elevated rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text flex items-center gap-2">
                      <Clock className="w-4 h-4 text-text-tertiary" />
                      Recent
                    </h3>
                    <button
                      onClick={clearSearches}
                      className="text-xs text-text-secondary hover:text-text"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(search)}
                        className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-bg-surface rounded-lg transition-colors truncate"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Main Results Area */}
            <main className="lg:col-span-3 space-y-8">
              {/* Trending Topics */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold text-text">
                    Trending Intelligence
                  </h2>
                  <button
                    onClick={() => navigate('/briefs')}
                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                  >
                    View all <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleSearch(topic.topic)}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        'bg-white dark:bg-bg-elevated border border-border hover:border-primary/50 hover:shadow-sm'
                      )}
                    >
                      <span>{topic.topic}</span>
                      <span className="text-xs text-text-tertiary px-2 py-0.5 bg-bg-surface rounded-full">
                        {topic.count}
                      </span>
                      {topic.trend === 'up' && (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                      {topic.trend === 'down' && (
                        <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Briefs */}
              <div>
                <h2 className="text-xl font-display font-bold text-text mb-4">
                  {searchQuery ? `Search results for "${searchQuery}"` : 'Featured Briefs'}
                </h2>
                {featuredBriefs.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {featuredBriefs.map((brief) => (
                      <BriefCard key={brief.id} brief={brief} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-bg-elevated rounded-xl border border-border p-12 text-center">
                    <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text mb-2">No briefs found</h3>
                    <p className="text-text-secondary mb-4">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                    <button
                      onClick={() => navigate('/editor')}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                    >
                      Create a new brief
                    </button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Quick Access Banner */}
      <section className="py-8 bg-primary/5 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="text-text-secondary">Quick access:</span>
            {[
              { label: 'Briefs Library', path: '/briefs' },
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'ASEAN Overview', path: '/asean' },
              { label: 'Watchlist', path: '/watchlist' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="px-3 py-1.5 bg-white dark:bg-bg-elevated border border-border rounded-lg text-text-secondary hover:text-text hover:border-primary/50 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
