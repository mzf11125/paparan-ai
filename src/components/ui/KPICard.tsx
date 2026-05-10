import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AnimatedCounter } from './AnimatedCounter'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  color?: 'primary' | 'gold' | 'success' | 'warning' | 'error'
  className?: string
  sparkline?: number[]
}

const COLOR_MAP = {
  primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary', glow: 'hover:shadow-glow-primary' },
  gold:    { text: 'text-gold',    bg: 'bg-gold/10',    border: 'border-l-gold',    glow: 'hover:shadow-glow-gold' },
  success: { text: 'text-success', bg: 'bg-success/10', border: 'border-l-success', glow: 'hover:shadow-glow-success' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning', glow: '' },
  error:   { text: 'text-error',   bg: 'bg-error/10',   border: 'border-l-error',   glow: '' },
  accent:  { text: 'text-accent',  bg: 'bg-accent/10',  border: 'border-l-accent',  glow: 'hover:shadow-glow-accent' },
}

export function KPICard({
  title, value, subtitle, change, changeLabel,
  icon: Icon, color = 'primary', className = '', sparkline,
}: KPICardProps) {
  const { text, bg, border, glow } = COLOR_MAP[color as keyof typeof COLOR_MAP] ?? COLOR_MAP.primary
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const numericValue = typeof value === 'number' ? value : null

  return (
    <div className={cn(
      'surface-card p-4 border-l-4 card-lift transition-all duration-200',
      border, glow, className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-secondary font-ui uppercase tracking-wide mb-1">{title}</p>
          <div className={cn('text-2xl font-bold tabular-nums font-mono animate-count-up', text)}>
            {numericValue !== null
              ? <AnimatedCounter value={numericValue} duration={700} />
              : value
            }
          </div>
          {subtitle && <p className="text-xs text-text-tertiary font-ui mt-1">{subtitle}</p>}

          {change !== undefined && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 text-xs font-semibold font-ui animate-count-up',
              isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-text-secondary'
            )} style={{ animationDelay: '150ms' }}>
              {isPositive ? <TrendingUp className="w-3 h-3" />
                : isNegative ? <TrendingDown className="w-3 h-3" />
                : <Minus className="w-3 h-3" />}
              {isPositive ? '+' : ''}{change}
              {changeLabel && <span className="text-text-tertiary font-normal ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
            <Icon className={cn('w-5 h-5', text)} />
          </div>
        )}
      </div>

      {/* Sparkline with gradient fill */}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 h-8">
          <MiniSparkline data={sparkline} colorClass={text} />
        </div>
      )}
    </div>
  )
}

function MiniSparkline({ data, colorClass }: { data: number[]; colorClass: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 100 / (data.length - 1)

  const pts = data.map((v, i) => ({
    x: i * w,
    y: 100 - ((v - min) / range) * 90,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} 100 L 0 100 Z`

  const gradId = `spark-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('w-full h-full', colorClass)}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// Stats row — horizontal strip of KPI cards
interface StatItem {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  color?: KPICardProps['color']
}

export function StatsRow({ stats, className = '' }: { stats: StatItem[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map(stat => (
        <KPICard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

// Sparkline card variant
export function SparklineCard({
  title, value, change, data, color = 'primary', className = '',
}: {
  title: string; value: string | number; change?: number; data: number[]; color?: KPICardProps['color']; className?: string
}) {
  return (
    <KPICard
      title={title}
      value={value}
      change={change}
      color={color}
      sparkline={data}
      className={className}
    />
  )
}
