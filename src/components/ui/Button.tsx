import React, { useState, useRef } from 'react'
import { Loader2, LucideIcon, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

type ButtonTone = 'neutral' | 'primary' | 'accent' | 'gold' | 'success' | 'error'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'gold' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  isSuccess?: boolean
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  children: React.ReactNode
  fullWidth?: boolean
  ripple?: boolean
  /** Adds a ribbon-shine sweep on hover (use sparingly — hero CTAs only) */
  shine?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary', size = 'md',
    isLoading = false, isSuccess = false,
    leftIcon: LeftIcon, rightIcon: RightIcon,
    children, fullWidth = false, ripple = true, shine = false,
    className = '', disabled, onClick, ...props
  }, ref) => {
    const [rippleCoords, setRippleCoords] = useState<{ x: number; y: number } | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const internalRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || isLoading) return
      const btn = internalRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      setRippleCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setTimeout(() => setRippleCoords(null), 600)
      onClick?.(e)
    }

    const base = cn(
      'inline-flex items-center justify-center gap-2 font-ui font-semibold relative overflow-hidden',
      'transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out',
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      'hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
    )

    const variants = {
      primary:   'bg-primary hover:bg-primary-hover text-white shadow-teal hover:shadow-glow-primary',
      secondary: 'bg-gradient-to-b from-primary/10 to-primary/6 text-primary border border-primary/25 hover:from-primary/18 hover:to-primary/12 hover:border-primary/40 hover:shadow-glow-primary/60',
      accent:    'bg-accent hover:bg-accent-hover text-white hover:shadow-glow-accent',
      outline:   'bg-transparent border border-border-strong text-text-secondary hover:text-text hover:border-border hover:bg-bg-subtle hover:shadow-sm',
      ghost:     'bg-transparent text-text-secondary hover:text-text hover:bg-bg-subtle hover:shadow-sm',
      danger:    'bg-error/10 text-error border border-error/25 hover:bg-error/18 hover:border-error/40',
      gold:      'bg-gold text-bg-elevated hover:bg-gold-hover hover:shadow-glow-gold',
      success:   'bg-success-bright text-white hover:shadow-glow-success',
    }

    const sizes = {
      sm:   'px-3.5 py-1.5 text-xs rounded-lg',
      md:   'px-5 py-2.5 text-sm rounded-lg',
      lg:   'px-7 py-3 text-base rounded-xl',
      icon: 'p-2 rounded-lg',
    }

    const iconSizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5', icon: 'w-4 h-4' }

    return (
      <button
        ref={internalRef}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect — on all solid variants */}
        {rippleCoords && !disabled && !isLoading && (
          <span
            className="absolute rounded-full bg-current/20 animate-ripple pointer-events-none motion-reduce:hidden"
            style={{ left: rippleCoords.x, top: rippleCoords.y, width: 100, height: 100, marginLeft: -50, marginTop: -50 }}
          />
        )}
        {/* Optional shine sweep for hero CTAs */}
        {shine && !isLoading && (
          <span
            className="absolute inset-0 pointer-events-none motion-reduce:hidden"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'ribbonShine 2.8s ease-in-out infinite',
              opacity: 0,
            }}
            aria-hidden="true"
          />
        )}
        {isLoading ? <Loader2 className={cn('animate-spin', iconSizes[size])} />
          : isSuccess ? <Check className={iconSizes[size]} />
          : LeftIcon ? <LeftIcon className={iconSizes[size]} />
          : null}
        {children && <span className={isLoading || isSuccess ? 'opacity-70' : ''}>{children}</span>}
        {!isLoading && !isSuccess && RightIcon && <RightIcon className={iconSizes[size]} />}
      </button>
    )
  }
)
Button.displayName = 'Button'

interface IconButtonProps extends Omit<ButtonProps, 'children' | 'variant'> {
  icon: LucideIcon
  label: string
  tone?: ButtonTone
}

const TONE_HOVER: Record<ButtonTone, string> = {
  neutral: 'hover:bg-bg-subtle hover:text-text',
  primary: 'hover:bg-primary/10 hover:text-primary',
  accent:  'hover:bg-accent/10 hover:text-accent',
  gold:    'hover:bg-gold/10 hover:text-gold',
  success: 'hover:bg-success/10 hover:text-success',
  error:   'hover:bg-error/10 hover:text-error',
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, tone = 'neutral', className = '', ...props }, ref) => {
    const [rippleCoords, setRippleCoords] = useState<{ x: number; y: number } | null>(null)
    const btnRef = useRef<HTMLButtonElement>(null)
    const resolvedRef = (ref as React.RefObject<HTMLButtonElement>) || btnRef

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = resolvedRef.current
      if (!btn || props.disabled) return
      const rect = btn.getBoundingClientRect()
      setRippleCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setTimeout(() => setRippleCoords(null), 600)
      props.onClick?.(e)
    }

    return (
      <button
        ref={resolvedRef}
        aria-label={label}
        title={label}
        className={cn(
          'relative overflow-hidden inline-flex items-center justify-center p-2 rounded-lg',
          'text-text-secondary transition-[transform,box-shadow,background-color,color] duration-150 ease-out',
          'hover:-translate-y-px active:translate-y-0 active:scale-[0.92]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          TONE_HOVER[tone],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {rippleCoords && !props.disabled && (
          <span
            className="absolute rounded-full bg-current/20 animate-ripple pointer-events-none motion-reduce:hidden"
            style={{ left: rippleCoords.x, top: rippleCoords.y, width: 80, height: 80, marginLeft: -40, marginTop: -40 }}
          />
        )}
        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'
