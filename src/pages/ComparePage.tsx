import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { GitCompareArrows, X, FileText, ArrowRight, Plus, Calendar, AlertTriangle, Lightbulb, ListChecks } from 'lucide-react'
import { briefService } from '@/services/briefService'
import { useAppStore } from '@/contexts/AppContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { regionColors, impactColors, regionAbbr } from '@/lib/domainColors'
import type { Paparan } from '@/types/paparan'
import { cn } from '@/utils/cn'

export function ComparePage() {
  usePageMeta({ title: 'Compare', description: 'Side-by-side comparison of selected briefs.' })
  const compareIds   = useAppStore(s => s.compareIds)
  const toggleCompare = useAppStore(s => s.toggleCompare)
  const clearCompare  = useAppStore(s => s.clearCompare)

  const { data: allBriefs = [], isLoading } = useQuery({
    queryKey: ['briefs', 'all'],
    queryFn: () => briefService.getAllBriefs(),
    retry: 1,
  })

  const selected = useMemo(
    () => compareIds.map(id => allBriefs.find(b => b.id === id)).filter((b): b is Paparan => !!b),
    [compareIds, allBriefs]
  )

  const candidates = useMemo(
    () => allBriefs.filter(b => !compareIds.includes(b.id)).slice(0, 12),
    [allBriefs, compareIds]
  )

  return (
    <div className="px-4 lg:px-8 py-10 max-w-7xl mx-auto">
      {/* Masthead */}
      <header className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <GitCompareArrows className="w-4 h-4 text-text-tertiary" />
          <p className="editorial-eyebrow text-text-muted">My Work</p>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-2">
              Brief Comparison
            </h1>
            <p className="text-text-secondary text-base font-serif max-w-2xl">
              Compare up to three briefs side-by-side. Add or remove briefs from any card on this page or from the Briefs Library.
            </p>
          </div>
          {selected.length > 0 && (
            <button
              onClick={clearCompare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-ui border border-border text-text-tertiary hover:text-error hover:border-error/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>
      </header>

      {selected.length === 0 ? (
        <EmptyCompare candidates={candidates} isLoading={isLoading} onAdd={toggleCompare} />
      ) : (
        <>
          <div className={cn(
            'grid gap-5 mb-12',
            selected.length === 1 && 'grid-cols-1 lg:grid-cols-2',
            selected.length === 2 && 'grid-cols-1 md:grid-cols-2',
            selected.length === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          )}>
            <AnimatePresence mode="popLayout">
              {selected.map(brief => (
                <CompareColumn key={brief.id} brief={brief} onRemove={() => toggleCompare(brief.id)} />
              ))}
            </AnimatePresence>
            {selected.length < 3 && (
              <AddSlot
                candidates={candidates}
                onAdd={toggleCompare}
              />
            )}
          </div>

          {/* Side-by-side comparison rows */}
          {selected.length >= 2 && <ComparisonMatrix briefs={selected} />}
        </>
      )}
    </div>
  )
}

function CompareColumn({ brief, onRemove }: { brief: Paparan; onRemove: () => void }) {
  const rg = regionColors(brief.region)
  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22, ease: [0.2, 0.7, 0.1, 1] }}
      className="bg-bg-elevated border border-border rounded-xl overflow-hidden flex flex-col card-lift card-glow-primary"
    >
      {/* Header strip */}
      <div className="px-4 py-2 border-b border-border bg-bg-subtle flex items-center justify-between gap-2">
        <ClassificationBadge level={brief.classification ?? 'unclassified'} variant="inline" />
        <button
          onClick={onRemove}
          className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
          aria-label={`Remove ${brief.title} from comparison`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', rg.bg, rg.text, rg.border)}>
            {regionAbbr(brief.region)}
          </span>
          <span className="text-xs text-text-tertiary font-mono tabular-nums flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {brief.date}
          </span>
        </div>
        <h2 className="font-display font-bold text-text text-lg leading-snug line-clamp-3">{brief.title}</h2>
        {brief.executiveSummary?.[0] && (
          <p className="text-sm text-text-secondary leading-relaxed font-serif line-clamp-4 flex-1">
            {brief.executiveSummary[0]}
          </p>
        )}
        <Link
          to={`/briefs/${brief.id}`}
          className="inline-flex items-center gap-1 mt-auto pt-2 text-xs font-semibold font-ui text-primary hover:text-primary-hover transition-colors"
        >
          Open brief <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.article>
  )
}

function AddSlot({ candidates, onAdd }: { candidates: Paparan[]; onAdd: (id: string) => void }) {
  return (
    <article className="rounded-xl border border-dashed border-border-strong p-5 flex flex-col gap-4 min-h-[280px] hover:border-accent/50 hover:bg-accent/5 hover:shadow-glow-accent transition-all">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-accent motion-safe:animate-float" />
        <p className="font-display font-semibold text-text text-sm">Add a brief</p>
      </div>
      <p className="text-xs text-text-tertiary font-ui">Choose another brief to add to the comparison.</p>
      <div className="space-y-1.5 overflow-y-auto max-h-[260px] -mx-1 px-1">
        {candidates.map(c => (
          <button
            key={c.id}
            onClick={() => onAdd(c.id)}
            className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <p className="text-xs font-medium text-text font-ui line-clamp-2">{c.title}</p>
            <p className="text-[10px] text-text-tertiary font-ui mt-1 flex items-center gap-2">
              <span>{c.region}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{c.date}</span>
            </p>
          </button>
        ))}
      </div>
    </article>
  )
}

function ComparisonMatrix({ briefs }: { briefs: Paparan[] }) {
  const cols = briefs.length
  return (
    <section className="bg-bg-elevated border border-border rounded-xl overflow-hidden">
      <header className="px-5 py-4 border-b-2 border-b-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <h2 className="font-display font-semibold text-text">Side-by-side comparison</h2>
      </header>

      <Row label="Region"          icon={null}              briefs={briefs} cols={cols}>
        {b => <span className="text-sm font-ui text-text">{b.region}</span>}
      </Row>
      <Row label="Classification"  icon={null}              briefs={briefs} cols={cols}>
        {b => <ClassificationBadge level={b.classification ?? 'unclassified'} variant="inline" />}
      </Row>
      <Row label="Top impact"      icon={null}              briefs={briefs} cols={cols}>
        {b => {
          const top = b.developments?.find(d => d.impact === 'HIGH') ?? b.developments?.find(d => d.impact === 'MEDIUM') ?? b.developments?.[0]
          if (!top) return <span className="text-xs text-text-muted font-ui">—</span>
          const ic = impactColors(top.impact)
          return (
            <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border font-ui', ic.bg, ic.text, ic.border)}>
              {top.impact}
            </span>
          )
        }}
      </Row>
      <Row label="Risks"           icon={AlertTriangle}     briefs={briefs} cols={cols}>
        {b => (
          <ul className="text-sm text-text-secondary font-ui leading-relaxed space-y-1.5">
            {(b.risks ?? []).slice(0, 3).map((r, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-text-muted">·</span><span className="line-clamp-2">{r}</span></li>
            ))}
            {(b.risks ?? []).length === 0 && <li className="text-text-muted">—</li>}
          </ul>
        )}
      </Row>
      <Row label="Opportunities"   icon={Lightbulb}         briefs={briefs} cols={cols}>
        {b => (
          <ul className="text-sm text-text-secondary font-ui leading-relaxed space-y-1.5">
            {(b.opportunities ?? []).slice(0, 3).map((r, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-text-muted">·</span><span className="line-clamp-2">{r}</span></li>
            ))}
            {(b.opportunities ?? []).length === 0 && <li className="text-text-muted">—</li>}
          </ul>
        )}
      </Row>
      <Row label="Recommended actions" icon={ListChecks} briefs={briefs} cols={cols}>
        {b => (
          <ul className="text-sm text-text-secondary font-ui leading-relaxed space-y-1.5">
            {(b.actions ?? []).slice(0, 3).map((a, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-text-muted font-mono">{i + 1}.</span>
                <span className="line-clamp-2">{a.text}</span>
              </li>
            ))}
            {(b.actions ?? []).length === 0 && <li className="text-text-muted">—</li>}
          </ul>
        )}
      </Row>
      <Row label="Sources"         icon={FileText}          briefs={briefs} cols={cols}>
        {b => <span className="text-sm font-ui tabular-nums text-text-secondary">{b.sources?.length ?? 0}</span>}
      </Row>
    </section>
  )
}

function Row({ label, icon: Icon, briefs, cols, children }: {
  label: string
  icon: React.ElementType | null
  briefs: Paparan[]
  cols: number
  children: (b: Paparan) => React.ReactNode
}) {
  return (
    <div
      className="grid border-b border-border last:border-0"
      style={{ gridTemplateColumns: `200px repeat(${cols}, minmax(0, 1fr))` }}
    >
      <div className="p-4 bg-bg-surface border-r border-border flex items-center gap-2 text-text-secondary">
        {Icon && <Icon className="w-3.5 h-3.5 text-text-tertiary" />}
        <span className="text-xs font-bold uppercase tracking-widest font-ui">{label}</span>
      </div>
      {briefs.map(b => (
        <div key={b.id} className="p-4 border-r border-border last:border-0">
          {children(b)}
        </div>
      ))}
    </div>
  )
}

function EmptyCompare({ candidates, isLoading, onAdd }: {
  candidates: Paparan[]
  isLoading: boolean
  onAdd: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="border border-dashed border-border rounded-xl">
        <EmptyState
          icon={GitCompareArrows}
          tone="primary"
          title="Pick up to three briefs"
          description='Use "Add to compare" from any brief card, or pick from the briefs below.'
        />
      </div>
      <div>
        <h3 className="font-display font-semibold text-text mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-text-tertiary" />
          Pick a brief
        </h3>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidates.map(c => (
              <button
                key={c.id}
                onClick={() => onAdd(c.id)}
                className="text-left p-4 bg-bg-elevated rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ClassificationBadge level={c.classification ?? 'unclassified'} variant="inline" />
                  <span className="text-[10px] font-mono text-text-tertiary tabular-nums ml-auto">{c.date}</span>
                </div>
                <p className="text-sm font-medium text-text font-ui line-clamp-2">{c.title}</p>
                <p className="text-xs text-text-tertiary font-ui mt-1">{c.region}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
