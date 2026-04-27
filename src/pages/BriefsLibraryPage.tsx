import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Grid3x3, List, Filter, FileText, Layers, X, Loader2 } from 'lucide-react'
import { BriefGrid, BriefGridSkeleton } from '@/components/brief/BriefGrid'
import { AdvancedSearch, SavedSearchesList } from '@/components/ui/AdvancedSearch'
import { RegionQuickSwitcher } from '@/components/Layout/RegionQuickSwitcher'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { useAppStore, useFilteredBriefs } from '@/contexts/AppContext'
import { exportService } from '@/services/exportService'
import { cn } from '@/utils/formatters'

// Initialize store with mock data
initializeBriefStore(mockBriefs)

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

  const { data: allBriefs = [], isLoading } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs()
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

  return (
    <div className="space-y-6">
      {/* Page Header — Official Style */}
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-3">
            <FileText className="w-3.5 h-3.5" />
            Intelligence Repository
          </div>
          <h1 className="text-3xl font-display font-bold text-text mb-2">Briefs Library</h1>
          <p className="text-text-secondary">
            Browse <span className="tabular-nums font-semibold text-text">{allBriefs.length}</span> policy intelligence briefs across <span className="tabular-nums font-semibold text-text">{regions.length - 1}</span> regions
          </p>
        </div>
        <button
          onClick={() => setShowSavedSearches(!showSavedSearches)}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text hover:border-primary hover:text-primary transition-all"
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
      <div className="bg-bg-elevated border border-border rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Region Quick Switcher */}
          <RegionQuickSwitcher />

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'grid' ? 'bg-primary text-white' : 'bg-bg-elevated hover:bg-bg-surface'
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
                viewMode === 'list' ? 'bg-primary text-white' : 'bg-bg-elevated hover:bg-bg-surface'
              )}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {Object.keys(filters).filter(k => filters[k as keyof typeof filters] !== undefined).length > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary hover:text-primary-dark underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <BriefGridSkeleton count={6} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Showing <span className="tabular-nums font-semibold text-text">{sortedBriefs.length}</span> of <span className="tabular-nums">{allBriefs.length}</span> briefs
            </p>
            {selectedIds.size >= 2 && (
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {synthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                Synthesize {selectedIds.size} Briefs
              </button>
            )}
          </div>

          {/* Synthesis result modal */}
          {synthesisResult && (
            <div className="bg-bg-elevated border border-accent/30 rounded-lg p-5 relative">
              <button onClick={() => setSynthesisResult(null)}
                className="absolute top-3 right-3 p-1 hover:bg-bg-surface rounded">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
              <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" /> Cross-Brief Synthesis
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { key: 'common_themes', label: 'Common Themes', color: 'text-primary' },
                  { key: 'diverging_signals', label: 'Diverging Signals', color: 'text-amber' },
                  { key: 'recommended_focus', label: 'Recommended Focus', color: 'text-green' },
                ].map(({ key, label, color }) => {
                  const items = (synthesisResult[key] as string[]) || []
                  return items.length > 0 ? (
                    <div key={key}>
                      <p className={cn('text-xs font-bold uppercase tracking-wider mb-1.5', color)}>{label}</p>
                      <ul className="space-y-1">
                        {items.map((item, i) => <li key={i} className="text-text-secondary">• {item}</li>)}
                      </ul>
                    </div>
                  ) : null
                })}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-red">Aggregate Risk</p>
                  <span className={cn('px-2 py-0.5 text-xs font-bold rounded uppercase',
                    synthesisResult.aggregate_risk === 'HIGH' ? 'bg-red/20 text-red' :
                    synthesisResult.aggregate_risk === 'MEDIUM' ? 'bg-amber/20 text-amber' : 'bg-green/20 text-green')}>
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
