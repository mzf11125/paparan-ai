import { useEffect, useState, useRef } from 'react'
import { Paparan } from '@/types/paparan'
import { BriefCard, BriefCardSkeleton } from './BriefCard'
import { FileX, Loader2, RefreshCw, Grid3x3, List, Filter } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface BriefGridProps {
  briefs: Paparan[]
  isLoading?: boolean
  isFetchingMore?: boolean
  viewMode?: 'grid' | 'list'
  className?: string
  onLoadMore?: () => void
  hasMore?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}

const VIEW_MODE_STORAGE_KEY = 'briefs-view-mode'

export function BriefGrid({
  briefs,
  isLoading,
  isFetchingMore = false,
  viewMode: externalViewMode,
  className = '',
  onLoadMore,
  hasMore = false,
  onRefresh,
  isRefreshing = false,
}: BriefGridProps) {
  const [internalViewMode] = useState<'grid' | 'list'>(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    return stored === 'list' ? 'list' : 'grid'
  })
  const [visibleCount, setVisibleCount] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const viewMode = externalViewMode || internalViewMode

  // Staggered fade-in animation
  useEffect(() => {
    if (!isLoading && briefs.length > 0) {
      const interval = setInterval(() => {
        setVisibleCount((prev) => {
          if (prev < briefs.length) {
            return prev + 1
          }
          clearInterval(interval)
          return prev
        })
      }, 50)

      return () => clearInterval(interval)
    }
  }, [briefs.length, isLoading])

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const target = observerTarget.current
    if (!target || !onLoadMore || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [onLoadMore, hasMore, isFetchingMore])


  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setTouchStart(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart && containerRef.current?.scrollTop === 0) {
      const currentTouch = e.touches[0].clientY
      const distance = currentTouch - touchStart
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.5, 120)) // Max pull distance
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80 && onRefresh && !isRefreshing) {
      onRefresh()
    }
    setPullDistance(0)
    setTouchStart(0)
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <BriefGridSkeleton count={6} viewMode={viewMode} />
      </div>
    )
  }

  if (briefs.length === 0) {
    return <EmptyState onRefresh={onRefresh} isRefreshing={isRefreshing} />
  }

  const visibleBriefs = briefs.slice(0, visibleCount || briefs.length)
  const showLoadingMore = isFetchingMore || (visibleCount < briefs.length)

  return (
    <div className="space-y-4">
      {/* Pull-to-refresh indicator */}
      <div
        className="relative overflow-hidden"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        {pullDistance > 40 && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity',
              pullDistance > 80 ? 'opacity-100' : 'opacity-0'
            )}
          >
            <RefreshCw className={cn('w-6 h-6 text-accent', isRefreshing && 'animate-spin')} />
          </div>
        )}
      </div>

      {/* Briefs Grid/List */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          viewMode === 'grid'
            ? 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4',
          className
        )}
      >
        {visibleBriefs.map((brief, index) => (
          <div
            key={brief.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <BriefCard brief={brief} variant={viewMode === 'list' ? 'compact' : 'default'} />
          </div>
        ))}

        {/* Loading more indicator */}
        {showLoadingMore && (
          <div className={cn(
            viewMode === 'grid' ? 'col-span-full' : 'w-full',
            'flex items-center justify-center py-8'
          )}>
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        )}

        {/* Intersection Observer target */}
        {hasMore && <div ref={observerTarget} className="h-4" />}
      </div>

      {/* End of results */}
      {!hasMore && visibleCount >= briefs.length && (
        <div className="text-center py-6 text-text-tertiary text-sm">
          Showing all {briefs.length} briefs
        </div>
      )}
    </div>
  )
}

// Loading skeleton component
export function BriefGridSkeleton({
  count = 6,
  viewMode = 'grid'
}: {
  count?: number
  viewMode?: 'grid' | 'list'
}) {
  return (
    <div
      className={cn(
        viewMode === 'grid'
          ? 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'space-y-4'
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <BriefCardSkeleton key={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
      ))}
    </div>
  )
}

// Empty state component
interface EmptyStateProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

function EmptyState({ onRefresh, isRefreshing }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileX className="w-10 h-10 text-text-tertiary" />
        </div>
        <h3 className="text-xl font-display font-semibold text-text mb-2">No Briefs Found</h3>
        <p className="text-text-secondary mb-6">
          No policy intelligence briefs match your current filters. Try adjusting your search criteria.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-radius-lg font-medium',
              'hover:bg-accent-dark transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        )}
      </div>
    </div>
  )
}

// View mode toggle component
interface ViewModeToggleProps {
  viewMode: 'grid' | 'list'
  onChange: (mode: 'grid' | 'list') => void
  className?: string
}

export function ViewModeToggle({ viewMode, onChange, className = '' }: ViewModeToggleProps) {
  return (
    <div className={cn('flex items-center border border-border rounded-radius-lg overflow-hidden', className)}>
      <button
        onClick={() => onChange('grid')}
        className={cn(
          'p-2.5 transition-colors',
          viewMode === 'grid' ? 'bg-accent text-white' : 'bg-white hover:bg-gray-50 text-text-tertiary'
        )}
        title="Grid view"
      >
        <Grid3x3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={cn(
          'p-2.5 transition-colors',
          viewMode === 'list' ? 'bg-accent text-white' : 'bg-white hover:bg-gray-50 text-text-tertiary'
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}

// Results summary component
interface ResultsSummaryProps {
  total: number
  showing: number
  filters?: string[]
  onClearFilters?: () => void
  className?: string
}

export function ResultsSummary({
  total,
  showing,
  filters = [],
  onClearFilters,
  className = ''
}: ResultsSummaryProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <p className="text-sm text-text-tertiary">
        Showing <span className="font-medium text-text">{showing}</span> of{' '}
        <span className="font-medium text-text">{total}</span> briefs
      </p>
      {filters.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-accent" />
            <span className="text-sm text-text-tertiary">{filters.length} filters</span>
          </div>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-accent hover:text-accent-dark transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
