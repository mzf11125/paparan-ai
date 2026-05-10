import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    const isDev = import.meta.env.DEV
    const error = this.state.error

    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-bg p-6 font-ui">
        <div className="w-full max-w-md bg-bg-elevated border border-border rounded-xl shadow-md p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex w-9 h-9 rounded-full bg-error/10 text-error items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-text">Something went wrong</h1>
              <p className="mt-1 text-sm text-text-secondary">
                The page hit an unexpected error. You can reload to try again.
              </p>
            </div>
          </div>

          {isDev && error && (
            <pre className="mt-4 max-h-48 overflow-auto bg-bg-subtle border border-border rounded-md p-3 text-[11px] leading-relaxed text-text-secondary font-mono whitespace-pre-wrap break-all">
              {error.stack ?? error.message}
            </pre>
          )}

          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reload page
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
