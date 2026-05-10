import { useEffect, useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface Shortcut {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  label: string
  shortcuts: Shortcut[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Global',
    shortcuts: [
      { keys: ['?'],            description: 'Show this keyboard help' },
      { keys: ['⌘', 'K'],        description: 'Open command palette' },
      { keys: ['/'],            description: 'Focus search' },
      { keys: ['Esc'],          description: 'Close dialog or modal' },
    ],
  },
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['g', 'h'],        description: 'Go to Intelligence Feed' },
      { keys: ['g', 'b'],        description: 'Go to Briefs Library' },
      { keys: ['g', 'r'],        description: 'Go to Reports' },
      { keys: ['g', 't'],        description: 'Go to Timeline' },
      { keys: ['g', 'w'],        description: 'Go to Watchlist' },
      { keys: ['g', 'n'],        description: 'Go to Inbox' },
      { keys: ['g', 'c'],        description: 'Go to Compare' },
      { keys: ['g', 's'],        description: 'Go to Settings' },
    ],
  },
  {
    label: 'Brief actions',
    shortcuts: [
      { keys: ['e'],            description: 'Edit current brief' },
      { keys: ['w'],            description: 'Toggle watchlist' },
      { keys: ['+'],            description: 'Add to compare' },
      { keys: ['p'],            description: 'Print brief' },
      { keys: ['c'],            description: 'Copy citation' },
    ],
  },
  {
    label: 'Reading',
    shortcuts: [
      { keys: ['f'],            description: 'Toggle focus mode' },
      { keys: ['j'],            description: 'Next section' },
      { keys: ['k'],            description: 'Previous section' },
      { keys: ['t'],            description: 'Toggle theme (light/dark)' },
    ],
  },
]

export const KEYBOARD_HELP_EVENT = 'paparan:open-keyboard-help'

/** Dispatch from anywhere (e.g. a footer link) to open the help sheet. */
export function openKeyboardHelp() {
  window.dispatchEvent(new CustomEvent(KEYBOARD_HELP_EVENT))
}

export function useKeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ? key (shift+/) opens help, ignored when typing
      const target = e.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isTyping) return

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setIsOpen(true)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    const onCustom = () => setIsOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(KEYBOARD_HELP_EVENT, onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(KEYBOARD_HELP_EVENT, onCustom)
    }
  }, [isOpen])

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }
}

export function KeyboardHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-help-title"
    >
      <button
        onClick={onClose}
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
        aria-label="Close keyboard help"
      />
      <div className="relative w-full max-w-2xl bg-bg-elevated border border-border rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-text-tertiary" />
            <h2 id="kbd-help-title" className="font-display font-semibold text-text">Keyboard shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text hover:bg-bg-subtle transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {SHORTCUT_GROUPS.map(group => (
              <section key={group.label}>
                <p className="editorial-eyebrow text-text-muted mb-3">{group.label}</p>
                <ul className="space-y-2">
                  {group.shortcuts.map(s => (
                    <li key={s.description} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-text-secondary font-ui">{s.description}</span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        {s.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className={cn(
                              'inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5',
                              'rounded border border-border bg-bg-surface',
                              'font-mono text-[11px] font-semibold text-text tabular-nums',
                              'shadow-[0_1px_0_rgb(var(--color-border-rgb)/0.5)]'
                            )}
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-border text-xs text-text-tertiary font-ui flex items-center justify-between">
          <span>Press <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-border bg-bg-surface">?</kbd> any time to reopen.</span>
          <span className="text-text-muted">Esc to close</span>
        </footer>
      </div>
    </div>
  )
}
