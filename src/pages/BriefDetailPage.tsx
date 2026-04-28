import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Share2, FileText, AlertCircle, FileDown, Presentation, Briefcase, Star } from 'lucide-react'
import { PaparanBrief } from '@/components/PaparanBrief'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { RpjmnAlignment } from '@/components/brief/RpjmnAlignment'
import { DiplomatView } from '@/components/brief/DiplomatView'
import { briefService } from '@/services/briefService'
import { initializeBriefStore } from '@/services/briefService'
import { exportService } from '@/services/exportService'
import { mockBriefs } from '@/data/mockBriefs'
import { cn } from '@/utils/formatters'

if (briefService) {
  initializeBriefStore(mockBriefs)
}

function OutcomeRating({ briefId }: { briefId: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [actionTaken, setActionTaken] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!rating) return
    await exportService.recordOutcome(briefId, rating, '', actionTaken)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green">
        <Star className="w-4 h-4 fill-green" /> Feedback recorded. Thank you.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-sm text-text-secondary font-ui">Was this brief useful?</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star className={cn('w-5 h-5 transition-colors',
              n <= (hover || rating) ? 'fill-amber text-amber' : 'text-border')} />
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer">
        <input type="checkbox" checked={actionTaken} onChange={e => setActionTaken(e.target.checked)}
          className="rounded" />
        Action taken
      </label>
      {rating > 0 && (
        <button onClick={handleSubmit}
          className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors">
          Submit
        </button>
      )}
    </div>
  )
}

export function BriefDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [diplomatMode, setDiplomatMode] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null)

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ['brief', id],
    queryFn: () => briefService.getBriefById(id || ''),
    enabled: !!id,
  })

  const handleExport = async (type: 'pdf' | 'pptx') => {
    if (!id) return
    setExporting(type)
    try {
      if (type === 'pdf') await exportService.downloadPdf(id)
      else await exportService.downloadPptx(id)
    } finally {
      setExporting(null)
    }
  }

  const handleShare = async () => {
    if (!brief) return
    if (navigator.share) {
      await navigator.share({ title: brief.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-ui">Loading brief…</p>
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
          <Link to="/briefs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Briefs Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Diplomat view overlay */}
      {diplomatMode && (
        <DiplomatView brief={brief} onClose={() => setDiplomatMode(false)} />
      )}

      {/* Breadcrumb */}
      <nav className="bg-bg-elevated border-b border-border px-4 lg:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <ol className="flex items-center gap-2 text-sm font-ui">
            <li><Link to="/" className="text-text-secondary hover:text-primary transition-colors">Home</Link></li>
            <li className="text-text-tertiary">/</li>
            <li><Link to="/briefs" className="text-text-secondary hover:text-primary transition-colors">Briefs</Link></li>
            <li className="text-text-tertiary">/</li>
            <li className="text-text font-medium truncate max-w-xs" title={brief.title}>{brief.title}</li>
          </ol>

          <div className="flex items-center gap-1">
            <ClassificationBadge level={brief.classification ?? 'unclassified'} variant="compact" />
            {/* Diplomat view toggle */}
            <button onClick={() => setDiplomatMode(true)}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Diplomat briefing view">
              <Briefcase className="w-4 h-4 text-text-secondary" />
            </button>
            {/* PDF export */}
            <button onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Download PDF">
              <FileDown className={cn('w-4 h-4', exporting === 'pdf' ? 'text-primary animate-pulse' : 'text-text-secondary')} />
            </button>
            {/* PPTX export */}
            <button onClick={() => handleExport('pptx')} disabled={exporting === 'pptx'}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Download PowerPoint">
              <Presentation className={cn('w-4 h-4', exporting === 'pptx' ? 'text-primary animate-pulse' : 'text-text-secondary')} />
            </button>
            <Link to={`/editor/${brief.id}`}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Edit brief">
              <Edit className="w-4 h-4 text-text-secondary" />
            </Link>
            <button onClick={handleShare}
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
              title="Share brief">
              <Share2 className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      </nav>

      {/* Brief Content */}
      <PaparanBrief paparan={brief} />

      {/* RPJMN Alignment */}
      {brief.rpjmn_alignment && (
        <section className="max-w-6xl mx-auto px-4 lg:px-8 py-8 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary font-ui">
              RPJMN & RDTII Alignment
            </h2>
          </div>
          <RpjmnAlignment alignment={brief.rpjmn_alignment} />
        </section>
      )}

      {/* Feedback */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-8 border-t border-border">
        <OutcomeRating briefId={brief.id} />
      </section>

      {/* Related Briefs */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-display font-bold text-text">Related Briefs</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
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
