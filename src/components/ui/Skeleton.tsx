import { cn } from '@/utils/cn'

/* ============================================
   SKELETON LOADING — PROFESSIONAL SHIMMER
   ============================================ */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
  className,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded max-w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    rounded: 'rounded-md',
  }

  const animationStyles = {
    pulse: 'animate-pulse-slow bg-bg-subtle',
    wave: '',
    none: 'bg-bg-subtle',
  }

  return (
    <div
      className={cn(
        'bg-bg-subtle',
        variantStyles[variant],
        animationStyles[animation],
        'overflow-hidden relative motion-reduce:animate-none',
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
      {...props}
    >
      {animation === 'wave' && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] motion-reduce:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg-elevated/60 to-transparent" />
        </div>
      )}
    </div>
  )
}

/* ============================================
   SKELETON CARD — BRIEF CARD LOADING
   ============================================ */

export function BriefCardSkeleton() {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 h-full shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <Skeleton variant="rounded" width={100} height={24} />
        <div className="flex gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2 mb-4">
        <Skeleton variant="text" width="85%" height={20} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>

      {/* Summary */}
      <div className="space-y-2 mb-4">
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="70%" height={14} />
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={75} height={24} />
        <Skeleton variant="rounded" width={65} height={24} />
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-border flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
        <Skeleton variant="rounded" width={100} height={32} />
      </div>
    </div>
  )
}

/* ============================================
   SKELETON TABLE — ROWS
   ============================================ */

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" width={80} height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              width={colIndex === 0 ? 120 : 100}
              height={16}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ============================================
   SKELETON STATS — KPI CARD
   ============================================ */

export function StatsCardSkeleton() {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 border-l-4 border-l-border-strong shadow-sm animate-fade-in">
      <div className="space-y-3">
        <Skeleton variant="text" width={120} height={14} />
        <Skeleton variant="text" width={80} height={32} />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width={100} height={14} />
        </div>
      </div>
    </div>
  )
}
