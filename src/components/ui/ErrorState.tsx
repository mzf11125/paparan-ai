import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  title?: string
  variant?: 'default' | 'inline'
  className?: string
}

export function ErrorState({
  message,
  onRetry,
  title = 'Something went wrong',
  variant = 'default',
  className,
}: ErrorStateProps) {
  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-center gap-3 px-4 py-3 bg-error/10 border border-error/25 rounded-lg text-sm',
          className,
        )}
      >
        <XCircle className="w-5 h-5 text-error flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text">{title}</p>
          <p className="text-text-secondary text-xs mt-0.5">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-error/15 hover:bg-error/25 text-error rounded-md text-xs font-medium transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center py-20 text-center px-6', className)}
    >
      <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-5 h-5 text-error" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-display font-semibold text-text mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-text hover:border-border-strong text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}

// Pre-configured error states for common scenarios
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  )
}

export function TimeoutError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Request Timed Out"
      message="The request took too long to complete. Please try again."
      onRetry={onRetry}
    />
  )
}

export function AuthenticationError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Authentication Error"
      message="Your session may have expired. Please sign in again to continue."
      onRetry={onRetry}
    />
  )
}

export function NotFoundError({ message = 'The requested resource was not found.' }: { message?: string }) {
  return <ErrorState title="Not Found" message={message} />
}
