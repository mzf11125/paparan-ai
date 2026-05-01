import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Grid3x3, List, Filter, FileText, Layers, X, Loader2, FolderOpen } from 'lucide-react'
import { BriefGrid, BriefGridSkeleton } from '@/components/brief/BriefGrid'
import { AdvancedSearch, SavedSearchesList } from '@/components/ui/AdvancedSearch'
import { RegionQuickSwitcher } from '@/components/Layout/RegionQuickSwitcher'
import { briefService } from '@/services/briefService'
import { useAppStore, useFilteredBriefs } from '@/contexts/AppContext'
import { exportService } from '@/services/exportService'
import { cn } from '@/utils/formatters'
import { ErrorState } from '@/components/ui/ErrorState'
import { useNavigate } from 'react-router-dom'

// Initialize store with mock data

const regions = ['All Regions', 'APAC', 'EMEA', 'Americas', 'ASEAN', 'Global']
const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'impact', label: 'High Impact First' }
]

export function BriefsLibraryPage() {
  const { viewMode, setViewMode, filters, clearFilters } = useAppStore()
  const filteredBriefs = useFilteredBriefs()
  const [sortBy, setSortBy] = useState('date-desc')
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [selectedIds] = useState<Set<string>>(new Set())
  const [synthesisResult, setSynthesisResult] = useState<Record<string, unknown> | null>(null)
  const [synthesizing, setSynthesizing] = useState(false)
  const navigate = useNavigate()

  const { data: allBriefs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
    retry: 1,
  })

  // Apply sorting to filtered briefs
  const sortedBriefs = useMemo(() => {
    const result = [...filteredBriefs]
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'impact':
          const aHigh = a.developments.filter((d) => d.impact === 'HIGH').length
          const bHigh = b.developments.filter((d) => d.impact === 'HIGH').length
          return bHigh - aHigh
        default:
          return 0
      }
    })
    return result
  }, [filteredBriefs, sortBy])

  const handleClearFilters = () => {
    clearFilters()
  }

  const handleSynthesize = async () => {
    if (selectedIds.size < 2) return
    setSynthesizing(true)
    try {
      const result = await exportService.synthesize(Array.from(selectedIds))
      setSynthesisResult(result)
    } finally {
      setSynthesizing(false)
    }
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(59,130,246,0.15)] text-[#3B82F6] text-xs font-semibold uppercase tracking-wider rounded-lg mb-3">
              <FileText className="w-3.5 h-3.5" />
              Intelligence Repository
            </div>
            <h1 className="text-3xl font-display font-bold text-[#F1F5F9] mb-2">Briefs Library</h1>
          </div>
        </div>
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load briefs. Please try again.'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  // Check if there are any active filters
  const hasActiveFilters = Object.keys(filters).filter(k => filters[k as keyof typeof filters] !== undefined).length > 0

  return (
    <div className="space-y-6">
      {/* Page Header — Official Style */}
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(59,130,246,0.15)] text-[#3B82F6] text-xs font-semibold uppercase tracking-wider rounded-lg mb-3">
            <FileText className="w-3.5 h-3.5" />
            Intelligence Repository
          </div>
          <h1 className="text-3xl font-display font-bold text-[#F1F5F9] mb-2">Briefs Library</h1>
          <p className="text-[#94A3B8]">
            Browse <span className="tabular-nums font-semibold text-[#F1F5F9]">{allBriefs.length}</span> policy intelligence briefs across <span className="tabular-nums font-semibold text-[#F1F5F9]">{regions.length - 1}</span> regions
          </p>
        </div>
        <button
          onClick={() => setShowSavedSearches(!showSavedSearches)}
          className="flex items-center gap-2 px-4 py-2 border border-[rgba(255,255,255,0.12)] rounded-lg text-sm text-[#94A3B8] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all"
        >
          <Filter className="w-4 h-4" />
          Saved Searches
        </button>
      </div>

      {/* Search and Filter Bar with Advanced Search */}
      <AdvancedSearch compact />

      {/* Saved Searches Panel */}
      {showSavedSearches && (
        <SavedSearchesList
          onSelect={() => setShowSavedSearches(false)}
          className="bg-bg-elevated border border-border rounded-lg p-4"
        />
      )}

      {/* Filter Controls Bar */}
      <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Region Quick Switcher */}
          <RegionQuickSwitcher />

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all text-sm text-[#F1F5F9]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[rgba(255,255,255,0.12)] rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'grid' ? 'bg-[#3B82F6] text-white' : 'bg-[#111318] hover:bg-[rgba(255,255,255,0.04)]'
              )}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'list' ? 'bg-[#3B82F6] text-white' : 'bg-[#111318] hover:bg-[rgba(255,255,255,0.04)]'
              )}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-[#3B82F6] hover:text-[#2563EB] underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <BriefGridSkeleton count={6} />
      ) : allBriefs.length === 0 ? (
        /* No briefs at all */
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-[#64748B]" />
          </div>
          <h3 className="text-xl font-semibold text-[#F1F5F9] mb-2">No briefs in library</h3>
          <p className="text-[#94A3B8] text-sm max-w-md mb-6">
            Get started by generating your first policy intelligence brief.
          </p>
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <FileText className="w-4 h-4" />
            Create Brief
          </button>
        </div>
      ) : sortedBriefs.length === 0 ? (
        /* No briefs match filters */
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-4">
            <Filter className="w-8 h-8 text-[#64748B]" />
          </div>
          <h3 className="text-xl font-semibold text-[#F1F5F9] mb-2">No briefs match your filters</h3>
          <p className="text-[#94A3B8] text-sm max-w-md mb-6">
            Try adjusting your filter criteria to see more results.
          </p>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-5 py-2.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[#94A3B8] hover:text-[#F1F5F9] rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#94A3B8]">
              Showing <span className="tabular-nums font-semibold text-[#F1F5F9]">{sortedBriefs.length}</span> of <span className="tabular-nums">{allBriefs.length}</span> briefs
            </p>
            {selectedIds.size >= 2 && (
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors disabled:opacity-50"
              >
                {synthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                Synthesize {selectedIds.size} Briefs
              </button>
            )}
          </div>

          {/* Synthesis result modal */}
          {synthesisResult && (
            <div className="bg-[#111318] border border-[rgba(59,130,246,0.30)] rounded-lg p-5 relative">
              <button onClick={() => setSynthesisResult(null)}
                className="absolute top-3 right-3 p-1 hover:bg-[rgba(255,255,255,0.04)] rounded">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
              <h3 className="font-semibold text-[#F1F5F9] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3B82F6]" /> Cross-Brief Synthesis
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { key: 'common_themes', label: 'Common Themes', color: 'text-[#3B82F6]' },
                  { key: 'diverging_signals', label: 'Diverging Signals', color: 'text-[#F59E0B]' },
                  { key: 'recommended_focus', label: 'Recommended Focus', color: 'text-[#10B981]' },
                ].map(({ key, label, color }) => {
                  const items = (synthesisResult[key] as string[]) || []
                  return items.length > 0 ? (
                    <div key={key}>
                      <p className={cn('text-xs font-bold uppercase tracking-wider mb-1.5', color)}>{label}</p>
                      <ul className="space-y-1">
                        {items.map((item, i) => <li key={i} className="text-[#94A3B8]">• {item}</li>)}
                      </ul>
                    </div>
                  ) : null
                })}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-[#EF4444]">Aggregate Risk</p>
                  <span className={cn('px-2 py-0.5 text-xs font-bold rounded uppercase',
                    synthesisResult.aggregate_risk === 'HIGH' ? 'bg-[rgba(239,68,68,0.20)] text-[#EF4444]' :
                    synthesisResult.aggregate_risk === 'MEDIUM' ? 'bg-[rgba(245,158,11,0.20)] text-[#F59E0B]' : 'bg-[rgba(16,185,129,0.20)] text-[#10B981]')}>
                    {synthesisResult.aggregate_risk as string}
                  </span>
                </div>
              </div>
            </div>
          )}

          <BriefGrid briefs={sortedBriefs} viewMode={viewMode} />
        </>
      )}
    </div>
  )
}
