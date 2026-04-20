import { lazy } from 'react'

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const BriefsLibraryPage = lazy(() => import('@/pages/BriefsLibraryPage').then(m => ({ default: m.BriefsLibraryPage })))
const BriefDetailPage = lazy(() => import('@/pages/BriefDetailPage').then(m => ({ default: m.BriefDetailPage })))
const AnalyticsDashboardPage = lazy(() => import('@/pages/AnalyticsDashboardPage').then(m => ({ default: m.AnalyticsDashboardPage })))
const BriefEditorPage = lazy(() => import('@/pages/BriefEditorPage').then(m => ({ default: m.BriefEditorPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

export interface RouteConfig {
  path: string
  element: React.ReactNode
  meta?: {
    title?: string
    description?: string
    requiresAuth?: boolean
    showInNav?: boolean
    icon?: string
  }
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <LandingPage />,
    meta: {
      title: 'Paparan Brief',
      description: 'Policy intelligence briefs for strategic decision-making',
      showInNav: false
    }
  },
  {
    path: '/briefs',
    element: <BriefsLibraryPage />,
    meta: {
      title: 'Briefs Library',
      description: 'Browse all policy intelligence briefs',
      showInNav: true,
      icon: 'FileText'
    }
  },
  {
    path: '/briefs/:id',
    element: <BriefDetailPage />,
    meta: {
      title: 'Brief Detail',
      description: 'View policy intelligence brief',
      showInNav: false
    }
  },
  {
    path: '/dashboard',
    element: <AnalyticsDashboardPage />,
    meta: {
      title: 'Analytics Dashboard',
      description: 'Overview of briefs and insights',
      showInNav: true,
      icon: 'BarChart3'
    }
  },
  {
    path: '/editor',
    element: <BriefEditorPage />,
    meta: {
      title: 'Create Brief',
      description: 'Create a new policy intelligence brief',
      showInNav: true,
      icon: 'PlusCircle'
    }
  },
  {
    path: '/editor/:id',
    element: <BriefEditorPage />,
    meta: {
      title: 'Edit Brief',
      description: 'Edit policy intelligence brief',
      showInNav: false
    }
  },
  {
    path: '/settings',
    element: <SettingsPage />,
    meta: {
      title: 'Settings',
      description: 'Manage your preferences',
      showInNav: true,
      icon: 'Settings'
    }
  }
]

export const navRoutes = routes.filter(route => route.meta?.showInNav)
