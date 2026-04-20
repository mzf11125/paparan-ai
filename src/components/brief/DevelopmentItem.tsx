import React from 'react'
import { DeltaLabel } from '@/components/ui/DeltaLabel'
import type { Development } from '@/types'

interface DevelopmentItemProps {
  development: Development
  highlightMode: boolean
  className?: string
}

export const DevelopmentItem: React.FC<DevelopmentItemProps> = ({
  development,
  highlightMode,
  className = ''
}) => {
  const isHighImpact = development.impact === 'HIGH'

  return (
    <article
      data-impact={development.impact}
      className={`development-item p-5 rounded-xl border transition-all duration-200 ${
        isHighImpact
          ? 'border-delta-escalated/30 bg-delta-escalated-light/50 shadow-subtle'
          : 'border-gray-200 bg-gray-50/50'
      } ${
        highlightMode && !isHighImpact
          ? 'opacity-40 scale-[0.98]'
          : ''
      } ${
        highlightMode && isHighImpact
          ? 'ring-2 ring-accent shadow-elevated scale-[1.01]'
          : ''
      } ${className}`}
    >
      {/* Delta Badge */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <DeltaLabel
          deltaType={development.delta}
          impactLevel={development.impact}
          showLabels
        />
        {development.date && (
          <time className="text-xs text-text-secondary font-ui whitespace-nowrap">
            {development.date}
          </time>
        )}
      </div>

      {/* Development Text */}
      <p
        className={`text-document-base leading-relaxed font-body ${
          highlightMode && isHighImpact ? 'font-semibold' : ''
        }`}
      >
        {development.text}
      </p>

      {/* Entity Tags */}
      {development.entities && development.entities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {development.entities.map((entity, j) => (
            <span
              key={j}
              className="inline-flex px-2.5 py-1 text-xs font-medium font-ui bg-white border border-gray-200 text-text-secondary rounded-md"
            >
              {entity}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
