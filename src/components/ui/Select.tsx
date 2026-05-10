import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  className?: string
}

interface OptionGroup {
  label: string
  options: SelectOption[]
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      label,
      error,
      disabled = false,
      searchable = false,
      clearable = false,
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const optionsListRef = useRef<HTMLDivElement>(null)

    // Group options if they have groups
    const groupedOptions = React.useMemo(() => {
      const groups: Record<string, SelectOption[]> = {}
      const ungrouped: SelectOption[] = []

      options.forEach((option) => {
        if (option.group) {
          if (!groups[option.group]) {
            groups[option.group] = []
          }
          groups[option.group].push(option)
        } else {
          ungrouped.push(option)
        }
      })

      const result: OptionGroup[] = []
      if (ungrouped.length > 0) {
        result.push({ label: '', options: ungrouped })
      }
      Object.entries(groups).forEach(([groupLabel, groupOptions]) => {
        result.push({ label: groupLabel, options: groupOptions })
      })

      return result
    }, [options])

    // Filter options based on search query
    const filteredGroups = React.useMemo(() => {
      if (!searchQuery) return groupedOptions

      return groupedOptions.map((group) => ({
        ...group,
        options: group.options.filter(
          (option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            option.value.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((group) => group.options.length > 0)
    }, [groupedOptions, searchQuery])

    // Flatten options for keyboard navigation
    const flatOptions = React.useMemo(
      () => filteredGroups.flatMap((group) => group.options),
      [filteredGroups]
    )

    const selectedOption = options.find((opt) => opt.value === value)

    const handleSelect = useCallback((optionValue: string) => {
      const option = options.find((opt) => opt.value === optionValue)
      if (option && !option.disabled) {
        onChange(optionValue)
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
      }
    }, [options, onChange])

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange('')
      setSearchQuery('')
    }

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!isOpen) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }
          return
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            setFocusedIndex((prev) => {
              const next = prev + 1
              if (next >= flatOptions.length) return 0
              return next
            })
            break
          case 'ArrowUp':
            e.preventDefault()
            setFocusedIndex((prev) => {
              const next = prev - 1
              if (next < 0) return flatOptions.length - 1
              return next
            })
            break
          case 'Enter':
            e.preventDefault()
            if (focusedIndex >= 0 && focusedIndex < flatOptions.length) {
              handleSelect(flatOptions[focusedIndex].value)
            }
            break
          case 'Escape':
            setIsOpen(false)
            setSearchQuery('')
            setFocusedIndex(-1)
            break
          case 'Tab':
            setIsOpen(false)
            break
        }
      },
      [isOpen, focusedIndex, flatOptions, handleSelect]
    )

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Scroll focused option into view
    useEffect(() => {
      if (focusedIndex >= 0 && optionsListRef.current) {
        const options = optionsListRef.current.querySelectorAll('[role="option"]')
        const focusedOption = options[focusedIndex] as HTMLElement
        focusedOption?.scrollIntoView({ block: 'nearest' })
      }
    }, [focusedIndex])

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            ref={ref as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full flex items-center justify-between px-4 py-2.5 border rounded-lg',
              'transition-all duration-200 ease-out',
              // Focus states
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)]',
              // Hover state
              'hover:border-primary/40 hover:shadow-sm',
              // Active state
              'active:scale-[0.99]',
              // Disabled state
              'disabled:bg-bg-surface disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-border-strong',
              // Error state
              error ? 'border-red-500' : 'border-border-strong',
              'bg-bg-elevated',
              className
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={cn('truncate', !selectedOption && 'text-text-tertiary')}>
              {selectedOption?.label || placeholder}
            </span>
            <div className="flex items-center gap-2">
              {clearable && selectedOption && (
                <X
                  className="w-4 h-4 text-text-tertiary hover:text-text"
                  onClick={handleClear}
                />
              )}
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-text-tertiary transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-bg-elevated border border-border rounded-radius-lg shadow-lg animate-slide-down overflow-hidden">
              {searchable && (
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setFocusedIndex(-1)
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search options..."
                      className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-radius-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          inputRef.current?.focus()
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-surface rounded"
                      >
                        <X className="w-3 h-3 text-text-tertiary" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div
                ref={optionsListRef}
                className="max-h-60 overflow-auto py-1"
                role="listbox"
                aria-activedescendant={focusedIndex >= 0 ? `option-${focusedIndex}` : undefined}
              >
                {filteredGroups.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-tertiary text-sm">
                    No options found
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.label || 'ungrouped'}>
                      {group.label && (
                        <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wide bg-bg-surface">
                          {group.label}
                        </div>
                      )}
                      {group.options.map((option) => {
                        const isSelected = option.value === value
                        const isFocused =
                          focusedIndex === flatOptions.indexOf(option)

                        return (
                          <button
                            key={option.value}
                            id={`option-${flatOptions.indexOf(option)}`}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            disabled={option.disabled}
                            className={cn(
                              // Base styles
                              'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-150',
                              // Focus
                              'focus:outline-none focus:bg-primary/5',
                              // Selected state
                              isSelected && 'bg-primary/10 text-primary font-medium',
                              // Focused state
                              isFocused && !isSelected && 'bg-bg-subtle',
                              // Disabled state
                              option.disabled && 'opacity-50 cursor-not-allowed',
                              // Hover state
                              !isSelected && !isFocused && 'hover:bg-bg-subtle/60',
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="truncate">{option.label}</span>
                            {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

// Multi-select variant
interface MultiSelectProps extends Omit<SelectProps, 'value' | 'onChange'> {
  value?: string[]
  onChange: (values: string[]) => void
  maxDisplay?: number
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      value = [],
      onChange,
      placeholder = 'Select...',
      label,
      error,
      disabled = false,
      searchable = false,
      maxDisplay = 3,
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOptions = options.filter((opt) => value.includes(opt.value))

    const handleToggle = (optionValue: string) => {
      const option = options.find((opt) => opt.value === optionValue)
      if (option && !option.disabled) {
        const newValue = value.includes(optionValue)
          ? value.filter((v) => v !== optionValue)
          : [...value, optionValue]
        onChange(newValue)
      }
    }

    const handleClear = () => {
      onChange([])
      setSearchQuery('')
    }

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            ref={ref as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full min-h-[42px] flex items-center gap-2 px-3 py-2 border rounded-radius-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
              'disabled:bg-bg-surface disabled:cursor-not-allowed',
              error ? 'border-red' : 'border-border-strong hover:border-accent/50',
              'bg-bg-elevated',
              className
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              {selectedOptions.length === 0 ? (
                <span className="text-text-tertiary">{placeholder}</span>
              ) : (
                <>
                  {selectedOptions.slice(0, maxDisplay).map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-dark rounded-md text-sm"
                    >
                      {option.label}
                      <X
                        className="w-3 h-3 hover:text-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggle(option.value)
                        }}
                      />
                    </span>
                  ))}
                  {selectedOptions.length > maxDisplay && (
                    <span className="text-sm text-text-tertiary">
                      +{selectedOptions.length - maxDisplay} more
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedOptions.length > 0 && (
                <X
                  className="w-4 h-4 text-text-tertiary hover:text-text"
                  onClick={handleClear}
                />
              )}
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-text-tertiary transition-transform flex-shrink-0',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-bg-elevated border border-border rounded-radius-lg shadow-lg animate-slide-down overflow-hidden">
              {searchable && (
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-radius-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-60 overflow-auto py-1" role="listbox">
                {options
                  .filter(
                    (option) =>
                      !searchQuery ||
                      option.label.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((option) => {
                    const isSelected = value.includes(option.value)

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        disabled={option.disabled}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                          'focus:outline-none',
                          isSelected && 'bg-accent/10 text-accent font-medium',
                          !isSelected && 'hover:bg-bg-surface',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                          isSelected ? 'bg-accent border-accent' : 'border-border-strong'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{option.label}</span>
                      </button>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red">{error}</p>
        )}
      </div>
    )
  }
)

MultiSelect.displayName = 'MultiSelect'
