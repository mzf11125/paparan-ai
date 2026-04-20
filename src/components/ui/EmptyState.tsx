import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/formatters'

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Pre-configured empty states for common scenarios
export function EmptyBriefs({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
