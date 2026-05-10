import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Edit, AlertCircle, FileDown, Presentation,
  Briefcase, Star, ChevronDown, ExternalLink,
  MapPin, TrendingUp, Clock, BookOpen, Printer, Quote, GitCompareArrows, Check,
} from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { DeltaBadge, ImpactBadge } from '@/components/ui/DeltaBadge'
import { DocumentFrame } from '@/components/ui/DocumentFrame'
import { cn } from '@/utils/cn'
import { briefService } from '@/services/briefService'
import { useAppStore } from '@/contexts/AppContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { copyToClipboard } from '@/utils/clipboard'
import { formatBibliography, CITATION_STYLE_LABELS, type CitationStyle } from '@/lib/citation'
import { toast } from '@/components/ui/Toast'
import type { Development } from '@/types/paparan'

const IMPACT_ROW: Record<string, string> = {
  HIGH:   'border-l-2 border-error bg-error/5',
  MEDIUM: 'border-l-2 border-warning bg-warning/5',
  LOW:    'border-l-2 border-success bg-success/5',
}

export function BriefDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isInWatchlist  = useAppStore(s => s.isInWatchlist)
  const toggleWatchlist = useAppStore(s => s.toggleWatchlist)
  const isInCompare    = useAppStore(s => s.isInCompare)
  const toggleCompare  = useAppStore(s => s.toggleCompare)
  const [selectedView, setSelectedView] = useState<'document' | 'diplomat'>('document')
  const [exportOpen, setExportOpen] = useState(false)
  const [citeOpen,   setCiteOpen]   = useState(false)

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ['brief', id],
    queryFn: () => briefService.getBriefById(id || ''),
    enabled: !!id,
  })

  usePageMeta({
    title:       brief?.title,
    description: brief?.executiveSummary?.[0] ?? brief?.currentSituation,
  })

  const handleCopyCitation = async (style: CitationStyle) => {
    if (!brief) return
    const text = formatBibliography(brief, style)
    const ok = await copyToClipboard(text)
    setCiteOpen(false)
    if (ok) toast.success('Citation copied', `${CITATION_STYLE_LABELS[style]} format copied to clipboard.`)
    else    toast.error('Could not copy', 'Clipboard access blocked by the browser.')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm font-ui">Loading brief…</p>
        </div>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h1 className="text-2xl font-display font-bold text-text mb-3">Brief Not Found</h1>
          <p className="text-text-secondary text-sm mb-6 font-ui">
            This policy brief doesn't exist or has been removed.
          </p>
          <Link
            to="/briefs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>
    )
  }

  const deltaSummary = {
    new:         (brief.developments as Development[])?.filter(d => d.delta === 'NEW').length || 0,
    updated:     (brief.developments as Development[])?.filter(d => d.delta === 'UPDATED').length || 0,
    escalated:   (brief.developments as Development[])?.filter(d => d.delta === 'ESCALATED').length || 0,
    deescalated: (brief.developments as Development[])?.filter(d => d.delta === 'DE-ESCALATED').length || 0,
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Classification banner */}
      <ClassificationBadge level={brief.classification || 'unclassified'} variant="banner" />

      {/* Sticky top bar */}
      <div className="sticky top-14 z-30 bg-bg-elevated/90 backdrop-blur-xl border-b border-border">
        <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm font-ui min-w-0" aria-label="Breadcrumb">
            <Link to="/briefs" className="flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Library
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-text font-medium truncate max-w-xs">{brief.title}</span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              {(['document', 'diplomat'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setSelectedView(v)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold font-ui capitalize transition-colors',
                    selectedView === v
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text hover:bg-bg-subtle'
                  )}
                >
                  {v === 'document' ? 'Document' : 'Diplomat'}
                </button>
              ))}
            </div>

            {/* Watchlist */}
            <button
              onClick={() => toggleWatchlist(brief.id)}
              className={cn(
                'p-2 rounded-lg border transition-all duration-150',
                isInWatchlist(brief.id)
                  ? 'text-gold border-gold/30 bg-gold/10'
                  : 'text-text-secondary border-border hover:text-gold hover:border-gold/30 hover:bg-gold/5'
              )}
              aria-label={isInWatchlist(brief.id) ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Star className={cn('w-4 h-4', isInWatchlist(brief.id) && 'fill-current')} />
            </button>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150"
              >
                <FileDown className="w-4 h-4" />
                Export
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-bg-overlay border border-border-strong rounded-xl shadow-lg py-1.5 z-20 animate-scale-in">
                    {[
                      { icon: FileDown, label: 'PDF Memo' },
                      { icon: Presentation, label: 'PowerPoint' },
                      { icon: Briefcase, label: 'Diplomat PDF' },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors font-ui"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Compare toggle */}
            <button
              onClick={() => toggleCompare(brief.id)}
              className={cn(
                'p-2 rounded-lg border transition-all duration-150',
                isInCompare(brief.id)
                  ? 'text-primary border-primary/30 bg-primary/10'
                  : 'text-text-secondary border-border hover:text-primary hover:border-primary/30 hover:bg-primary/5'
              )}
              aria-label={isInCompare(brief.id) ? 'Remove from compare' : 'Add to compare'}
              title={isInCompare(brief.id) ? 'In compare' : 'Add to compare'}
            >
              {isInCompare(brief.id) ? <Check className="w-4 h-4" /> : <GitCompareArrows className="w-4 h-4" />}
            </button>

            {/* Cite dropdown */}
            <div className="relative">
              <button
                onClick={() => setCiteOpen(o => !o)}
                className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong transition-all duration-150"
                aria-label="Copy citation"
                title="Copy citation"
              >
                <Quote className="w-4 h-4" />
              </button>
              {citeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCiteOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-bg-overlay border border-border-strong rounded-xl shadow-lg py-1.5 z-20 animate-scale-in">
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui">Copy as</p>
                    {(['apa', 'chicago', 'mla'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => handleCopyCitation(style)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors font-ui"
                      >
                        {CITATION_STYLE_LABELS[style]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Print */}
            <button
              onClick={() => window.print()}
              data-print-hidden
              className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong transition-all duration-150"
              aria-label="Print brief"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>

            <Link
              to={`/editor/${brief.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-border text-text-secondary hover:text-text hover:border-border-strong rounded-lg text-sm font-medium font-ui transition-all duration-150"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-4 lg:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New',         value: deltaSummary.new,         color: 'text-primary',  bg: 'bg-primary/10' },
          { label: 'Updated',     value: deltaSummary.updated,     color: 'text-warning',  bg: 'bg-warning/10' },
          { label: 'Escalated',   value: deltaSummary.escalated,   color: 'text-error',    bg: 'bg-error/10' },
          { label: 'De-escalated',value: deltaSummary.deescalated, color: 'text-success',  bg: 'bg-success/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('surface-card p-3 flex items-center gap-3')}>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
              <TrendingUp className={cn('w-4 h-4', color)} />
            </div>
            <div>
              <p className={cn('text-xl font-bold tabular-nums font-mono', color)}>{value}</p>
              <p className="text-xs text-text-tertiary font-ui">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Document */}
      <div className="flex-1 px-4 lg:px-6 pb-8">
        <DocumentFrame classification={brief.classification || 'unclassified'} watermark>
          {/* Doc header */}
          <div className="text-center pb-6 mb-8 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 font-ui">
              Policy Intelligence Brief
            </p>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-text mb-3">{brief.title}</h1>
            <div className="flex items-center justify-center gap-4 flex-wrap text-xs text-text-secondary font-ui">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {brief.region}
              </span>
              <span className="text-text-muted">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {new Date(brief.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {brief.sources && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    {brief.sources.length} sources
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-8">
            <h2 className="section-header">Executive Summary</h2>
            <ul className="space-y-2">
              {brief.executiveSummary.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Current Situation */}
          <section className="mb-8">
            <h2 className="section-header">Current Situation</h2>
            <p className="text-text leading-relaxed text-sm whitespace-pre-wrap">{brief.currentSituation}</p>
          </section>

          {/* Key Developments */}
          {brief.developments?.length > 0 && (
            <section className="mb-8">
              <h2 className="section-header">Key Developments</h2>
              <div className="space-y-2">
                {(brief.developments as Development[]).map(dev => (
                  <div key={dev.id} className={cn('rounded-lg p-3.5', IMPACT_ROW[dev.impact] || 'border-l-2 border-border bg-bg-subtle')}>
                    <div className="flex items-start gap-3">
                      <DeltaBadge type={dev.delta} variant="compact" />
                      <ImpactBadge level={dev.impact} variant="dot" />
                      <p className="flex-1 text-sm text-text leading-relaxed">{dev.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Strategic Implications */}
          <section className="mb-8">
            <h2 className="section-header">Strategic Implications</h2>
            <p className="text-text leading-relaxed text-sm whitespace-pre-wrap">{brief.implications}</p>
          </section>

          {/* Risks & Opportunities */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {brief.risks?.length > 0 && (
              <section>
                <h2 className="section-header">Risks</h2>
                <div className="flex flex-wrap gap-2">
                  {brief.risks.map((risk, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-lg text-xs font-medium font-ui">
                      {risk}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {brief.opportunities?.length > 0 && (
              <section>
                <h2 className="section-header">Opportunities</h2>
                <div className="flex flex-wrap gap-2">
                  {brief.opportunities.map((opp, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-medium font-ui">
                      {opp}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Recommended Actions */}
          {brief.actions?.length > 0 && (
            <section className="mb-8">
              <h2 className="section-header">Recommended Actions</h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm font-ui">
                  <thead>
                    <tr className="border-b border-border bg-bg-surface">
                      {['Priority', 'Action', 'Owner', 'Deadline'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {brief.actions.map((action, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-subtle transition-colors">
                        <td className="px-4 py-3">
                          <ImpactBadge level={action.priority} variant="default" />
                        </td>
                        <td className="px-4 py-3 text-text">{action.text}</td>
                        <td className="px-4 py-3 text-text-secondary">{action.owner || '—'}</td>
                        <td className="px-4 py-3 text-text-secondary">{action.deadline || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Sources */}
          {brief.sources?.length > 0 && (
            <section className="pt-6 border-t border-border">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3">Sources</h3>
              <ol className="space-y-1.5">
                {brief.sources.map((source, i) => (
                  <li key={source.id || i} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-primary flex-shrink-0">[{i + 1}]</span>
                    <span className="text-text-secondary">
                      {source.title}
                      {source.url && (
                        <>
                          {' — '}
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-hover inline-flex items-center gap-1 transition-colors"
                          >
                            {source.url.replace(/^https?:\/\//, '').slice(0, 50)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </DocumentFrame>
      </div>
    </div>
  )
}
