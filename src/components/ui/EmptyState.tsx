import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/formatters'

type EmptyStateTone = 'primary' | 'accent' | 'gold' | 'success' | 'warning' | 'error' | 'neutral'

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  /** Decorative colour for the icon background */
  tone?: EmptyStateTone
  eyebrow?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'accent' | 'gold' | 'success' | 'outline'
  }
  className?: string
}

const TONE_CLASSES: Record<EmptyStateTone, string> = {
  primary: 'bg-primary/10 text-primary',
  accent:  'bg-accent/10 text-accent',
  gold:    'bg-gold/10 text-gold',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error:   'bg-error/10 text-error',
  neutral: 'bg-bg-subtle text-text-tertiary',
}

export function EmptyState({
  icon: Icon,
  tone = 'primary',
  eyebrow,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center mb-5 motion-safe:animate-float',
          TONE_CLASSES[tone],
        )}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      {eyebrow && <p className="editorial-eyebrow text-text-muted mb-2">{eyebrow}</p>}
      <h3 className="font-display font-semibold text-text text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary font-ui leading-relaxed max-w-sm mb-0">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <button
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-ui',
              'transition-[transform,box-shadow,background-color] duration-150 ease-out',
              'hover:-translate-y-px active:scale-[0.97]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              action.variant === 'outline'
                ? 'border border-border text-text-secondary hover:text-text hover:border-border-strong'
                : action.variant === 'accent'
                ? 'bg-accent text-white hover:bg-accent-hover hover:shadow-glow-accent'
                : action.variant === 'gold'
                ? 'bg-gold text-bg-elevated hover:bg-gold-hover hover:shadow-glow-gold'
                : action.variant === 'success'
                ? 'bg-success-bright text-white hover:shadow-glow-success'
                : 'bg-primary text-white hover:bg-primary-hover hover:shadow-glow-primary',
            )}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}

// Pre-configured empty states for common scenarios
export function EmptyBriefs({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}
      title="No Briefs Found"
      description="No policy intelligence briefs match your current filters. Try adjusting your search criteria or create a new brief."
      action={onCreate ? { label: 'Create New Brief', onClick: onCreate } : undefined}
    />
  )
}

export function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      )}
      title="No Results Found"
      description="We couldn't find any results matching your search. Try different keywords or clear your filters."
      action={{ label: 'Clear Search', onClick: onClear }}
    />
  )
}

export function EmptyFilters({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      )}
      title="No Matches"
      description="No items match your current filter settings."
      action={{ label: 'Reset Filters', onClick: onReset }}
    />
  )
}
