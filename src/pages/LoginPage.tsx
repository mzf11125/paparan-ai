import { useState, useEffect, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Mail, Lock, CheckCircle, AlertCircle, Clock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore, type AuthError } from '@/contexts/AppContext'

type AuthMode = 'signin' | 'signup' | 'forgot-password'

export function LoginPage() {
  const { isAuthenticated } = useAppStore()
  const setUser = useAppStore(s => s.setUser)
  const location = useLocation()

  // Form state
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<AuthError | null>(null)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check for error passed from auth callback
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
      window.history.replaceState({}, '', '/login')
    }
  }, [location.state])

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [retryCountdown])

  if (isAuthenticated) {
    return <Navigate to="/briefs" replace />
  }

  const canRetry = retryCountdown === 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError('')
    setAuthError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setIsSubmitting(false)

    if (error) {
      const authErr: AuthError = { message: error.message, code: error.status?.toString() }

      if (error.message?.toLowerCase().includes('rate limit') ||
          error.status === 429) {
        authErr.message = 'Too many sign-in attempts. Please wait a moment before trying again.'
        authErr.code = 'RATE_LIMIT_EXCEEDED'
        authErr.retryAfter = 300
        setRetryCountdown(300)
      }

      setError(authErr.message)
      setAuthError(authErr)
    } else {
      setSuccess(true)
    }
  }

  const handlePasswordSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsSubmitting(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message || 'Invalid email or password')
    } else if (data.user) {
      setUser({
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ?? data.user.email!.split('@')[0],
        avatar: data.user.user_metadata?.avatar_url,
      })
      window.location.href = '/briefs'
    }
  }

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message || 'Failed to create account')
    } else {
      if (data.session && data.user) {
        setUser({
          email: data.user.email!,
          name: fullName,
          avatar: data.user.user_metadata?.avatar_url,
        })
        window.location.href = '/briefs'
      } else {
        setSuccess(true)
        setError('')
      }
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message || 'Failed to send reset email')
    } else {
      setSuccess(true)
    }
  }

  const handleReset = useCallback(() => {
    setSuccess(false)
    setError('')
    setAuthError(null)
    setRetryCountdown(0)
    setPassword('')
    setFullName('')
  }, [])

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    handleReset()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-15"
             style={{ background: 'radial-gradient(ellipse at center top, var(--color-primary) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-text) 2px, var(--color-text) 3px)', backgroundSize: '100% 4px' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg font-display">P</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-text">Paparan Brief</h1>
          </div>
          <p className="text-sm text-text-secondary">Policy Intelligence Platform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Tabs */}
          {mode !== 'forgot-password' && (
            <div className="flex border-b border-border">
              <button
                onClick={() => switchMode('signin')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  mode === 'signin'
                    ? 'text-text'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                Sign In
                {mode === 'signin' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  mode === 'signup'
                    ? 'text-text'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                Create Account
                {mode === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Back button for forgot password */}
            {mode === 'forgot-password' && (
              <button
                onClick={() => switchMode('signin')}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            )}

            {/* Success state */}
            {success ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green" />
                </div>
                <h3 className="font-semibold text-text mb-2">
                  {mode === 'forgot-password' ? 'Check your email' : 'Email sent!'}
                </h3>
                <p className="text-sm text-text-secondary mb-1">
                  {mode === 'signup' && `We've sent a confirmation to ${email}`}
                  {mode === 'signin' && `Magic link sent to ${email}`}
                  {mode === 'forgot-password' && `Password reset link sent to ${email}`}
                </p>
                {mode === 'signup' && (
                  <p className="text-sm text-text-secondary">
                    Click the link in the email to activate your account.
                  </p>
                )}
                <button
                  onClick={handleReset}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  {mode === 'signin' ? 'Try a different email' : 'Return to sign in'}
                </button>
              </div>
            ) : (
              <>
                {/* Heading */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-text mb-1">
                    {mode === 'signin' && 'Welcome back'}
                    {mode === 'signup' && 'Create your account'}
                    {mode === 'forgot-password' && 'Reset your password'}
                  </h2>
                  <p className="text-sm text-text-tertiary">
                    {mode === 'signin' && 'Sign in to access your briefings and analytics'}
                    {mode === 'signup' && 'Join to access policy intelligence briefings'}
                    {mode === 'forgot-password' && 'We\'ll send you a reset link'}
                  </p>
                </div>

                {/* Error display */}
                {error && (
                  <div className="p-3 bg-red-light/20 border border-red/30 rounded-lg mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />
                    <p className="text-sm text-red flex-1">{error}</p>
                    {authError?.code === 'RATE_LIMIT_EXCEEDED' && retryCountdown > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red/80">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(retryCountdown)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
                  {/* Full name for signup */}
                  {mode === 'signup' && (
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-9 pr-3 py-2.5 bg-bg-surface border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                          disabled={isSubmitting}
                          autoComplete="name"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@organization.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-bg-surface border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                        disabled={isSubmitting}
                        autoComplete={mode === 'signup' ? 'email' : 'username'}
                      />
                    </div>
                  </div>

                  {/* Password - for signin, signup, and reset */}
                  {mode !== 'forgot-password' && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2.5 bg-bg-surface border border-border rounded-lg text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                          disabled={isSubmitting}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remember me & Forgot password for signin */}
                  {mode === 'signin' && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit buttons */}
                  {mode === 'signin' && (
                    <>
                      <button
                        onClick={handlePasswordSignIn}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.765-.887-5.319-2.394-7.248L4 12h2z" />
                            </svg>
                            Signing in…
                          </>
                        ) : (
                          'Sign In with Password'
                        )}
                      </button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-bg-elevated text-text-tertiary">or</span>
                        </div>
                      </div>

                      <button
                        onClick={handleMagicLinkSignIn}
                        disabled={isSubmitting || !canRetry}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-surface hover:bg-bg-subtle border border-border text-text rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.765-.887-5.319-2.394-7.248L4 12h2z" />
                            </svg>
                            Sending…
                          </>
                        ) : !canRetry ? (
                          <>
                            <Clock className="w-4 h-4" />
                            Wait {formatTime(retryCountdown)}
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Send magic link instead
                          </>
                        )}
                      </button>

                      {!canRetry && (
                        <p className="text-xs text-text-tertiary text-center mt-2">
                          Rate limit active. Magic links will be available in {formatTime(retryCountdown)}
                        </p>
                      )}
                    </>
                  )}

                  {mode === 'signup' && (
                    <button
                      onClick={handleSignUp}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.765-.887-5.319-2.394-7.248L4 12h2z" />
                          </svg>
                          Creating account…
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  )}

                  {mode === 'forgot-password' && (
                    <button
                      onClick={handleForgotPassword}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.765-.887-5.319-2.394-7.248L4 12h2z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Footer note */}
          {!success && (
            <div className="px-6 py-4 bg-bg-surface border-t border-border">
              <p className="text-xs text-text-tertiary text-center">
                Protected platform • Authorized access only
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-4">
          © 2026 Paparan Brief. All rights reserved.
        </p>
      </div>
    </div>
  )
}
