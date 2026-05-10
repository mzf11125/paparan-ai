import React from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'primary' | 'gold' | 'success' | 'warning' | 'error' | 'neutral' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary border-primary/25',
  gold:    'bg-gold/10 text-gold border-gold/25',
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  error:   'bg-error/10 text-error border-error/25',
  neutral: 'bg-bg-subtle text-text-secondary border-border',
  outline: 'bg-transparent text-text-secondary border-border-strong',
}

export function Badge({ children, variant = 'neutral', size = 'md', dot = false, className = '' }: BadgeProps) {
  return (
    <span className={cn(
      'badge border',
      VARIANT_STYLES[variant],
      size === 'sm' && 'text-[9px] px-1.5 py-0.5',
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-primary': variant === 'primary',
        'bg-gold':    variant === 'gold',
        'bg-success': variant === 'success',
        'bg-warning': variant === 'warning',
        'bg-error':   variant === 'error',
        'bg-text-secondary': variant === 'neutral' || variant === 'outline',
      })} />}
      {children}
    </span>
  )
}

// Classification badge
type ClassLevel = 'unclassified' | 'official' | 'confidential' | 'secret'

const CLASS_STYLES: Record<ClassLevel, string> = {
  unclassified: 'bg-success/10 text-success border-success/25',
  official:     'bg-primary/10 text-primary border-primary/25',
  confidential: 'bg-warning/10 text-warning border-warning/25',
  secret:       'bg-error/10 text-error border-error/25',
}

export function ClassificationBadge({ level, className = '' }: { level: ClassLevel; className?: string }) {
  return (
    <span className={cn('badge border uppercase', CLASS_STYLES[level], className)}>
      {level}
    </span>
  )
}

// Impact badge
type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW'

const IMPACT_STYLES: Record<ImpactLevel, string> = {
  HIGH:   'bg-error/10 text-error border-error/25',
  MEDIUM: 'bg-warning/10 text-warning border-warning/25',
  LOW:    'bg-success/10 text-success border-success/25',
}

export function ImpactBadge({ level, className = '' }: { level: ImpactLevel; className?: string }) {
  return (
    <span className={cn('badge border', IMPACT_STYLES[level], className)}>
      {level}
    </span>
  )
}

// Delta badge
type DeltaType = 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'

const DELTA_STYLES: Record<DeltaType, string> = {
  'NEW':          'bg-primary/10 text-primary border-primary/25',
  'UPDATED':      'bg-warning/10 text-warning border-warning/25',
  'ESCALATED':    'bg-error/10 text-error border-error/25',
  'DE-ESCALATED': 'bg-success/10 text-success border-success/25',
}

export function DeltaBadge({ type, className = '' }: { type: DeltaType; className?: string }) {
  return (
    <span className={cn('badge border', DELTA_STYLES[type], className)}>
      {type}
    </span>
  )
}
