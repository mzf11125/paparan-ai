import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'

export function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAppStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/briefs" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email')
      return
    }

    const success = await login(email)
    if (!success) {
      setError('Access denied. You are not authorized to view this page.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center top, var(--color-primary) 0%, transparent 60%)'
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl font-display">P</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-text">Paparan Brief</h1>
          </div>
          <p className="text-text-secondary">Policy Intelligence Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-elevated border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-text mb-2">Sign in to continue</h2>
            <p className="text-sm text-text-tertiary">
              Protected access — authorization required
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-light/20 border border-red/30 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red shrink-0 mt-0.5" />
              <p className="text-sm text-red">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.765-.887-5.319-2.394-7.248L4 12h2z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-6 border-t border-border flex items-start gap-3">
            <Lock className="w-5 h-5 text-text-tertiary shrink-0 mt-0.5" />
            <div className="text-xs text-text-tertiary">
              <p className="font-medium text-text-secondary mb-1">Protected Access</p>
              <p>This platform is currently in private development. Access is restricted to authorized personnel only.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-6">
          © 2026 Paparan Brief. All rights reserved.
        </p>
      </div>
    </div>
  )
}
