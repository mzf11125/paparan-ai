import { useState } from 'react'
import { Globe, ChevronDown, MapPin, Check } from 'lucide-react'
import { cn } from '@/utils/formatters'
import { useAppStore } from '@/contexts/AppContext'

const regions = [
  { id: 'all', label: 'All Regions', flag: '🌍' },
  { id: 'APAC', label: 'Asia Pacific', flag: '🌏' },
  { id: 'EMEA', label: 'Europe & Africa', flag: '🌍' },
  { id: 'Americas', label: 'Americas', flag: '🌎' },
  { id: 'ASEAN', label: 'ASEAN', flag: '🏘️' },
  { id: 'Global', label: 'Global', flag: '🌐' },
]

export function RegionQuickSwitcher({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { filters, setFilters } = useAppStore()
  const currentRegion = regions.find((r) => r.id === filters.region) || regions[0]

  const handleSelectRegion = (regionId: string) => {
    if (regionId === 'all') {
      setFilters({ region: undefined })
    } else {
      setFilters({ region: regionId })
    }
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-bg-elevated border border-border rounded-lg',
          'hover:border-primary hover:shadow-sm transition-all',
          'text-sm font-medium text-text',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
        aria-label="Select region"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">{currentRegion.flag}</span>
        <span className="hidden md:inline">{currentRegion.label}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-text-tertiary transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Menu */}
          <div
            className="absolute right-0 mt-2 w-56 bg-bg-elevated border border-border rounded-lg shadow-lg z-20 animate-fade-in"
            role="listbox"
            aria-label="Regions"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                Filter by Region
              </div>
              <div className="mt-1" role="presentation">
                {regions.map((region) => {
                  const isSelected = filters.region === region.id || (region.id === 'all' && !filters.region)
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleSelectRegion(region.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        'hover:bg-bg-surface',
                        isSelected ? 'bg-primary-lighter text-primary font-medium' : 'text-text'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="text-base">{region.flag}</span>
                      <span className="flex-1 text-left">{region.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="px-3 py-2 border-t border-border bg-bg-surface rounded-b-lg">
              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>Quick navigation</span>
                <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border rounded">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Compact version for header
export function RegionQuickSwitcherCompact({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { filters, setFilters } = useAppStore()
  const currentRegion = regions.find((r) => r.id === filters.region) || regions[0]

  const handleSelectRegion = (regionId: string) => {
    if (regionId === 'all') {
      setFilters({ region: undefined })
    } else {
      setFilters({ region: regionId })
    }
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-elevated border border-border rounded-md',
          'hover:border-primary hover:shadow-sm transition-all',
          'text-xs font-medium text-text',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
        aria-label="Select region"
      >
        <span>{currentRegion.flag}</span>
        <span className="hidden sm:inline">{currentRegion.id === 'all' ? 'All' : currentRegion.id}</span>
        <ChevronDown className={cn(
          'w-3 h-3 text-text-tertiary transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 mt-2 w-48 bg-bg-elevated border border-border rounded-lg shadow-lg z-20 animate-fade-in"
            role="listbox"
          >
            <div className="p-1">
              {regions.map((region) => {
                const isSelected = filters.region === region.id || (region.id === 'all' && !filters.region)
                return (
                  <button
                    key={region.id}
                    onClick={() => handleSelectRegion(region.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      'hover:bg-bg-surface',
                      isSelected ? 'bg-primary-lighter text-primary' : 'text-text'
                    )}
                  >
                    <span>{region.flag}</span>
                    <span className="flex-1 text-left">{region.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
