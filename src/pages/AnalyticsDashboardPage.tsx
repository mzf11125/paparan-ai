import { useQuery } from '@tanstack/react-query'
import { FileText, TrendingUp, AlertTriangle, Tag, BarChart3, Activity } from 'lucide-react'
import { StatsCard } from '@/components/ui/Card'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { RegionOverview } from '@/components/dashboard/RegionOverview'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { subDays } from 'date-fns'

// Initialize store with mock data
initializeBriefStore(mockBriefs)

export function AnalyticsDashboardPage() {
  const { data: briefs = [] } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs()
  })

  // Calculate statistics
  const totalBriefs = briefs.length
  const regions = Array.from(new Set(briefs.map((b) => b.region)))
  const highImpactDevelopments = briefs.reduce(
    (sum, brief) => sum + brief.developments.filter((d) => d.impact === 'HIGH').length,
    0
  )
  const totalTags = new Set(briefs.flatMap((b) => b.tags || [])).size

  // Calculate region distribution with government-appropriate colors
  const regionDistribution = regions.map((region) => ({
    region,
    count: briefs.filter((b) => b.region === region).length,
    color:
      region === 'APAC'
        ? '#0369A1'  // Navy
        : region === 'EMEA'
          ? '#2D7A4D'  // Green
          : region === 'Americas'
            ? '#B8860B'  // Amber
            : region === 'ASEAN'
              ? '#2E5C8A'  // Blue
              : '#6B7280'  // Gray
  }))

  // Generate mock recent activity
  const recentActivities = briefs.slice(0, 5).map((brief) => ({
    id: `activity-${brief.id}`,
    type: 'updated' as const,
    briefId: brief.id,
    briefTitle: brief.title,
    timestamp: subDays(new Date(), Math.floor(Math.random() * 7)),
    description: brief.executiveSummary[0]
  }))

  return (
    <div className="space-y-6">
      {/* Page Header — Official Style */}
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-3">
            <BarChart3 className="w-3.5 h-3.5" />
            Intelligence Overview
          </div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">Analytics Dashboard</h1>
          <p className="text-text-secondary">
            Overview of policy intelligence briefs and developments
          </p>
        </div>
        <div className="text-sm text-text-tertiary tabular-nums">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Statistics Grid — Government Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value={totalBriefs}
          label="Total Briefs"
          change={12}
          changeLabel="vs last month"
          icon={<FileText className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          value={regions.length}
          label="Regions Covered"
          change={0}
          changeLabel="stable"
          icon={<TrendingUp className="w-5 h-5" />}
          color="accent"
        />
        <StatsCard
          value={highImpactDevelopments}
          label="High Impact Items"
          change={8}
          changeLabel="vs last week"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          value={totalTags}
          label="Topics Tracked"
          change={5}
          changeLabel="new this month"
          icon={<Tag className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityFeed activities={recentActivities} />
        </div>

        {/* Region Overview */}
        <div>
          <RegionOverview regions={regionDistribution} />
        </div>
      </div>

      {/* Trending Topics Section — Official Style */}
      <div className="bg-bg-elevated border border-border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-text">Trending Topics</h3>
          </div>
          <span className="text-xs text-text-tertiary tabular-nums">
            {Array.from(new Set(briefs.flatMap((b) => b.tags || []))).length} topics tracked
          </span>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {Array.from(
              new Set(briefs.flatMap((b) => b.tags || []))
            )
              .slice(0, 12)
              .map((tag) => {
                const count = briefs.filter((b) => b.tags?.includes(tag)).length
                return (
                  <button
                    key={tag}
                    className="px-4 py-2 bg-bg-surface hover:bg-primary-lighter hover:text-primary text-text-secondary border border-border hover:border-primary rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <span>{tag}</span>
                    <span className="px-2 py-0.5 bg-bg-elevated rounded-full text-xs text-text-tertiary tabular-nums">
                      {count}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {/* Recent Briefs Preview — Official Table Style */}
      <div className="bg-bg-elevated border border-border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-text">Recently Updated Briefs</h3>
          </div>
          <span className="text-xs text-text-tertiary">
            Last 7 days
          </span>
        </div>
        <div className="divide-y divide-border">
          {briefs.slice(0, 5).map((brief) => (
            <div
              key={brief.id}
              className="px-6 py-4 hover:bg-bg-surface transition-colors flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="classification-badge classification-badge-unclassified flex-shrink-0">
                    UNCLASSIFIED
                  </span>
                  <p className="font-medium text-text truncate group-hover:text-primary transition-colors">
                    {brief.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                  <span>{brief.region}</span>
                  <span>•</span>
                  <span className="tabular-nums">{brief.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm text-text-secondary">
                    {brief.developments.length} developments
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {brief.developments.filter((d) => d.impact === 'HIGH').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red" />
                    )}
                    {brief.developments.filter((d) => (d as any).delta === 'new').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-green" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
