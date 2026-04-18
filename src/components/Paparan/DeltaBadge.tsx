'use client'

import React from 'react'
import type { Development } from '@/lib/schema'
import { DeltaLabel } from '../ui/DeltaLabel'

interface DeltaBadgeProps {
  development: Development
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ development }) => {
  return (
    <div className="flex items-start gap-3 p-4 bg-paparan-cream rounded-lg border border-paparan-deep/10">
      <DeltaLabel
        deltaType={development.deltaType}
        impactLevel={development.impactLevel}
      />
      <p className="flex-1 text-paparan-ink text-sm leading-relaxed">
        {development.description}
      </p>
      {development.entities && development.entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {development.entities.map((entity, i) => (
            <span
              key={i}
              className="inline-flex px-2 py-0.5 text-xs font-medium bg-paparan-deep/10 text-paparan-deep rounded"
            >
              {entity}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
