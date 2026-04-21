import { useState } from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar,
  TrendingUp,
  Shield,
  Tag,
  Clock,
  Filter,
} from 'lucide-react'
import { cn } from '@/utils/formatters'
import { useAppStore, type BriefFilters } from '@/contexts/AppContext'
import { toast } from '@/components/ui/Toast'

const impactLevels = [
  { value: 'HIGH', label: 'High Impact', color: 'text-red' },
  { value: 'MEDIUM', label: 'Medium Impact', color: 'text-amber' },
  { value: 'LOW', label: 'Low Impact', color: 'text-green' },
] as const

const classifications = [
  { value: 'unclassified', label: 'UNCLASSIFIED', color: 'border-green text-green bg-green-light' },
  { value: 'official', label: 'OFFICIAL', color: 'border-primary text-primary bg-primary-lighter' },
  { value: 'confidential', label: 'CONFIDENTIAL', color: 'border-amber text-amber bg-amber-light' },
  { value: 'secret', label: 'SECRET', color: 'border-red text-red bg-red-light' },
] as const

const dateRanges = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 3 months', days: 90 },
  { value: '1y', label: 'Last year', days: 365 },
  { value: 'custom', label: 'Custom range', days: 0 },
] as const

interface AdvancedSearchProps {
  className?: string
  compact?: boolean
}

