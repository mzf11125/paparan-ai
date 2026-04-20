import React from 'react'
import { Loader2, LucideIcon } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
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
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

    const variantStyles = {
      primary: 'bg-accent text-white hover:bg-accent-dark active:scale-[0.98] shadow-md hover:shadow-lg',
      secondary: 'border-2 border-accent text-accent hover:bg-accent/10 active:scale-[0.98]',
      outline: 'border border-border-strong text-text hover:bg-gray-50 active:scale-[0.98] hover:border-accent hover:text-accent',
      ghost: 'text-text-secondary hover:bg-gray-100 hover:text-text active:scale-[0.98]',
      danger: 'bg-red text-white hover:bg-red/90 active:scale-[0.98] shadow-md',
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-radius-lg',
      md: 'px-6 py-2.5 text-base rounded-radius-full',
      lg: 'px-8 py-3 text-lg rounded-radius-full',
      icon: 'p-2 rounded-radius-lg',
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
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {tooltip}
          </span>
        </div>
      )
    }

    return button
  }
)

IconButton.displayName = 'IconButton'
