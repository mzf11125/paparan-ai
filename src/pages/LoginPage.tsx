import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'

export function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAppStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/briefs" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email'); return }
    const result = await login(email)
    if (result.error) setError(result.error)
    else if (result.magicLinkSent) setSent(true)
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

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-text mb-2">Check your email</h3>
              <p className="text-sm text-text-secondary">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-light/20 border border-red/30 rounded-lg mb-6">
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.765-.887-5.319-2.394-7.248L4 12h2z" />
                      </svg>
                      Sending link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send magic link
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border flex items-start gap-3">
                <Lock className="w-5 h-5 text-text-tertiary shrink-0 mt-0.5" />
                <div className="text-xs text-text-tertiary">
                  <p className="font-medium text-text-secondary mb-1">Protected Access</p>
                  <p>This platform is currently in private development. Access is restricted to authorized personnel only.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-6">
          © 2026 Paparan Brief. All rights reserved.
        </p>
      </div>
    </div>
  )
}
