import { useState, useEffect, useRef } from 'react'
import { Globe } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/formatters'

interface RegionData {
  region: string
  count: number
  color?: string
  category?: 'americas' | 'emea' | 'apac' | 'global'
  change?: number
}

interface RegionOverviewProps {
  regions: RegionData[]
  className?: string
  onRegionClick?: (region: string) => void
  viewMode?: 'progress' | 'compact' | 'grid'
  animated?: boolean
}

const defaultRegionColors: Record<string, string> = {
  'APAC': '#3B82F6',
  'EMEA': '#10B981',
  'Americas': '#F59E0B',
  'ASEAN': '#8B5CF6',
  'Global': '#6B7280',
}

const categoryColors: Record<string, string> = {
  'americas': '#F59E0B',
  'emea': '#10B981',
  'apac': '#3B82F6',
  'global': '#6B7280',
}

export function RegionOverview({
  regions,
  className = '',
  onRegionClick,
  viewMode = 'progress',
  animated = true,
}: RegionOverviewProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({})
  const navigate = useNavigate()
  const hasMounted = useRef(false)

  const maxCount = Math.max(...regions.map((r) => r.count), 1)

  // Animate progress bars on mount
  useEffect(() => {
    if (animated && !hasMounted.current) {
      hasMounted.current = true
      regions.forEach((region) => {
        setTimeout(() => {
          setAnimatedValues((prev) => ({
            ...prev,
            [region.region]: region.count,
          }))
        }, 50)
      })
    }
  }, [regions, animated])

  const handleRegionClick = (region: string) => {
    if (onRegionClick) {
      onRegionClick(region)
    } else {
      navigate(`/briefs?region=${encodeURIComponent(region)}`)
    }
  }

  const getRegionColor = (region: RegionData) => {
    if (region.color) return region.color
    if (region.category) return categoryColors[region.category]
    return defaultRegionColors[region.region] || '#6B7280'
  }

  return (
    <div className={cn('bg-bg-elevated border border-border rounded-radius-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-text flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          Regions Overview
        </h3>
        <div className="text-sm text-text-tertiary">
          {regions.reduce((sum, r) => sum + r.count, 0)} briefs
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'progress' && (
          <div className="space-y-4">
            {regions.map((region) => {
              const percentage = (region.count / maxCount) * 100
              const color = getRegionColor(region)
              const isHovered = hoveredRegion === region.region
              const currentValue = animatedValues[region.region] || 0
              const animatedPercentage = (currentValue / maxCount) * 100

              return (
                <div key={region.region}>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => handleRegionClick(region.region)}
                      className={cn(
                        'text-sm font-medium transition-colors text-left hover:text-accent flex items-center gap-2',
                        isHovered ? 'text-accent' : 'text-text'
                      )}
                      onMouseEnter={() => setHoveredRegion(region.region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {region.region}
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'text-sm font-medium transition-colors',
                        isHovered ? 'text-accent' : 'text-text-tertiary'
                      )}>
                        {region.count} briefs
                      </span>
                      {region.change !== undefined && (
                        <span className={cn(
                          'text-xs font-medium',
                          region.change > 0 ? 'text-green' : region.change < 0 ? 'text-red' : 'text-text-tertiary'
                        )}>
                          {region.change > 0 && '+'}{region.change}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden group">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out relative"
                      style={{
                        width: `${animatedPercentage}%`,
                        backgroundColor: color,
                      }}
                    >
                      {/* Shine effect on hover */}
                      <div className={cn(
                        'absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity',
                        isHovered ? 'opacity-100' : 'opacity-0'
                      )} />
                    </div>
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap animate-fade-in">
                        {Math.round(percentage)}% of total
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'compact' && (
          <div className="space-y-1">
            {regions.map((region) => {
              const color = getRegionColor(region)
              const percentage = Math.round((region.count / maxCount) * 100)

              return (
                <Link
                  key={region.region}
                  to={`/briefs?region=${encodeURIComponent(region.region)}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                      {region.region}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-tertiary">{percentage}%</span>
                    <span className="text-sm font-medium text-text">{region.count}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-3">
            {regions.map((region) => {
              const color = getRegionColor(region)
              const percentage = Math.round((region.count / maxCount) * 100)

              return (
                <button
                  key={region.region}
                  onClick={() => handleRegionClick(region.region)}
                  className={cn(
                    'p-4 rounded-lg border transition-all duration-200 text-left',
                    'hover:shadow-md hover:-translate-y-0.5',
                    'border-border hover:border-accent'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-text">{region.region}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-display font-bold text-text">
                      {region.count}
                    </span>
                    <span className="text-sm text-text-tertiary">{percentage}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      {viewMode === 'progress' && (
        <div className="px-6 py-3 border-t border-border bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
            <span className="font-medium">Categories:</span>
            {Object.entries(defaultRegionColors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Mini region card for compact display
interface MiniRegionCardProps {
  region: string
  count: number
  color?: string
  onClick?: () => void
  className?: string
}

export function MiniRegionCard({
  region,
  count,
  color = '#C8A96A',
  onClick,
  className = '',
}: MiniRegionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-bg-elevated border border-border rounded-lg transition-all duration-200',
        'hover:shadow-md hover:border-accent',
        className
      )}
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-text">{region}</p>
      </div>
      <span className="text-lg font-display font-semibold text-accent">{count}</span>
    </button>
  )
}

// Region selector for filters
interface RegionSelectorProps {
  regions: string[]
  selected?: string[]
  onChange: (regions: string[]) => void
  className?: string
}

export function RegionSelector({
  regions,
  selected = [],
  onChange,
  className = '',
}: RegionSelectorProps) {
  const toggleRegion = (region: string) => {
    if (selected.includes(region)) {
      onChange(selected.filter((r) => r !== region))
    } else {
      onChange([...selected, region])
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {regions.map((region) => {
        const isSelected = selected.includes(region)
        const color = defaultRegionColors[region] || '#6B7280'

        return (
          <button
            key={region}
            onClick={() => toggleRegion(region)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
              'border',
              isSelected
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-tertiary hover:border-accent/50 hover:text-text'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                isSelected ? 'bg-accent' : 'opacity-50'
              )}
              style={{ backgroundColor: isSelected ? undefined : color }}
            />
            {region}
          </button>
        )
      })}
    </div>
  )
}

// Region stat summary
interface RegionStatsProps {
  regions: RegionData[]
  className?: string
}

export function RegionStats({ regions, className = '' }: RegionStatsProps) {
  const totalBriefs = regions.reduce((sum, r) => sum + r.count, 0)
  const topRegion = regions.reduce((max, r) => r.count > max.count ? r : max, regions[0])

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-wide">Total Briefs</p>
        <p className="text-2xl font-display font-bold text-text">{totalBriefs}</p>
      </div>
      <div className="w-px h-10 bg-border" />
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-wide">Top Region</p>
        <p className="text-lg font-semibold text-accent">{topRegion.region}</p>
      </div>
      <div className="w-px h-10 bg-border" />
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-wide">Regions</p>
        <p className="text-lg font-semibold text-text">{regions.length}</p>
      </div>
    </div>
  )
}
