import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Grid3x3, List, SlidersHorizontal, X, Filter, FileText } from 'lucide-react'
import { BriefGrid, BriefGridSkeleton } from '@/components/brief/BriefGrid'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { useAppStore } from '@/contexts/AppContext'
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
  const { viewMode, setViewMode } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [sortBy, setSortBy] = useState('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs()
  })

  // Filter and sort briefs
  const filteredBriefs = useMemo(() => {
    let result = [...briefs]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (brief) =>
          brief.title.toLowerCase().includes(query) ||
          brief.region.toLowerCase().includes(query) ||
          brief.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Apply region filter
    if (selectedRegion !== 'All Regions') {
      result = result.filter((brief) => brief.region === selectedRegion)
    }

    // Apply sorting
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
  }, [briefs, searchQuery, selectedRegion, sortBy])

  const activeFilters = [
    searchQuery && 'Search',
    selectedRegion !== 'All Regions' && selectedRegion
  ].filter((f): f is string => Boolean(f))

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedRegion('All Regions')
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
            Browse <span className="tabular-nums font-semibold text-text">{briefs.length}</span> policy intelligence briefs across <span className="tabular-nums font-semibold text-text">{regions.length - 1}</span> regions
          </p>
        </div>
      </div>

      {/* Search and Filter Bar — Official Style */}
      <div className="bg-bg-elevated border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="search"
              placeholder="Search briefs by title, region, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-elevated rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2.5 bg-bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
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

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2.5 border border-border rounded transition-colors flex items-center gap-2 text-sm',
                showFilters && 'bg-primary-lighter border-primary text-primary'
              )}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">Active filters:</span>
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-lighter text-primary text-sm rounded border border-primary/20"
              >
                {filter}
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary hover:text-primary-dark underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <BriefGridSkeleton count={6} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Showing <span className="tabular-nums font-semibold text-text">{filteredBriefs.length}</span> of <span className="tabular-nums">{briefs.length}</span> briefs
            </p>
          </div>
          <BriefGrid briefs={filteredBriefs} viewMode={viewMode} />
        </>
      )}
    </div>
  )
}
