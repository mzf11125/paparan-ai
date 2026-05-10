import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/contexts/AppContext'
import { PageLoader } from '@/components/ui/PageLoader'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if there's an error in the URL hash/query params from Supabase
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const errorDescription = hashParams.get('error_description')
    const searchParams = new URLSearchParams(window.location.search)
    const searchError = searchParams.get('error')

    if (errorDescription || searchError) {
      setError(errorDescription || searchError || 'Authentication failed')
      setTimeout(() => {
        navigate('/login', {
          state: { error: errorDescription || searchError || 'Authentication failed' },
          replace: true
        })
      }, 2000)
      return
    }

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        setTimeout(() => {
          navigate('/login', {
            state: { error: sessionError.message },
            replace: true
          })
        }, 2000)
        return
      }

      if (session?.user) {
        const { email, user_metadata } = session.user
        setUser({
          email: email!,
          name: user_metadata?.full_name ?? email!.split('@')[0],
          avatar: user_metadata?.avatar_url,
        })
        navigate('/briefs', { replace: true })
      } else {
        // No session - check if there's a pending auth flow
        navigate('/login', { replace: true })
      }
    }).catch((err) => {
      setError(err.message || 'An unexpected error occurred')
      setTimeout(() => {
        navigate('/login', {
          state: { error: err.message || 'An unexpected error occurred' },
          replace: true
        })
      }, 2000)
    })
  }, [navigate, setUser])

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-text mb-2">Authentication error</h1>
          <p className="text-text-secondary text-sm">{error}</p>
          <p className="editorial-eyebrow mt-4">Redirecting to login</p>
        </div>
      </div>
    )
  }

  return <PageLoader label="Signing you in…" />
}
