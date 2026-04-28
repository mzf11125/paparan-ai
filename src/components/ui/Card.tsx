import React from 'react'
import { cn } from '@/utils/formatters'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'bordered' | 'elevated' | 'flat' | 'document' | 'official'
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
  watermark?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', hoverable = false, clickable = false, onClick, watermark = false, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-bg-elevated border border-border rounded-xl shadow-sm',
      bordered: 'bg-bg-elevated border-2 border-border-strong rounded-xl',
      elevated: 'bg-bg-elevated border border-border rounded-xl shadow-md',
      flat: 'bg-bg-elevated rounded-xl',
      // Document frame variant — official government style
      document: 'bg-document-bg border-2 border-document-frame rounded-official shadow-sm relative overflow-hidden',
      // Official variant — subtle gold accent
      official: 'bg-bg-elevated border border-border rounded-xl shadow-sm border-l-4 border-l-accent',
    }

    const watermarkClass = watermark ? 'document-watermark' : ''

    const interactiveStyles = hoverable
      ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer'
      : clickable
        ? 'hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer'
        : ''

    return (
      <div
        ref={ref}
        className={cn('p-6', variantStyles[variant], watermarkClass, interactiveStyles, className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
  withCorner?: boolean
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', withCorner = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', withCorner && 'document-corner pl-4', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
)

CardBody.displayName = 'CardBody'

interface CardFooterProps {
  children: React.ReactNode
  className?: string
  official?: boolean
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', official = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-4 pt-4 border-t border-border flex items-center justify-between',
        official && 'bg-bg-surface -mx-6 -mb-6 px-6 py-3 border-t border-border-strong',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

// Card with action footer
interface InteractiveCardProps extends CardProps {
  actions?: React.ReactNode
}

export const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ children, className = '', actions, ...props }, ref) => (
    <Card ref={ref} className={cn('group', className)} clickable {...props}>
      {children}
      {actions && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </Card>
  )
)

InteractiveCard.displayName = 'InteractiveCard'

// Stats Card — Government style for data display
interface StatsCardProps {
  value: string | number
  label: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  color?: 'primary' | 'accent' | 'green' | 'amber' | 'red'
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ value, label, change, changeLabel, icon, className = '', color = 'primary' }, ref) => {
    const colorStyles = {
      primary: 'border-l-primary',
      accent: 'border-l-accent',
      green: 'border-l-green',
      amber: 'border-l-amber',
      red: 'border-l-red',
    }

    const changeColor = change && change > 0 ? 'text-green' : change && change < 0 ? 'text-red' : 'text-text-secondary'

    return (
      <div
        ref={ref}
        className={cn(
          'stats-card-official border-l-4',
          colorStyles[color],
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="stats-value tabular-nums">{value}</div>
            <div className="stats-label">{label}</div>
            {(change !== undefined || changeLabel) && (
              <div className="mt-2 text-sm font-medium flex items-center gap-2">
                {change !== undefined && (
                  <span className={changeColor}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                )}
                {changeLabel && <span className="text-text-tertiary">{changeLabel}</span>}
              </div>
            )}
          </div>
          {icon && (
            <div className="text-text-tertiary opacity-50">
              {icon}
            </div>
          )}
        </div>
      </div>
    )
  }
)

StatsCard.displayName = 'StatsCard'
