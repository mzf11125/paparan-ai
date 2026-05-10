import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from '@/components/Layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
import { SearchPage } from '@/pages/SearchPage'
import { BriefsLibraryPage } from '@/pages/BriefsLibraryPage'
import { BriefDetailPage } from '@/pages/BriefDetailPage'
import { AnalyticsDashboardPage } from '@/pages/AnalyticsDashboardPage'
import { BriefEditorPage } from '@/pages/BriefEditorPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { NewsFeedPage } from '@/pages/NewsFeedPage'
import { LoginPage } from '@/pages/LoginPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { ChatPage } from '@/pages/ChatPage'
import { AseanDashboardPage } from '@/pages/AseanDashboardPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { TopicsPage } from '@/pages/TopicsPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { ComparePage } from '@/pages/ComparePage'
import { SourcesPage } from '@/pages/SourcesPage'
import { GlossaryPage } from '@/pages/GlossaryPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { CommandPalette, useCommandPalette } from '@/components/ui/CommandPalette'
import { KeyboardHelp, useKeyboardHelp } from '@/components/ui/KeyboardHelp'
import { Toaster } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAppStore, useAuthInitializer } from '@/contexts/AppContext'
import { briefService } from '@/services/briefService'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAppStore()
  const location = useLocation()

  if (isAuthLoading) return <PageLoader />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const commandPalette = useCommandPalette()
  const keyboardHelp   = useKeyboardHelp()
  const theme = useAppStore(s => s.theme)
  const { isAuthenticated } = useAppStore()
  const setBriefs = useAppStore(s => s.setBriefs)
  const briefs = useAppStore(s => s.briefs)

  useAuthInitializer()

  useEffect(() => {
    if (!isAuthenticated) return
    briefService.getAllBriefs().then(setBriefs).catch(() => {/* stay with empty store */})
  }, [isAuthenticated, setBriefs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        <Route path="/" element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="landing" element={<LandingPage />} />
          {/* Public reference pages */}
          <Route path="sources" element={<SourcesPage />} />
          <Route path="glossary" element={<GlossaryPage />} />

          <Route path="briefs" element={<ProtectedRoute><BriefsLibraryPage /></ProtectedRoute>} />
          <Route path="briefs/:id" element={<ProtectedRoute><BriefDetailPage /></ProtectedRoute>} />
          <Route path="watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
          <Route path="home" element={<ProtectedRoute><NewsFeedPage /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute><AnalyticsDashboardPage /></ProtectedRoute>} />
          <Route path="editor" element={<ProtectedRoute><BriefEditorPage /></ProtectedRoute>} />
          <Route path="editor/:id" element={<ProtectedRoute><BriefEditorPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="asean" element={<ProtectedRoute><AseanDashboardPage /></ProtectedRoute>} />
          {/* Phase 7 — new pages */}
          <Route path="reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
          <Route path="timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
          <Route path="compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        briefs={briefs}
      />
      <KeyboardHelp isOpen={keyboardHelp.isOpen} onClose={keyboardHelp.close} />
      <Toaster />
    </>
  )
}

function App() {
  const theme = useAppStore(s => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
