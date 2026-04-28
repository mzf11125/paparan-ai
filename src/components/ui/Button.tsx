import React from 'react'
import { Loader2, LucideIcon } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'official'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  children: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

    const variantStyles = {
      // Navy primary button — government style
      primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm border border-transparent',
      // Gold secondary button — for emphasis
      secondary: 'border-2 border-accent text-accent hover:bg-accent/10',
      // Outline button — subtle
      outline: 'border border-border-strong text-text hover:bg-bg-surface hover:border-primary hover:text-primary',
      // Ghost button — minimal
      ghost: 'text-text-secondary hover:bg-bg-surface hover:text-text',
      // Danger button — for destructive actions
      danger: 'bg-red text-white hover:bg-red/90 shadow-sm border border-transparent',
      // Official button — document style with subtle border
      official: 'bg-primary/95 text-white border border-primary/80 hover:bg-primary hover:border-primary shadow-sm rounded-official',
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-lg',
      md: 'px-6 py-2.5 text-base rounded-lg',
      lg: 'px-8 py-3 text-lg rounded-lg',
      icon: 'p-2 rounded-lg',
    }

    const iconSize = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
      icon: 'w-5 h-5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSize[size])} />
        ) : LeftIcon ? (
          <LeftIcon className={iconSize[size]} />
        ) : null}
        {children && (
          <span className={isLoading ? 'opacity-70' : ''}>{children}</span>
        )}
        {!isLoading && RightIcon && <RightIcon className={iconSize[size]} />}
      </button>
    )
  }
)

Button.displayName = 'Button'

// IconButton convenience component
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon
  label: string
  tooltip?: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, tooltip, size = 'md', className = '', ...props }, ref) => {
    const button = (
      <Button
        ref={ref}
        size="icon"
        variant="ghost"
        className={cn('aspect-square', className)}
        aria-label={label}
        {...props}
      >
        <Icon className="w-5 h-5" />
      </Button>
    )

    if (tooltip) {
      return (
        <div className="group relative inline-block">
          {button}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-navy-dark rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {tooltip}
          </span>
        </div>
      )
    }

    return button
  }
)

IconButton.displayName = 'IconButton'
