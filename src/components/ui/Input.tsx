import React, { useState } from 'react'
import { LucideIcon, Eye, EyeOff, Check, AlertCircle, Search as SearchIcon } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: string
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  onRightIconClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      size = 'md',
      className = '',
      type,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isShaking, setIsShaking] = useState(false)

    const inputType = type === 'password' && showPassword ? 'text' : type
    const hasError = Boolean(error)
    const hasSuccess = Boolean(success)

    const handleErrorAnimation = () => {
      if (hasError) {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      }
    }

    React.useEffect(() => {
      if (hasError) {
        handleErrorAnimation()
      }
    }, [error])

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    }

    const iconSize = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              <LeftIcon className={iconSize[size]} />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full border rounded-radius-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
              'placeholder:text-text-tertiary',
              'disabled:bg-gray-50 disabled:cursor-not-allowed',
              sizeStyles[size],
              LeftIcon && 'pl-10',
              (RightIcon || type === 'password' || hasError || hasSuccess) && 'pr-10',
              hasError
                ? 'border-red focus:ring-red/50 animate-shake'
                : hasSuccess
                  ? 'border-green focus:ring-green/50'
                  : 'border-border-strong hover:border-accent/50',
              isShaking && 'animate-shake',
              className
            )}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasError && (
              <AlertCircle className={cn('text-red', iconSize[size])} />
            )}
            {hasSuccess && !hasError && (
              <Check className={cn('text-green', iconSize[size])} />
            )}
            {type === 'password' && !hasError && !hasSuccess && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-tertiary hover:text-text transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className={iconSize[size]} /> : <Eye className={iconSize[size]} />}
              </button>
            )}
            {RightIcon && !hasError && !hasSuccess && type !== 'password' && (
              <button
                type="button"
                onClick={onRightIconClick}
                className="text-text-tertiary hover:text-accent transition-colors"
                tabIndex={-1}
              >
                <RightIcon className={iconSize[size]} />
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-1.5 text-sm text-green flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, success, resize = 'none', size = 'md', className = '', ...props }, ref) => {
    const hasError = Boolean(error)
    const hasSuccess = Boolean(success)

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm min-h-[80px]',
      md: 'px-4 py-2.5 text-base min-h-[120px]',
      lg: 'px-5 py-3 text-lg min-h-[160px]',
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full border rounded-radius-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            'placeholder:text-text-tertiary',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            sizeStyles[size],
            hasError
              ? 'border-red focus:ring-red/50'
              : hasSuccess
                ? 'border-green focus:ring-green/50'
                : 'border-border-strong hover:border-accent/50',
            resize === 'none' && 'resize-none',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-1.5 text-sm text-green flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {success}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Search input with clear button
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void
  showClearButton?: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, value, className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={SearchIcon}
        className={className}
        value={value}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'
