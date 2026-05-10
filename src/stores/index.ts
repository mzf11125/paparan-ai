import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ============================================
   TYPES — STORE DEFINITIONS
   ============================================ */

export type ClassificationLevel = 'unclassified' | 'official' | 'confidential' | 'secret'
export type DeltaType = 'NEW' | 'UPDATED' | 'ESCALATED' | 'DE-ESCALATED'
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Development {
  id: string
  text: string
  impact: ImpactLevel
  delta: DeltaType
  sourceId: string
  date?: string
  entities?: string[]
}

export interface Source {
  id: string
  title: string
  url?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  date: string
}

export interface Action {
  priority: ImpactLevel
  text: string
  owner?: string
  deadline?: string
}

export interface Paparan {
  id: string
  title: string
  date: string
  region: string
  lastUpdated?: string
  classification?: ClassificationLevel

  // 7-Section Content
  executiveSummary: string[]
  currentSituation: string
  developments: Development[]
  implications: string
  risks: string[]
  opportunities: string[]
  actions: Action[]
  sources: Source[]
  tags?: string[]

  // Intelligence Enhancements
  rpjmn_alignment?: Record<string, Record<string, number>> | null
  urgency_score?: number | null
  source_count?: number
  confidence_score?: string
  diplomat_meta?: Record<string, unknown> | null
  previous_report_id?: string | null

  // OSINT Enrichments
  spatial_context?: Record<string, unknown>
  archived_sources?: Array<{url: string, archive_url: string}>
  environmental_indicators?: Record<string, unknown>
  conflict_context?: Record<string, unknown>
  rdtii_evidence?: Array<{
    id: string
    brief_id: string
    source_url: string
    clause_text: string
    pillar_id: string
    indicator_code: string
    country: string
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    extracted_at: string
  }>
}

export interface User {
  id: string
  email: string
  name: string
  full_name?: string // Alias for backward compatibility
  avatar?: string
  role?: string
}

export interface SavedSearch {
  id: string
  name: string
  filters: BriefFilters
  createdAt: string
}

export interface BriefFilters {
  search?: string
  regions?: string[]
  classifications?: ClassificationLevel[]
  dateFrom?: string
  dateTo?: string
  tags?: string[]
}

/* ============================================
   APP STORE — MAIN STATE MANAGEMENT
   ============================================ */

interface AppState {
  // Authentication
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void

  // Briefs Data
  briefs: Paparan[]
  setBriefs: (briefs: Paparan[]) => void
  addBrief: (brief: Paparan) => void
  updateBrief: (id: string, updates: Partial<Paparan>) => void
  deleteBrief: (id: string) => void
  getBriefById: (id: string) => Paparan | undefined

  // Watchlist/Bookmarks
  watchlist: string[]
  addToWatchlist: (id: string) => void
  removeFromWatchlist: (id: string) => void
  toggleWatchlist: (id: string) => void
  isInWatchlist: (id: string) => boolean

  // Saved Searches
  savedSearches: SavedSearch[]
  addSavedSearch: (name: string, filters: BriefFilters) => void
  deleteSavedSearch: (id: string) => void

  // UI State
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Filters
  filters: BriefFilters
  setFilters: (filters: Partial<BriefFilters>) => void
  clearFilters: () => void

