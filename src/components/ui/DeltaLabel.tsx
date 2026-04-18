import React from 'react'
import { Badge } from './Badge'

interface DeltaLabelProps {
  deltaType: 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

export const DeltaLabel: React.FC<DeltaLabelProps> = ({ deltaType, impactLevel }) => {
  const deltaColors = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    UPDATED: 'bg-amber-100 text-amber-800 border-amber-200',
    ESCALATED: 'bg-red-100 text-red-800 border-red-200',
    'DE-ESCALATED': 'bg-green-100 text-green-800 border-green-200',
  }

  const impactColors = {
    HIGH: 'bg-red-50 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={deltaColors[deltaType]}>
        {deltaType}
      </Badge>
      <Badge className={impactColors[impactLevel]}>
        {impactLevel}
      </Badge>
    </div>
  )
}
