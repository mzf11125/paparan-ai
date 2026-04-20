import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Paparan } from '@/types/paparan'

export interface BriefFilters {
  region?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  impactLevel?: ('HIGH' | 'MEDIUM' | 'LOW')[]
  searchQuery?: string
}

export interface AppStore {
  // Briefs data
  briefs: Paparan[]
  setBriefs: (briefs: Paparan[]) => void
  addBrief: (brief: Paparan) => void
  updateBrief: (id: string, updates: Partial<Paparan>) => void
  deleteBrief: (id: string) => void

  // Filter state
  filters: BriefFilters
  setFilters: (filters: Partial<BriefFilters>) => void
  clearFilters: () => void

  // UI state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

const defaultFilters: BriefFilters = {}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Briefs data
      briefs: [],
      setBriefs: (briefs) => set({ briefs }),
      addBrief: (brief) => set((state) => ({ briefs: [...state.briefs, brief] })),
      updateBrief: (id, updates) =>
        set((state) => ({
          briefs: state.briefs.map((b) => (b.id === id ? { ...b, ...updates } : b))
        })),
      deleteBrief: (id) =>
        set((state) => ({ briefs: state.briefs.filter((b) => b.id !== id) })),

      // Filter state
      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
      clearFilters: () => set({ filters: defaultFilters }),

      // UI state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open })
    }),
    {
      name: 'paparan-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        viewMode: state.viewMode
      })
    }
  )
)

// Selectors for filtered briefs
export const useFilteredBriefs = () => {
  const briefs = useAppStore((state) => state.briefs)
  const filters = useAppStore((state) => state.filters)

  return briefs.filter((brief) => {
    // Region filter
    if (filters.region && brief.region !== filters.region) {
      return false
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some((tag) => brief.tags?.includes(tag))
      if (!hasTag) return false
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matchesTitle = brief.title.toLowerCase().includes(query)
      const matchesRegion = brief.region.toLowerCase().includes(query)
      const matchesTags = brief.tags?.some((tag) => tag.toLowerCase().includes(query))
      if (!matchesTitle && !matchesRegion && !matchesTags) {
        return false
      }
    }

    return true
  })
}

// Selector for brief statistics
export const useBriefStats = () => {
  const briefs = useAppStore((state) => state.briefs)

  return {
    totalBriefs: briefs.length,
    regions: Array.from(new Set(briefs.map((b) => b.region))),
    topTags: Object.entries(
      briefs.flatMap((b) => b.tags || []).reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  }
}
