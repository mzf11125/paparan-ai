import { useState, useEffect, useRef } from 'react'
import { Search, X, Command } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  onShortcutTriggered?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  onShortcutTriggered
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [localValue, debounceMs, onChange])

  // Keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        onShortcutTriggered?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onShortcutTriggered])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-24 py-2.5 bg-bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-bg-elevated transition-all text-text placeholder:text-text-tertiary"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary bg-bg-elevated border border-border rounded">
          <Command className="w-3 h-3" />
          K
        </kbd>
        {localValue && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-bg-surface rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>
    </div>
  )
}
