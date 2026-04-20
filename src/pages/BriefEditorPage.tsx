import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Eye, ArrowLeft, Plus, Trash2, Check } from 'lucide-react'
import { briefService, initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { Paparan, Development } from '@/types/paparan'

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
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C8A96A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading brief...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={isEditing ? `/briefs/${id}` : '/briefs'}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              {isEditing ? 'Edit Brief' : 'Create New Brief'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Editing existing policy intelligence brief' : 'Create a new policy intelligence brief'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {autoSaveStatus === 'saved' && (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Saved
              </>
            )}
            {autoSaveStatus === 'saving' && (
              <>
                <div className="w-4 h-4 border-2 border-[#C8A96A] border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            )}
            {autoSaveStatus === 'unsaved' && (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                Unsaved
              </>
            )}
          </div>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </button>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-[#E8E4DC] rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., ASEAN Trade Relations — Vietnam-Indonesia Tariff Dispute"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region *
                </label>
                <select
                  value={formData.region || ''}
                  onChange={(e) => updateField('region', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                >
                  <option value="">Select region</option>
                  <option value="APAC">APAC</option>
                  <option value="EMEA">EMEA</option>
                  <option value="Americas">Americas</option>
                  <option value="ASEAN">ASEAN</option>
                  <option value="Global">Global</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => updateTags(e.target.value)}
              placeholder="e.g., Trade Policy, ASEAN, Vietnam, Indonesia (comma-separated)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
            />
          </div>

          {/* Executive Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Executive Summary
              </label>
              <button
                type="button"
                onClick={addExecutiveSummaryItem}
                className="flex items-center gap-1 text-sm text-[#C8A96A] hover:text-[#A88B4A]"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {(formData.executiveSummary || []).map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-2">{index + 1}.</span>
                  <textarea
                    value={item}
                    onChange={(e) => updateExecutiveSummaryItem(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] resize-none"
                    placeholder="Key point..."
                  />
                  <button
                    type="button"
                    onClick={() => removeExecutiveSummaryItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(formData.executiveSummary || []).length === 0 && (
                <button
                  type="button"
                  onClick={addExecutiveSummaryItem}
                  className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-[#C8A96A] hover:text-[#C8A96A] transition-colors"
                >
                  Add executive summary item
                </button>
              )}
            </div>
          </div>

          {/* Current Situation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Situation
            </label>
            <textarea
              value={formData.currentSituation || ''}
              onChange={(e) => updateField('currentSituation', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] resize-none"
              placeholder="Describe the current situation and context..."
            />
          </div>

          {/* Developments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Key Developments
              </label>
              <button
                type="button"
                onClick={addDevelopment}
                className="flex items-center gap-1 text-sm text-[#C8A96A] hover:text-[#A88B4A]"
              >
                <Plus className="w-4 h-4" />
                Add Development
              </button>
            </div>
            <div className="space-y-4">
              {(formData.developments || []).map((dev, index) => (
                <div key={dev.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-gray-500">Development {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeDevelopment(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={dev.text}
                    onChange={(e) => updateDevelopment(index, 'text', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] resize-none"
                    placeholder="Development description..."
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Impact</label>
                      <select
                        value={dev.impact}
                        onChange={(e) => updateDevelopment(index, 'impact', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] text-sm"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Delta</label>
                      <select
                        value={dev.delta}
                        onChange={(e) => updateDevelopment(index, 'delta', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] text-sm"
                      >
                        <option value="NEW">New</option>
                        <option value="UPDATED">Updated</option>
                        <option value="ESCALATED">Escalated</option>
                        <option value="DE-ESCALATED">De-escalated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="text"
                        value={dev.date || ''}
                        onChange={(e) => updateDevelopment(index, 'date', e.target.value)}
                        placeholder="e.g., 15 April 2026"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Implications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strategic Implications
            </label>
            <textarea
              value={formData.implications || ''}
              onChange={(e) => updateField('implications', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] resize-none"
              placeholder="Describe strategic implications..."
            />
          </div>

          {/* Risks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Risks
              </label>
              <button
                type="button"
                onClick={addRisk}
                className="flex items-center gap-1 text-sm text-[#C8A96A] hover:text-[#A88B4A]"
              >
                <Plus className="w-4 h-4" />
                Add Risk
              </button>
            </div>
            <div className="space-y-2">
              {(formData.risks || []).map((risk, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-2">⚠</span>
                  <textarea
                    value={risk}
                    onChange={(e) => updateRisk(index, e.target.value)}
                    rows={1}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] resize-none"
                    placeholder="Risk description..."
                  />
                  <button
                    type="button"
                    onClick={() => removeRisk(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Opportunities
              </label>
              <button
                type="button"
                onClick={addOpportunity}
                className="flex items-center gap-1 text-sm text-[#C8A96A] hover:text-[#A88B4A]"
              >
                <Plus className="w-4 h-4" />
                Add Opportunity
              </button>
            </div>
            <div className="space-y-2">
              {(formData.opportunities || []).map((opp, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-2">✓</span>
                  <textarea
                    value={opp}
                    onChange={(e) => updateOpportunity(index, e.target.value)}
                    rows={1}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A] resize-none"
                    placeholder="Opportunity description..."
                  />
                  <button
                    type="button"
                    onClick={() => removeOpportunity(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
