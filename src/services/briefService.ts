import { Paparan } from '@/types/paparan'
import { BriefFilters } from '@/contexts/AppContext'

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory storage (in production, this would be a real API)
let briefsStore: Paparan[] = []

export interface BriefService {
  getAllBriefs(filters?: BriefFilters): Promise<Paparan[]>
  getBriefById(id: string): Promise<Paparan | null>
  createBrief(brief: Partial<Paparan>): Promise<Paparan>
  updateBrief(id: string, brief: Partial<Paparan>): Promise<Paparan>
  deleteBrief(id: string): Promise<void>
  searchBriefs(query: string): Promise<Paparan[]>
  getRelatedBriefs(id: string, limit?: number): Promise<Paparan[]>
}

class BriefServiceImpl implements BriefService {
  async getAllBriefs(filters?: BriefFilters): Promise<Paparan[]> {
    await delay(300) // Simulate network delay

    let results = [...briefsStore]

    if (filters) {
      // Apply filters
      if (filters.region) {
        results = results.filter((b) => b.region === filters.region)
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter((b) =>
          filters.tags!.some((tag) => b.tags?.includes(tag))
        )
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        results = results.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.region.toLowerCase().includes(query) ||
            b.tags?.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      if (filters.dateRange) {
        results = results.filter((b) => {
          const briefDate = new Date(b.date)
          return (
            briefDate >= filters.dateRange!.start &&
            briefDate <= filters.dateRange!.end
          )
        })
      }
    }

    // Sort by date (newest first)
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return results
  }

  async getBriefById(id: string): Promise<Paparan | null> {
    await delay(200)
    return briefsStore.find((b) => b.id === id) || null
  }

  async createBrief(brief: Partial<Paparan>): Promise<Paparan> {
    await delay(400)

    const newBrief: Paparan = {
      id: `brief-${Date.now()}`,
      title: brief.title || 'Untitled Brief',
      date: brief.date || new Date().toISOString().split('T')[0],
      region: brief.region || 'Global',
      lastUpdated: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      executiveSummary: brief.executiveSummary || [],
      currentSituation: brief.currentSituation || '',
      developments: brief.developments || [],
      implications: brief.implications || '',
      risks: brief.risks || [],
      opportunities: brief.opportunities || [],
      actions: brief.actions || [],
      sources: brief.sources || [],
      tags: brief.tags || []
    }

    briefsStore.push(newBrief)
    return newBrief
  }

  async updateBrief(id: string, updates: Partial<Paparan>): Promise<Paparan> {
    await delay(300)

    const index = briefsStore.findIndex((b) => b.id === id)
    if (index === -1) {
      throw new Error(`Brief with id ${id} not found`)
    }

    briefsStore[index] = {
      ...briefsStore[index],
      ...updates,
      id,
      lastUpdated: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    }

    return briefsStore[index]
  }

  async deleteBrief(id: string): Promise<void> {
    await delay(200)
    briefsStore = briefsStore.filter((b) => b.id !== id)
  }

  async searchBriefs(query: string): Promise<Paparan[]> {
    await delay(250)

    const lowerQuery = query.toLowerCase()
    return briefsStore.filter(
      (b) =>
        b.title.toLowerCase().includes(lowerQuery) ||
        b.region.toLowerCase().includes(lowerQuery) ||
        b.executiveSummary.some((point) =>
          point.toLowerCase().includes(lowerQuery)
        ) ||
        b.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    )
  }

  async getRelatedBriefs(id: string, limit = 3): Promise<Paparan[]> {
    await delay(200)

    const brief = briefsStore.find((b) => b.id === id)
    if (!brief) return []

    // Find related briefs by region or tags
    const related = briefsStore
      .filter((b) => b.id !== id)
      .map((b) => {
        let score = 0

        // Same region
        if (b.region === brief.region) score += 3

        // Common tags
        const commonTags = (b.tags || []).filter((tag) =>
          brief.tags?.includes(tag)
        ).length
        score += commonTags

        return { brief: b, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.brief)

    return related
  }
}

// Export singleton instance
export const briefService = new BriefServiceImpl()

// Helper function to initialize with mock data
export function initializeBriefStore(initialBriefs: Paparan[]) {
  briefsStore = [...initialBriefs]
}
