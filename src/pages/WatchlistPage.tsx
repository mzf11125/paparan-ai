import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Trash2, Star, FileText, Filter, AlertTriangle, Globe, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/stores'
import { BriefCard } from '@/components/brief/BriefCard'
import { cn } from '@/utils/cn'
import { briefService } from '@/services/briefService'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { Development } from '@/types/paparan'

type SortOption   = 'recent' | 'region' | 'impact' | 'classification'
type FilterOption = 'all' | 'high-impact' | 'escalated' | 'recent-updates'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent',         label: 'Most Recent' },
  { value: 'region',         label: 'By Region' },
  { value: 'impact',         label: 'High Impact First' },
  { value: 'classification', label: 'By Classification' },
]

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all',            label: 'All' },
  { value: 'high-impact',    label: 'High Impact' },
  { value: 'escalated',      label: 'Escalated' },
  { value: 'recent-updates', label: 'Recent (7d)' },
]

export function WatchlistPage() {
  usePageMeta({ title: 'Watchlist' })
  const { toggleWatchlist, isInWatchlist } = useAppStore()
  const [sortBy, setSortBy]     = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const { data: allBriefs = [], isLoading } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
  })

  const watchlistBriefs = useMemo(() => {
    let briefs = allBriefs.filter(b => isInWatchlist(b.id))

    if (filterBy === 'high-impact') {
      briefs = briefs.filter(b => b.developments?.some((d: Development) => d.impact === 'HIGH'))
    } else if (filterBy === 'escalated') {
      briefs = briefs.filter(b => b.developments?.some((d: Development) => d.delta === 'ESCALATED'))
    } else if (filterBy === 'recent-updates') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
      briefs = briefs.filter(b => new Date(b.date) >= cutoff)
    }

    return [...briefs].sort((a, b) => {
      switch (sortBy) {
        case 'region': return a.region.localeCompare(b.region)
        case 'impact': {
          const aH = (a.developments || []).filter((d: Development) => d.impact === 'HIGH').length
          const bH = (b.developments || []).filter((d: Development) => d.impact === 'HIGH').length
          return bH - aH
        }
        case 'classification': {
          const order: Record<string, number> = { secret: 0, confidential: 1, official: 2, unclassified: 3 }
          return (order[a.classification || 'unclassified'] || 3) - (order[b.classification || 'unclassified'] || 3)
        }
        default: return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })
  }, [allBriefs, isInWatchlist, sortBy, filterBy])

  const stats = useMemo(() => ({
    total:     watchlistBriefs.length,
    highImpact: watchlistBriefs.filter(b => b.developments?.some((d: Development) => d.impact === 'HIGH')).length,
    escalated:  watchlistBriefs.filter(b => b.developments?.some((d: Development) => d.delta === 'ESCALATED')).length,
    regions:    new Set(watchlistBriefs.map(b => b.region)).size,
  }), [watchlistBriefs])

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-gold/20 mb-3 font-ui">
          <Star className="w-3 h-3" />
          Personal Collection
        </div>
        <h1 className="text-3xl font-display font-bold text-text">My Watchlist</h1>
        <p className="text-text-secondary text-sm mt-1 font-ui">
          Bookmarked briefs for quick access
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Saved Briefs',  value: stats.total,      icon: Bookmark,      color: 'text-gold',    bg: 'bg-gold/10',    border: 'border-l-gold' },
          { label: 'High Impact',   value: stats.highImpact, icon: AlertTriangle, color: 'text-error',   bg: 'bg-error/10',   border: 'border-l-error' },
          { label: 'Escalated',     value: stats.escalated,  icon: TrendingUp,    color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' },
          { label: 'Regions',       value: stats.regions,    icon: Globe,         color: 'text-success', bg: 'bg-success/10', border: 'border-l-success' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn('surface-card p-4 border-l-4', border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className={cn('text-2xl font-bold tabular-nums font-mono', color)}>{value}</p>
                <p className="text-xs text-text-secondary font-ui mt-1">{label}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-4.5 h-4.5', color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="surface-card p-3 flex items-center gap-3 flex-wrap">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterBy(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui border transition-all duration-150',
                filterBy === value
                  ? 'bg-primary text-white border-primary'
                  : 'text-text-secondary border-border hover:border-border-strong hover:text-text'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="input-base w-auto text-xs py-1.5"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
        </div>
      ) : allBriefs.filter(b => isInWatchlist(b.id)).length === 0 ? (
        /* Empty watchlist */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-xl font-display font-bold text-text mb-2">No saved briefs</h3>
          <p className="text-text-secondary text-sm max-w-sm mb-6 font-ui">
            Bookmark briefs from the library to track them here.
          </p>
          <Link
            to="/briefs"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal"
          >
            <FileText className="w-4 h-4" />
            Browse Library
          </Link>
        </div>
      ) : watchlistBriefs.length === 0 ? (
        /* No matches for filter */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-bg-subtle border border-border flex items-center justify-center mb-3">
            <Filter className="w-6 h-6 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-display font-bold text-text mb-2">No matches</h3>
          <p className="text-text-secondary text-sm mb-4 font-ui">Try a different filter.</p>
          <button
            onClick={() => setFilterBy('all')}
            className="text-sm text-primary hover:text-primary-hover font-ui font-medium transition-colors"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary font-ui">
            Showing <span className="tabular-nums font-semibold text-text">{watchlistBriefs.length}</span> briefs
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlistBriefs.map(brief => (
              <div key={brief.id} className="relative group">
                <BriefCard brief={brief} />
                <button
                  onClick={() => toggleWatchlist(brief.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-bg-elevated/80 backdrop-blur-sm border border-border text-gold opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error hover:border-error/20 transition-all duration-150"
                  aria-label="Remove from watchlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
