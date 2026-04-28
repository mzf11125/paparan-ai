import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/contexts/AppContext'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const { email, user_metadata } = session.user
        setUser({
          email: email!,
          name: user_metadata?.full_name ?? email!.split('@')[0],
          avatar: user_metadata?.avatar_url,
        })
        navigate('/briefs', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate, setUser])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Signing you in…</p>
      </div>
    </div>
  )
}
