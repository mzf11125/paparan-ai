import React from 'react'
import { cn } from '@/utils/formatters'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PageIndicatorProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  className?: string
  variant?: 'default' | 'compact' | 'document'
  showTotal?: boolean
}

export const PageIndicator = React.forwardRef<HTMLDivElement, PageIndicatorProps>(
  ({ currentPage, totalPages, onPageChange, className = '', variant = 'default', showTotal = false }, ref) => {
  const getButtonStyles = (page: number) => {
    const isActive = page === currentPage
    return cn(
      'page-number',
      'min-w-[2.5rem]',
      isActive && 'page-number-active'
    )
  }

  if (variant === 'compact') {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2 text-sm text-text-secondary', className)}
      >
        <span className="tabular-nums">
          Page <span className="font-semibold text-text">{currentPage}</span>
          {showTotal && <> of {totalPages}</>}
        </span>
      </div>
    )
  }

  if (variant === 'document') {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between py-4 border-t border-border', className)}
      >
        <button
          onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded',
            'bg-bg-elevated border border-border',
            'hover:border-primary hover:text-primary transition-colors',
            currentPage === 1 && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange?.(page)}
              className={getButtonStyles(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded',
            'bg-bg-elevated border border-border',
            'hover:border-primary hover:text-primary transition-colors',
            currentPage === totalPages && 'opacity-50 cursor-not-allowed'
          )}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2', className)}
    >
      <button
        onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'p-2 rounded border border-border',
          'hover:border-primary hover:text-primary transition-colors',
          currentPage === 1 && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={getButtonStyles(page)}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => currentPage < totalPages && onPageChange?.(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'p-2 rounded border border-border',
          'hover:border-primary hover:text-primary transition-colors',
          currentPage === totalPages && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {showTotal && (
        <span className="ml-4 text-sm text-text-tertiary tabular-nums">
          of {totalPages}
        </span>
      )}
    </div>
  )
})

PageIndicator.displayName = 'PageIndicator'
