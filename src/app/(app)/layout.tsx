import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { Sidebar } from '@/components/Layout/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