export function AdvancedSearch({ className = '', compact = false }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { filters, setFilters, clearFilters, addSavedSearch } = useAppStore()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savedSearchName, setSavedSearchName] = useState('')

  const activeFilterCount = [
    filters.searchQuery,
    filters.region,
    filters.impactLevel?.length,
    filters.classification?.length,
    filters.dateRange,
    filters.tags?.length,
  ].filter(Boolean).length

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters({ searchQuery: query || undefined })
  }

  const handleToggleImpact = (level: typeof impactLevels[number]['value']) => {
    const current = filters.impactLevel || []
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level]
    setFilters({ impactLevel: updated.length > 0 ? updated : undefined })
  }

  const handleToggleClassification = (level: typeof classifications[number]['value']) => {
    const current = filters.classification || []
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level]
    setFilters({ classification: updated.length > 0 ? updated : undefined })
  }

  const handleDateRange = (value: string) => {
    if (value === 'custom') return
    const range = dateRanges.find((r) => r.value === value)
    if (range) {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - range.days)
      setFilters({
        dateRange: { start, end }
      })
    }
  }

  const handleClearFilters = () => {
    clearFilters()
    setSearchQuery('')
    toast.info('All filters cleared', { duration: 2500 })
  }

  const handleSaveSearch = () => {
    if (!savedSearchName.trim()) {
      toast.error('Please enter a name for this search')
      return
    }
    addSavedSearch(savedSearchName, filters)
    setShowSaveModal(false)
    setSavedSearchName('')
    toast.success('Search saved successfully', {
      title: 'Saved Search',
      duration: 3000,
    })
  }

  const hasActiveFilters = activeFilterCount > 0

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search briefs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-bg-elevated border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-surface rounded transition-colors"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 bg-bg-elevated border border-border rounded-lg transition-all',
            hasActiveFilters && 'border-primary text-primary',
            !hasActiveFilters && 'hover:border-border-strong'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 bg-primary text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter Panel */}
        {isOpen && (
          <FilterPanel
            filters={filters}
            onToggleImpact={handleToggleImpact}
            onToggleClassification={handleToggleClassification}
            onDateRange={handleDateRange}
            onClearFilters={handleClearFilters}
            onClose={() => setIsOpen(false)}
            onSaveSearch={() => setShowSaveModal(true)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar with Filter Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search briefs by title, region, or tags..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-bg-elevated border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-surface rounded transition-colors"
            >
              <X className="w-5 h-5 text-text-tertiary" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 bg-bg-elevated border border-border rounded-lg transition-all',
            hasActiveFilters && 'border-primary text-primary',
            !hasActiveFilters && 'hover:border-border-strong'
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 bg-primary text-white text-sm rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-3 text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <FilterPanel
          filters={filters}
          onToggleImpact={handleToggleImpact}
          onToggleClassification={handleToggleClassification}
          onDateRange={handleDateRange}
          onClearFilters={handleClearFilters}
          onClose={() => setIsOpen(false)}
          onSaveSearch={() => setShowSaveModal(true)}
        />
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-bg-elevated border border-border rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-display font-semibold text-text mb-4">Save Search</h3>
            <input
              type="text"
              placeholder="Enter a name for this search..."
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
              className="w-full px-4 py-2 bg-bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              autoFocus
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setSavedSearchName('')
                }}
                className="px-4 py-2 text-text-secondary hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Filter Panel Component
interface FilterPanelProps {
  filters: BriefFilters
  onToggleImpact: (level: 'HIGH' | 'MEDIUM' | 'LOW') => void
  onToggleClassification: (level: 'unclassified' | 'official' | 'confidential' | 'secret') => void
  onDateRange: (value: string) => void
  onClearFilters: () => void
  onClose: () => void
  onSaveSearch: () => void
}

function FilterPanel({
  filters,
  onToggleImpact,
  onToggleClassification,
  onDateRange,
  onClearFilters,
  onClose,
  onSaveSearch,
}: FilterPanelProps) {
  return (
    <div className="bg-bg-elevated border border-border rounded-lg p-6 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Advanced Filters</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-tertiary" />
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Impact Level */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-sm font-semibold text-text uppercase tracking-wide">Impact Level</h4>
          </div>
          <div className="space-y-2">
            {impactLevels.map((level) => {
              const isSelected = filters.impactLevel?.includes(level.value)
              return (
                <button
                  key={level.value}
                  onClick={() => onToggleImpact(level.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                    'border',
                    isSelected
                      ? `${level.color} border-current bg-bg-surface`
                      : 'border-border hover:border-border-strong text-text'
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded-sm border-2 flex items-center justify-center',
                    isSelected ? level.color + ' border-current' : 'border-text-tertiary'
                  )}>
                    {isSelected && <span className="w-2 h-2 rounded-sm bg-current" />}
                  </span>
                  {level.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Classification */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-sm font-semibold text-text uppercase tracking-wide">Classification</h4>
          </div>
          <div className="space-y-2">
            {classifications.map((level) => {
              const isSelected = filters.classification?.includes(level.value)
              return (
                <button
                  key={level.value}
                  onClick={() => onToggleClassification(level.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all border',
                    isSelected ? 'ring-2 ring-offset-1 ring-primary/20' : 'hover:border-border-strong'
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded-sm border-2 flex items-center justify-center',
                    isSelected ? 'bg-primary border-primary' : 'border-text-tertiary'
                  )}>
                    {isSelected && <span className="w-2 h-2 rounded-sm bg-white" />}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-semibold uppercase',
                    level.color
                  )}>
                    {level.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-sm font-semibold text-text uppercase tracking-wide">Date Range</h4>
          </div>
          <div className="space-y-2">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => onDateRange(range.value)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all border',
                  'hover:border-border-strong',
                  filters.dateRange && 'border-primary text-primary bg-primary-lighter'
                )}
              >
                <Clock className="w-4 h-4" />
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
        <button
          onClick={onSaveSearch}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          <Tag className="w-4 h-4" />
          Save this search
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Clear filters
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  )
}

// Saved Searches List Component
interface SavedSearchesListProps {
  onSelect?: (filters: BriefFilters) => void
  className?: string
}

export function SavedSearchesList({ onSelect, className = '' }: SavedSearchesListProps) {
  const { savedSearches, deleteSavedSearch, applySavedSearch } = useAppStore()

  if (savedSearches.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Saved Searches</h4>
      <div className="space-y-2">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-3 bg-bg-surface border border-border rounded-lg group hover:border-primary transition-colors"
          >
            <button
              onClick={() => {
                applySavedSearch(search.id)
                onSelect?.(search.filters)
              }}
              className="flex-1 text-left"
            >
              <div className="font-medium text-text text-sm">{search.name}</div>
              <div className="text-xs text-text-tertiary mt-1">
                {search.filters.searchQuery && `"${search.filters.searchQuery}"`}
                {search.filters.region && ` • ${search.filters.region}`}
                {search.filters.impactLevel && ` • ${search.filters.impactLevel.length} impacts`}
              </div>
            </button>
            <button
              onClick={() => {
                deleteSavedSearch(search.id)
                toast.info('Search removed', { duration: 2000 })
              }}
              className="p-1.5 hover:bg-bg-elevated rounded transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete saved search"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
