import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase'
import { FilePlus, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch recent Paparan reports
  const { data: reports } = await supabase
    .from('paparan_reports')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-paparan-cream">
      {/* Header */}
      <header className="bg-white border-b border-paparan-deep/10">
        <div className="container py-4">
          <h1 className="font-serif text-2xl text-paparan-deep">Dashboard</h1>
          <p className="text-paparan-slate text-sm">Welcome back</p>
        </div>
      </header>

      <div className="container py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/app/create">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-paparan-deep/10 rounded-lg">
                  <FilePlus className="h-6 w-6 text-paparan-deep" />
                </div>
                <div>
                  <h3 className="font-semibold text-paparan-deep">Create Paparan</h3>
                  <p className="text-sm text-paparan-slate">Generate a new brief</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/app/archive">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-paparan-deep/10 rounded-lg">
                  <Clock className="h-6 w-6 text-paparan-deep" />
                </div>
                <div>
                  <h3 className="font-semibold text-paparan-deep">Archive</h3>
                  <p className="text-sm text-paparan-slate">View all briefs</p>
                </div>
              </div>
            </Card>
          </Link>

          <Card>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-paparan-deep/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-paparan-deep" />
              </div>
              <div>
                <h3 className="font-semibold text-paparan-deep">
                  {reports?.length || 0} Briefs
                </h3>
                <p className="text-sm text-paparan-slate">Total generated</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Briefs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-paparan-deep">Recent Briefs</h2>
            <Link href="/app/archive" className="text-sm text-paparan-deep hover:text-paparan-sage">
              View all →
            </Link>
          </div>

          {reports && reports.length > 0 ? (
            <div className="bg-white rounded-card border border-paparan-deep/10 divide-y divide-paparan-deep/10">
              {reports.map((report: any) => (
                <Link
                  key={report.id}
                  href={`/app/paparan/${report.id}`}
                  className="block p-4 hover:bg-paparan-deep/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-paparan-deep">{report.topic}</h3>
                      <p className="text-sm text-paparan-slate mt-1">
                        {report.region} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.report_type === 'daily'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-paparan-deep/10 text-paparan-deep'
                    }`}>
                      {report.report_type === 'daily' ? 'Daily' : 'On-demand'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <FilePlus className="h-12 w-12 mx-auto text-paparan-slate mb-4" />
                <h3 className="font-serif text-lg text-paparan-deep mb-2">
                  No briefs yet
                </h3>
                <p className="text-paparan-slate mb-6">
                  Create your first policy intelligence brief
                </p>
                <Link href="/app/create">
                  <Button variant="primary" size="lg">
                    Create Paparan
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
