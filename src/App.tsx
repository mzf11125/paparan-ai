import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import { useCommandPalette } from '@/components/ui/CommandPalette'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { Toaster } from '@/components/ui/Toast'
import { initializeBriefStore } from '@/services/briefService'
import { mockBriefs } from '@/data/mockBriefs'
import { useAppStore } from '@/contexts/AppContext'

// Initialize store with mock data
initializeBriefStore(mockBriefs)

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
})

function AppRoutes() {
  const commandPalette = useCommandPalette()
  const theme = useAppStore(s => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <>
      <Routes>
        {/* Routes with AppShell */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route path="briefs" element={<BriefsLibraryPage />} />
          <Route path="briefs/:id" element={<BriefDetailPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="home" element={<NewsFeedPage />} />
          <Route path="dashboard" element={<AnalyticsDashboardPage />} />
          <Route path="editor" element={<BriefEditorPage />} />
          <Route path="editor/:id" element={<BriefEditorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        briefs={mockBriefs}
      />

      {/* Global Toast Notifications */}
      <Toaster />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
