import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react'
import { cn } from '@/utils/formatters'

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
  className
}: ErrorStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 bg-red-500/[0.08] border border-red-500/[0.20] rounded-lg text-sm',
        className
      )}>
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-200">{title}</p>
          <p className="text-red-300/70 text-xs mt-0.5">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-md text-xs font-medium transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-20 text-center px-6', className)}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/[0.10] border border-red-500/[0.20] flex items-center justify-center mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold font-['Libre_Baskerville'] text-[#F1F5F9] mb-2">
        {title}
      </h3>
      <p className="text-[#94A3B8] text-sm max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
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
