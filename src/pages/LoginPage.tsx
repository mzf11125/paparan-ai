import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore, type AuthError } from '@/contexts/AppContext'
import { usePageMeta } from '@/hooks/usePageMeta'

type AuthMode = 'signin' | 'signup' | 'forgot-password'

export function LoginPage() {
  usePageMeta({ title: 'Sign in' })
  const { isAuthenticated } = useAppStore()
  const setUser = useAppStore(s => s.setUser)
  const location = useLocation()

  const [mode, setMode]               = useState<AuthMode>('signin')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [fullName, setFullName]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [authError, setAuthError]     = useState<AuthError | null>(null)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
      window.history.replaceState({}, '', '/login')
    }
  }, [location.state])

  useEffect(() => {
    if (retryCountdown > 0) {
      const t = setTimeout(() => setRetryCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [retryCountdown])

  if (isAuthenticated) return <Navigate to="/briefs" replace />

  const canRetry = retryCountdown === 0
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const handleMagicLink = async () => {
    if (!email) { setError('Please enter your email address'); return }
    setIsSubmitting(true); setError(''); setAuthError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setIsSubmitting(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
    }
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setIsSubmitting(true); setError(''); setAuthError(null)

    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (err) throw err
        setSuccess(true)
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        if (data.user) {
          setUser({
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          })
        }
      }
    } catch (err) {
      const e = err as { message?: string; status?: number }
      if (e.message?.toLowerCase().includes('rate limit') || e.status === 429) {
        setRetryCountdown(300)
        setError('Too many attempts. Please wait before trying again.')
      } else {
        setError(e.message || 'Authentication failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address'); return }
    setIsSubmitting(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setIsSubmitting(false)
    if (err) setError(err.message)
    else setSuccess(true)
  }

  return (
    <div className="min-h-screen min-h-dvh bg-bg flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-surface flex-col justify-between p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/6 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(var(--color-border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-strong) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-text">PaparanBrief</p>
              <p className="text-xs text-text-tertiary font-ui">Policy Intelligence Platform</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-text leading-tight mb-4">
              Intelligence for<br />
              <span className="teal-text">ASEAN Policymakers</span>
            </h1>
            <p className="text-text-secondary font-ui leading-relaxed max-w-sm">
              Transform fragmented information into structured, decision-ready policy briefs with multi-agent AI.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              'Multi-agent AI orchestration (LangGraph)',
              'RPJMN Asta Cita & RDTII alignment scoring',
              'Bellingcat OSINT integration',
              'PDF, PPTX & Diplomat Brief exports',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-sm text-text-secondary font-ui">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs text-text-muted font-ui">© 2026 PaparanBrief · Classification: Unclassified</p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <p className="font-display font-bold text-lg text-text">PaparanBrief</p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold text-text mb-2">
                {mode === 'forgot-password' ? 'Check your email' : mode === 'signup' ? 'Verify your email' : 'Magic link sent'}
              </h2>
              <p className="text-text-secondary text-sm font-ui mb-6">
                {mode === 'forgot-password'
                  ? `Password reset link sent to ${email}`
                  : `We sent a link to ${email}. Click it to sign in.`}
              </p>
              <button
                onClick={() => { setSuccess(false); setMode('signin') }}
                className="text-sm text-primary hover:text-primary-hover font-ui font-medium transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-text">
                  {mode === 'signin'          && 'Sign in'}
                  {mode === 'signup'          && 'Create account'}
                  {mode === 'forgot-password' && 'Reset password'}
                </h2>
                <p className="text-text-secondary text-sm font-ui mt-1">
                  {mode === 'signin'          && 'Access your intelligence platform'}
                  {mode === 'signup'          && 'Join the intelligence platform'}
                  {mode === 'forgot-password' && "We'll send you a reset link"}
                </p>
              </div>

              {/* Error */}
              {(error || authError) && (
                <div className="flex items-start gap-3 p-3.5 bg-error/10 border border-error/20 rounded-xl mb-5 animate-fade-in">
                  {retryCountdown > 0
                    ? <Clock className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm text-error font-ui">{error || authError?.message}</p>
                    {retryCountdown > 0 && (
                      <p className="text-xs text-error/70 font-ui mt-1">Retry in {formatTime(retryCountdown)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={mode === 'forgot-password' ? handleForgotPassword : handlePasswordAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary font-ui mb-1.5 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="input-base w-full"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text-secondary font-ui mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@ministry.gov"
                      className="input-base w-full pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary font-ui mb-1.5 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-base w-full pl-10 pr-10"
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot-password'); setError('') }}
                      className="text-xs text-primary hover:text-primary-hover font-ui font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !canRetry}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold font-ui transition-all duration-150 shadow-teal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : mode === 'signin'          ? <><ArrowRight className="w-4 h-4" /> Sign In</>
                    : mode === 'signup'          ? <><ArrowRight className="w-4 h-4" /> Create Account</>
                    : <><Mail className="w-4 h-4" /> Send Reset Link</>}
                </button>
              </form>

              {/* Magic link option */}
              {mode === 'signin' && (
                <div className="mt-4">
                  <div className="relative flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-muted font-ui">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <button
                    onClick={handleMagicLink}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-border hover:border-border-strong text-text-secondary hover:text-text rounded-xl text-sm font-semibold font-ui transition-all duration-150 disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    Sign in with magic link
                  </button>
                </div>
              )}

              {/* Mode switch */}
              <p className="text-center text-sm text-text-secondary font-ui mt-6">
                {mode === 'signin' ? (
                  <>Don't have an account?{' '}
                    <button onClick={() => { setMode('signup'); setError('') }} className="text-primary hover:text-primary-hover font-semibold transition-colors">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => { setMode('signin'); setError('') }} className="text-primary hover:text-primary-hover font-semibold transition-colors">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
