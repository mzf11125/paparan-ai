import { ExternalLink, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DeltaBadge, type DeltaType, ImpactBadge, type ImpactLevel } from '@/components/ui/DeltaBadge'
import { cn } from '@/utils/cn'

/* ============================================
   FEED ITEM — NEWS FEED CARD
   Intelligence feed with topics and actions
   ============================================ */

export interface FeedData {
  id: string
  title: string
  source: string
  sourceUrl?: string
  sourceFavicon?: string
  publishedAt: string
  summary: string
  topics: string[]
  countries: string[]
  impact: ImpactLevel
  delta?: DeltaType
}

interface FeedItemProps {
  item: FeedData
  isWatched?: boolean
  onToggleWatch?: (id: string) => void
  onAddToBrief?: (id: string) => void
  className?: string
}

export function FeedItem({
  item,
  isWatched = false,
  onToggleWatch,
  onAddToBrief,
  className,
}: FeedItemProps) {
  return (
    <article
      className={cn(
        'paper-card',
        'rounded-md',
        'p-4',
        'transition-spring-fast',
        'hover-lift',
        'group',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Source Favicon */}
          {item.sourceFavicon ? (
            <img
              src={item.sourceFavicon}
              alt=""
              className="w-4 h-4 flex-shrink-0"
            />
          ) : (
            <div className="w-4 h-4 rounded bg-surface flex-shrink-0" />
          )}
          <span className="font-ui text-sm text-text-secondary truncate">
            {item.source}
          </span>
          <span className="text-text-tertiary">·</span>
          <time
            className="font-ui text-sm text-text-tertiary whitespace-nowrap"
            dateTime={item.publishedAt}
          >
            {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
          </time>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleWatch?.(item.id)}
            className={cn(
              'p-1.5',
              'rounded-sm',
              'transition-colors',
              'hover:bg-surface',
              isWatched && 'text-amber-500'
            )}
            aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star className={cn('w-4 h-4', isWatched && 'fill-current')} />
          </button>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-sm transition-colors hover:bg-surface"
              aria-label="Open source"
            >
              <ExternalLink className="w-4 h-4 text-text-tertiary" />
            </a>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-lg leading-snug text-text mb-2 group-hover:text-primary transition-colors">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="font-body text-sm text-text-secondary line-clamp-2 mb-3">
        {item.summary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {item.topics.map((topic) => (
          <span
            key={topic}
            className="px-2 py-0.5 bg-primary-light text-primary rounded font-ui text-xs font-medium uppercase tracking-wider"
          >
            {topic}
          </span>
        ))}
        {item.countries.map((country) => (
          <span
            key={country}
            className="px-2 py-0.5 bg-surface text-text-secondary rounded font-ui text-xs"
          >
            {country}
          </span>
        ))}
        {item.delta && <DeltaBadge type={item.delta} variant="compact" />}
        <ImpactBadge level={item.impact} variant="dot" />
      </div>

      {/* Add to Brief Action */}
      {onAddToBrief && (
        <button
          onClick={() => onAddToBrief(item.id)}
          className="w-full mt-2 px-3 py-2 border border-border rounded-sm font-ui text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          + Add to Brief
        </button>
      )}
    </article>
  )
}

/* ============================================
   FEED ITEM SKELETON
   ============================================ */

export function FeedItemSkeleton() {
  return (
    <div className="paper-card rounded-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="skeleton w-4 h-4 rounded" />
          <div className="skeleton w-24 h-4 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton w-8 h-8 rounded" />
          <div className="skeleton w-8 h-8 rounded" />
        </div>
      </div>

      {/* Title */}
      <div className="skeleton w-3/4 h-6 rounded mb-2" />
      <div className="skeleton w-1/2 h-6 rounded mb-3" />

      {/* Summary */}
      <div className="space-y-1.5 mb-3">
        <div className="skeleton w-full h-4 rounded" />
        <div className="skeleton w-2/3 h-4 rounded" />
      </div>

      {/* Tags */}
      <div className="flex gap-2">
        <div className="skeleton w-16 h-6 rounded" />
        <div className="skeleton w-20 h-6 rounded" />
        <div className="skeleton w-16 h-6 rounded" />
      </div>
    </div>
  )
}

/* ============================================
   FEED GROUP — BY DATE
   ============================================ */

interface FeedGroupProps {
  date: string
  children: React.ReactNode
}

export function FeedGroup({ date, children }: FeedGroupProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="font-ui text-sm font-semibold uppercase tracking-wider text-text-secondary">
          {formatDate(date)}
        </h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-3 stagger-list">
        {children}
      </div>
    </div>
  )
}
