import { createSupabaseServerClient } from '@/lib/supabase'
import { Link } from '@/components/ui/Link'
import { Card } from '@/components/ui/Card'

export default async function ArchivePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reports } = await supabase
    .from('paparan_reports')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-paparan-cream">
      <header className="bg-white border-b border-paparan-deep/10">
        <div className="container py-4">
          <h1 className="font-serif text-2xl text-paparan-deep">Archive</h1>
          <p className="text-paparan-slate text-sm">All your policy intelligence briefs</p>
        </div>
      </header>

      <div className="container py-8">
        {reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <Link key={report.id} href={`/app/paparan/${report.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-paparan-deep">
                        {report.topic}
                      </h3>
                      <p className="text-sm text-paparan-slate mt-1">
                        {report.region} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      {report.delta_summary && (
                        <p className="text-sm text-paparan-ink mt-2 line-clamp-2">
                          {report.delta_summary}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      report.report_type === 'daily'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-paparan-deep/10 text-paparan-deep'
                    }`}>
                      {report.report_type === 'daily' ? 'Daily' : 'On-demand'}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-paparan-slate">No briefs found in your archive.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
