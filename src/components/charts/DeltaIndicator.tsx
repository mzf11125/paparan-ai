import { useState } from 'react'
import { Delta, Impact } from '@/types/paparan'
import { cn } from '@/utils/cn'
import { AlertTriangle, TrendingUp, Zap, Shield, ChevronDown } from 'lucide-react'

/* ============================================
   DELTA INDICATOR — Delta Status Visualization
   Animated badges with pulse effects
   ============================================ */

interface DeltaIndicatorProps {
  delta: Delta
  impact?: Impact
  count?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'card' | 'minimal'
  showTrend?: boolean
  className?: string
}

export function DeltaIndicator({
  delta,
  impact,
  count,
  showCount = false,
  size = 'md',
  variant = 'badge',
  showTrend = true,
  className = '',
}: DeltaIndicatorProps) {
  const [expanded, setExpanded] = useState(false)

  const deltaConfig = {
    NEW: {
      label: 'NEW',
      description: 'New intelligence report',
      color: 'bg-purple-500',
      bgLight: 'bg-purple-light/20',
      text: 'text-purple',
      border: 'border-purple/20',
      icon: Zap,
      trend: 'new',
    },
    UPDATED: {
      label: 'UPDATED',
      description: 'Existing report updated',
      color: 'bg-blue-500',
      bgLight: 'bg-blue-light/20',
      text: 'text-blue',
      border: 'border-blue/20',
      icon: TrendingUp,
      trend: 'updated',
    },
    ESCALATED: {
      label: 'ESCALATED',
      description: 'Significant development detected',
      color: 'bg-red-500',
      bgLight: 'bg-red-light/20',
      text: 'text-red',
      border: 'border-red/20',
      icon: AlertTriangle,
      trend: 'escalated',
    },
    'DE-ESCALATED': {
      label: 'DE-ESCALATED',
      description: 'Situation stabilizing',
      color: 'bg-green-500',
      bgLight: 'bg-green-light/20',
      text: 'text-green',
      border: 'border-green/20',
      icon: Shield,
      trend: 'de-escalated',
    },
  }

  const config = deltaConfig[delta]
  const Icon = config.icon

  // Minimal variant (small dot)
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2',
          className
        )}
        title={`${config.label}: ${config.description}`}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            delta === 'ESCALATED' && 'animate-ping',
            config.color
          )}
        />
        <span className={cn('text-xs font-medium', config.text)}>
          {config.label}
        </span>
      </div>
    )
  }

  // Card variant (larger with details)
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-4 transition-all duration-200',
          config.bgLight,
          config.border,
          delta === 'ESCALATED' && 'shadow-lg shadow-red-500/10',
          className
        )}
      >
        {/* Animated corner accent for escalated */}
        {delta === 'ESCALATED' && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full" />
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgLight)}>
              <Icon className={cn('w-5 h-5', config.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-bold uppercase tracking-wider', config.text)}>
                  {config.label}
                </span>
                {showCount && count !== undefined && (
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', config.bgLight, config.text)}>
                    {count}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{config.description}</p>
            </div>
          </div>

          {/* Impact indicator */}
          {impact && (
            <div className="text-right">
              <div className="text-xs text-text-tertiary">Impact</div>
              <div className={cn(
                'text-sm font-bold uppercase',
                impact === 'HIGH' && 'text-red-500',
                impact === 'MEDIUM' && 'text-amber-500',
                impact === 'LOW' && 'text-green-500'
              )}>
                {impact}
              </div>
            </div>
          )}
        </div>

        {/* Expandable details */}
        {showTrend && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-text-secondary hover:text-text transition-colors w-full"
          >
            <span>View details</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>
    )
  }

  // Badge variant (default)
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-xs',
    lg: 'px-3 py-2 text-sm',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
        sizeStyles[size],
        config.bgLight,
        config.border,
        delta === 'ESCALATED' && 'shadow-md shadow-red-500/10',
        className
    )}
      title={`${config.label}: ${config.description}`}
    >
      {/* Animated indicator for escalated */}
      {delta === 'ESCALATED' && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.color)} />
      )}

      <Icon className={cn('w-3.5 h-3.5', config.text)} />

      <span className={cn('font-semibold uppercase tracking-wider', config.text)}>
        {config.label}
      </span>

      {showCount && count !== undefined && (
        <>
          <span className={cn('w-px h-3 bg-current/20')} />
          <span className={cn('font-mono font-bold', config.text)}>{count}</span>
        </>
      )}

      {impact && (
        <>
          <span className={cn('w-px h-3 bg-current/20')} />
          <span className={cn(
            'text-xs font-bold',
            impact === 'HIGH' && 'text-red-500',
            impact === 'MEDIUM' && 'text-amber-500',
            impact === 'LOW' && 'text-green-500'
          )}>
            {impact.charAt(0)}
          </span>
        </>
      )}
    </div>
  )
}

