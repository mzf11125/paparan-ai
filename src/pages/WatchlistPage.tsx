import { NavLink } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ArrowRight, Trash2, FileText } from 'lucide-react'
import { useWatchlistBriefs, useAppStore } from '@/contexts/AppContext'
import { BriefCard } from '@/components/brief/BriefCard'
import { EmptyState } from '@/components/ui/EmptyState'

export function WatchlistPage() {
  const watchlistBriefs = useWatchlistBriefs()
  const { removeFromWatchlist } = useAppStore()

  const handleRemove = (id: string) => {
    removeFromWatchlist(id)
  }

  if (watchlistBriefs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-3">
            <BookmarkCheck className="w-3.5 h-3.5" />
            Personal Collection
          </div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">My Watchlist</h1>
          <p className="text-text-secondary">
            Briefs you've bookmarked for quick access
          </p>
        </div>

        <EmptyState
          icon={Bookmark}
          title="No bookmarked briefs"
          description="Save briefs to your watchlist to quickly access them later. Use the bookmark icon on any brief to add it here."
          action={{
            label: 'Browse Briefs',
            onClick: () => window.location.href = '/briefs'
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-3">
            <BookmarkCheck className="w-3.5 h-3.5" />
            Personal Collection
          </div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">My Watchlist</h1>
          <p className="text-text-secondary">
            <span className="tabular-nums font-semibold text-text">{watchlistBriefs.length}</span> saved brief
            {watchlistBriefs.length !== 1 && 's'}
          </p>
        </div>

        <NavLink
          to="/briefs"
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:border-primary hover:text-primary transition-all"
        >
          <FileText className="w-4 h-4" />
          Browse All Briefs
          <ArrowRight className="w-4 h-4" />
        </NavLink>
      </div>

      {/* Watchlist Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <WatchlistStat
          label="Total Bookmarked"
          value={watchlistBriefs.length}
          icon={Bookmark}
        />
        <WatchlistStat
          label="From APAC"
          value={watchlistBriefs.filter(b => b.region === 'APAC').length}
          icon={FileText}
        />
        <WatchlistStat
          label="From EMEA"
          value={watchlistBriefs.filter(b => b.region === 'EMEA').length}
          icon={FileText}
        />
        <WatchlistStat
          label="High Impact"
          value={watchlistBriefs.filter(b =>
            b.developments.some(d => d.impact === 'HIGH')
          ).length}
          icon={FileText}
        />
      </div>

      {/* Watchlist Briefs */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {watchlistBriefs.map((brief) => (
          <div key={brief.id} className="relative group">
            <BriefCard
              brief={brief}
              bookmarkedOverride={true}
            />
            {/* Quick Remove Button */}
            <button
              onClick={() => handleRemove(brief.id)}
              className="absolute top-4 right-4 p-2 bg-bg-elevated border border-border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red hover:text-white hover:border-red"
              aria-label="Remove from watchlist"
              title="Remove from watchlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface WatchlistStatProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}

function WatchlistStat({ label, value, icon: Icon }: WatchlistStatProps) {
  return (
    <div className="bg-bg-elevated border border-border rounded-lg p-4 flex items-center gap-3">
      <div className="p-2 bg-primary-lighter text-primary rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-text tabular-nums">{value}</div>
        <div className="text-xs text-text-tertiary uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}
