import React from 'react'
import type { Delta, Impact } from '@/types'

interface DeltaLabelProps {
  deltaType: Delta
  impactLevel?: Impact
  showLabels?: boolean
  className?: string
}

const deltaConfig = {
  NEW: {
    label: 'NEW',
    bgColor: 'bg-delta-new-light',
    textColor: 'text-delta-new',
    borderColor: 'border-delta-new/20',
    dotColor: 'bg-delta-new',
  },
  UPDATED: {
    label: 'UPDATED',
    bgColor: 'bg-delta-updated-light',
    textColor: 'text-delta-updated',
    borderColor: 'border-delta-updated/20',
    dotColor: 'bg-delta-updated',
  },
  ESCALATED: {
    label: 'ESCALATED',
    bgColor: 'bg-delta-escalated-light',
    textColor: 'text-delta-escalated',
    borderColor: 'border-delta-escalated/20',
    dotColor: 'bg-delta-escalated',
  },
  'DE-ESCALATED': {
    label: 'DE-ESCALATED',
    bgColor: 'bg-delta-de-escalated-light',
    textColor: 'text-delta-de-escalated',
    borderColor: 'border-delta-de-escalated/20',
    dotColor: 'bg-delta-de-escalated',
  },
} as const

const impactConfig = {
  HIGH: { label: 'HIGH', color: 'text-red-700' },
  MEDIUM: { label: 'MED', color: 'text-amber-700' },
  LOW: { label: 'LOW', color: 'text-text-tertiary' },
} as const

export const DeltaLabel: React.FC<DeltaLabelProps> = ({
  deltaType,
  impactLevel,
  showLabels = true,
  className = ''
}) => {
  const config = deltaConfig[deltaType]
  const impact = impactLevel ? impactConfig[impactLevel] : null

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {/* Status Dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`}
        aria-hidden="true"
      />

      {showLabels && (
        <span className="text-xs font-semibold uppercase tracking-wider font-ui">
          {config.label}
        </span>
      )}

      {impact && (
        <>
          <span className="w-px h-3 bg-current/20" aria-hidden="true" />
          <span className={`text-xs font-semibold uppercase tracking-wider font-ui ${impact.color}`}>
            {impact.label} IMPACT
          </span>
        </>
      )}
    </div>
  )
}
