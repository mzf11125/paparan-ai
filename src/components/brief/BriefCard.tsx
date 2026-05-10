import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Edit,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Copy,
  GitCompareArrows,
  Check,
} from 'lucide-react'
import { Paparan } from '@/types/paparan'
import { cn } from '@/utils/cn'
import { toast } from '@/components/ui/Toast'
import { useAppStore } from '@/contexts/AppContext'

interface BriefCardProps {
  brief: Paparan
  variant?: 'default' | 'compact'
  className?: string
  loading?: boolean
  onShare?: (briefId: string) => void
  showQuickActions?: boolean
  classification?: 'unclassified' | 'official' | 'confidential'
  // Optional override for bookmark state (for preview/readonly mode)
  bookmarkedOverride?: boolean
}

export function BriefCard({
  brief,
  variant = 'default',
  className = '',
  loading = false,
  onShare,
  bookmarkedOverride,
}: BriefCardProps) {
  const [copied, setCopied] = useState(false)
  const displayTags = brief.tags?.slice(0, 3) || []
  const { isInWatchlist, toggleWatchlist, isInCompare, toggleCompare, compareIds } = useAppStore()
  const bookmarked = bookmarkedOverride ?? isInWatchlist(brief.id)
  const inCompare  = isInCompare(brief.id)

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inCompare && compareIds.length >= 3) {
      toast.warning('Compare full', 'You can compare up to three briefs at a time.')
      return
    }
    toggleCompare(brief.id)
    if (!inCompare) toast.success('Added to compare')
    else            toast.info('Removed from compare')
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/briefs/${brief.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied to clipboard')
    onShare?.(brief.id)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleWatchlist(brief.id)
    // Show toast notification
    if (!bookmarked) {
      toast.success('Added to watchlist')
    } else {
      toast.info('Removed from watchlist')
    }
  }

  if (loading) {
    return <BriefCardSkeleton variant={variant} />
  }

  if (variant === 'compact') {
    return (
      <NavLink
        to={`/briefs/${brief.id}`}
        className={cn(
          'block bg-bg-elevated border border-border rounded-lg p-4',
          // Enhanced hover effects
          'transition-all duration-200 ease-out group',
          'hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30',
          'active:scale-[0.99]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#5183EB]/10 text-[#5183EB] border border-[#5183EB]/20">
                {brief.region}
              </span>
            </div>
            <h3 className="font-display font-semibold text-text line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {brief.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-tertiary">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {brief.region}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {brief.date}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBookmark}
              className="p-1.5 rounded-lg hover:bg-bg-surface active:scale-95 transition-all duration-200"
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
              )}
            </button>
            <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>
      </NavLink>
    )
  }

  return (
    <article
      className={cn(
        'group relative bg-white/70 dark:bg-white/[0.04]',
        'border border-black/[0.06] dark:border-white/[0.08]',
        'rounded-2xl overflow-hidden',
        'backdrop-blur-sm',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]',
        // Enhanced hover effects
        'transition-all duration-200 ease-out',
        'hover:shadow-[0_8px_32px_rgba(37,99,235,0.15),0_2px_8px_rgba(0,0,0,0.08)]',
        'hover:border-primary/40 hover:-translate-y-1',
        'active:scale-[0.99] active:shadow-inner',
        className
      )}
    >
      {/* Impact accent bar */}
      {brief.developments?.some(d => d.impact === 'HIGH') && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400 via-orange-400 to-red-400 opacity-70" />
      )}

      <div className="p-5">
        {/* Top row — region + date */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#5183EB]/10 text-[#5183EB] text-[11px] font-semibold uppercase tracking-wider rounded-full border border-[#5183EB]/20">
            <MapPin className="w-3 h-3" />
            {brief.region}
          </span>
          <div className="flex items-center gap-2">
            <time className="text-[11px] text-gray-400 tabular-nums flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {brief.date}
            </time>
            <button
              onClick={handleBookmark}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all duration-200"
              title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              {bookmarked
                ? <BookmarkCheck className="w-3.5 h-3.5 text-[#5183EB]" />
                : <Bookmark className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
              }
            </button>
          </div>
        </div>

        {/* Title */}
        <NavLink to={`/briefs/${brief.id}`} className="block">
          <h3 className="font-display font-bold text-[15px] leading-snug text-gray-900 dark:text-white group-hover:text-[#5183EB] transition-colors duration-200 line-clamp-2">
            {brief.title}
          </h3>
        </NavLink>

        {/* Summary */}
        <p className="mt-2.5 text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {brief.executiveSummary[0]}
        </p>

        {/* Impact pills */}
        {brief.developments && brief.developments.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
              const count = brief.developments.filter(d => d.impact === level).length
              if (!count) return null
              const styles = {
                HIGH: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
                MEDIUM: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
                LOW: 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10',
              }
              return (
                <span key={level} className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border', styles[level])}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {count} {level}
                </span>
              )
            })}
          </div>
        )}

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {displayTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 rounded-md border border-gray-100 dark:border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50/80 dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-all duration-200"
            title={copied ? 'Copied!' : 'Copy link'}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <NavLink
            to={`/editor/${brief.id}`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-all duration-200"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </NavLink>
          <button
            onClick={handleCompare}
            className={cn(
              'p-1.5 rounded-lg active:scale-95 transition-all duration-200',
              inCompare
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-white dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}
            title={inCompare ? 'In compare' : 'Add to compare'}
          >
            {inCompare ? <Check className="w-3.5 h-3.5" /> : <GitCompareArrows className="w-3.5 h-3.5" />}
          </button>
        </div>

        <NavLink
          to={`/briefs/${brief.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5183EB] hover:bg-[#3d6fd4] text-white text-[12px] font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_4px_12px_rgba(81,131,235,0.35)] hover:-translate-y-px active:scale-95"
        >
          Read Brief
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </NavLink>
      </div>
    </article>
  )
}

// Loading skeleton component
interface BriefCardSkeletonProps {
  variant?: 'default' | 'compact'
}

export function BriefCardSkeleton({ variant = 'default' }: BriefCardSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className="bg-bg-elevated border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="skeleton h-5 rounded w-3/4 mb-2" />
            <div className="flex items-center gap-3">
              <div className="skeleton h-4 rounded w-20" />
              <div className="skeleton h-4 rounded w-24" />
            </div>
          </div>
          <div className="skeleton w-5 h-5 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex gap-2 mb-4">
          <div className="skeleton h-6 w-24 rounded" />
          <div className="skeleton h-6 w-20 rounded" />
        </div>
        <div className="skeleton h-6 rounded mb-2 w-3/4" />
        <div className="skeleton h-6 rounded mb-4 w-1/2" />
        <div className="skeleton h-4 rounded mb-2 w-full" />
        <div className="skeleton h-4 rounded mb-2 w-2/3" />
        <div className="skeleton h-4 rounded mb-4 w-4/5" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded" />
          <div className="skeleton h-6 w-20 rounded" />
          <div className="skeleton h-6 w-24 rounded" />
        </div>
      </div>
      <div className="px-6 py-4 bg-bg-surface border-t border-border flex items-center justify-between">
        <div className="flex gap-2">
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-8 rounded" />
        </div>
        <div className="skeleton h-9 w-24 rounded" />
      </div>
    </div>
  )
}

// Quick preview modal (to be implemented with state management)
interface BriefPreviewModalProps {
  brief: Paparan
  isOpen: boolean
  onClose: () => void
}

export function BriefPreviewModal({ brief, isOpen, onClose }: BriefPreviewModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">{brief.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-surface rounded transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="classification-badge classification-badge-unclassified">
              UNCLASSIFIED
            </span>
            <span className="text-sm text-text-tertiary">{brief.date}</span>
          </div>
          <p className="text-text-secondary leading-relaxed mb-6">
            {brief.executiveSummary[0]}
          </p>
          <div className="flex items-center gap-3">
            <NavLink
              to={`/briefs/${brief.id}`}
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
            >
              View Full Brief
            </NavLink>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded font-medium hover:bg-bg-surface transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
