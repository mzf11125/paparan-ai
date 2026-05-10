import React from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'teal' | 'gold' | 'document'
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', hoverable = false, clickable = false, onClick, ...props }, ref) => {
    const variants = {
      default:  'surface-card',
      elevated: 'bg-bg-elevated border border-border rounded-xl shadow-md',
      teal:     'teal-card',
      gold:     'bg-bg-elevated border border-gold/20 rounded-xl shadow-sm',
      document: 'document-frame',
    }

    const interactive = (hoverable || clickable) ? cn(
      'transition-all duration-200 ease-out cursor-pointer',
      'hover:shadow-lg hover:-translate-y-1 hover:border-primary/30',
      'active:scale-[0.99]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
    ) : ''

    return (
      <div
        ref={ref}
        className={cn('p-5', variants[variant], interactive, className)}
        onClick={onClick}
        tabIndex={clickable || hoverable ? 0 : undefined}
        role={clickable || hoverable ? 'button' : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>{children}</div>
  )
)
CardHeader.displayName = 'CardHeader'

export const CardBody = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props}>{children}</div>
  )
)
CardBody.displayName = 'CardBody'

export const CardFooter = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-border flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
)
CardFooter.displayName = 'CardFooter'

// Stats card with left accent border
interface StatsCardProps {
  value: string | number
  label: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  color?: 'primary' | 'gold' | 'success' | 'warning' | 'error'
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ value, label, change, changeLabel, icon, className = '', color = 'primary' }, ref) => {
    const borderColors = {
      primary: 'border-l-primary',
      gold:    'border-l-gold',
      success: 'border-l-success',
      warning: 'border-l-warning',
      error:   'border-l-error',
    }
    const textColors = {
      primary: 'text-primary',
      gold:    'text-gold',
      success: 'text-success',
      warning: 'text-warning',
      error:   'text-error',
    }
    const changeColor = change && change > 0 ? 'text-success' : change && change < 0 ? 'text-error' : 'text-text-secondary'

    return (
      <div ref={ref} className={cn('surface-card p-4 border-l-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200', borderColors[color], className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn('text-2xl font-bold tabular-nums font-mono', textColors[color])}>{value}</p>
            <p className="text-xs text-text-secondary font-ui mt-1">{label}</p>
            {(change !== undefined || changeLabel) && (
              <div className="mt-2 text-xs font-medium flex items-center gap-1.5">
                {change !== undefined && (
                  <span className={cn(changeColor)}>
                    {change > 0 ? '↑' : change < 0 ? '↓' : ''}{Math.abs(change)}
                  </span>
                )}
                {changeLabel && <span className="text-text-tertiary">{changeLabel}</span>}
              </div>
            )}
          </div>
          {icon && <div className="text-text-tertiary opacity-60">{icon}</div>}
        </div>
      </div>
    )
  }
)
StatsCard.displayName = 'StatsCard'
