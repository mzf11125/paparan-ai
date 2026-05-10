import { useState, useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'
import { Clock, BookOpen, Eye, EyeOff, ChevronUp, Maximize2 } from 'lucide-react'

/* ============================================
   READING PROGRESS — Scroll & Reading Metrics
   Shows reading progress, estimated time, sections
   ============================================ */

interface ReadingProgressProps {
  targetRef?: React.RefObject<HTMLElement>
  sections?: Array<{ id: string; title: string }>
  showEstimatedTime?: boolean
  showSectionNav?: boolean
  position?: 'top' | 'bottom' | 'both'
  className?: string
  onDistractionFreeToggle?: (enabled: boolean) => void
}

export function ReadingProgress({
  targetRef,
  sections = [],
  showEstimatedTime = true,
  showSectionNav = true,
  position = 'top',
  className = '',
  onDistractionFreeToggle,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [activeSection, setActiveSection] = useState<string>('')
  const [readingTime, setReadingTime] = useState(0)
  const [isDistractionFree, setIsDistractionFree] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  // Calculate reading progress
  useEffect(() => {
    const target = targetRef?.current || document.documentElement
    let rafId: number

    const updateProgress = () => {
      const scrollTop = window.scrollY || target.scrollTop
      const scrollHeight = target.scrollHeight - window.innerHeight
      const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setProgress(Math.min(100, Math.max(0, scrollPercent)))

      // Update active section based on scroll position
      if (showSectionNav && sections.length > 0) {
        for (const section of sections) {
          const element = document.getElementById(section.id)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= 150 && rect.bottom >= 150) {
              setActiveSection(section.id)
              break
            }
          }
        }
      }

      rafId = requestAnimationFrame(updateProgress)
    }

    rafId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(rafId)
  }, [targetRef, sections, showSectionNav])

  // Calculate reading time
  useEffect(() => {
    if (!showEstimatedTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setReadingTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [showEstimatedTime])

  // Format reading time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Toggle distraction-free mode
  const toggleDistractionFree = () => {
    const newState = !isDistractionFree
    setIsDistractionFree(newState)
    onDistractionFreeToggle?.(newState)

    // Toggle class on body
    if (newState) {
      document.body.classList.add('distraction-free-mode')
    } else {
      document.body.classList.remove('distraction-free-mode')
    }
  }

  const progressColor = progress >= 100 ? 'bg-green-500' : 'bg-primary'

  return (
    <div className={cn('reading-progress-container', className)}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-bg-surface">
        <div
          className={cn('h-full transition-all duration-150 ease-out', progressColor)}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reading Stats Bar */}
      <div
        className={cn(
          'fixed z-40 bg-white/95 dark:bg-bg-elevated/95 backdrop-blur-sm border-b border-border transition-all duration-200',
          position === 'top' || position === 'both' ? 'top-1' : '',
          position === 'bottom' || position === 'both' ? 'bottom-0' : '',
          isDistractionFree ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-ui">
          {/* Left: Progress & Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-text-secondary">
                {progress.toFixed(0)}% complete
              </span>
            </div>
            {showEstimatedTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-text-secondary font-mono">
                  {formatTime(readingTime)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDistractionFree}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                'hover:bg-bg-surface text-text-secondary'
              )}
              title={isDistractionFree ? 'Exit distraction-free mode' : 'Enter distraction-free mode'}
            >
              {isDistractionFree ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Focus</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Focus Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Section Navigation (floating) */}
      {showSectionNav && sections.length > 0 && !isDistractionFree && (
        <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:block">
          <div className="bg-white dark:bg-bg-elevated rounded-lg border border-border shadow-lg p-2 space-y-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                  activeSection === section.id
                    ? 'bg-primary-light/20 text-primary'
                    : 'text-text-secondary hover:bg-bg-surface'
                )}
                title={section.title}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    activeSection === section.id ? 'bg-primary' : 'bg-text-tertiary'
                  )}
                />
                <span className="max-w-[120px] truncate">{section.title}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Scroll to Top Button */}
      {progress > 20 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn(
            'fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg transition-all duration-200',
            'bg-primary text-white hover:bg-primary-dark',
            'hover:scale-110 active:scale-95',
            isDistractionFree && 'opacity-0 pointer-events-none'
          )}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

/* ============================================
   READING MODE TOGGLE — Switch reading modes
   ============================================ */

type ReadingMode = 'default' | 'comfortable' | 'focused' | 'distraction-free'

interface ReadingModeToggleProps {
  mode: ReadingMode
  onChange: (mode: ReadingMode) => void
  className?: string
}

export function ReadingModeToggle({
  mode,
  onChange,
  className = '',
}: ReadingModeToggleProps) {
  const modes: Array<{ value: ReadingMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: 'default', label: 'Default', icon: BookOpen },
    { value: 'comfortable', label: 'Comfortable', icon: Maximize2 },
    { value: 'focused', label: 'Focused', icon: Eye },
    { value: 'distraction-free', label: 'Zen', icon: EyeOff },
  ]

  return (
    <div className={cn('flex items-center gap-1 bg-bg-surface rounded-lg p-1 border border-border', className)}>
      {modes.map((m) => {
        const Icon = m.icon
        const isActive = mode === m.value

        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              isActive
                ? 'bg-white dark:bg-bg-elevated text-primary shadow-sm'
                : 'text-text-secondary hover:text-text'
            )}
            title={m.label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ============================================
   ESTIMATED READING TIME — Word count & time
   ============================================ */

interface EstimatedReadingTimeProps {
  content: string
  wordsPerMinute?: number
  className?: string
}

export function EstimatedReadingTime({
  content,
  wordsPerMinute = 200,
  className = '',
}: EstimatedReadingTimeProps) {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  return (
    <div className={cn('flex items-center gap-2 text-xs text-text-tertiary font-ui', className)}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        {wordCount} words · {minutes} min read
      </span>
    </div>
  )
}

/* ============================================
   DOCUMENT SETTINGS — Typography & layout controls
   ============================================ */

interface DocumentSettingsProps {
  fontSize: number
  setFontSize: (size: number) => void
  lineHeight: number
  setLineHeight: (height: number) => void
  maxWidth: number
  setMaxWidth: (width: number) => void
  className?: string
}

export function DocumentSettings({
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  maxWidth,
  setMaxWidth,
  className = '',
}: DocumentSettingsProps) {
  return (
    <div className={cn('bg-white dark:bg-bg-elevated rounded-xl border border-border p-4 space-y-4', className)}>
      <h3 className="font-semibold text-text text-sm">Reading Settings</h3>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Font Size</span>
          <span className="font-mono text-text-tertiary">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={14}
          max={24}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full h-2 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Line Height</span>
          <span className="font-mono text-text-tertiary">{lineHeight.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={1.2}
          max={2.2}
          step={0.1}
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          className="w-full h-2 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Content Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Content Width</span>
          <span className="font-mono text-text-tertiary">{maxWidth}px</span>
        </div>
        <div className="flex gap-2">
          {[600, 700, 800, 900].map((width) => (
            <button
              key={width}
              onClick={() => setMaxWidth(width)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg transition-colors',
                maxWidth === width
                  ? 'bg-primary text-white'
                  : 'bg-bg-surface text-text-secondary hover:text-text'
              )}
            >
              {width}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          setFontSize(16)
          setLineHeight(1.7)
          setMaxWidth(700)
        }}
        className="w-full py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-surface transition-colors"
      >
        Reset to defaults
      </button>
    </div>
  )
}
