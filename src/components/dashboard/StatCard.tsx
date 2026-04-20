import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  sparkline?: number[]
  size?: 'default' | 'compact' | 'large'
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  className?: string
  loading?: boolean
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  sparkline,
  size = 'default',
  variant = 'default',
  className = '',
  loading = false,
  onClick,
}: StatCardProps) {
  const TrendIcon = trend && trend.value > 0 ? TrendingUp : trend && trend.value < 0 ? TrendingDown : Minus
  const trendColor = trend && trend.value > 0 ? 'text-green' : trend && trend.value < 0 ? 'text-red' : 'text-text-tertiary'

  const variantStyles = {
    default: 'bg-bg-elevated border border-border',
    accent: 'bg-bg-elevated border-l-4 border-l-accent border-y border-r border-border',
    success: 'bg-bg-elevated border-l-4 border-l-green border-y border-r border-border',
    warning: 'bg-bg-elevated border-l-4 border-l-amber border-y border-r border-border',
    danger: 'bg-bg-elevated border-l-4 border-l-red border-y border-r border-border',
  }

  const iconBgStyles = {
    default: 'bg-accent/10 text-accent',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-green-light text-green',
    warning: 'bg-amber-light text-amber',
    danger: 'bg-red-light text-red',
  }

  if (loading) {
    return <StatCardSkeleton size={size} className={className} />
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-secondary font-medium mb-1">{title}</p>
          <p className={cn(
            'font-display font-bold tracking-tight',
            size === 'compact' ? 'text-2xl' : size === 'large' ? 'text-4xl' : 'text-3xl',
            'text-text'
          )}>
            {value}
          </p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="font-semibold">{Math.abs(trend.value)}%</span>
              <span className="text-text-tertiary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg flex-shrink-0', iconBgStyles[variant])}>
          <Icon className={cn('flex-shrink-0', size === 'compact' ? 'w-5 h-5' : 'w-6 h-6')} />
        </div>
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="mt-4 h-12">
          <Sparkline data={sparkline} color={variant} />
        </div>
      )}
    </>
  )

  return (
    <div
      className={cn(
        'rounded-radius-xl p-6 transition-all duration-200',
        variantStyles[variant],
        onClick && 'hover:shadow-md cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {content}
    </div>
  )
}

// Sparkline component for mini charts
interface SparklineProps {
  data: number[]
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  height?: number
}

const sparkColors = {
  default: '#C8A96A',
  accent: '#C8A96A',
  success: '#2D7A4D',
  warning: '#B8860B',
  danger: '#A83232',
}

function Sparkline({ data, color = 'default', height = 48 }: SparklineProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  const fillPoints = `0,100 ${points} 100,100`

  return (
    <svg
      viewBox={`0 0 100 100`}
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
      style={{ height }}
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={sparkColors[color]} stopOpacity="0.2" />
          <stop offset="100%" stopColor={sparkColors[color]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#gradient-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={sparkColors[color]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* End dot */}
      <circle
        cx="100"
        cy={100 - ((data[data.length - 1] - min) / range) * 100}
        r="3"
        fill={sparkColors[color]}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// Skeleton loading state
interface StatCardSkeletonProps {
  size?: 'default' | 'compact' | 'large'
  className?: string
}

export function StatCardSkeleton({ size = 'default', className = '' }: StatCardSkeletonProps) {
  return (
    <div className={cn('bg-bg-elevated border border-border rounded-radius-xl p-6 animate-pulse', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className={cn(
            'bg-gray-200 rounded',
            size === 'compact' ? 'h-8 w-20' : size === 'large' ? 'h-12 w-32' : 'h-10 w-28'
          )} />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}

// Compact stat card for dashboards
interface CompactStatProps {
  label: string
  value: string | number
  change?: number
  icon?: LucideIcon
  className?: string
}

export function CompactStat({ label, value, change, icon: Icon, className = '' }: CompactStatProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {Icon && (
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="w-4 h-4 text-accent" />
        </div>
      )}
      <div>
        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-display font-semibold text-text">{value}</p>
          {change !== undefined && (
            <span className={cn(
              'text-xs font-medium',
              isPositive ? 'text-green' : isNegative ? 'text-red' : 'text-text-tertiary'
            )}>
              {isPositive && '+'}{change}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat grid for dashboard layouts
interface StatGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function StatGrid({ children, columns = 4, className = '' }: StatGridProps) {
  return (
    <div className={cn(
      'grid gap-6',
      columns === 2 && 'grid-cols-1 sm:grid-cols-2',
      columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  )
}
