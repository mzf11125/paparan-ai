import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Eye, ArrowLeft, Plus, Trash2, Check, FileEdit, Sparkles, Loader2 } from 'lucide-react'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { Paparan, Development } from '@/types/paparan'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { cn } from '@/utils/formatters'

initializeBriefStore(mockBriefs)

const REGIONS = ['ASEAN', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Philippines', 'Vietnam', 'Myanmar', 'Global']

export function BriefEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [previewMode, setPreviewMode] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [aiTopic, setAiTopic] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiGenerationStep, setAiGenerationStep] = useState<string>('')
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<Paparan>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    region: '',
    classification: 'unclassified',
    executiveSummary: [],
    currentSituation: '',
    developments: [],
    implications: '',
    risks: [],
    opportunities: [],
    actions: [],
    sources: [],
    tags: []
  })

  // Load brief for editing
  const { data: brief, isLoading } = useQuery({
    queryKey: ['brief', id],
    queryFn: () => briefService.getBriefById(id || ''),
    enabled: isEditing
  })

  // Update form data when brief is loaded
  useEffect(() => {
    if (brief) {
      setFormData(brief)
    }
  }, [brief])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Paparan>) =>
      isEditing
        ? briefService.updateBrief(id!, data)
        : briefService.createBrief(data),
    onSuccess: () => {
      setAutoSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['briefs'] })
      if (!isEditing) {
        navigate('/briefs')
      }
    }
  })

  // Auto-save effect with debounce to prevent race conditions
  useEffect(() => {
    if (autoSaveStatus === 'unsaved') {
      // Clear any existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Set new timeout with debounce (3 seconds)
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus('saving')
        saveMutation.mutate(formData)
      }, 3000)

      // Cleanup function
      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
      }
    }
  }, [formData, autoSaveStatus])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const handleSave = () => {
    setAutoSaveStatus('saving')
    saveMutation.mutate(formData)
  }

  const handleGenerateWithAI = async () => {
    const topic = aiTopic.trim() || formData.title || ''
    if (!topic) { setAiError('Enter a topic to generate a brief.'); return }
    setAiGenerating(true)
    setAiError('')
    setAiGenerationStep('Initializing research agents...')

    try {
      // Simulate progress updates during generation
      const steps = [
        'Initializing research agents...',
        'Scraping news sources...',
        'Analyzing developments...',
        'Scoring RPJMN alignment...',
        'Enriching spatial context...',
        'Generating brief...'
      ]

      let stepIndex = 0
      const stepInterval = setInterval(() => {
        stepIndex++
        if (stepIndex < steps.length) {
          setAiGenerationStep(steps[stepIndex])
        }
      }, 1500)

      const generated = await briefService.generateBrief(
        topic,
        formData.region || 'ASEAN',
        formData.classification || 'unclassified'
      )

      clearInterval(stepInterval)
      setAiGenerationStep('Completing...')
      setFormData(generated)
      setAutoSaveStatus('unsaved')
      setAiGenerationStep('')
    } catch (e: any) {
      setAiError(e.message?.includes('fetch') ? 'Backend unavailable. Start the API server.' : (e.message || 'Generation failed'))
      setAiGenerationStep('')
    } finally {
      setAiGenerating(false)
    }
  }

  const updateField = (field: keyof Paparan, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setAutoSaveStatus('unsaved')
  }

  const addExecutiveSummaryItem = () => {
    updateField('executiveSummary', [...(formData.executiveSummary || []), ''])
  }

  const updateExecutiveSummaryItem = (index: number, value: string) => {
    const updated = [...(formData.executiveSummary || [])]
    updated[index] = value
    updateField('executiveSummary', updated)
  }

  const removeExecutiveSummaryItem = (index: number) => {
    const updated = (formData.executiveSummary || []).filter((_, i) => i !== index)
    updateField('executiveSummary', updated)
  }

  const addDevelopment = () => {
    const newDev: Development = {
      id: `dev-${Date.now()}`,
      text: '',
      impact: 'MEDIUM',
      delta: 'NEW',
      sourceId: '',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      entities: []
    }
    updateField('developments', [...(formData.developments || []), newDev])
  }

  const updateDevelopment = (index: number, field: keyof Development, value: any) => {
    const updated = [...(formData.developments || [])]
    updated[index] = { ...updated[index], [field]: value }
    updateField('developments', updated)
  }

  const removeDevelopment = (index: number) => {
    const updated = (formData.developments || []).filter((_, i) => i !== index)
    updateField('developments', updated)
  }

  const addRisk = () => {
    updateField('risks', [...(formData.risks || []), ''])
  }

  const updateRisk = (index: number, value: string) => {
    const updated = [...(formData.risks || [])]
    updated[index] = value
    updateField('risks', updated)
  }

  const removeRisk = (index: number) => {
    const updated = (formData.risks || []).filter((_, i) => i !== index)
    updateField('risks', updated)
  }

  const addOpportunity = () => {
    updateField('opportunities', [...(formData.opportunities || []), ''])
  }

  const updateOpportunity = (index: number, value: string) => {
    const updated = [...(formData.opportunities || [])]
    updated[index] = value
    updateField('opportunities', updated)
  }

  const removeOpportunity = (index: number) => {
    const updated = (formData.opportunities || []).filter((_, i) => i !== index)
    updateField('opportunities', updated)
  }

  const updateTags = (value: string) => {
    const tags = value.split(',').map((t) => t.trim()).filter(Boolean)
    updateField('tags', tags)
  }

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8] font-ui">Loading brief...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Official Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-4">
          <Link
            to={isEditing ? `/briefs/${id}` : '/briefs'}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors border border-transparent hover:border-[rgba(255,255,255,0.12)]"
          >
            <ArrowLeft className="w-5 h-5 text-[#94A3B8]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#3B82F6] rounded-full" />
            <div>
              <h1 className="text-2xl font-display font-bold text-[#F1F5F9]">
                {isEditing ? 'Edit Brief' : 'Create New Brief'}
              </h1>
              <p className="text-sm text-[#94A3B8] font-ui">
                {isEditing ? 'Editing existing policy intelligence brief' : 'Create a new policy intelligence brief'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 text-sm font-ui px-3 py-1.5 rounded-lg border",
            autoSaveStatus === 'saved' && "bg-[rgba(16,185,129,0.20)] text-[#10B981] border-[rgba(16,185,129,0.30)]",
            autoSaveStatus === 'saving' && "bg-[rgba(245,158,11,0.20)] text-[#F59E0B] border-[rgba(245,158,11,0.30)]",
            autoSaveStatus === 'unsaved' && "bg-[rgba(255,255,255,0.04)] text-[#64748B] border-[rgba(255,255,255,0.12)]"
          )}>
            {autoSaveStatus === 'saved' && (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            )}
            {autoSaveStatus === 'saving' && (
              <>
                <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            )}
            {autoSaveStatus === 'unsaved' && (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-[rgba(255,255,255,0.12)]" />
                Unsaved
              </>
            )}
          </div>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg font-ui text-sm transition-colors",
              previewMode
                ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                : "bg-[#111318] border-[rgba(255,255,255,0.12)] hover:border-[#3B82F6] hover:text-[#3B82F6] text-[#94A3B8]"
            )}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </button>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors disabled:opacity-50 font-ui text-sm shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg">
        <div className="p-6 space-y-8">

          {/* AI Generation Panel */}
          {!isEditing && (
            <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.20)] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <h2 className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider font-ui">Generate with AI</h2>
              </div>
              <p className="text-xs text-[#94A3B8] mb-3">
                Enter a policy topic and let the AI agents research and generate a full brief automatically.
              </p>
              <div className="flex gap-2">
                <input
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateWithAI()}
                  placeholder={`e.g., "ASEAN digital trade agreement 2026" or "OJK crypto regulation Indonesia"`}
                  className="flex-1 px-3 py-2 text-sm border border-[rgba(255,255,255,0.12)] rounded-lg bg-[#181B22] focus:outline-none focus:border-[#3B82F6] text-[#F1F5F9] placeholder:text-[#64748B]"
                  disabled={aiGenerating}
                />
                <select
                  value={formData.region || 'ASEAN'}
                  onChange={e => updateField('region', e.target.value)}
                  className="px-3 py-2 text-sm border border-[rgba(255,255,255,0.12)] rounded-lg bg-[#181B22] focus:outline-none focus:border-[#3B82F6] text-[#F1F5F9]"
                  disabled={aiGenerating}
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white text-sm rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50 font-medium whitespace-nowrap"
                >
                  {aiGenerating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-4 h-4" /> Generate</>}
                </button>
              </div>
              {aiError && <p className="mt-2 text-xs text-[#EF4444]">{aiError}</p>}
              {aiGenerating && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin" />
                    <p className="text-xs text-[#94A3B8]">{aiGenerationStep || 'Generating brief...'}</p>
                  </div>
                  <div className="mt-2 h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3B82F6] animate-pulse rounded-full" style={{ width: '100%', animation: 'progress 2s ease-in-out infinite' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileEdit className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8] font-ui">Basic Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., ASEAN Trade Relations — Vietnam-Indonesia Tariff Dispute"
                  className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                  Region *
                </label>
                <select
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                >
                  <option value="">Select region</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                  Classification
                </label>
                <select
                  value={formData.classification || 'unclassified'}
                  onChange={(e) => updateField('classification', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                >
                  <option value="unclassified">Unclassified</option>
                  <option value="official">Official Use Only</option>
                  <option value="confidential">Confidential</option>
                  <option value="secret">Secret</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                  Classification Preview
                </label>
                <div className="h-11 flex items-center">
                  <ClassificationBadge
                    level={formData.classification ?? 'unclassified'}
                    variant="compact"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
              Tags
            </label>
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => updateTags(e.target.value)}
              placeholder="e.g., Trade Policy, ASEAN, Vietnam, Indonesia (comma-separated)"
              className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
            />
          </div>

          {/* Executive Summary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <label className="text-sm font-semibold text-[#F1F5F9] font-ui">Executive Summary</label>
              </div>
              <button
                type="button"
                onClick={addExecutiveSummaryItem}
                className="flex items-center gap-1 text-sm text-[#3B82F6] hover:text-[#3B82F6]-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {(formData.executiveSummary || []).map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-[#64748B] mt-2.5 font-ui tabular-nums">{index + 1}.</span>
                  <textarea
                    value={item}
                    onChange={(e) => updateExecutiveSummaryItem(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Key point..."
                  />
                  <button
                    type="button"
                    onClick={() => removeExecutiveSummaryItem(index)}
                    className="p-2 text-[#EF4444] hover:bg-red-light rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(formData.executiveSummary || []).length === 0 && (
                <button
                  type="button"
                  onClick={addExecutiveSummaryItem}
                  className="w-full py-8 border-2 border-dashed border-[rgba(255,255,255,0.12)] rounded-lg text-[#64748B] hover:border-primary hover:text-[#3B82F6] transition-colors font-ui"
                >
                  Add executive summary item
                </button>
              )}
            </div>
          </div>

          {/* Current Situation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <label className="text-sm font-semibold text-[#F1F5F9] font-ui">Current Situation</label>
            </div>
            <textarea
              value={formData.currentSituation || ''}
              onChange={(e) => updateField('currentSituation', e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
              placeholder="Describe the current situation and context..."
            />
          </div>

          {/* Developments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <label className="text-sm font-semibold text-[#F1F5F9] font-ui">Key Developments</label>
              </div>
              <button
                type="button"
                onClick={addDevelopment}
                className="flex items-center gap-1 text-sm text-[#3B82F6] hover:text-[#3B82F6]-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Development
              </button>
            </div>
            <div className="space-y-4">
              {(formData.developments || []).map((dev, index) => (
                <div key={dev.id} className="p-4 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-[#F1F5F9] font-ui">Development {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeDevelopment(index)}
                      className="p-1 text-[#EF4444] hover:bg-red-light rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={dev.text}
                    onChange={(e) => updateDevelopment(index, 'text', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Development description..."
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#F1F5F9]-secondary mb-1 font-ui">Impact</label>
                      <select
                        value={dev.impact}
                        onChange={(e) => updateDevelopment(index, 'impact', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-sm"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#F1F5F9]-secondary mb-1 font-ui">Delta</label>
                      <select
                        value={dev.delta}
                        onChange={(e) => updateDevelopment(index, 'delta', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-sm"
                      >
                        <option value="NEW">New</option>
                        <option value="UPDATED">Updated</option>
                        <option value="ESCALATED">Escalated</option>
                        <option value="DE-ESCALATED">De-escalated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#F1F5F9]-secondary mb-1 font-ui">Date</label>
                      <input
                        type="text"
                        value={dev.date || ''}
                        onChange={(e) => updateDevelopment(index, 'date', e.target.value)}
                        placeholder="e.g., 15 April 2026"
                        className="w-full px-3 py-2 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Implications */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <label className="text-sm font-semibold text-[#F1F5F9] font-ui">Strategic Implications</label>
            </div>
            <textarea
              value={formData.implications || ''}
              onChange={(e) => updateField('implications', e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
              placeholder="Describe strategic implications..."
            />
          </div>

          {/* Risks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red rounded-full" />
                <label className="text-sm font-semibold text-[#F1F5F9] font-ui">Risks</label>
              </div>
              <button
                type="button"
                onClick={addRisk}
                className="flex items-center gap-1 text-sm text-[#3B82F6] hover:text-[#3B82F6]-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Risk
              </button>
            </div>
            <div className="space-y-2">
              {(formData.risks || []).map((risk, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-[#EF4444] mt-2.5">⚠</span>
                  <textarea
                    value={risk}
                    onChange={(e) => updateRisk(index, e.target.value)}
                    rows={1}
                    className="flex-1 px-3 py-2 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Risk description..."
                  />
                  <button
                    type="button"
                    onClick={() => removeRisk(index)}
                    className="p-2 text-[#EF4444] hover:bg-red-light rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-green rounded-full" />
                <label className="text-sm font-semibold text-[#F1F5F9] font-ui">Opportunities</label>
              </div>
              <button
                type="button"
                onClick={addOpportunity}
                className="flex items-center gap-1 text-sm text-[#3B82F6] hover:text-[#3B82F6]-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Opportunity
              </button>
            </div>
            <div className="space-y-2">
              {(formData.opportunities || []).map((opp, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-[#10B981] mt-2.5">✓</span>
                  <textarea
                    value={opp}
                    onChange={(e) => updateOpportunity(index, e.target.value)}
                    rows={1}
                    className="flex-1 px-3 py-2 bg-background border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Opportunity description..."
                  />
                  <button
                    type="button"
                    onClick={() => removeOpportunity(index)}
                    className="p-2 text-[#EF4444] hover:bg-red-light rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
