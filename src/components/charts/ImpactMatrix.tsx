import { useMemo } from 'react'
import { cn } from '@/utils/cn'
import { Delta, Impact } from '@/types/paparan'
import { TrendingUp, AlertCircle, CheckCircle, Minus } from 'lucide-react'

/* ============================================
   IMPACT MATRIX — Impact vs Delta Scatter Plot
   Quadrant analysis for brief prioritization
   ============================================ */

interface MatrixPoint {
  id: string
  title: string
  delta: Delta
  impact: Impact
  region: string
  briefId: string
}

interface ImpactMatrixProps {
  points: MatrixPoint[]
  onPointClick?: (point: MatrixPoint) => void
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export function ImpactMatrix({
  points,
  onPointClick,
  size = 'md',
  showLabels = true,
  className = '',
}: ImpactMatrixProps) {
  // Calculate quadrant counts
  const quadrants = useMemo(() => {
    return {
      critical: points.filter((p) => p.impact === 'HIGH' && p.delta === 'ESCALATED').length,
      priority: points.filter((p) => p.impact === 'HIGH' && p.delta !== 'ESCALATED').length,
      monitoring: points.filter((p) => p.impact === 'MEDIUM').length,
      stable: points.filter((p) => p.impact === 'LOW').length,
    }
  }, [points])

  const sizeStyles = {
    sm: { width: 300, height: 300 },
    md: { width: 400, height: 400 },
    lg: { width: 500, height: 500 },
  }

  // Position points on the matrix
  const getPosition = (point: MatrixPoint) => {
    const impactValue = point.impact === 'HIGH' ? 0.85 : point.impact === 'MEDIUM' ? 0.5 : 0.15
    const deltaValue = point.delta === 'ESCALATED' ? 0.85 : point.delta === 'UPDATED' ? 0.5 : 0.15
    return { x: deltaValue * 100, y: 100 - impactValue * 100 }
  }

  const getColor = (point: MatrixPoint) => {
    if (point.impact === 'HIGH' && point.delta === 'ESCALATED') return 'bg-red-500'
    if (point.impact === 'HIGH') return 'bg-orange-500'
    if (point.delta === 'ESCALATED') return 'bg-amber-500'
    return 'bg-blue-500'
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Matrix */}
      <div
        className="relative bg-white dark:bg-bg-elevated rounded-xl border border-border p-4"
        style={sizeStyles[size]}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-border/50" strokeDasharray="4 4" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" className="text-border/50" strokeDasharray="4 4" />
        </svg>

        {/* Quadrant labels */}
        {showLabels && (
          <>
            <div className="absolute top-2 left-2 text-xs font-semibold text-red-500">
              CRITICAL
              <span className="block text-text-tertiary font-normal">High Impact + Escalated</span>
            </div>
            <div className="absolute top-2 right-2 text-xs font-semibold text-orange-500 text-right">
              PRIORITY
              <span className="block text-text-tertiary font-normal">High Impact</span>
            </div>
            <div className="absolute bottom-2 left-2 text-xs font-semibold text-amber-500">
              MONITORING
              <span className="block text-text-tertiary font-normal">Escalated</span>
            </div>
            <div className="absolute bottom-2 right-2 text-xs font-semibold text-blue-500 text-right">
              STABLE
              <span className="block text-text-tertiary font-normal">Low Impact</span>
            </div>
          </>
        )}

        {/* Axis labels */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-text-tertiary">
          Change Velocity →
        </div>
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-text-tertiary">
          Impact Level →
        </div>

        {/* Points */}
        {points.map((point) => {
          const pos = getPosition(point)
          const color = getColor(point)

          return (
            <button
              key={point.id}
              onClick={() => onPointClick?.(point)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={`${point.title}\n${point.region}\nImpact: ${point.impact} | Delta: ${point.delta}`}
            >
              {/* Point with shadow */}
              <div className={cn('w-4 h-4 rounded-full shadow-lg', color)} />
              {/* Pulse effect for critical points */}
              {point.impact === 'HIGH' && point.delta === 'ESCALATED' && (
                <div className={cn('absolute inset-0 rounded-full animate-ping opacity-50', color)} />
              )}
            </button>
          )
        })}

        {/* Empty state */}
        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
            <div className="text-center">
              <Minus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data to display</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-8 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-text-secondary">Critical ({quadrants.critical})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-text-secondary">Priority ({quadrants.priority})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-text-secondary">Monitoring ({quadrants.monitoring})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-text-secondary">Stable ({quadrants.stable})</span>
        </div>
      </div>
    </div>
  )
}

/* ============================================
   IMPACT DISTRIBUTION — Visual Bar Chart
   Shows distribution of impact levels
   ============================================ */

interface ImpactDistributionProps {
  data: Record<Impact, number>
  showDelta?: boolean
  deltaData?: Record<Delta, number>
  className?: string
}

export function ImpactDistribution({
  data,
  showDelta = false,
  deltaData,
  className = '',
}: ImpactDistributionProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0)

  const impactConfig = {
    HIGH: {
      label: 'High Impact',
      color: 'bg-red-500',
      bgLight: 'bg-red-light/20',
      text: 'text-red',
      icon: AlertCircle,
    },
    MEDIUM: {
      label: 'Medium Impact',
      color: 'bg-amber-500',
      bgLight: 'bg-amber-light/20',
      text: 'text-amber',
      icon: TrendingUp,
    },
    LOW: {
      label: 'Low Impact',
      color: 'bg-green-500',
      bgLight: 'bg-green-light/20',
      text: 'text-green',
      icon: CheckCircle,
    },
  }

  return (
    <div className={cn('bg-white dark:bg-bg-elevated rounded-xl border border-border p-4', className)}>
      <h3 className="font-semibold text-text mb-4">Impact Distribution</h3>

      <div className="space-y-3">
        {(['HIGH', 'MEDIUM', 'LOW'] as Impact[]).map((impact) => {
          const config = impactConfig[impact]
          const count = data[impact] || 0
          const percent = total > 0 ? (count / total) * 100 : 0
          const Icon = config.icon

          return (
            <div key={impact} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', config.text)} />
                  <span className="font-medium text-text">{config.label}</span>
                </div>
                <span className={cn('font-mono font-bold', config.text)}>
                  {count} <span className="text-text-tertiary text-xs">({percent.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', config.color)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Delta breakdown */}
      {showDelta && deltaData && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Delta Status
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(['NEW', 'UPDATED', 'ESCALATED', 'DE-ESCALATED'] as Delta[]).map((delta) => {
              const count = deltaData[delta] || 0
              if (count === 0) return null

              const deltaClasses = {
                NEW: 'bg-purple-light/20 text-purple border-purple/20',
                UPDATED: 'bg-blue-light/20 text-blue border-blue/20',
                ESCALATED: 'bg-red-light/20 text-red border-red/20',
                'DE-ESCALATED': 'bg-green-light/20 text-green border-green/20',
              }

              return (
                <div
                  key={delta}
                  className={cn('flex items-center justify-between px-3 py-2 rounded-lg border', deltaClasses[delta])}
                >
                  <span className="text-xs font-medium">{delta}</span>
                  <span className="font-mono font-bold text-sm">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================
   IMPACT HEATMAP — Country x Impact Matrix
   Shows impact levels by country
   ============================================ */

interface HeatmapData {
  country: string
  countryCode: string
  high: number
  medium: number
  low: number
}

interface ImpactHeatmapProps {
  data: HeatmapData[]
  onCountryClick?: (countryCode: string) => void
  className?: string
}

export function ImpactHeatmap({
  data,
  onCountryClick,
  className = '',
}: ImpactHeatmapProps) {
  const maxTotal = Math.max(...data.map((d) => d.high + d.medium + d.low), 1)

  return (
    <div className={cn('bg-white dark:bg-bg-elevated rounded-xl border border-border p-4', className)}>
      <h3 className="font-semibold text-text mb-4">Impact by Country</h3>

      <div className="space-y-2">
        {data.map((item) => {
          const total = item.high + item.medium + item.low
          const widthPercent = (total / maxTotal) * 100

          return (
            <button
              key={item.countryCode}
              onClick={() => onCountryClick?.(item.countryCode)}
              className="w-full flex items-center gap-3 text-left hover:bg-bg-surface rounded-lg p-2 transition-colors"
            >
              <div className="w-24 text-sm font-medium text-text truncate">{item.country}</div>
              <div className="flex-1 h-6 bg-bg-surface rounded overflow-hidden flex">
                {item.high > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${(item.high / total) * widthPercent}%` }}
                    title={`${item.high} high impact`}
                  />
                )}
                {item.medium > 0 && (
                  <div
                    className="bg-amber-500"
                    style={{ width: `${(item.medium / total) * widthPercent}%` }}
                    title={`${item.medium} medium impact`}
                  />
                )}
                {item.low > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ width: `${(item.low / total) * widthPercent}%` }}
                    title={`${item.low} low impact`}
                  />
                )}
              </div>
              <div className="w-12 text-right text-sm font-mono text-text-tertiary">{total}</div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Low</span>
        </div>
      </div>
    </div>
  )
}
