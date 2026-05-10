import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/utils/cn'

/* ============================================
   RPJMN RADAR CHART — 8 ASTA CITA PILLARS
   Indonesia's National Development Alignment
   ============================================ */

const RPJMN_PILLARS = [
  { id: 'P1', label: 'Pembangunan Manusia', en: 'Human Development' },
  { id: 'P2', label: 'Ekonomi Digital', en: 'Digital Economy' },
  { id: 'P3', label: 'Reformasi Birokrasi', en: 'Bureaucratic Reform' },
  { id: 'P4', label: 'Penanggulangan Kemiskinan', en: 'Poverty Alleviation' },
  { id: 'P5', label: 'Penguatan Ketahanan Negara', en: 'National Resilience' },
  { id: 'P6', label: 'Pembangunan Daerah', en: 'Regional Development' },
  { id: 'P7', label: 'Penurunan Angka Stunting', en: 'Stunting Reduction' },
  { id: 'P8', label: 'Penciptaan Lapangan Kerja', en: 'Job Creation' },
]

interface RPJMNRadarProps {
  data: Record<string, number>
  size?: 'sm' | 'md' | 'lg'
  showValues?: boolean
  className?: string
}

export function RPJMN_RadarChart({
  data,
  size = 'md',
  showValues = false,
  className,
}: RPJMNRadarProps) {
  const sizeStyles = {
    sm: { height: 200, fontSize: 10 },
    md: { height: 280, fontSize: 11 },
    lg: { height: 360, fontSize: 12 },
  }

  const styles = sizeStyles[size]

  // Transform data for Recharts
  const chartData = RPJMN_PILLARS.map(pillar => ({
    pillar: pillar.id,
    fullLabel: pillar.label,
    shortLabel: pillar.en,
    value: data[pillar.id] || 0,
  }))

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={styles.height}>
        <RadarChart data={chartData}>
          <PolarGrid
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="shortLabel"
            tick={{
              fill: 'var(--color-text-secondary)',
              fontSize: styles.fontSize,
              fontFamily: 'var(--font-ui)',
            }}
          />
          {showValues && (
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: 'var(--color-text-tertiary)',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
              }}
            />
          )}
          <Radar
            name="Alignment"
            dataKey="value"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-primary)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ============================================
   RPJMN SCORE CARD — COMPACT VERSION
   ============================================ */

interface RPJMNScoreCardProps {
  scores: Record<string, number>
  averageScore?: number
  className?: string
}

export { RPJMN_RadarChart as RPJMNRadarChart };

export function RPJMNScoreCard({ scores, averageScore, className }: RPJMNScoreCardProps) {
  const avgScore = averageScore || Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length

  // Get top and bottom pillars
  const pillarScores = RPJMN_PILLARS.map(p => ({
    ...p,
    score: scores[p.id] || 0,
  })).sort((a, b) => b.score - a.score)

  const topPillar = pillarScores[0]
  const bottomPillar = pillarScores[pillarScores.length - 1]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Average Score */}
      <div className="text-center">
        <p className="font-ui text-xs font-semibold uppercase tracking-wider text-text-secondary">
          RPJMN Alignment
        </p>
        <p className="font-mono text-4xl font-bold text-text mt-1">
          {avgScore.toFixed(0)}
          <span className="text-lg text-text-tertiary">/100</span>
        </p>
      </div>

      {/* Top & Bottom Pillars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-ui text-sm text-text-secondary">Highest</span>
          <span className="font-ui text-sm font-medium text-text">
            {topPillar?.label} ({topPillar?.score})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-ui text-sm text-text-secondary">Lowest</span>
          <span className="font-ui text-sm font-medium text-text">
            {bottomPillar?.label} ({bottomPillar?.score})
          </span>
        </div>
      </div>

      {/* Mini Bar Indicators */}
      <div className="space-y-1">
        {pillarScores.slice(0, 4).map((pillar) => (
          <div key={pillar.id} className="flex items-center gap-2">
            <span className="font-ui text-xs text-text-tertiary w-4">{pillar.id}</span>
            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${pillar.score}%` }}
              />
            </div>
            <span className="font-ui text-xs text-text-secondary w-8 text-right">
              {pillar.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
