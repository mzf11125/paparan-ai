import React from 'react'
import { cn } from '@/utils/formatters'
import { Shield, AlertTriangle } from 'lucide-react'

export type ClassificationLevel = 'unclassified' | 'official' | 'confidential' | 'secret'

interface ClassificationBadgeProps {
  level: ClassificationLevel
  showIcon?: boolean
  variant?: 'inline' | 'banner' | 'compact'
  className?: string
}

const config = {
  unclassified: {
    label: 'UNCLASSIFIED',
    description: 'For Public Release',
    color: 'text-green',
    bgColor: 'bg-green-light',
    borderColor: 'border-green',
    icon: Shield,
  },
  official: {
    label: 'OFFICIAL',
    description: 'Official Use Only',
    color: 'text-primary',
    bgColor: 'bg-primary-light',
    borderColor: 'border-primary',
    icon: Shield,
  },
  confidential: {
    label: 'CONFIDENTIAL',
    description: 'Confidential',
    color: 'text-amber',
    bgColor: 'bg-amber-light',
    borderColor: 'border-amber',
    icon: AlertTriangle,
  },
  secret: {
    label: 'SECRET',
    description: 'Secret',
    color: 'text-red',
    bgColor: 'bg-red-light',
    borderColor: 'border-red',
    icon: AlertTriangle,
  },
} as const

export const ClassificationBadge = React.forwardRef<
  HTMLDivElement,
  ClassificationBadgeProps
>(({ level, showIcon = false, variant = 'inline', className = '' }, ref) => {
  const { label, description, bgColor, borderColor, icon: Icon } = config[level]

  if (variant === 'banner') {
    return (
      <div
        ref={ref}
        className={cn(
          'classification-banner',
          `classification-banner-${level}`,
          'gap-2 w-full',
          className
        )}
      >
        {showIcon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
        <span className="opacity-75">— {description}</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5',
          'font-ui text-xs font-bold uppercase tracking-wider',
          'rounded border',
          bgColor, borderColor,
          className
        )}
      >
        {label}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'classification-badge',
        `classification-badge-${level}`,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  )
})

ClassificationBadge.displayName = 'ClassificationBadge'
