import { useState, useEffect, useRef } from 'react'
import { Search, FileText, BarChart3, Settings, PlusCircle, X } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface CommandItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  action: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  briefs?: Array<{ id: string; title: string; region: string; tags?: string[] }>
}

export function CommandPalette({ isOpen, onClose, briefs = [] }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: CommandItem[] = [
    {
      id: 'briefs',
      label: 'Go to Briefs Library',
      icon: FileText,
      action: () => {
        window.location.href = '/briefs'
        onClose()
      },
      keywords: ['briefs', 'library', 'list']
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: BarChart3,
      action: () => {
        window.location.href = '/dashboard'
        onClose()
      },
      keywords: ['dashboard', 'analytics', 'stats']
    },
    {
      id: 'create',
      label: 'Create New Brief',
      icon: PlusCircle,
      action: () => {
        window.location.href = '/editor'
        onClose()
      },
      keywords: ['create', 'new', 'add', 'editor']
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      action: () => {
        window.location.href = '/settings'
        onClose()
      },
      keywords: ['settings', 'preferences', 'config']
    }
  ]

  // Add briefs to commands
  const briefCommands: CommandItem[] = briefs.slice(0, 5).map((brief) => ({
    id: brief.id,
    label: brief.title,
    icon: FileText,
    action: () => {
      window.location.href = `/briefs/${brief.id}`
      onClose()
    },
    keywords: [brief.title, brief.region, ...(brief.tags || [])]
  }))

  const allCommands = [...commands, ...briefCommands]

  // Filter commands based on query
  const filteredCommands = allCommands.filter((command) => {
    if (!query) return true

    const lowerQuery = query.toLowerCase()
    return (
      command.label.toLowerCase().includes(lowerQuery) ||
      command.keywords?.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
    )
  })

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          filteredCommands[selectedIndex]?.action()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <>
              {query && briefCommands.filter((c) => filteredCommands.includes(c)).length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                  Briefs
                </div>
              )}
              {filteredCommands.map((command, index) => {
                const Icon = command.icon
                const isSelected = index === selectedIndex
                const isBrief = briefCommands.includes(command)

                return (
                  <button
                    key={command.id}
                    onClick={command.action}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      isSelected ? 'bg-[#C8A96A]/10' : 'hover:bg-gray-50'
                    )}
                  >
                    {Icon && <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    <span className="flex-1 text-gray-900">{command.label}</span>
                    {isBrief && (
                      <span className="text-xs text-gray-400">Brief</span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
              Select
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to use command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev)
  }
}
