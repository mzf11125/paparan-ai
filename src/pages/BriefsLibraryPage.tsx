import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Grid3x3, List, SlidersHorizontal, X } from 'lucide-react'
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Briefs Library</h1>
        <p className="text-gray-600">
          Browse {briefs.length} policy intelligence briefs across {regions.length - 1} regions
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-[#E8E4DC] rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search briefs by title, region, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
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
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2.5 transition-colors',
                  viewMode === 'grid' ? 'bg-[#C8A96A] text-white' : 'bg-white hover:bg-gray-50'
                )}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2.5 transition-colors',
                  viewMode === 'list' ? 'bg-[#C8A96A] text-white' : 'bg-white hover:bg-gray-50'
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2.5 border border-gray-200 rounded-lg transition-colors flex items-center gap-2',
                showFilters && 'bg-[#C8A96A] text-white border-[#C8A96A]'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Active filters:</span>
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#C8A96A]/10 text-[#C8A96A] text-sm rounded"
              >
                {filter}
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
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
          <p className="text-sm text-gray-500">
            Showing {filteredBriefs.length} of {briefs.length} briefs
          </p>
          <BriefGrid briefs={filteredBriefs} viewMode={viewMode} />
        </>
      )}
    </div>
  )
}
