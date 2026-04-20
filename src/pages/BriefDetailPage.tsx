import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Share2 } from 'lucide-react'
import { PaparanBrief } from '@/components/PaparanBrief'
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
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C8A96A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading brief...</p>
        </div>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">Brief Not Found</h1>
          <p className="text-gray-600 mb-6">The policy intelligence brief you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/briefs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-medium transition-colors"
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
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-[#E8E4DC] px-4 lg:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className="text-gray-500 hover:text-[#C8A96A] transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link to="/briefs" className="text-gray-500 hover:text-[#C8A96A] transition-colors">
                Briefs
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate max-w-xs" title={brief.title}>
              {brief.title}
            </li>
          </ol>

          <div className="flex items-center gap-2">
            <Link
              to={`/editor/${brief.id}`}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit brief"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </Link>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Share brief"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Brief Content */}
      <PaparanBrief paparan={brief} />

      {/* Related Briefs Section */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
        <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Related Briefs</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Related briefs would be loaded here */}
          <div className="bg-white border border-[#E8E4DC] rounded-lg p-6">
            <p className="text-sm text-gray-500">Loading related briefs...</p>
          </div>
        </div>
      </section>
    </div>
  )
}
