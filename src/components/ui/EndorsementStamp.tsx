import React from 'react'
import { cn } from '@/utils/formatters'
import { Check, Clock, AlertCircle } from 'lucide-react'

export type EndorsementStatus = 'approved' | 'review' | 'draft' | 'rejected'

interface EndorsementStampProps {
  status: EndorsementStatus
  reviewer?: string
  date?: string
  className?: string
  variant?: 'full' | 'compact' | 'inline'
}

export const EndorsementStamp = React.forwardRef<HTMLDivElement, EndorsementStampProps>(
  ({ status, reviewer, date, className = '', variant = 'full' }, ref) => {
  const config = {
    approved: {
      label: 'APPROVED',
      icon: Check,
      className: 'endorsement-stamp',
    },
    review: {
      label: 'UNDER REVIEW',
      icon: Clock,
      className: 'endorsement-stamp endorsement-stamp-review',
    },
    draft: {
      label: 'DRAFT',
      icon: AlertCircle,
      className: 'endorsement-stamp endorsement-stamp-draft',
    },
    rejected: {
      label: 'REJECTED',
      icon: AlertCircle,
      className: 'px-4 py-2 text-red border-2 border-red border-dashed rounded',
    },
  }

  const { label, icon: Icon, className: statusClass } = config[status]

  if (variant === 'inline') {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1',
          'text-xs font-bold uppercase tracking-wider rounded',
          status === 'approved' && 'bg-green-light text-green border border-green',
          status === 'review' && 'bg-amber-light text-amber border border-amber',
          status === 'draft' && 'bg-bg-surface text-text-tertiary border border-border border-dashed',
          status === 'rejected' && 'bg-red-light text-red border border-red border-dashed',
          className
        )}
      >
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5',
          'text-xs font-bold uppercase tracking-wider rounded border',
          status === 'approved' && 'bg-green-light text-green border-green',
          status === 'review' && 'bg-amber-light text-amber border-amber',
          status === 'draft' && 'bg-bg-surface text-text-tertiary border-border border-dashed',
          className
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(statusClass, className)}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {reviewer && (
        <span className="text-xs opacity-75">by {reviewer}</span>
      )}
      {date && (
        <span className="text-xs opacity-75 tabular-nums">{date}</span>
      )}
    </div>
  )
})

EndorsementStamp.displayName = 'EndorsementStamp'

// Document endorsement footer
interface DocumentEndorsementProps {
  status: EndorsementStatus
  reviewer?: string
  date?: string
  documentNumber?: string
  classification?: string
  className?: string
}

export const DocumentEndorsement = React.forwardRef<HTMLDivElement, DocumentEndorsementProps>(
  ({ status, reviewer, date, documentNumber, classification, className = '' }, ref) => {
    return (
    <div
      ref={ref}
      className={cn(
        'mt-8 pt-4 border-t border-border',
        'flex items-center justify-between flex-wrap gap-4',
        'text-xs text-text-tertiary font-ui',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {documentNumber && (
          <span className="tabular-nums">DOC: {documentNumber}</span>
        )}
        {classification && (
          <span>{classification.toUpperCase()}</span>
        )}
        {date && (
          <span className="tabular-nums">{date}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <EndorsementStamp status={status} reviewer={reviewer} variant="inline" />
      </div>
    </div>
  )
})

DocumentEndorsement.displayName = 'DocumentEndorsement'