  // Tracked Topics for Feed
  trackedTopics: string[]
  addTrackedTopic: (topic: string) => void
  removeTrackedTopic: (topic: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Authentication Initial State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Briefs
      briefs: [],
      setBriefs: (briefs) => set({ briefs }),
      addBrief: (brief) => set((state) => ({ briefs: [brief, ...state.briefs] })),
      updateBrief: (id, updates) =>
        set((state) => ({
          briefs: state.briefs.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      deleteBrief: (id) =>
        set((state) => ({
          briefs: state.briefs.filter((b) => b.id !== id),
          watchlist: state.watchlist.filter((w) => w !== id),
        })),
      getBriefById: (id) => get().briefs.find((b) => b.id === id),

      // Watchlist
      watchlist: [],
      addToWatchlist: (id) =>
        set((state) => ({ watchlist: [...new Set([...state.watchlist, id])] })),
      removeFromWatchlist: (id) =>
        set((state) => ({ watchlist: state.watchlist.filter((w) => w !== id) })),
      toggleWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.includes(id)
            ? state.watchlist.filter((w) => w !== id)
            : [...state.watchlist, id],
        })),
      isInWatchlist: (id) => get().watchlist.includes(id),

      // Saved Searches
      savedSearches: [],
      addSavedSearch: (name, filters) =>
        set((state) => ({
          savedSearches: [
            ...state.savedSearches,
            { id: crypto.randomUUID(), name, filters, createdAt: new Date().toISOString() },
          ],
        })),
      deleteSavedSearch: (id) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        })),

      // UI State
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Filters
      filters: {},
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      clearFilters: () => set({ filters: {} }),

      // Tracked Topics
      trackedTopics: ['ASEAN', 'Trade', 'Security'],
      addTrackedTopic: (topic) =>
        set((state) => ({
          trackedTopics: [...new Set([...state.trackedTopics, topic])],
        })),
      removeTrackedTopic: (topic) =>
        set((state) => ({
          trackedTopics: state.trackedTopics.filter((t) => t !== topic),
        })),
    }),
    {
      name: 'paparan-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        viewMode: state.viewMode,
        watchlist: state.watchlist,
        savedSearches: state.savedSearches,
        trackedTopics: state.trackedTopics,
      }),
    }
  )
)

/* ============================================
   BRIEF EDITOR STORE — EDITOR STATE
   ============================================ */

interface BriefEditorState {
  // Draft state
  draft: Partial<Paparan> | null
  setDraft: (draft: Partial<Paparan> | null) => void
  updateDraftField: <K extends keyof Partial<Paparan>>(field: K, value: Partial<Paparan>[K]) => void

  // Editor state
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  isSaving: boolean
  setIsSaving: (saving: boolean) => void

  // Agent pipeline
  agentSteps: Array<{
    id: string
    name: string
    status: 'pending' | 'running' | 'completed' | 'error'
    message?: string
  }>
  currentAgentStep: number
  setAgentSteps: (steps: BriefEditorState['agentSteps']) => void
  setCurrentAgentStep: (step: number) => void
  updateAgentStep: (stepId: string, updates: Partial<BriefEditorState['agentSteps'][0]>) => void

  // Reset editor
  resetEditor: () => void
}

export const useBriefEditorStore = create<BriefEditorState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft, isDirty: false }),
  updateDraftField: (field, value) =>
    set((state) => ({
      draft: { ...state.draft, [field]: value },
      isDirty: true,
    })),
  isDirty: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  isSaving: false,
  setIsSaving: (saving) => set({ isSaving: saving }),
  agentSteps: [],
  currentAgentStep: 0,
  setAgentSteps: (steps) => set({ agentSteps: steps }),
  setCurrentAgentStep: (step) => set({ currentAgentStep: step }),
  updateAgentStep: (stepId, updates) =>
    set((state) => ({
      agentSteps: state.agentSteps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    })),
  resetEditor: () =>
    set({
      draft: null,
      isDirty: false,
      isSaving: false,
      agentSteps: [],
      currentAgentStep: 0,
    }),
}))

/* ============================================
   FEED STORE — NEWS FEED STATE
   ============================================ */

interface FeedItem {
  id: string
  title: string
  source: string
  sourceUrl?: string
  publishedAt: string
  summary: string
  topics: string[]
  countries: string[]
  impact: ImpactLevel
}

interface FeedState {
  items: FeedItem[]
  setItems: (items: FeedItem[]) => void
  addItem: (item: FeedItem) => void

  // Filters
  filters: {
    topics?: string[]
    countries?: string[]
    impactLevels?: ImpactLevel[]
  }
  setFilters: (filters: Partial<FeedState['filters']>) => void
  clearFilters: () => void

  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  lastFetched: Date | null
  setLastFetched: (date: Date) => void
}

export const useFeedStore = create<FeedState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),

  filters: {},
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  lastFetched: null,
  setLastFetched: (date) => set({ lastFetched: date }),
}))
