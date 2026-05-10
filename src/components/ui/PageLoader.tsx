import { cn } from '@/utils/cn'

interface PageLoaderProps {
  label?: string
  fullscreen?: boolean
  className?: string
}

export function PageLoader({ label = 'Loading…', fullscreen = true, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-bg',
        fullscreen && 'min-h-screen min-h-dvh',
        !fullscreen && 'py-16',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="block w-9 h-9 rounded-full border-2 border-border-strong border-t-primary animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-sm text-text-secondary font-ui">{label}</p>
      </div>
    </div>
  )
}

export default PageLoader
