import { cn } from '@/utils/cn'

/* ============================================
   HEAT MATRIX — ASEAN REGIONAL COVERAGE
   Rows = Topics, Columns = Countries
   Cells = Brief coverage/risk level
   ============================================ */

const ASEAN_COUNTRIES = [
  { code: 'SGP', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MYS', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PHL', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VNM', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'THA', name: 'Thailand', flag: '🇹🇭' },
  { code: 'MMR', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'KHM', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'LAO', name: 'Laos', flag: '🇱🇦' },
  { code: 'BRN', name: 'Brunei', flag: '🇧🇳' },
]

const TOPIC_DOMAINS = [
  { id: 'trade', label: 'Trade' },
  { id: 'security', label: 'Security' },
  { id: 'climate', label: 'Climate' },
  { id: 'digital', label: 'Digital' },
  { id: 'infrastructure', label: 'Infrastructure' },
]

type CellValue = 'none' | 'low' | 'medium' | 'high' | 'critical'

interface HeatMatrixProps {
  data: Record<string, Record<string, CellValue>> // [topic][country]
  className?: string
  interactive?: boolean
  onCellClick?: (topic: string, country: string) => void
}

export function HeatMatrix({
  data,
  className,
  interactive = false,
  onCellClick,
}: HeatMatrixProps) {
  const getCellConfig = (value: CellValue) => {
    switch (value) {
      case 'critical':
        return {
          bg: 'bg-secret',
          text: 'text-white',
          icon: '●',
        }
      case 'high':
        return {
          bg: 'bg-red-light',
          text: 'text-secret',
          icon: '●',
        }
      case 'medium':
        return {
          bg: 'bg-amber-light',
          text: 'text-confidential',
          icon: '◆',
        }
      case 'low':
        return {
          bg: 'bg-primary-light',
          text: 'text-primary',
          icon: '○',
        }
      default:
        return {
          bg: 'bg-surface',
          text: 'text-text-tertiary',
          icon: '○',
        }
    }
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        {/* Header Row */}
        <thead>
          <tr>
            <th className="font-ui text-xs font-semibold uppercase tracking-wider text-text-secondary p-2 text-left">
              Topic
            </th>
            {ASEAN_COUNTRIES.map((country) => (
              <th
                key={country.code}
                className="font-ui text-xs font-medium text-text-secondary p-2 text-center"
              >
                <span className="sr-only">{country.name}</span>
                <span className="text-lg" role="img" aria-label={country.name}>
                  {country.flag}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Data Rows */}
        <tbody>
          {TOPIC_DOMAINS.map((topic) => (
            <tr key={topic.id} className="border-t border-border">
              <td className="font-ui text-xs font-medium text-text p-2">
                {topic.label}
              </td>
              {ASEAN_COUNTRIES.map((country) => {
                const value = data[topic.id]?.[country.code] || 'none'
                const config = getCellConfig(value)

                return (
                  <td
                    key={country.code}
                    className={cn(
                      'p-1',
                      'text-center',
                      interactive && 'cursor-pointer hover:opacity-80 transition-opacity'
                    )}
                    onClick={() => onCellClick?.(topic.id, country.code)}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 mx-auto rounded flex items-center justify-center',
                        config.bg,
                        config.text
                      )}
                      title={`${topic.label} - ${country.name}: ${value}`}
                    >
                      <span className="text-xs">{config.icon}</span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <span className="font-ui text-xs text-text-secondary">Coverage:</span>
        {(['none', 'low', 'medium', 'high', 'critical'] as CellValue[]).map((level) => {
          const config = getCellConfig(level)
          return (
            <div key={level} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded', config.bg)} />
              <span className="font-ui text-xs text-text-tertiary capitalize">{level}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================
   MINI HEAT MAP — SINGLE ROW
   ============================================ */

interface MiniHeatMapProps {
  data: Record<string, number>
  labels: Record<string, string>
  max?: number
  className?: string
}

export function MiniHeatMap({
  data,
  labels,
  max = 100,
  className,
}: MiniHeatMapProps) {
  const keys = Object.keys(data)

  return (
    <div className={cn('flex items-end gap-1', className)}>
      {keys.map((key) => {
        const value = data[key] || 0
        const percent = (value / max) * 100

        return (
          <div
            key={key}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div
              className="w-full bg-primary rounded-sm transition-all duration-300 hover:opacity-80"
              style={{ height: `${Math.max(percent, 4)}%` }}
              title={`${labels[key] || key}: ${value}`}
            />
            <span className="font-ui text-xs text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {labels[key] || key}
            </span>
          </div>
        )
      })}
    </div>
  )
}
