import React from 'react'
import { cn } from '@/utils/formatters'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'bordered' | 'elevated' | 'flat'
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', hoverable = false, clickable = false, onClick, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-bg-elevated border border-border rounded-radius-xl shadow-sm',
      bordered: 'bg-bg-elevated border-2 border-border-strong rounded-radius-xl',
      elevated: 'bg-bg-elevated border border-border rounded-radius-xl shadow-md',
      flat: 'bg-bg-elevated rounded-radius-xl',
    }

    const interactiveStyles = hoverable
      ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
      : clickable
        ? 'hover:border-accent hover:shadow-md transition-all duration-200 cursor-pointer group'
        : ''

    return (
      <div
        ref={ref}
        className={cn('p-6', variantStyles[variant], interactiveStyles, className)}
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
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
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
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-border flex items-center justify-between', className)} {...props}>
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
    <Card ref={ref} className={cn('group', className)} {...props}>
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
