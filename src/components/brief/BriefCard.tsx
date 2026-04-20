import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Tag,
  Edit,
  Share2,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Copy,
  Eye
} from 'lucide-react'
import { Paparan } from '@/types/paparan'
import { cn } from '@/utils/formatters'

interface BriefCardProps {
  brief: Paparan
  variant?: 'default' | 'compact'
  className?: string
  loading?: boolean
  bookmarked?: boolean
  onBookmarkToggle?: (briefId: string) => void
  onShare?: (briefId: string) => void
  showQuickActions?: boolean
}

export function BriefCard({
  brief,
  variant = 'default',
  className = '',
  loading = false,
  bookmarked = false,
  onBookmarkToggle,
  onShare,
  showQuickActions = true,
}: BriefCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)
  const highImpactCount = brief.developments.filter((d) => d.impact === 'HIGH').length
  const displayTags = brief.tags?.slice(0, 3) || []

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/briefs/${brief.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onShare?.(brief.id)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBookmarkToggle?.(brief.id)
  }

  if (loading) {
    return <BriefCardSkeleton variant={variant} />
  }

  if (variant === 'compact') {
    return (
      <NavLink
        to={`/briefs/${brief.id}`}
        className={cn(
          'block bg-bg-elevated border border-border rounded-radius-lg p-4',
          'hover:border-accent hover:shadow-md transition-all duration-200 group',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-text line-clamp-1 group-hover:text-accent transition-colors">
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
            {onBookmarkToggle && (
              <button
                onClick={handleBookmark}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {bookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-accent" />
                ) : (
                  <Bookmark className="w-4 h-4 text-text-tertiary" />
                )}
              </button>
            )}
            <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-accent transition-colors" />
          </div>
        </div>
      </NavLink>
    )
  }

  return (
    <article
      className={cn(
        'bg-bg-elevated border border-border rounded-radius-xl overflow-hidden',
        'hover:border-accent hover:shadow-lg transition-all duration-200 group',
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide rounded-radius-md">
            {brief.region}
          </span>
          {highImpactCount > 0 && (
            <span className="px-2.5 py-1 bg-red-light text-red text-xs font-semibold uppercase tracking-wide rounded-radius-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
              {highImpactCount} High Impact
            </span>
          )}
          {brief.lastUpdated && (
            <span className="ml-auto text-xs text-text-tertiary">
              Updated {brief.lastUpdated}
            </span>
          )}
        </div>

        <NavLink
          to={`/briefs/${brief.id}`}
          className="block group/link"
        >
          <h3 className="font-display font-bold text-lg text-text leading-snug group-hover/link:text-accent transition-colors line-clamp-2">
            {brief.title}
          </h3>
        </NavLink>

        <div className="flex items-center gap-3 mt-3 text-sm text-text-tertiary">
          <time className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {brief.date}
          </time>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue" />
            {brief.developments.length} developments
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green" />
            {brief.sources.length} sources
          </span>
        </div>

        {/* Executive Summary Preview */}
        <p className="mt-4 text-sm text-text-secondary line-clamp-3 leading-relaxed">
          {brief.executiveSummary[0]}
        </p>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded-radius-md hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {(brief.tags?.length || 0) > 3 && (
              <span className="text-xs text-text-tertiary">
                +{(brief.tags?.length || 0) - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {showQuickActions && (
            <div className={cn(
              'flex items-center gap-1 transition-opacity duration-200',
              showActions ? 'opacity-100' : 'opacity-0'
            )}>
              <NavLink
                to={`/briefs/${brief.id}`}
                className="p-2 rounded-lg hover:bg-white hover:text-accent transition-colors"
                title="View brief"
              >
                <Eye className="w-4 h-4 text-text-tertiary" />
              </NavLink>
              <NavLink
                to={`/editor/${brief.id}`}
                className="p-2 rounded-lg hover:bg-white hover:text-accent transition-colors"
                title="Edit brief"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="w-4 h-4 text-text-tertiary" />
              </NavLink>
              <button
                className="p-2 rounded-lg hover:bg-white hover:text-accent transition-colors relative"
                title={copied ? 'Copied!' : 'Copy link'}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Copy className="w-4 h-4 text-green" />
                ) : (
                  <Share2 className="w-4 h-4 text-text-tertiary" />
                )}
              </button>
              {onBookmarkToggle && (
                <button
                  className="p-2 rounded-lg hover:bg-white transition-colors"
                  title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  onClick={handleBookmark}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-accent" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-text-tertiary" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <NavLink
          to={`/briefs/${brief.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-radius-lg text-sm font-medium text-text hover:border-accent hover:text-accent transition-all group-hover:shadow-sm"
        >
          View Brief
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
      <div className="bg-bg-elevated border border-border rounded-radius-lg p-4 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="flex items-center gap-3">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-radius-xl overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-20 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/2" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-4/5" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50/50 border-t border-border flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated rounded-radius-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">{brief.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide rounded-radius-md">
              {brief.region}
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
              className="px-4 py-2 bg-accent text-white rounded-radius-lg font-medium hover:bg-accent-dark transition-colors"
            >
              View Full Brief
            </NavLink>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-radius-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
