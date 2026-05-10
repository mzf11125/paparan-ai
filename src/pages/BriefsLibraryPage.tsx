import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Grid3x3, List, Filter, FileText, Layers, X, Loader2,
  FolderOpen, SlidersHorizontal, ChevronDown,
} from 'lucide-react'
import { BriefGrid, BriefGridSkeleton } from '@/components/brief/BriefGrid'
import { AdvancedSearch, SavedSearchesList } from '@/components/ui/AdvancedSearch'
import { RegionQuickSwitcher } from '@/components/Layout/RegionQuickSwitcher'
import { briefService } from '@/services/briefService'
import { useAppStore, useFilteredBriefs } from '@/contexts/AppContext'
import { exportService } from '@/services/exportService'
import { cn } from '@/utils/formatters'
import { ErrorState } from '@/components/ui/ErrorState'
import { usePageMeta } from '@/hooks/usePageMeta'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc',  label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'impact',    label: 'High Impact First' },
]

export function BriefsLibraryPage() {
  usePageMeta({ title: 'Briefs Library' })
  const { viewMode, setViewMode, filters, clearFilters } = useAppStore()
  const filteredBriefs = useFilteredBriefs()
  const [sortBy, setSortBy]                   = useState('date-desc')
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [selectedIds]                         = useState<Set<string>>(new Set())
  const [synthesisResult, setSynthesisResult] = useState<Record<string, unknown> | null>(null)
  const [synthesizing, setSynthesizing]       = useState(false)
  const navigate = useNavigate()

  const { data: allBriefs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
    retry: 1,
  })

  const sortedBriefs = useMemo(() => {
    const result = [...filteredBriefs]
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':  return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'title-asc': return a.title.localeCompare(b.title)
        case 'impact': {
          const aH = a.developments.filter(d => d.impact === 'HIGH').length
          const bH = b.developments.filter(d => d.impact === 'HIGH').length
          return bH - aH
        }
        default: return 0
      }
    })
    return result
  }, [filteredBriefs, sortBy])

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

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined)

  if (error) {
    return (
      <div className="px-4 lg:px-6 py-6 space-y-6">
        <PageHeader count={0} />
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load briefs.'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20 mb-3 font-ui">
            <FileText className="w-3 h-3" />
            Intelligence Repository
          </div>
          <h1 className="text-3xl font-display font-bold text-text">Briefs Library</h1>
          <p className="text-text-secondary text-sm mt-1 font-ui">
            <span className="tabular-nums font-semibold text-text">{allBriefs.length}</span> policy intelligence briefs
          </p>
        </div>

        <button
          onClick={() => setShowSavedSearches(!showSavedSearches)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-ui font-medium border transition-all duration-150',
            showSavedSearches
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-text-secondary border-border hover:border-border-strong hover:text-text'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Saved Searches
        </button>
      </div>

      {/* Search */}
      <AdvancedSearch compact />

      {/* Saved searches panel */}
      {showSavedSearches && (
        <div className="surface-card p-4 animate-fade-in">
          <SavedSearchesList
            onSelect={() => setShowSavedSearches(false)}
          />
        </div>
      )}

      {/* Filter bar */}
      <div className="surface-card p-3 flex items-center gap-3 flex-wrap">
        <RegionQuickSwitcher />

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text font-ui focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
          {[
            { mode: 'grid', Icon: Grid3x3, label: 'Grid view' },
            { mode: 'list', Icon: List,    label: 'List view' },
          ].map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as 'grid' | 'list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-bg-surface text-text-secondary hover:text-text hover:bg-bg-subtle'
              )}
              aria-label={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-ui font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <BriefGridSkeleton count={6} />
      ) : allBriefs.length === 0 ? (
        <EmptyLibrary onNavigate={() => navigate('/editor')} />
      ) : sortedBriefs.length === 0 ? (
        <EmptyFiltered onClear={clearFilters} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary font-ui">
              Showing <span className="tabular-nums font-semibold text-text">{sortedBriefs.length}</span>
              {' '}of <span className="tabular-nums">{allBriefs.length}</span> briefs
            </p>

            {selectedIds.size >= 2 && (
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 disabled:opacity-50"
              >
                {synthesizing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Layers className="w-4 h-4" />}
                Synthesize {selectedIds.size} Briefs
              </button>
            )}
          </div>

          {/* Synthesis result */}
          {synthesisResult && (
            <div className="surface-card border-primary/20 p-5 relative animate-fade-in">
              <button
                onClick={() => setSynthesisResult(null)}
                className="absolute top-3 right-3 p-1.5 hover:bg-bg-subtle rounded-lg transition-colors"
                aria-label="Close synthesis"
              >
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
              <h3 className="font-display font-bold text-text mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Cross-Brief Synthesis
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { key: 'common_themes',    label: 'Common Themes',    color: 'text-primary' },
                  { key: 'diverging_signals', label: 'Diverging Signals', color: 'text-warning' },
                  { key: 'recommended_focus', label: 'Recommended Focus', color: 'text-success' },
                ].map(({ key, label, color }) => {
                  const items = (synthesisResult[key] as string[]) || []
                  return items.length > 0 ? (
                    <div key={key}>
                      <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2 font-ui', color)}>{label}</p>
                      <ul className="space-y-1">
                        {items.map((item, i) => (
                          <li key={i} className="text-text-secondary text-xs">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                })}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-error font-ui">Aggregate Risk</p>
                  <span className={cn(
                    'badge',
                    synthesisResult.aggregate_risk === 'HIGH'   ? 'bg-error/10 text-error border border-error/25' :
                    synthesisResult.aggregate_risk === 'MEDIUM' ? 'bg-warning/10 text-warning border border-warning/25' :
                    'bg-success/10 text-success border border-success/25'
                  )}>
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

function PageHeader({ count }: { count: number }) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20 mb-3 font-ui">
        <FileText className="w-3 h-3" />
        Intelligence Repository
      </div>
      <h1 className="text-3xl font-display font-bold text-text">Briefs Library</h1>
      <p className="text-text-secondary text-sm mt-1 font-ui">
        <span className="tabular-nums font-semibold text-text">{count}</span> policy intelligence briefs
      </p>
    </div>
  )
}

function EmptyLibrary({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-xl font-display font-bold text-text mb-2">No briefs yet</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-6 font-ui">
        Generate your first policy intelligence brief to populate the library.
      </p>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal"
      >
        <FileText className="w-4 h-4" />
        Create Brief
      </button>
    </div>
  )
}

function EmptyFiltered({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center mb-4">
        <Filter className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-xl font-display font-bold text-text mb-2">No matches</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-6 font-ui">
        Try adjusting your filters to see more results.
      </p>
      <button
        onClick={onClear}
        className="flex items-center gap-2 px-5 py-2.5 bg-bg-subtle hover:bg-bg-overlay border border-border text-text-secondary hover:text-text rounded-lg text-sm font-medium font-ui transition-all duration-150"
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    </div>
  )
}
