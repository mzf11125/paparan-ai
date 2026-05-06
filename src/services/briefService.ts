import { Paparan } from '@/types/paparan'
import { BriefFilters } from '@/contexts/AppContext'
import { apiClient } from './api'

// In-memory fallback storage
let briefsStore: Paparan[] = []

export interface BriefService {
  getAllBriefs(filters?: BriefFilters): Promise<Paparan[]>
  getBriefById(id: string): Promise<Paparan | null>
  createBrief(brief: Partial<Paparan>): Promise<Paparan>
  updateBrief(id: string, brief: Partial<Paparan>): Promise<Paparan>
  deleteBrief(id: string): Promise<void>
  searchBriefs(query: string): Promise<Paparan[]>
  getRelatedBriefs(id: string, limit?: number): Promise<Paparan[]>
  generateBrief(topic: string, region: string, classification?: string): Promise<Paparan>
}

class BriefServiceImpl implements BriefService {
  async getAllBriefs(filters?: BriefFilters): Promise<Paparan[]> {
    try {
      const briefs = await apiClient.get<Paparan[]>('/api/briefs')
      briefsStore = briefs
      return this._applyFilters(briefs, filters)
    } catch {
      return this._applyFilters(briefsStore, filters)
    }
  }

  async getBriefById(id: string): Promise<Paparan | null> {
    try {
      return await apiClient.get<Paparan>(`/api/briefs/${id}`)
    } catch {
      return briefsStore.find(b => b.id === id) || null
    }
  }

  async createBrief(brief: Partial<Paparan>): Promise<Paparan> {
    const newBrief: Paparan = {
      id: `brief-${Date.now()}`,
      title: brief.title || 'Untitled Brief',
      date: brief.date || new Date().toISOString().split('T')[0],
      region: brief.region || 'Global',
      executiveSummary: brief.executiveSummary || [],
      currentSituation: brief.currentSituation || '',
      developments: brief.developments || [],
      implications: brief.implications || '',
      risks: brief.risks || [],
      opportunities: brief.opportunities || [],
      actions: brief.actions || [],
      sources: brief.sources || [],
      tags: brief.tags || [],
    }
    briefsStore.push(newBrief)
    return newBrief
  }

  async updateBrief(id: string, updates: Partial<Paparan>): Promise<Paparan> {
    const index = briefsStore.findIndex(b => b.id === id)
    if (index === -1) throw new Error(`Brief ${id} not found`)
    briefsStore[index] = { ...briefsStore[index], ...updates, id }
    return briefsStore[index]
  }

  async deleteBrief(id: string): Promise<void> {
    briefsStore = briefsStore.filter(b => b.id !== id)
  }

  async searchBriefs(query: string): Promise<Paparan[]> {
    try {
      return await apiClient.get<Paparan[]>(`/api/search?q=${encodeURIComponent(query)}`)
    } catch {
      const q = query.toLowerCase()
      return briefsStore.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q) ||
        b.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
  }

  async getRelatedBriefs(id: string, limit = 3): Promise<Paparan[]> {
    const brief = briefsStore.find(b => b.id === id)
    if (!brief) return []
    return briefsStore
      .filter(b => b.id !== id && (b.region === brief.region || b.tags?.some(t => brief.tags?.includes(t))))
      .slice(0, limit)
  }

  async generateBrief(topic: string, region: string, classification = 'unclassified'): Promise<Paparan> {
    return await apiClient.postStream<Paparan>('/api/paparan', { topic, region, classification })
  }

  private _applyFilters(briefs: Paparan[], filters?: BriefFilters): Paparan[] {
    if (!filters) return briefs
    let results = [...briefs]
    if (filters.region) results = results.filter(b => b.region === filters.region)
    if (filters.tags?.length) results = results.filter(b => filters.tags!.some(t => b.tags?.includes(t)))
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      results = results.filter(b => b.title.toLowerCase().includes(q) || b.region.toLowerCase().includes(q))
    }
    if (filters.dateRange) {
      results = results.filter(b => {
        const d = new Date(b.date)
        return d >= filters.dateRange!.start && d <= filters.dateRange!.end
      })
    }
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}

export const briefService = new BriefServiceImpl()

export function initializeBriefStore(initialBriefs: Paparan[]) {
  briefsStore = [...initialBriefs]
}
