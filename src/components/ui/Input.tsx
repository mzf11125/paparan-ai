import React from 'react'
import { LucideIcon, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  success?: string
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label, helperText, error, success,
    leftIcon: LeftIcon, rightIcon: RightIcon,
    fullWidth = true, className = '', id, type, ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary font-ui uppercase tracking-wide">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {LeftIcon && (
            <LeftIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'input-base',
              fullWidth && 'w-full',
              LeftIcon && 'pl-9',
              (RightIcon || isPassword || error || success) && 'pr-9',
              error   && 'border-error/50 focus:border-error focus:ring-error/20',
              success && 'border-success/50 focus:border-success focus:ring-success/20',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {error   && <AlertCircle className="w-4 h-4 text-error" />}
            {success && <CheckCircle className="w-4 h-4 text-success" />}
            {isPassword && !error && !success && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-tertiary hover:text-text transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            {RightIcon && !error && !success && !isPassword && (
              <RightIcon className="w-4 h-4 text-text-tertiary" />
            )}
          </div>
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-error font-ui flex items-center gap-1" role="alert">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="text-xs text-success font-ui flex items-center gap-1">
            <CheckCircle className="w-3 h-3 flex-shrink-0" />
            {success}
          </p>
        )}
        {helperText && !error && !success && (
          <p id={`${inputId}-helper`} className="text-xs text-text-tertiary font-ui">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary font-ui uppercase tracking-wide">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'input-base resize-none',
            fullWidth && 'w-full',
            error && 'border-error/50 focus:border-error focus:ring-error/20',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-xs text-error font-ui" role="alert">{error}</p>}
        {helperText && !error && <p className="text-xs text-text-tertiary font-ui">{helperText}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
