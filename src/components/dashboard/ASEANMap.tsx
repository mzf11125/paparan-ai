import { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { DeltaBadge } from '@/components/ui/DeltaBadge'

/* ============================================
   ASEAN MAP — SVG CHOROPLETH
   Countries colored by classification/risk level
   Enhanced with interactive tooltips and animations
   ============================================ */

const ASEAN_COUNTRIES = [
  { id: 'SGP', name: 'Singapore', fullName: 'Republic of Singapore', path: 'M 385 265 L 392 262 L 398 265 L 395 272 Z', cx: 390, cy: 267 },
  { id: 'MYS', name: 'Malaysia', fullName: 'Malaysia', path: 'M 320 240 L 380 235 L 385 265 L 370 290 L 340 285 L 315 260 Z', cx: 348, cy: 263 },
  { id: 'IDN', name: 'Indonesia', fullName: 'Republic of Indonesia', path: 'M 280 290 L 320 270 L 340 285 L 370 290 L 380 340 L 350 380 L 290 370 L 270 330 Z', cx: 330, cy: 330 },
  { id: 'PHL', name: 'Philippines', fullName: 'Republic of the Philippines', path: 'M 395 220 L 415 225 L 420 240 L 400 245 L 390 235 Z', cx: 405, cy: 232 },
  { id: 'VNM', name: 'Vietnam', fullName: 'Socialist Republic of Vietnam', path: 'M 390 235 L 410 230 L 415 250 L 405 265 L 385 265 L 385 250 Z', cx: 398, cy: 250 },
  { id: 'THA', name: 'Thailand', fullName: 'Kingdom of Thailand', path: 'M 365 250 L 385 250 L 385 265 L 370 290 L 355 270 Z', cx: 372, cy: 268 },
  { id: 'MMR', name: 'Myanmar', fullName: 'Republic of the Union of Myanmar', path: 'M 340 230 L 365 235 L 365 250 L 355 270 L 340 265 L 330 245 Z', cx: 348, cy: 250 },
  { id: 'KHM', name: 'Cambodia', fullName: 'Kingdom of Cambodia', path: 'M 385 265 L 400 260 L 405 275 L 390 280 L 380 270 Z', cx: 392, cy: 270 },
  { id: 'LAO', name: 'Laos', fullName: 'Lao People\'s Democratic Republic', path: 'M 375 245 L 390 235 L 395 250 L 385 265 L 370 255 Z', cx: 383, cy: 252 },
  { id: 'BRN', name: 'Brunei', fullName: 'Nation of Brunei', path: 'M 405 275 L 412 273 L 415 278 L 408 280 Z', cx: 410, cy: 276 },
]

type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
type ClassificationLevel = 'unclassified' | 'official' | 'confidential' | 'secret'
type DeltaType = 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'

interface CountryData {
  briefCount: number
  riskLevel: RiskLevel
  classification?: ClassificationLevel
  lastDelta?: DeltaType
  lastUpdated?: string
  topRiskSnippet?: string
  escalatedCount?: number
}

interface ASEANMapProps {
  data?: Record<string, CountryData>
  onCountryClick?: (countryCode: string) => void
  selectedCountry?: string
  size?: 'sm' | 'md' | 'lg'
  colorBy?: 'risk' | 'classification' | 'delta'
  showTooltips?: boolean
  className?: string
}

export function ASEANMap({
  data = {},
  onCountryClick,
  selectedCountry,
  size = 'md',
  colorBy = 'risk',
  showTooltips = true,
  className,
}: ASEANMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const getCountryColor = (countryCode: string): { fill: string; stroke: string; strokeWidth: number } => {
    const countryData = data[countryCode]
    const isSelected = countryCode === selectedCountry

    if (!countryData) {
      return {
        fill: 'rgba(200, 200, 200, 0.3)',
        stroke: isSelected ? 'var(--color-primary)' : 'rgba(200, 200, 200, 0.5)',
        strokeWidth: isSelected ? 2 : 1,
      }
    }

    // Color by risk level (default)
    if (colorBy === 'risk') {
      switch (countryData.riskLevel) {
        case 'critical':
          return { fill: 'rgba(239, 68, 68, 0.7)', stroke: isSelected ? '#DC2626' : '#EF4444', strokeWidth: isSelected ? 2 : 1 }
        case 'high':
          return { fill: 'rgba(249, 115, 22, 0.6)', stroke: isSelected ? '#EA580C' : '#F97316', strokeWidth: isSelected ? 2 : 1 }
        case 'medium':
          return { fill: 'rgba(234, 179, 8, 0.5)', stroke: isSelected ? '#CA8A04' : '#EAB308', strokeWidth: isSelected ? 2 : 1 }
        case 'low':
          return { fill: 'rgba(34, 197, 94, 0.4)', stroke: isSelected ? '#16A34A' : '#22C55E', strokeWidth: isSelected ? 2 : 1 }
        default:
          return { fill: 'rgba(200, 200, 200, 0.3)', stroke: 'rgba(200, 200, 200, 0.5)', strokeWidth: 1 }
      }
    }

    // Color by classification
    if (colorBy === 'classification') {
      switch (countryData.classification) {
        case 'secret':
          return { fill: 'rgba(239, 68, 68, 0.7)', stroke: isSelected ? '#DC2626' : '#EF4444', strokeWidth: isSelected ? 2 : 1 }
        case 'confidential':
          return { fill: 'rgba(245, 158, 11, 0.6)', stroke: isSelected ? '#D97706' : '#F59E0B', strokeWidth: isSelected ? 2 : 1 }
        case 'official':
          return { fill: 'rgba(59, 130, 246, 0.5)', stroke: isSelected ? '#2563EB' : '#3B82F6', strokeWidth: isSelected ? 2 : 1 }
        case 'unclassified':
          return { fill: 'rgba(34, 197, 94, 0.4)', stroke: isSelected ? '#16A34A' : '#22C55E', strokeWidth: isSelected ? 2 : 1 }
        default:
          return { fill: 'rgba(200, 200, 200, 0.3)', stroke: 'rgba(200, 200, 200, 0.5)', strokeWidth: 1 }
      }
    }

    // Color by delta
    if (colorBy === 'delta') {
      switch (countryData.lastDelta) {
        case 'ESCALATED':
          return { fill: 'rgba(239, 68, 68, 0.7)', stroke: isSelected ? '#DC2626' : '#EF4444', strokeWidth: isSelected ? 2 : 1 }
        case 'UPDATED':
          return { fill: 'rgba(59, 130, 246, 0.5)', stroke: isSelected ? '#2563EB' : '#3B82F6', strokeWidth: isSelected ? 2 : 1 }
        case 'DE-ESCALATED':
          return { fill: 'rgba(34, 197, 94, 0.4)', stroke: isSelected ? '#16A34A' : '#22C55E', strokeWidth: isSelected ? 2 : 1 }
        case 'NEW':
          return { fill: 'rgba(168, 85, 247, 0.5)', stroke: isSelected ? '#9333EA' : '#A855F7', strokeWidth: isSelected ? 2 : 1 }
        default:
          return { fill: 'rgba(200, 200, 200, 0.3)', stroke: 'rgba(200, 200, 200, 0.5)', strokeWidth: 1 }
      }
    }

    return { fill: 'rgba(200, 200, 200, 0.3)', stroke: 'rgba(200, 200, 200, 0.5)', strokeWidth: 1 }
  }

  const sizeStyles = {
    sm: { width: '100%', maxWidth: 400 },
    md: { width: '100%', maxWidth: 600 },
    lg: { width: '100%', maxWidth: 800 },
  }

  const activeCountry = ASEAN_COUNTRIES.find(c => c.id === hoveredCountry || c.id === selectedCountry)

  // Calculate summary stats
  const totalBriefs = useMemo(() => Object.values(data).reduce((sum, d) => sum + d.briefCount, 0), [data])
  const escalatedCount = useMemo(() => Object.values(data).filter(d => d.lastDelta === 'ESCALATED').length, [data])

  return (
    <div className={cn('relative', className)}>
      {/* SVG Map */}
      <svg
        viewBox="255 210 175 185"
        className={cn('w-full h-auto drop-shadow-md', size === 'sm' && 'max-w-md')}
        style={sizeStyles[size]}
      >
        {/* Ocean/Background */}
        <rect
          x="255"
          y="210"
          width="175"
          height="185"
          fill="rgba(59, 130, 246, 0.05)"
          rx="4"
        />

        {/* Grid lines (subtle) */}
        <g stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5">
          <line x1="255" y1="250" x2="430" y2="250" />
          <line x1="255" y1="290" x2="430" y2="290" />
          <line x1="255" y1="330" x2="430" y2="330" />
          <line x1="300" y1="210" x2="300" y2="395" />
          <line x1="345" y1="210" x2="345" y2="395" />
          <line x1="390" y1="210" x2="390" y2="395" />
        </g>

        {/* Countries */}
        {ASEAN_COUNTRIES.map((country) => {
          const isSelected = country.id === selectedCountry
          const isHovered = country.id === hoveredCountry
          const colors = getCountryColor(country.id)

          return (
            <g key={country.id}>
              {/* Country Shape */}
              <path
                d={country.path}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={colors.strokeWidth}
                className={cn(
                  // Base transition
                  'transition-all duration-200 ease-out cursor-pointer',
                  // Hover effects
                  'hover:brightness-110 hover:filter hover:drop-shadow-md',
                  // Active effect
                  'active:scale-95 active:brightness-125',
                  // Selection state
                  isSelected && 'motion-safe:animate-pulse-slow',
                  // Focus ring for accessibility
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
                onMouseEnter={(e) => {
                  setHoveredCountry(country.id)
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
                }}
                onMouseLeave={() => setHoveredCountry(null)}
                onClick={() => onCountryClick?.(country.id)}
              />

              {/* Country Label */}
              {(size === 'lg' || isHovered || isSelected) && (
                <>
                  {/* Label background */}
                  <rect
                    x={country.cx - 12}
                    y={country.cy - 6}
                    width="24"
                    height="12"
                    fill="rgba(0, 0, 0, 0.6)"
                    rx="2"
                  />
                  <text
                    x={country.cx}
                    y={country.cy + 3}
                    className="font-ui text-[10px] font-bold fill-white pointer-events-none"
                    textAnchor="middle"
                  >
                    {country.id}
                  </text>
                </>
              )}

              {/* Escalation pulse indicator */}
              {data[country.id]?.lastDelta === 'ESCALATED' && (
                <circle
                  cx={country.cx}
                  cy={country.cy}
                  r="4"
                  fill="rgba(239, 68, 68, 0.8)"
                  className="animate-ping"
                />
              )}
            </g>
          )
        })}

        {/* Title */}
        <text x="260" y="225" className="font-display text-sm font-semibold fill-text">
          ASEAN Region
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        <span className="font-ui text-xs text-text-secondary">
          {colorBy === 'risk' ? 'Risk Level:' : colorBy === 'classification' ? 'Classification:' : 'Delta Status:'}
        </span>
        {colorBy === 'risk' && ([
          { level: 'low' as RiskLevel, label: 'Low', color: 'rgba(34, 197, 94, 0.6)' },
          { level: 'medium' as RiskLevel, label: 'Medium', color: 'rgba(234, 179, 8, 0.6)' },
          { level: 'high' as RiskLevel, label: 'High', color: 'rgba(249, 115, 22, 0.7)' },
          { level: 'critical' as RiskLevel, label: 'Critical', color: 'rgba(239, 68, 68, 0.8)' },
        ]).map((item) => (
          <div key={item.level} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="font-ui text-xs text-text-tertiary">{item.label}</span>
          </div>
        ))}
        {colorBy === 'classification' && ([
          { level: 'unclassified' as ClassificationLevel, label: 'Public', color: 'rgba(34, 197, 94, 0.6)' },
          { level: 'official' as ClassificationLevel, label: 'Official', color: 'rgba(59, 130, 246, 0.6)' },
          { level: 'confidential' as ClassificationLevel, label: 'Conf.', color: 'rgba(245, 158, 11, 0.7)' },
          { level: 'secret' as ClassificationLevel, label: 'Secret', color: 'rgba(239, 68, 68, 0.8)' },
        ]).map((item) => (
          <div key={item.level} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="font-ui text-xs text-text-tertiary">{item.label}</span>
          </div>
        ))}
        {colorBy === 'delta' && ([
          { level: 'NEW' as DeltaType, label: 'New', color: 'rgba(168, 85, 247, 0.6)' },
          { level: 'UPDATED' as DeltaType, label: 'Updated', color: 'rgba(59, 130, 246, 0.6)' },
          { level: 'DE-ESCALATED' as DeltaType, label: 'De-escalated', color: 'rgba(34, 197, 94, 0.6)' },
          { level: 'ESCALATED' as DeltaType, label: 'Escalated', color: 'rgba(239, 68, 68, 0.8)' },
        ]).map((item) => (
          <div key={item.level} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="font-ui text-xs text-text-tertiary">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-ui text-xs text-text-secondary">
            {totalBriefs.toLocaleString()} briefs
          </span>
        </div>
        {escalatedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-ui text-xs text-text-secondary">
              {escalatedCount} escalated
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Tooltip */}
      {showTooltips && activeCountry && (
        <div
          className="fixed z-50 w-64 bg-white dark:bg-bg-elevated rounded-xl shadow-2xl border border-border p-4 animate-slide-in-top pointer-events-none backdrop-blur-sm bg-opacity-95"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 180}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-display font-semibold text-base text-text">{activeCountry.name}</h4>
              <p className="font-ui text-xs text-text-secondary">{activeCountry.fullName}</p>
            </div>
            <span className="text-xs font-mono text-text-tertiary bg-bg-surface px-2 py-1 rounded">
              {activeCountry.id}
            </span>
          </div>

          {data[activeCountry.id] && (
            <>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-bg-surface rounded-lg p-2">
                  <div className="text-xs text-text-tertiary">Briefs</div>
                  <div className="font-mono text-lg font-bold text-text">
                    {data[activeCountry.id].briefCount}
                  </div>
                </div>
                <div className="bg-bg-surface rounded-lg p-2">
                  <div className="text-xs text-text-tertiary">Risk</div>
                  <div className="font-medium capitalize text-sm text-text mt-1">
                    {data[activeCountry.id].riskLevel}
                  </div>
                </div>
              </div>

              {/* Delta badge */}
              {data[activeCountry.id].lastDelta && (
                <div className="mt-3">
                  <DeltaBadge delta={data[activeCountry.id].lastDelta!} />
                </div>
              )}

              {/* Top risk snippet */}
              {data[activeCountry.id].topRiskSnippet && (
                <div className="mt-3 p-2 bg-red-light/20 rounded-lg border border-red/20">
                  <p className="font-ui text-xs text-text-secondary">
                    {data[activeCountry.id].topRiskSnippet}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================
   TIMELINE SCRUBBER — TIME NAVIGATION
   ============================================ */

interface TimelineScrubberProps {
  value: number // 0-100
  onChange: (value: number) => void
  dates: string[]
  className?: string
}

export function TimelineScrubber({
  value,
  onChange,
  dates,
  className,
}: TimelineScrubberProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Timeline Bar */}
      <div className="relative h-2 bg-surface rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-200"
          style={{ width: `${value}%` }}
        />
        {/* Scrubber Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110"
          style={{ left: `calc(${value}% - 8px)` }}
          onMouseDown={(e: React.MouseEvent) => {
            const target = e.currentTarget
            const handleMouseMove = (e: MouseEvent) => {
              const rect = target.parentElement?.getBoundingClientRect()
              if (rect) {
                const newValue = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
                onChange(newValue)
              }
            }
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        />
      </div>

      {/* Date Labels */}
      {dates.length > 0 && (
        <div className="flex justify-between mt-2">
          {dates.map((date, index) => (
            <span
              key={index}
              className={cn(
                'font-ui text-xs',
                index / (dates.length - 1) * 100 <= value ? 'text-text' : 'text-text-tertiary'
              )}
            >
              {date}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================
   RECENT DEVELOPMENTS FEED — LIVE UPDATES
   ============================================ */

interface Development {
  id: string
  delta: 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'
  title: string
  timeAgo: string
  briefId: string
}

interface RecentDevelopmentsProps {
  developments: Development[]
  onBriefClick?: (briefId: string) => void
  className?: string
}

export function RecentDevelopments({
  developments,
  onBriefClick,
  className,
}: RecentDevelopmentsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {developments.map((dev) => (
        <button
          key={dev.id}
          onClick={() => onBriefClick?.(dev.briefId)}
          className="w-full text-left p-3 paper-card rounded-sm hover-lift transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            <span className="text-xs text-text-tertiary whitespace-nowrap">{dev.timeAgo}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-text-tertiary">—</span>
                <p className="font-ui text-sm text-text truncate">{dev.title}</p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
