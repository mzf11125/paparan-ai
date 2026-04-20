import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Share2, FileText, AlertCircle } from 'lucide-react'
import { PaparanBrief } from '@/components/PaparanBrief'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { briefService } from '@/services/briefService'
import { initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'

// Initialize store with mock data
if (briefService) {
  initializeBriefStore(mockBriefs)
}

export function BriefDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ['brief', id],
    queryFn: () => briefService.getBriefById(id || ''),
    enabled: !!id
  })

  const handleShare = async () => {
    if (brief) {
      if (navigator.share) {
        await navigator.share({
          title: brief.title,
          text: `Policy Intelligence Brief: ${brief.title}`,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-ui">Loading brief...</p>
        </div>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red" />
          </div>
          <h1 className="text-2xl font-display font-bold text-text mb-4">Brief Not Found</h1>
          <p className="text-text-secondary mb-8">
            The policy intelligence brief you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/briefs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Briefs Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Official Breadcrumb */}
      <nav className="bg-bg-elevated border-b border-border px-4 lg:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <ol className="flex items-center gap-2 text-sm font-ui">
            <li>
              <Link to="/" className="text-text-secondary hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li className="text-text-tertiary">/</li>
            <li>
              <Link to="/briefs" className="text-text-secondary hover:text-primary transition-colors">
                Briefs
              </Link>
            </li>
            <li className="text-text-tertiary">/</li>
            <li className="text-text font-medium truncate max-w-xs" title={brief.title}>
              {brief.title}
            </li>
          </ol>

          <div className="flex items-center gap-2">
            <ClassificationBadge
              level={brief.classification ?? 'unclassified'}
              variant="compact"
            />
            <Link
              to={`/editor/${brief.id}`}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Edit brief"
            >
              <Edit className="w-4 h-4 text-text-secondary" />
            </Link>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Share brief"
            >
              <Share2 className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      </nav>

      {/* Brief Content */}
      <PaparanBrief paparan={brief} />

      {/* Related Briefs Section */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-display font-bold text-text">Related Briefs</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Related briefs would be loaded here */}
          <div className="bg-bg-elevated border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 text-text-tertiary">
              <div className="w-2 h-2 bg-accent/50 rounded-full animate-pulse" />
              <p className="text-sm font-ui">Loading related briefs...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
