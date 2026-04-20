import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Eye, ArrowLeft, Plus, Trash2, Check, FileEdit } from 'lucide-react'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { Paparan, Development } from '@/types/paparan'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { cn } from '@/utils/formatters'

// Initialize store with mock data
initializeBriefStore(mockBriefs)

export function BriefEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [previewMode, setPreviewMode] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

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

  // Auto-save effect
  useEffect(() => {
    if (autoSaveStatus === 'unsaved') {
      const timer = setTimeout(() => {
        setAutoSaveStatus('saving')
        saveMutation.mutate(formData)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [formData, autoSaveStatus])

  const handleSave = () => {
    setAutoSaveStatus('saving')
    saveMutation.mutate(formData)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary font-ui">Loading brief...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Official Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            to={isEditing ? `/briefs/${id}` : '/briefs'}
            className="p-2 rounded-lg hover:bg-bg-surface transition-colors border border-transparent hover:border-border"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-accent rounded-full" />
            <div>
              <h1 className="text-2xl font-display font-bold text-text">
                {isEditing ? 'Edit Brief' : 'Create New Brief'}
              </h1>
              <p className="text-sm text-text-secondary font-ui">
                {isEditing ? 'Editing existing policy intelligence brief' : 'Create a new policy intelligence brief'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 text-sm font-ui px-3 py-1.5 rounded-lg border",
            autoSaveStatus === 'saved' && "bg-green-light/30 text-green border-green/30",
            autoSaveStatus === 'saving' && "bg-amber-light/30 text-amber border-amber/30",
            autoSaveStatus === 'unsaved' && "bg-bg-surface text-text-tertiary border-border"
          )}>
            {autoSaveStatus === 'saved' && (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            )}
            {autoSaveStatus === 'saving' && (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            )}
            {autoSaveStatus === 'unsaved' && (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-border" />
                Unsaved
              </>
            )}
          </div>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg font-ui text-sm transition-colors",
              previewMode
                ? "bg-primary text-white border-primary"
                : "bg-bg-elevated border-border hover:border-primary hover:text-primary text-text-secondary"
            )}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </button>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 font-ui text-sm shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-bg-elevated border border-border rounded-lg">
        <div className="p-6 space-y-8">
          {/* Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileEdit className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-ui">Basic Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2 font-ui">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., ASEAN Trade Relations — Vietnam-Indonesia Tariff Dispute"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2 font-ui">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2 font-ui">
                  Region *
                </label>
                <select
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                >
                  <option value="">Select region</option>
                  <option value="APAC">APAC</option>
                  <option value="EMEA">EMEA</option>
                  <option value="Americas">Americas</option>
                  <option value="ASEAN">ASEAN</option>
                  <option value="Global">Global</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2 font-ui">
                  Classification
                </label>
                <select
                  value={formData.classification || 'unclassified'}
                  onChange={(e) => updateField('classification', e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                >
                  <option value="unclassified">Unclassified</option>
                  <option value="official">Official Use Only</option>
                  <option value="confidential">Confidential</option>
                  <option value="secret">Secret</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2 font-ui">
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
            <label className="block text-sm font-medium text-text mb-2 font-ui">
              Tags
            </label>
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => updateTags(e.target.value)}
              placeholder="e.g., Trade Policy, ASEAN, Vietnam, Indonesia (comma-separated)"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
            />
          </div>

          {/* Executive Summary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <label className="text-sm font-semibold text-text font-ui">Executive Summary</label>
              </div>
              <button
                type="button"
                onClick={addExecutiveSummaryItem}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {(formData.executiveSummary || []).map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-text-tertiary mt-2.5 font-ui tabular-nums">{index + 1}.</span>
                  <textarea
                    value={item}
                    onChange={(e) => updateExecutiveSummaryItem(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Key point..."
                  />
                  <button
                    type="button"
                    onClick={() => removeExecutiveSummaryItem(index)}
                    className="p-2 text-red hover:bg-red-light rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(formData.executiveSummary || []).length === 0 && (
                <button
                  type="button"
                  onClick={addExecutiveSummaryItem}
                  className="w-full py-8 border-2 border-dashed border-border rounded-lg text-text-tertiary hover:border-accent hover:text-accent transition-colors font-ui"
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
              <label className="text-sm font-semibold text-text font-ui">Current Situation</label>
            </div>
            <textarea
              value={formData.currentSituation || ''}
              onChange={(e) => updateField('currentSituation', e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
              placeholder="Describe the current situation and context..."
            />
          </div>

          {/* Developments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <label className="text-sm font-semibold text-text font-ui">Key Developments</label>
              </div>
              <button
                type="button"
                onClick={addDevelopment}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Development
              </button>
            </div>
            <div className="space-y-4">
              {(formData.developments || []).map((dev, index) => (
                <div key={dev.id} className="p-4 bg-background border border-border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-text font-ui">Development {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeDevelopment(index)}
                      className="p-1 text-red hover:bg-red-light rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={dev.text}
                    onChange={(e) => updateDevelopment(index, 'text', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Development description..."
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1 font-ui">Impact</label>
                      <select
                        value={dev.impact}
                        onChange={(e) => updateDevelopment(index, 'impact', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-sm"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1 font-ui">Delta</label>
                      <select
                        value={dev.delta}
                        onChange={(e) => updateDevelopment(index, 'delta', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-sm"
                      >
                        <option value="NEW">New</option>
                        <option value="UPDATED">Updated</option>
                        <option value="ESCALATED">Escalated</option>
                        <option value="DE-ESCALATED">De-escalated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1 font-ui">Date</label>
                      <input
                        type="text"
                        value={dev.date || ''}
                        onChange={(e) => updateDevelopment(index, 'date', e.target.value)}
                        placeholder="e.g., 15 April 2026"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-sm"
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
              <label className="text-sm font-semibold text-text font-ui">Strategic Implications</label>
            </div>
            <textarea
              value={formData.implications || ''}
              onChange={(e) => updateField('implications', e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
              placeholder="Describe strategic implications..."
            />
          </div>

          {/* Risks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red rounded-full" />
                <label className="text-sm font-semibold text-text font-ui">Risks</label>
              </div>
              <button
                type="button"
                onClick={addRisk}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Risk
              </button>
            </div>
            <div className="space-y-2">
              {(formData.risks || []).map((risk, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-red mt-2.5">⚠</span>
                  <textarea
                    value={risk}
                    onChange={(e) => updateRisk(index, e.target.value)}
                    rows={1}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Risk description..."
                  />
                  <button
                    type="button"
                    onClick={() => removeRisk(index)}
                    className="p-2 text-red hover:bg-red-light rounded-lg transition-colors"
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
                <label className="text-sm font-semibold text-text font-ui">Opportunities</label>
              </div>
              <button
                type="button"
                onClick={addOpportunity}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark font-ui"
              >
                <Plus className="w-4 h-4" />
                Add Opportunity
              </button>
            </div>
            <div className="space-y-2">
              {(formData.opportunities || []).map((opp, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-green mt-2.5">✓</span>
                  <textarea
                    value={opp}
                    onChange={(e) => updateOpportunity(index, e.target.value)}
                    rows={1}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-ui text-sm"
                    placeholder="Opportunity description..."
                  />
                  <button
                    type="button"
                    onClick={() => removeOpportunity(index)}
                    className="p-2 text-red hover:bg-red-light rounded-lg transition-colors"
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
