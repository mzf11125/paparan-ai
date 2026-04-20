import { useQuery } from '@tanstack/react-query'
import { FileText, TrendingUp, AlertTriangle, Tag } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
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

  // Calculate region distribution
  const regionDistribution = regions.map((region) => ({
    region,
    count: briefs.filter((b) => b.region === region).length,
    color:
      region === 'APAC'
        ? '#3B82F6'
        : region === 'EMEA'
          ? '#10B981'
          : region === 'Americas'
            ? '#F59E0B'
            : region === 'ASEAN'
              ? '#8B5CF6'
              : '#6B7280'
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Overview of policy intelligence briefs and developments
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Briefs"
          value={totalBriefs}
          icon={FileText}
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard
          title="Regions Covered"
          value={regions.length}
          icon={TrendingUp}
          trend={{ value: 0, label: 'stable' }}
        />
        <StatCard
          title="High Impact Items"
          value={highImpactDevelopments}
          icon={AlertTriangle}
          trend={{ value: 8, label: 'vs last week' }}
        />
        <StatCard
          title="Topics Tracked"
          value={totalTags}
          icon={Tag}
          trend={{ value: 5, label: 'new this month' }}
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

      {/* Trending Topics Section */}
      <div className="bg-white border border-[#E8E4DC] rounded-lg">
        <div className="px-6 py-4 border-b border-[#E8E4DC]">
          <h3 className="font-semibold text-gray-900">Trending Topics</h3>
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
                    className="px-4 py-2 bg-gray-100 hover:bg-[#C8A96A]/10 hover:text-[#C8A96A] text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span>{tag}</span>
                    <span className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-500">
                      {count}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {/* Recent Briefs Preview */}
      <div className="bg-white border border-[#E8E4DC] rounded-lg">
        <div className="px-6 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recently Updated Briefs</h3>
        </div>
        <div className="divide-y divide-[#E8E4DC]">
          {briefs.slice(0, 5).map((brief) => (
            <div
              key={brief.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{brief.title}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{brief.region}</span>
                  <span>•</span>
                  <span>{brief.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {brief.developments.length} developments
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
