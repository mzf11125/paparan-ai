import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Paparan } from '@/types/paparan'

// Auth types
export interface User {
  email: string
  name: string
  avatar?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => Promise<boolean>
  logout: () => void
}

const ALLOWED_EMAIL = 'mzidanfatonie@gmail.com'

export interface BriefFilters {
  region?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  impactLevel?: ('HIGH' | 'MEDIUM' | 'LOW')[]
  classification?: ('unclassified' | 'official' | 'confidential' | 'secret')[]
  searchQuery?: string
}

export interface SavedSearch {
  id: string
  name: string
  filters: BriefFilters
  createdAt: Date
}

export interface AppStore {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => Promise<boolean>
  logout: () => void

  // Briefs data
  briefs: Paparan[]
  setBriefs: (briefs: Paparan[]) => void
  addBrief: (brief: Paparan) => void
  updateBrief: (id: string, updates: Partial<Paparan>) => void
  deleteBrief: (id: string) => void

  // Watchlist/Bookmarks
  watchlist: string[]
  addToWatchlist: (id: string) => void
  removeFromWatchlist: (id: string) => void
  toggleWatchlist: (id: string) => void
  isInWatchlist: (id: string) => boolean

  // Saved searches
  savedSearches: SavedSearch[]
  addSavedSearch: (name: string, filters: BriefFilters) => void
  deleteSavedSearch: (id: string) => void
  applySavedSearch: (id: string) => void

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
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email: string) => {
        set({ isLoading: true })
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800))

        if (email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
          const user: User = {
            email: ALLOWED_EMAIL,
            name: 'Zidan Fatonie',
            avatar: 'https://ui-avatars.com/api/?name=ZF&background=1d4ed8&color=fff'
          }
          set({ user, isAuthenticated: true, isLoading: false })
          return true
        }

        set({ isLoading: false })
        return false
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

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

      // Watchlist/Bookmarks
      watchlist: [],
      addToWatchlist: (id) => set((state) => ({
        watchlist: [...new Set([...state.watchlist, id])]
      })),
      removeFromWatchlist: (id) => set((state) => ({
        watchlist: state.watchlist.filter((item) => item !== id)
      })),
      toggleWatchlist: (id) => set((state) => ({
        watchlist: state.watchlist.includes(id)
          ? state.watchlist.filter((item) => item !== id)
          : [...new Set([...state.watchlist, id])]
      })),
      isInWatchlist: (id) => get().watchlist.includes(id),

      // Saved searches
      savedSearches: [],
      addSavedSearch: (name, filters) => set((state) => ({
        savedSearches: [
          ...state.savedSearches,
          {
            id: `search-${Date.now()}`,
            name,
            filters,
            createdAt: new Date()
          }
        ]
      })),
      deleteSavedSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter((s) => s.id !== id)
      })),
      applySavedSearch: (id) => {
        const search = get().savedSearches.find((s) => s.id === id)
        if (search) {
          set({ filters: search.filters })
        }
      },

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
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        viewMode: state.viewMode,
        watchlist: state.watchlist,
        savedSearches: state.savedSearches
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

    // Impact level filter
    if (filters.impactLevel && filters.impactLevel.length > 0) {
      const hasMatchingImpact = brief.developments.some((d) =>
        filters.impactLevel?.includes(d.impact)
      )
      if (!hasMatchingImpact) return false
    }

    // Date range filter
    if (filters.dateRange) {
      const briefDate = new Date(brief.date)
      if (briefDate < filters.dateRange.start || briefDate > filters.dateRange.end) {
        return false
      }
    }

    return true
  })
}

// Selector for watchlist briefs
export const useWatchlistBriefs = () => {
  const briefs = useAppStore((state) => state.briefs)
  const watchlist = useAppStore((state) => state.watchlist)

  return briefs.filter((brief) => watchlist.includes(brief.id))
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
