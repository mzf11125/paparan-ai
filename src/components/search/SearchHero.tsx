import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SearchHeroProps {
  onSearch: (query: string) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

const SUGGESTED_QUERIES = [
  'ASEAN economic integration',
  'Indonesia trade policy',
  'Philippines infrastructure',
  'Singapore digital economy',
  'Vietnam manufacturing',
  'Thailand tourism recovery',
]

export function SearchHero({
  onSearch,
  initialValue = '',
  placeholder = 'Search policy briefs, intelligence, and analysis...',
  className = '',
}: SearchHeroProps) {
  const [query, setQuery] = useState(initialValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Cycle through suggestions
  useEffect(() => {
    if (!query && !showSuggestions) {
      const interval = setInterval(() => {
        // Suggestions cycle automatically in AnimatedPlaceholder
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [query, showSuggestions])

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
    }
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Main Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light/20 border border-primary/30 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Policy Intelligence Portal</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-4">
          What intelligence do you need?
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Search across thousands of policy briefs, diplomatic communications, and strategic analysis from across ASEAN and Southeast Asia.
        </p>
      </div>

      {/* Search Bar Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-white dark:bg-[#0D0F14] rounded-2xl shadow-2xl border-2 border-primary/20 focus-within:border-primary/50 transition-colors duration-200">
          {/* Search Icon */}
          <div className="flex items-center justify-center w-14 h-14 text-text-tertiary">
            <Search className="w-6 h-6" />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="flex-1 h-14 bg-transparent border-0 outline-none text-text placeholder:text-text-tertiary text-lg"
            spellCheck={false}
            autoComplete="off"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pr-4">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-tertiary bg-bg-surface rounded-lg border border-border">
              <span>⌘</span>K
            </kbd>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="p-2 text-text-tertiary hover:text-text transition-colors rounded-lg hover:bg-bg-surface"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0D0F14] rounded-xl shadow-xl border border-border overflow-hidden z-50"
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto">
              <span className="text-xs font-medium text-text-tertiary whitespace-nowrap">Filters:</span>
              {['All Regions', 'ASEAN', 'Indonesia', 'Philippines', 'Singapore', 'Thailand', 'Vietnam'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text hover:bg-bg-surface rounded-lg whitespace-nowrap transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Suggestion List */}
            <div className="max-h-64 overflow-y-auto">
              {query ? (
                // Show matching suggestions
                SUGGESTED_QUERIES
                  .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-surface transition-colors"
                    >
                      <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <span className="text-text">{suggestion}</span>
                    </button>
                  ))
              ) : (
                // Show trending searches
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Trending Intelligence
                  </div>
                  {SUGGESTED_QUERIES.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-surface transition-colors group"
                    >
                      <TrendingUp className="w-4 h-4 text-text-tertiary group-hover:text-primary flex-shrink-0 transition-colors" />
                      <span className="text-text group-hover:text-primary transition-colors">{suggestion}</span>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-bg-surface border-t border-border flex items-center justify-between text-xs text-text-tertiary">
              <span>Use <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">↓</kbd> to navigate</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded">Enter</kbd> to search</span>
            </div>
          </div>
        )}
      </form>

      {/* Quick Stats */}
      <div className="flex items-center justify-center gap-8 mt-8 text-sm text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>2,847 briefs indexed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Updated 5 minutes ago</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>10 ASEAN countries</span>
        </div>
      </div>
    </div>
  )
}

// Animated placeholder text component
export function AnimatedPlaceholder({ suggestions }: { suggestions: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % suggestions.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [suggestions.length])

  return (
    <span className="text-text-tertiary">
      {suggestions[index]}
      <span className="animate-pulse">|</span>
    </span>
  )
}
