import { cn } from '@/utils/formatters'

export interface LogoProps {
  variant?: 'wordmark' | 'icon' | 'compact'
  color?: 'full' | 'monochrome' | 'inverted'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ variant = 'wordmark', color = 'full', size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  }

  const iconSize = {
    sm: 20,
    md: 24,
    lg: 32
  }

  const colors = {
    full: {
      primary: '#C8A96A',
      text: '#2D2D2D'
    },
    monochrome: {
      primary: '#2D2D2D',
      text: '#2D2D2D'
    },
    inverted: {
      primary: '#FFFFFF',
      text: '#FFFFFF'
    }
  }

  const currentColors = colors[color]

  if (variant === 'icon') {
    return (
      <svg
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('flex-shrink-0', className)}
        aria-label="Paparan Brief Logo"
      >
        {/* Stylized letter P with document fold */}
        <rect
          x="4"
          y="2"
          width="24"
          height="28"
          rx="2"
          fill="none"
          stroke={currentColors.primary}
          strokeWidth="2"
        />
        {/* P shape */}
        <path
          d="M12 8V24M12 8H18C20.2091 8 22 9.79086 22 12C22 14.2091 20.2091 16 18 16H12"
          stroke={currentColors.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Document fold */}
        <path
          d="M22 2V8H28"
          stroke={currentColors.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0"
        />
      </svg>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)} style={{ height: sizeClasses[size] }}>
        <svg
          width={iconSize[size]}
          height={iconSize[size]}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
          aria-label="Paparan Brief Logo"
        >
          <rect
            x="4"
            y="2"
            width="24"
            height="28"
            rx="2"
            fill="none"
            stroke={currentColors.primary}
            strokeWidth="2"
          />
          <path
            d="M12 8V24M12 8H18C20.2091 8 22 9.79086 22 12C22 14.2091 20.2091 16 18 16H12"
            stroke={currentColors.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="font-serif font-bold tracking-tight"
          style={{
            color: currentColors.text,
            fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem'
          }}
        >
          Paparan
        </span>
      </div>
    )
  }

  // Wordmark variant (default)
  return (
    <div
      className={cn('flex items-baseline gap-1', className)}
      style={{ height: sizeClasses[size] }}
    >
      <span
        className="font-serif font-bold tracking-tight"
        style={{
          color: currentColors.text,
          fontSize: size === 'sm' ? '1.125rem' : size === 'md' ? '1.5rem' : '2rem'
        }}
      >
        Paparan
      </span>
      <span
        className="font-serif font-normal tracking-tight"
        style={{
          color: currentColors.primary,
          fontSize: size === 'sm' ? '1.125rem' : size === 'md' ? '1.5rem' : '2rem'
        }}
      >
        Brief
      </span>
    </div>
  )
}
