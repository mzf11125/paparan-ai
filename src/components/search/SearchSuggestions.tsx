import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Clock, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SuggestionItem {
  id: string
  type: 'brief' | 'history' | 'filter'
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  action: () => void
}

interface SearchSuggestionsProps {
  query: string
  suggestions: SuggestionItem[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onSelectSuggestion: (suggestion: SuggestionItem) => void
  recentSearches?: string[]
  onClearRecent?: () => void
  className?: string
}

export function SearchSuggestions({
  query,
  suggestions,
  selectedIndex,
  onSelectIndex,
  onSelectSuggestion,
  recentSearches = [],
  onClearRecent,
  className = '',
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset selection when query changes
  useEffect(() => {
    onSelectIndex(0)
  }, [query, onSelectIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (containerRef.current) {
      const selectedElement = containerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Filter suggestions based on query
  const filteredSuggestions = query
    ? suggestions.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.subtitle?.toLowerCase().includes(query.toLowerCase())
      )
    : suggestions.slice(0, 6)

  const hasResults = filteredSuggestions.length > 0 || recentSearches.length > 0

  if (!hasResults && !query) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute top-full left-0 right-0 mt-2 bg-white dark:bg-bg-elevated rounded-xl shadow-xl border border-border overflow-hidden z-50 max-h-96 overflow-y-auto',
        className
      )}
    >
      {/* Recent Searches (shown when no query) */}
      {!query && recentSearches.length > 0 && (
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Recent Searches
            </div>
            {onClearRecent && (
              <button
                onClick={onClearRecent}
                className="text-xs text-text-secondary hover:text-text transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {recentSearches.map((search, i) => (
            <button
              key={`recent-${i}`}
              data-index={i}
              onClick={() => onSelectSuggestion({
                id: `recent-${i}`,
                type: 'history',
                title: search,
                action: () => {},
              })}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                selectedIndex === i
                  ? 'bg-primary-light/20 text-primary'
                  : 'hover:bg-bg-surface text-text'
              )}
            >
              <Clock className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              <span className="flex-1">{search}</span>
            </button>
          ))}
        </>
      )}

      {/* Suggestion Results */}
      {filteredSuggestions.length > 0 && (
        <>
          {query && recentSearches.length > 0 && (
            <div className="border-t border-border" />
          )}
          <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            {query ? 'Results' : 'Suggestions'}
          </div>
          {filteredSuggestions.map((suggestion, i) => {
            const index = query ? i : i + recentSearches.length
            const Icon = suggestion.icon || FileText

            return (
              <button
                key={suggestion.id}
                data-index={index}
                onClick={() => {
                  onSelectSuggestion(suggestion)
                  suggestion.action()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  selectedIndex === index
                    ? 'bg-primary-light/20 text-primary'
                    : 'hover:bg-bg-surface text-text'
                )}
              >
                <Icon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{suggestion.title}</div>
                  {suggestion.subtitle && (
                    <div className="text-xs text-text-tertiary truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
                {suggestion.type === 'brief' && (
                  <span className="text-xs text-text-tertiary">Brief</span>
                )}
              </button>
            )
          })}
        </>
      )}

      {/* No Results */}
      {query && filteredSuggestions.length === 0 && (
        <div className="px-4 py-8 text-center text-text-secondary">
          <Search className="w-8 h-8 mx-auto mb-2 text-text-tertiary" />
          <p>No results found for "{query}"</p>
          <p className="text-sm text-text-tertiary mt-1">Try different keywords or browse categories</p>
        </div>
      )}

      {/* Keyboard Shortcuts Footer */}
      {hasResults && (
        <div className="px-4 py-2 bg-bg-surface border-t border-border flex items-center justify-between text-xs text-text-tertiary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">esc</kbd>
              Close
            </span>
          </div>
          <button
            onClick={onClearRecent}
            className="flex items-center gap-1 hover:text-text transition-colors"
          >
            <X className="w-3 h-3" />
            Clear history
          </button>
        </div>
      )}
    </div>
  )
}

// Filter Pills Component
interface FilterPillsProps {
  filters: Array<{ id: string; label: string; active?: boolean; count?: number }>
  onToggle: (id: string) => void
  className?: string
}

export function FilterPills({ filters, onToggle, className = '' }: FilterPillsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className="text-xs font-medium text-text-tertiary">Filters:</span>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onToggle(filter.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            filter.active
              ? 'bg-primary text-white'
              : 'bg-bg-surface text-text-secondary hover:text-text hover:bg-bg-elevated'
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              filter.active ? 'bg-white/20' : 'bg-text-tertiary/20'
            )}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Recent Searches Manager Hook
export function useRecentSearches(maxItems = 10) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('paparan-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }
  }, [])

  // Add a search to history
  const addSearch = (query: string) => {
    if (!query.trim()) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query)
      const updated = [query, ...filtered].slice(0, maxItems)
      localStorage.setItem('paparan-recent-searches', JSON.stringify(updated))
      return updated
    })
  }

  // Clear all searches
  const clearSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('paparan-recent-searches')
  }

  return {
    recentSearches,
    addSearch,
    clearSearches,
  }
}
