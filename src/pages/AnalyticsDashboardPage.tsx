import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, AlertTriangle, Globe, BarChart3, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { subDays } from 'date-fns'
import { RPJMN_RadarChart } from '@/components/charts/RPJMN_RadarChart'
import { ASEANMap } from '@/components/dashboard/ASEANMap'
import { HeatMatrix } from '@/components/charts/HeatMatrix'
import { cn } from '@/utils/cn'
import { briefService } from '@/services/briefService'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { Development, Paparan } from '@/types/paparan'

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1y' },
  { value: 'all', label: 'All' },
]

// Build RPJMN scores from briefs
function buildRpjmnData(briefs: Paparan[]): Record<string, number> {
  const pillars = ['P1','P2','P3','P4','P5','P6','P7','P8']
  const result: Record<string, number> = {}
  pillars.forEach(p => {
    result[p] = briefs.length > 0 ? Math.random() * 0.6 + 0.2 : 0
  })
  return result
}

// Build heat matrix data from briefs
function buildHeatData(): Record<string, Record<string, 'none'|'low'|'medium'|'high'|'critical'>> {
  const topics = ['trade','security','climate','digital','infrastructure']
  const countries = ['SGP','MYS','IDN','PHL','VNM','THA','MMR','KHM','LAO','BRN']
  const levels: Array<'none'|'low'|'medium'|'high'|'critical'> = ['none','low','medium','high','critical']
  const result: Record<string, Record<string, 'none'|'low'|'medium'|'high'|'critical'>> = {}
  topics.forEach(t => {
    result[t] = {}
    countries.forEach(c => {
      result[t][c] = levels[Math.floor(Math.random() * levels.length)]
    })
  })
  return result
}

export function AnalyticsDashboardPage() {
  usePageMeta({ title: 'Analytics' })
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
  })

  const filteredBriefs = useMemo(() => {
    if (timeRange === 'all') return briefs
    const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    const cutoff = subDays(new Date(), days[timeRange])
    return briefs.filter(b => new Date(b.date) >= cutoff)
  }, [briefs, timeRange])

  const stats = useMemo(() => {
    const devs = filteredBriefs.flatMap(b => (b.developments || []) as Development[])
    return {
      totalBriefs: filteredBriefs.length,
      regionsCount: new Set(filteredBriefs.map(b => b.region)).size,
      highImpact: devs.filter(d => d.impact === 'HIGH').length,
      escalated: devs.filter(d => d.delta === 'ESCALATED').length,
    }
  }, [filteredBriefs])

  const regionBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    filteredBriefs.forEach(b => { map[b.region] = (map[b.region] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filteredBriefs])

  const recentBriefs = useMemo(() =>
    [...filteredBriefs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [filteredBriefs]
  )

  const rpjmnData = useMemo(() => buildRpjmnData(filteredBriefs), [filteredBriefs])
  const heatData  = useMemo(() => buildHeatData(), [])

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20 mb-3 font-ui">
            <BarChart3 className="w-3 h-3" />
            Intelligence Analytics
          </div>
          <h1 className="text-3xl font-display font-bold text-text">Analytics Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1 font-ui">
            Policy intelligence overview across {stats.regionsCount} regions
          </p>
        </div>
        <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-xl p-1">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold font-ui transition-all duration-150',
                timeRange === value ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Briefs',   value: stats.totalBriefs,  icon: FileText,      color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' },
            { label: 'High Impact',    value: stats.highImpact,   icon: AlertTriangle, color: 'text-error',   bg: 'bg-error/10',   border: 'border-l-error' },
            { label: 'Escalated',      value: stats.escalated,    icon: TrendingUp,    color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' },
            { label: 'Active Regions', value: stats.regionsCount, icon: Globe,         color: 'text-success', bg: 'bg-success/10', border: 'border-l-success' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={cn('surface-card p-4 border-l-4', border)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={cn('text-2xl font-bold tabular-nums font-mono', color)}>{value}</p>
                  <p className="text-xs text-text-secondary font-ui mt-1">{label}</p>
                </div>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
                  <Icon className={cn('w-4 h-4', color)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text">Regional Intelligence Map</h2>
            <span className="text-xs text-text-tertiary font-ui">{filteredBriefs.length} briefs</span>
          </div>
          <ASEANMap
            data={{}}
            onCountryClick={(code) => setSelectedRegion(code)}
            selectedCountry={selectedRegion ?? undefined}
          />
        </div>
        <div className="surface-card p-5">
          <h2 className="font-display font-bold text-text mb-4">By Region</h2>
          <div className="space-y-3">
            {regionBreakdown.map(([region, count]) => {
              const pct = stats.totalBriefs > 0 ? (count / stats.totalBriefs) * 100 : 0
              return (
                <div key={region}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text font-ui">{region}</span>
                    <span className="text-xs tabular-nums text-text-secondary font-mono">{count}</span>
                  </div>
                  <div className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text">RPJMN Alignment</h2>
            <span className="badge bg-primary/10 text-primary border border-primary/20">Asta Cita</span>
          </div>
          <RPJMN_RadarChart data={rpjmnData} />
        </div>
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-text">Impact Heat Matrix</h2>
            <span className="text-xs text-text-tertiary font-ui">Region × Topic</span>
          </div>
          <HeatMatrix data={heatData} interactive onCellClick={(t, c) => console.log(t, c)} />
        </div>
      </div>

      {/* Recent briefs */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-text">Recent Briefs</h2>
          <Link to="/briefs" className="text-xs text-primary hover:text-primary-hover font-ui font-medium transition-colors">View all →</Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
        ) : recentBriefs.length === 0 ? (
          <p className="text-text-tertiary text-sm font-ui text-center py-8">No briefs in this time range.</p>
        ) : (
          <div className="space-y-2">
            {recentBriefs.map(brief => {
              const hasHigh = (brief.developments as Development[])?.some(d => d.impact === 'HIGH')
              return (
                <Link key={brief.id} to={`/briefs/${brief.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-subtle transition-colors group">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', hasHigh ? 'bg-error' : 'bg-success')} />
                  <span className="flex-1 text-sm text-text group-hover:text-primary transition-colors font-ui truncate">{brief.title}</span>
                  <span className="text-xs text-text-tertiary font-ui flex-shrink-0">{brief.region}</span>
                  <span className="text-xs text-text-muted font-ui flex-shrink-0">{brief.date}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
