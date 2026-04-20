import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Edit,
  Share2,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Copy,
  Eye,
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
  classification?: 'unclassified' | 'official' | 'confidential'
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
  classification = 'unclassified',
}: BriefCardProps) {
  const [copied, setCopied] = useState(false)
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

  // Classification badge styles
  const classificationStyles = {
    unclassified: 'classification-badge-unclassified',
    official: 'classification-badge-official',
    confidential: 'classification-badge-confidential',
  }

  const classificationLabels = {
    unclassified: 'UNCLASSIFIED',
    official: 'OFFICIAL',
    confidential: 'CONFIDENTIAL',
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
          'hover:border-primary hover:shadow-sm transition-all duration-200 group',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('classification-badge', classificationStyles[classification])}>
                {classificationLabels[classification]}
              </span>
            </div>
            <h3 className="font-display font-semibold text-text line-clamp-1 group-hover:text-primary transition-colors">
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
                className="p-1.5 rounded hover:bg-bg-surface transition-colors"
                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {bookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-primary" />
                ) : (
                  <Bookmark className="w-4 h-4 text-text-tertiary" />
                )}
              </button>
            )}
            <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition-colors" />
          </div>
        </div>
      </NavLink>
    )
  }

  return (
    <article
      className={cn(
        'bg-bg-elevated border border-border rounded-lg overflow-hidden',
        'hover:border-primary transition-all duration-200 group',
        className
      )}
    >
      {/* Card Header — Simplified */}
      <div className="p-6">
        {/* Region Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official border border-primary/20">
            {brief.region}
          </span>
          <time className="ml-auto text-xs text-text-tertiary tabular-nums">
            {brief.date}
          </time>
        </div>

        <NavLink
          to={`/briefs/${brief.id}`}
          className="block group/link"
        >
          <h3 className="font-display font-bold text-lg text-text leading-snug group-hover/link:text-primary transition-colors">
            {brief.title}
          </h3>
        </NavLink>

        {/* Executive Summary Preview */}
        <p className="mt-4 text-sm text-text-secondary leading-relaxed">
          {brief.executiveSummary[0]}
        </p>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 text-xs text-text-tertiary">
            {displayTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer — Official Style */}
      <div className="px-6 py-4 bg-bg-surface border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="flex items-center gap-1">
              <NavLink
                to={`/briefs/${brief.id}`}
                className="p-2 rounded hover:bg-bg-elevated hover:text-primary transition-colors"
                title="View brief"
              >
                <Eye className="w-4 h-4 text-text-tertiary" />
              </NavLink>
              <NavLink
                to={`/editor/${brief.id}`}
                className="p-2 rounded hover:bg-bg-elevated hover:text-primary transition-colors"
                title="Edit brief"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="w-4 h-4 text-text-tertiary" />
              </NavLink>
              <button
                className="p-2 rounded hover:bg-bg-elevated hover:text-primary transition-colors relative"
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
                  className="p-2 rounded hover:bg-bg-elevated transition-colors"
                  title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  onClick={handleBookmark}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-primary" />
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border rounded text-sm font-medium text-text hover:border-primary hover:text-primary transition-all group-hover:shadow-sm"
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
      <div className="bg-bg-elevated border border-border rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-5 bg-bg-surface rounded w-3/4 mb-2" />
            <div className="flex items-center gap-3">
              <div className="h-4 bg-bg-surface rounded w-20" />
              <div className="h-4 bg-bg-surface rounded w-24" />
            </div>
          </div>
          <div className="w-5 h-5 bg-bg-surface rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-24 bg-bg-surface rounded" />
          <div className="h-6 w-20 bg-bg-surface rounded" />
        </div>
        <div className="h-6 bg-bg-surface rounded mb-2 w-3/4" />
        <div className="h-6 bg-bg-surface rounded mb-4 w-1/2" />
        <div className="h-4 bg-bg-surface rounded mb-2 w-full border-l-2 border-bg-subtle pl-3" />
        <div className="h-4 bg-bg-surface rounded mb-2 w-2/3 border-l-2 border-bg-subtle pl-3" />
        <div className="h-4 bg-bg-surface rounded mb-4 w-4/5 border-l-2 border-bg-subtle pl-3" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-bg-surface rounded" />
          <div className="h-6 w-20 bg-bg-surface rounded" />
          <div className="h-6 w-24 bg-bg-surface rounded" />
        </div>
      </div>
      <div className="px-6 py-4 bg-bg-surface border-t border-border flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-bg-elevated rounded" />
          <div className="h-8 w-8 bg-bg-elevated rounded" />
          <div className="h-8 w-8 bg-bg-elevated rounded" />
        </div>
        <div className="h-9 w-24 bg-bg-elevated rounded" />
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
