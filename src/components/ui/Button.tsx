import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className = '', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-paparan-deep text-paparan-cream hover:bg-paparan-sage active:scale-[0.98]',
      secondary: 'border-2 border-paparan-deep text-paparan-deep hover:bg-paparan-deep/5 active:scale-[0.98]',
      outline: 'border-2 border-paparan-sage text-paparan-sage hover:bg-paparan-sage/5 active:scale-[0.98]',
      ghost: 'text-paparan-deep hover:bg-paparan-deep/5',
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-button',
      md: 'px-6 py-2.5 text-base rounded-button',
      lg: 'px-8 py-3 text-lg rounded-button',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
