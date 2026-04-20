import React from 'react'
import { LucideIcon, X } from 'lucide-react'
import { cn } from '@/utils/formatters'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'subtle' | 'outline' | 'accent'
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

interface BadgeProps {
  children?: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  dot?: boolean
  pulse?: boolean
  dismissible?: boolean
  onDismiss?: () => void
  icon?: LucideIcon
}

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-xs gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
} as const

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
} as const

const variantClasses = {
  default: 'bg-accent/10 text-accent-dark border border-accent/20',
  success: 'bg-green-light text-green border border-green/30',
  warning: 'bg-amber-light text-amber border border-amber/30',
  danger: 'bg-red-light text-red border border-red/30',
  info: 'bg-blue-light text-blue border border-blue/30',
  subtle: 'bg-gray-100 text-text-secondary border border-gray-200',
  outline: 'bg-transparent border border-border-strong text-text',
  accent: 'bg-accent text-white border border-accent',
} as const

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'default',
      size = 'sm',
      className = '',
      dot = false,
      pulse = false,
      dismissible = false,
      onDismiss,
      icon: Icon,
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-radius-md font-sans font-medium uppercase tracking-wide transition-all duration-150',
          sizeClasses[size],
          variantClasses[variant],
          pulse && 'animate-pulse-subtle',
          className
        )}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full bg-current',
              dotSizes[size],
              pulse && 'animate-pulse'
            )}
          />
        )}
        {Icon && !dot && <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', size === 'lg' && 'w-4 h-4')} />}
        {children && <span>{children}</span>}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-1 hover:opacity-70 transition-opacity"
            type="button"
          >
            <X className={cn('w-3 h-3 flex-shrink-0', size === 'lg' && 'w-3.5 h-3.5')} />
          </button>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Status Badge for delta types
interface StatusBadgeProps {
  delta: 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'
  size?: BadgeSize
  className?: string
}

export function StatusBadge({ delta, size = 'sm', className = '' }: StatusBadgeProps) {
  const config = {
    NEW: { variant: 'info' as const, label: 'New', icon: null },
    UPDATED: { variant: 'warning' as const, label: 'Updated', icon: null },
    ESCALATED: { variant: 'danger' as const, label: 'Escalated', pulse: true },
    'DE-ESCALATED': { variant: 'success' as const, label: 'De-escalated', icon: null },
  }

  const { variant, label } = config[delta]
  const pulse = delta === 'ESCALATED'

  return (
    <Badge variant={variant} size={size} pulse={pulse} className={className}>
      {label}
    </Badge>
  )
}

// Count Badge for numbers
interface CountBadgeProps {
  count: number
  max?: number
  size?: BadgeSize
  className?: string
}

export function CountBadge({ count, max = 99, size = 'xs', className = '' }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count

  return (
    <Badge variant="accent" size={size} className={cn('min-w-[1.25rem] justify-center', className)}>
      {displayCount}
    </Badge>
  )
}

// Dot Badge for status indicators
interface DotBadgeProps {
  color?: 'green' | 'amber' | 'red' | 'blue' | 'gray'
  pulse?: boolean
  className?: string
}

const dotColors = {
  green: 'bg-green',
  amber: 'bg-amber',
  red: 'bg-red',
  blue: 'bg-blue',
  gray: 'bg-gray-400',
}

export function DotBadge({ color = 'gray', pulse = false, className = '' }: DotBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        dotColors[color],
        pulse && 'animate-pulse',
        className
      )}
    />
  )
}
