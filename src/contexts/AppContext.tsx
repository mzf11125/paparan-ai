import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Paparan } from '@/types/paparan'
import { supabase } from '@/lib/supabase'

// Auth types
export interface User {
  email: string
  name: string
  avatar?: string
}

export interface AuthError {
  message: string
  code?: string
  retryAfter?: number // seconds until retry
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => Promise<{ error?: string; magicLinkSent?: boolean; authError?: AuthError }>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}


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

export type NotificationKind = 'alert' | 'watchlist' | 'classification' | 'system'

export interface Notification {
  id: string
  kind: NotificationKind
  title: string
  body?: string
  briefId?: string
  createdAt: number
  read: boolean
}

export interface OnboardingPreferences {
  completed: boolean
  regions: string[]
  topics: string[]
  cadence: 'realtime' | 'daily' | 'weekly' | 'off'
}

export interface AppStore {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAuthLoading: boolean // True while restoring session on app load
  login: (email: string) => Promise<{ error?: string; magicLinkSent?: boolean; authError?: AuthError }>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void
  initializeAuth: () => Promise<void>

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

  // Notifications
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void

  // Compare
  compareIds: string[]
  toggleCompare: (id: string) => void
  isInCompare: (id: string) => boolean
  clearCompare: () => void

  // Onboarding
  onboarding: OnboardingPreferences
  setOnboarding: (prefs: Partial<OnboardingPreferences>) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

const defaultFilters: BriefFilters = {}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAuthLoading: true, // Start with true to prevent redirects during session restoration
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      login: async (email: string) => {
        set({ isLoading: true })
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        set({ isLoading: false })
        if (error) {
          // Parse Supabase error for better handling
          const authError: AuthError = { message: error.message, code: error.status?.toString() }

          // Detect rate limiting errors
          if (error.message?.toLowerCase().includes('rate limit') ||
              error.message?.toLowerCase().includes('too many requests') ||
              error.status === 429) {
            authError.message = 'Too many sign-in attempts. Please wait a moment before trying again.'
            authError.code = 'RATE_LIMIT_EXCEEDED'
            authError.retryAfter = 300 // 5 minutes default for OTP rate limit
          }

          return { error: authError.message, authError }
        }
        return { magicLinkSent: true }
      },
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      },
      initializeAuth: async () => {
        // Skip auth check if using mock Supabase
        if (!import.meta.env.VITE_SUPABASE_URL) {
          console.warn('Skipping auth initialization - mock mode')
          set({ isAuthLoading: false })
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({
            user: {
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url,
            },
            isAuthenticated: true,
            isAuthLoading: false,
          })
        } else {
          set({ isAuthLoading: false })
        }
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
      theme: 'light', // Light-dominant editorial default; user can opt into dark
      setTheme: (theme) => set({ theme }),
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Notifications
      notifications: [],
      addNotification: (n) => set((state) => ({
        notifications: [
          { ...n, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), read: false },
          ...state.notifications,
        ].slice(0, 100),
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      clearAllNotifications: () => set({ notifications: [] }),

      // Compare
      compareIds: [],
      toggleCompare: (id) => set((state) => {
        if (state.compareIds.includes(id)) {
          return { compareIds: state.compareIds.filter((x) => x !== id) }
        }
        if (state.compareIds.length >= 3) return state // max 3
        return { compareIds: [...state.compareIds, id] }
      }),
      isInCompare: (id) => get().compareIds.includes(id),
      clearCompare: () => set({ compareIds: [] }),

      // Onboarding
      onboarding: { completed: false, regions: [], topics: [], cadence: 'daily' },
      setOnboarding: (prefs) => set((state) => ({ onboarding: { ...state.onboarding, ...prefs } })),
      completeOnboarding: () => set((state) => ({ onboarding: { ...state.onboarding, completed: true } })),
      resetOnboarding: () => set({ onboarding: { completed: false, regions: [], topics: [], cadence: 'daily' } }),
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
        savedSearches: state.savedSearches,
        notifications: state.notifications,
        compareIds: state.compareIds,
        onboarding: state.onboarding,
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

/**
 * Hook to initialize auth state on app load.
 * This should be called once in the App component to:
 * 1. Restore session from Supabase on app load
 * 2. Listen for auth state changes (token refresh, sign out, etc.)
 * 3. Sync auth state with Zustand store
 *
 * IMPORTANT: This must be called before any ProtectedRoute components
 * to ensure auth state is restored before checking authentication.
 */
export function useAuthInitializer() {
  useEffect(() => {
    // CRITICAL: Initialize auth on app load to restore session
    const store = useAppStore.getState()

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (store.isAuthLoading) {
        console.warn('Auth initialization timeout - setting loading to false')
        store.setAuthLoading(false)
      }
    }, 5000) // 5 second timeout

    store.initializeAuth().finally(() => {
      clearTimeout(timeoutId)
    })

    // Then listen for auth state changes (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const store = useAppStore.getState()

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          store.setUser({
            email: session.user.email!,
            name: session.user.user_metadata?.full_name ?? session.user.email!.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
          })
        }
      } else if (event === 'SIGNED_OUT') {
        store.setUser(null)
      }

      // Always clear loading state after any auth event
      store.setAuthLoading(false)
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])
}
