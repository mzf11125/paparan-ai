import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from '@/components/Layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
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
import { useCommandPalette } from '@/components/ui/CommandPalette'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { Toaster } from '@/components/ui/Toast'
import { useAppStore, useAuthInitializer } from '@/contexts/AppContext'
import { briefService } from '@/services/briefService'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAppStore()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const commandPalette = useCommandPalette()
  const theme = useAppStore(s => s.theme)
  const { isAuthenticated } = useAppStore()
  const setBriefs = useAppStore(s => s.setBriefs)
  const briefs = useAppStore(s => s.briefs)

  useAuthInitializer()

  // Fetch briefs from live API once authenticated
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

        <Route path="/" element={<AppShell />}>
          <Route index element={<LandingPage />} />

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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        briefs={briefs}
      />
      <Toaster />
    </>
  )
}

function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
