import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/contexts/AppContext'

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 mb-2">Authentication Error</p>
            <p className="text-text-secondary text-sm">{error}</p>
            <p className="text-text-secondary text-sm mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  )
}
