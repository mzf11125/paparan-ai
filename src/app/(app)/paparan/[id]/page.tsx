import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { PaparanDisplay } from '@/components/Paparan/PaparanDisplay'

export default async function PaparanPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: report } = await supabase
    .from('paparan_reports')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single()

  if (!report) {
    notFound()
  }

  const paparan = report.content as any

  return (
    <div className="min-h-screen bg-paparan-cream">
      <header className="bg-white border-b border-paparan-deep/10">
        <div className="container py-4">
          <a
            href="/app"
            className="text-sm text-paparan-deep hover:text-paparan-sage"
          >
            ← Back to Dashboard
          </a>
        </div>
      </header>

      <div className="container py-8">
        <PaparanDisplay
          paparan={paparan}
          topic={report.topic}
          region={report.region}
          createdAt={new Date(report.created_at)}
        />
      </div>
    </div>
  )
}
