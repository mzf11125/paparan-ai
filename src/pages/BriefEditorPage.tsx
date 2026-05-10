import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save, Eye, ArrowLeft, Plus, Trash2, Check, FileEdit,
  Sparkles, Loader2, Settings,
} from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { DocumentFrame } from '@/components/ui/DocumentFrame'
import { AgentPipeline, type AgentStep } from '@/components/ui/AgentPipeline'
import { cn } from '@/utils/cn'
import { briefService } from '@/services/briefService'
import { usePageMeta } from '@/hooks/usePageMeta'
import { Paparan, Development } from '@/types/paparan'

const REGIONS = [
  'ASEAN','Indonesia','Malaysia','Singapore','Thailand','Philippines',
  'Vietnam','Myanmar','Cambodia','Laos','Brunei','Global',
]

const FIELD_CLS = 'input-base w-full'
const LABEL_CLS = 'block text-xs font-semibold text-text-secondary font-ui mb-1.5 uppercase tracking-wide'

export function BriefEditorPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const isEditing = !!id
  usePageMeta({ title: isEditing ? 'Edit Brief' : 'New Brief' })

  const [previewMode, setPreviewMode]     = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved'|'saving'|'unsaved'>('saved')
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)

  const [aiTopic, setAiTopic]       = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError]       = useState('')
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([
    { id: 'route',      name: 'Route Request',    status: 'pending' },
    { id: 'gov',        name: 'Gov Intel',         status: 'pending' },
    { id: 'analyst',    name: 'Financial Analyst', status: 'pending' },
    { id: 'researcher', name: 'Researcher',        status: 'pending' },
    { id: 'rpjmn',      name: 'RPJMN Scorer',      status: 'pending' },
    { id: 'rdtii',      name: 'RDTII Extractor',   status: 'pending' },
    { id: 'osint',      name: 'OSINT Enrichment',  status: 'pending' },
    { id: 'synthesizer',name: 'Synthesizer',       status: 'pending' },
  ])

  const [formData, setFormData] = useState<Partial<Paparan>>({
    title: '', date: new Date().toISOString().split('T')[0],
    region: 'ASEAN', classification: 'unclassified',
    executiveSummary: [], currentSituation: '',
    developments: [], implications: '',
    risks: [], opportunities: [], actions: [], sources: [], tags: [],
  })

  const { data: brief, isLoading } = useQuery({
    queryKey: ['brief', id],
    queryFn: () => briefService.getBriefById(id || ''),
    enabled: isEditing,
  })

  useEffect(() => { if (brief) setFormData(brief) }, [brief])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Paparan>) =>
      isEditing ? briefService.updateBrief(id!, data) : briefService.createBrief(data),
    onSuccess: () => {
      setAutoSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['briefs'] })
    },
  })

  const saveMutationRef = useRef(saveMutation)
  saveMutationRef.current = saveMutation

  useEffect(() => {
    if (autoSaveStatus !== 'unsaved') return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      setAutoSaveStatus('saving')
      saveMutationRef.current.mutate(formData)
    }, 3000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [formData, autoSaveStatus])

  useEffect(() => () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }, [])

  const updateField = <K extends keyof Paparan>(field: K, value: Paparan[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setAutoSaveStatus('unsaved')
  }

  const handleGenerateWithAI = async () => {
    const topic = aiTopic.trim() || formData.title || ''
    if (!topic) { setAiError('Enter a topic to generate a brief.'); return }
    setAiGenerating(true); setAiError('')
    setAgentSteps(s => s.map(x => ({ ...x, status: 'pending' as const })))
    try {
      for (let i = 0; i < agentSteps.length; i++) {
        setAgentSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running' as const } : s
        ))
        await new Promise(r => setTimeout(r, 1200))
        setAgentSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'completed' as const } : s
        ))
      }
      const generated = await briefService.generateBrief(topic, formData.region || 'ASEAN', formData.classification || 'unclassified')
      setFormData(generated); setAutoSaveStatus('unsaved')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed'
      setAiError(msg.includes('fetch') ? 'Backend unavailable.' : msg)
    } finally { setAiGenerating(false) }
  }

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm font-ui">Loading brief…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-bg-elevated/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={isEditing ? `/briefs/${id}` : '/briefs'}
              className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong transition-all duration-150"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg text-text truncate">
                {isEditing ? 'Edit Brief' : 'New Intelligence Brief'}
              </h1>
              <p className="text-xs text-text-tertiary font-ui">
                {isEditing ? 'Editing existing brief' : 'Create a new policy brief'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save */}
            <div className={cn(
              'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium border',
              autoSaveStatus === 'saved'   && 'bg-success/10 text-success border-success/20',
              autoSaveStatus === 'saving'  && 'bg-primary/10 text-primary border-primary/20',
              autoSaveStatus === 'unsaved' && 'bg-bg-subtle text-text-secondary border-border',
            )}>
              {autoSaveStatus === 'saved'   && <><Check className="w-3 h-3" /> Saved</>}
              {autoSaveStatus === 'saving'  && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              {autoSaveStatus === 'unsaved' && <><div className="w-2 h-2 rounded-full border border-text-tertiary" /> Unsaved</>}
            </div>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold font-ui border transition-all duration-150',
                previewMode
                  ? 'bg-primary text-white border-primary'
                  : 'text-text-secondary border-border hover:text-text hover:border-border-strong'
              )}
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>

            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="lg:hidden p-2 rounded-lg border border-border text-text-secondary hover:text-text transition-colors"
            >
              {showLeftPanel ? <Settings className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
            </button>

            <button
              onClick={() => { setAutoSaveStatus('saving'); saveMutation.mutate(formData) }}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal disabled:opacity-50"
            >
              <Save className={cn('w-4 h-4', saveMutation.isPending && 'animate-spin')} />
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        {showLeftPanel && (
          <aside className="w-72 border-r border-border bg-bg-surface flex-shrink-0 overflow-y-auto hidden lg:block">
            <div className="p-4 space-y-6">

              {/* AI Generation */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  AI Generation
                </h3>
                <textarea
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. South China Sea territorial disputes, Q3 2025"
                  className="input-base resize-none min-h-[80px] mb-3"
                  rows={3}
                />
                {aiError && (
                  <p className="text-xs text-error mb-2 font-ui">{aiError}</p>
                )}
                <button
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 disabled:opacity-50 shadow-teal"
                >
                  {aiGenerating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
                </button>

                {aiGenerating && (
                  <div className="mt-4">
                    <AgentPipeline steps={agentSteps} />
                  </div>
                )}
              </section>

              {/* Configuration */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3">Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className={LABEL_CLS}>Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => updateField('title', e.target.value)}
                      placeholder="Brief title"
                      className={FIELD_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Region</label>
                    <select value={formData.region || ''} onChange={e => updateField('region', e.target.value)} className={FIELD_CLS}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Classification</label>
                    <select
                      value={formData.classification || 'unclassified'}
                      onChange={e => updateField('classification', e.target.value as Paparan['classification'])}
                      className={FIELD_CLS}
                    >
                      <option value="unclassified">Unclassified</option>
                      <option value="official">Official</option>
                      <option value="confidential">Confidential</option>
                      <option value="secret">Secret</option>
                    </select>
                    <div className="mt-2">
                      <ClassificationBadge level={formData.classification || 'unclassified'} variant="inline" />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Date</label>
                    <input type="date" value={formData.date || ''} onChange={e => updateField('date', e.target.value)} className={FIELD_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={(formData.tags || []).join(', ')}
                      onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                      placeholder="trade, security, ASEAN"
                      className={FIELD_CLS}
                    />
                  </div>
                </div>
              </section>
            </div>
          </aside>
        )}

        {/* Right panel — editor / preview */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {previewMode ? (
            <div className="px-4 lg:px-8 py-6">
              <DocumentFrame classification={formData.classification || 'unclassified'} watermark>
                <div className="text-center pb-6 mb-8 border-b border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 font-ui">Policy Intelligence Brief</p>
                  <h1 className="font-display font-bold text-2xl text-text">{formData.title || 'Untitled Brief'}</h1>
                  <p className="text-xs text-text-secondary mt-2 font-ui">{formData.region} · {formData.date}</p>
                </div>
                {formData.executiveSummary && formData.executiveSummary.length > 0 && (
                  <section className="mb-6">
                    <h2 className="section-header">Executive Summary</h2>
                    <ul className="space-y-2">
                      {(formData.executiveSummary || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-text">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {formData.currentSituation && (
                  <section className="mb-6">
                    <h2 className="section-header">Current Situation</h2>
                    <p className="text-sm text-text leading-relaxed">{formData.currentSituation}</p>
                  </section>
                )}
              </DocumentFrame>
            </div>
          ) : (
            <div className="px-4 lg:px-8 py-6 space-y-6">

              {/* Executive Summary */}
              <EditorSection title="Executive Summary">
                <div className="space-y-2">
                  {(formData.executiveSummary || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-3.5 flex-shrink-0" />
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          const updated = [...(formData.executiveSummary || [])]
                          updated[i] = e.target.value
                          updateField('executiveSummary', updated)
                        }}
                        placeholder={`Summary point ${i + 1}`}
                        className="input-base flex-1"
                      />
                      <button onClick={() => updateField('executiveSummary', (formData.executiveSummary || []).filter((_, idx) => idx !== i))}
                        className="p-2 text-text-tertiary hover:text-error transition-colors rounded-lg hover:bg-error/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <AddButton onClick={() => updateField('executiveSummary', [...(formData.executiveSummary || []), ''])} label="Add point" />
                </div>
              </EditorSection>

              {/* Current Situation */}
              <EditorSection title="Current Situation">
                <textarea
                  value={formData.currentSituation || ''}
                  onChange={e => updateField('currentSituation', e.target.value)}
                  placeholder="Describe the current situation…"
                  className="input-base resize-none min-h-[120px]"
                  rows={5}
                />
              </EditorSection>

              {/* Developments */}
              <EditorSection title="Key Developments">
                <div className="space-y-3">
                  {(formData.developments || []).map((dev, i) => (
                    <div key={dev.id} className="surface-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select value={dev.delta} onChange={e => {
                          const updated = [...(formData.developments as Development[])]
                          updated[i] = { ...updated[i], delta: e.target.value as Development['delta'] }
                          updateField('developments', updated)
                        }} className="input-base w-32 text-xs">
                          {(['NEW','UPDATED','ESCALATED','DE-ESCALATED'] as const).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={dev.impact} onChange={e => {
                          const updated = [...(formData.developments as Development[])]
                          updated[i] = { ...updated[i], impact: e.target.value as Development['impact'] }
                          updateField('developments', updated)
                        }} className="input-base w-28 text-xs">
                          {(['HIGH','MEDIUM','LOW'] as const).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button onClick={() => updateField('developments', (formData.developments as Development[]).filter((_, idx) => idx !== i))}
                          className="ml-auto p-1.5 text-text-tertiary hover:text-error transition-colors rounded-lg hover:bg-error/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={dev.text}
                        onChange={e => {
                          const updated = [...(formData.developments as Development[])]
                          updated[i] = { ...updated[i], text: e.target.value }
                          updateField('developments', updated)
                        }}
                        placeholder="Development description…"
                        className="input-base"
                      />
                    </div>
                  ))}
                  <AddButton onClick={() => updateField('developments', [...(formData.developments as Development[] || []), { id: `dev-${Date.now()}`, text: '', impact: 'MEDIUM', delta: 'NEW', sourceId: '', date: new Date().toLocaleDateString() }])} label="Add development" />
                </div>
              </EditorSection>

              {/* Strategic Implications */}
              <EditorSection title="Strategic Implications">
                <textarea
                  value={formData.implications || ''}
                  onChange={e => updateField('implications', e.target.value)}
                  placeholder="Strategic implications…"
                  className="input-base resize-none min-h-[100px]"
                  rows={4}
                />
              </EditorSection>

              {/* Risks */}
              <EditorSection title="Risks">
                <div className="space-y-2">
                  {(formData.risks || []).map((risk, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={risk} onChange={e => {
                        const updated = [...(formData.risks || [])]
                        updated[i] = e.target.value
                        updateField('risks', updated)
                      }} placeholder="Risk description" className="input-base flex-1" />
                      <button onClick={() => updateField('risks', (formData.risks || []).filter((_, idx) => idx !== i))}
                        className="p-2 text-text-tertiary hover:text-error transition-colors rounded-lg hover:bg-error/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <AddButton onClick={() => updateField('risks', [...(formData.risks || []), ''])} label="Add risk" />
                </div>
              </EditorSection>

              {/* Opportunities */}
              <EditorSection title="Opportunities">
                <div className="space-y-2">
                  {(formData.opportunities || []).map((opp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={opp} onChange={e => {
                        const updated = [...(formData.opportunities || [])]
                        updated[i] = e.target.value
                        updateField('opportunities', updated)
                      }} placeholder="Opportunity description" className="input-base flex-1" />
                      <button onClick={() => updateField('opportunities', (formData.opportunities || []).filter((_, idx) => idx !== i))}
                        className="p-2 text-text-tertiary hover:text-error transition-colors rounded-lg hover:bg-error/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <AddButton onClick={() => updateField('opportunities', [...(formData.opportunities || []), ''])} label="Add opportunity" />
                </div>
              </EditorSection>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <h3 className="text-sm font-bold text-text font-display mb-4 pb-3 border-b border-border">{title}</h3>
      {children}
    </section>
  )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-ui font-medium transition-colors py-1"
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}