/* ============================================
   DELTA SUMMARY CARD — Aggregate Delta Display
   Shows summary of all delta statuses
   ============================================ */

interface DeltaSummary {
  new: number
  updated: number
  escalated: number
  deescalated: number
}

interface DeltaSummaryCardProps {
  summary: DeltaSummary
  timeframe?: string
  showTrend?: boolean
  className?: string
}

export function DeltaSummaryCard({
  summary,
  timeframe = '24h',
  showTrend = true,
  className = '',
}: DeltaSummaryCardProps) {
  const total = summary.new + summary.updated + summary.escalated + summary.deescalated
  const escalatedPercent = total > 0 ? (summary.escalated / total) * 100 : 0

  return (
    <div className={cn('bg-white dark:bg-bg-elevated rounded-xl border border-border p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text">Delta Summary</h3>
          <p className="text-xs text-text-tertiary">Last {timeframe}</p>
        </div>
        {escalatedPercent > 10 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-light/20 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-500">
              {escalatedPercent.toFixed(0)}% escalated
            </span>
          </div>
        )}
      </div>

      {/* Delta Grid */}
      <div className="grid grid-cols-2 gap-3">
        <DeltaStatCard
          delta="NEW"
          count={summary.new}
          total={total}
          color="purple"
        />
        <DeltaStatCard
          delta="UPDATED"
          count={summary.updated}
          total={total}
          color="blue"
        />
        <DeltaStatCard
          delta="ESCALATED"
          count={summary.escalated}
          total={total}
          color="red"
          highlight
        />
        <DeltaStatCard
          delta="DE-ESCALATED"
          count={summary.deescalated}
          total={total}
          color="green"
        />
      </div>

      {/* Progress bar */}
      {showTrend && total > 0 && (
        <div className="mt-4">
          <div className="flex h-2 rounded-full overflow-hidden bg-bg-surface">
            {summary.new > 0 && (
              <div
                className="bg-purple-500"
                style={{ width: `${(summary.new / total) * 100}%` }}
              />
            )}
            {summary.updated > 0 && (
              <div
                className="bg-blue-500"
                style={{ width: `${(summary.updated / total) * 100}%` }}
              />
            )}
            {summary.escalated > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(summary.escalated / total) * 100}%` }}
              />
            )}
            {summary.deescalated > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(summary.deescalated / total) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DeltaStatCardProps {
  delta: Delta
  count: number
  total: number
  color: 'purple' | 'blue' | 'red' | 'green'
  highlight?: boolean
}

function DeltaStatCard({ delta, count, total, color, highlight }: DeltaStatCardProps) {
  const percent = total > 0 ? (count / total) * 100 : 0

  const colorClasses = {
    purple: 'bg-purple-light/20 text-purple border-purple/20',
    blue: 'bg-blue-light/20 text-blue border-blue/20',
    red: 'bg-red-light/20 text-red border-red/20',
    green: 'bg-green-light/20 text-green border-green/20',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-3 transition-all duration-200',
        colorClasses[color],
        highlight && 'shadow-md',
        highlight && color === 'red' && 'animate-pulse-slow'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {delta === 'DE-ESCALATED' ? 'De-escalated' : delta}
          </div>
          <div className="text-2xl font-bold mt-1">{count}</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-60">{percent.toFixed(0)}%</div>
        </div>
      </div>

      {/* Background indicator */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1',
          color === 'purple' && 'bg-purple-500',
          color === 'blue' && 'bg-blue-500',
          color === 'red' && 'bg-red-500',
          color === 'green' && 'bg-green-500'
        )}
        style={{ width: `${Math.max(percent, 5)}%` }}
      />
    </div>
  )
}
