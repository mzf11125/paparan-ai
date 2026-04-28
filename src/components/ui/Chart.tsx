import React from 'react'
import { cn } from '@/utils/formatters'

// Chart wrapper with consistent styling
interface ChartWrapperProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function ChartWrapper({ title, subtitle, children, className = '', actions }: ChartWrapperProps) {
  return (
    <div className={cn('bg-bg-elevated border border-border rounded-radius-xl p-6', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="font-display font-semibold text-text">{title}</h3>}
            {subtitle && <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

// Sparkline chart for mini trends
interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  showDots?: boolean
  className?: string
}

export function SparklineChart({
  data,
  height = 40,
  color = '#C8A96A',
  showArea = true,
  showDots = false,
  className = '',
}: SparklineChartProps) {
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
      className={cn('w-full overflow-visible', className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && (
        <polygon
          points={fillPoints}
          fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDots && data.map((_, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((data[index] - min) / range) * 100
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="1.5"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}

// Donut chart for distribution
interface DonutChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  size?: number
  thickness?: number
  showLabels?: boolean
  centerContent?: React.ReactNode
  className?: string
}

const defaultColors = ['#C8A96A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']

export function DonutChart({
  data,
  size = 200,
  thickness = 20,
  showLabels = true,
  centerContent,
  className = '',
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - thickness) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let currentOffset = 0

  const segments = data.map((item, index) => {
    const percentage = item.value / total
    const strokeDasharray = percentage * circumference
    const color = item.color || defaultColors[index % defaultColors.length]

    const segment = (
      <circle
        key={item.label}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={-currentOffset}
        className="transition-all duration-500 ease-out"
      />
    )

    currentOffset += strokeDasharray

    return { ...item, color, percentage, segment }
  })

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((s) => s.segment)}
        </svg>
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent}
          </div>
        )}
      </div>

      {showLabels && (
        <div className="flex flex-col gap-2">
          {segments.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-text-secondary">{item.label}</span>
              <span className="text-sm font-medium text-text">
                {item.value} ({Math.round(item.percentage * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Simple bar chart
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
  showValues?: boolean
  horizontal?: boolean
  className?: string
}

export function BarChart({
  data,
  height = 200,
  showValues = true,
  horizontal = false,
  className = '',
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  if (horizontal) {
    return (
      <div className={cn('space-y-3', className)} style={{ height }}>
        {data.map((item) => {
          const percentage = (item.value / maxValue) * 100
          const color = item.color || '#C8A96A'

          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-text-secondary w-20 text-right flex-shrink-0">
                {item.label}
              </span>
              <div className="flex-1 h-6 bg-bg-surface rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
              {showValues && (
                <span className="text-sm font-medium text-text w-12 flex-shrink-0">
                  {item.value}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((item) => {
        const percentage = (item.value / maxValue) * 100
        const color = item.color || '#C8A96A'

        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
            {showValues && (
              <span className="text-xs font-medium text-text">{item.value}</span>
            )}
            <div className="w-full bg-bg-surface rounded-t-lg overflow-hidden" style={{ height: `${percentage}%` }}>
              <div
                className="w-full h-full rounded-t-lg transition-all duration-500 ease-out"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="text-xs text-text-tertiary truncate w-full text-center">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Progress ring for circular progress
interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#C8A96A',
  label,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(value / max, 1)
  const offset = circumference * (1 - percentage)

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E4DC"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-text">{label}</span>
        </div>
      )}
    </div>
  )
}

// Metric card with mini chart
interface MetricWithChartProps {
  label: string
  value: string | number
  change?: number
  data: number[]
  color?: string
  className?: string
}

export function MetricWithChart({
  label,
  value,
  change,
  data,
  color = '#C8A96A',
  className = '',
}: MetricWithChartProps) {
  return (
    <div className={cn('bg-bg-elevated border border-border rounded-radius-xl p-4', className)}>
      <p className="text-sm text-text-tertiary">{label}</p>
      <div className="flex items-end justify-between mt-2">
        <div>
          <p className="text-2xl font-display font-bold text-text">{value}</p>
          {change !== undefined && (
            <p className={cn(
              'text-sm mt-1',
              change > 0 ? 'text-green' : change < 0 ? 'text-red' : 'text-text-tertiary'
            )}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className="w-24 h-12">
          <SparklineChart data={data} color={color} height={48} />
        </div>
      </div>
    </div>
  )
}
