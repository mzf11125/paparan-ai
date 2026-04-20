import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  FileText,
  BarChart3,
  PlusCircle,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Home,
  Shield,
} from 'lucide-react'
import { Logo } from '@/components/Brand/Logo'
import { cn } from '@/utils/formatters'

const navItems = [
  { path: '/briefs', label: 'Briefs Library', icon: FileText },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/editor', label: 'Create Brief', icon: PlusCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
]

interface AppShellProps {
  showSidebar?: boolean
  fullWidth?: boolean
}

export function AppShell({ showSidebar = true, fullWidth = false }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const isLandingPage = location.pathname === '/'

  // Don't show sidebar on landing page
  if (isLandingPage) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navigation Bar — Official Style */}
      <header className="sticky top-0 z-50 bg-bg-elevated/95 backdrop-blur-sm border-b border-border shadow-sm">
        {/* Classification Banner */}
        <div className="classification-banner classification-banner-unclassified py-1">
          <Shield className="w-3 h-3" />
          <span>Unclassified — For Public Release</span>
        </div>

        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          {/* Left: Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-bg-surface transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <NavLink to="/" className="flex-shrink-0" aria-label="Paparan Brief home">
              <Logo variant="compact" size="md" />
            </NavLink>

            {/* Breadcrumb-like path indicator */}
            <nav className="hidden lg:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <span className="text-text-tertiary">Paparan</span>
              <span className="text-text-tertiary">/</span>
              <span className="font-medium text-text">
                {location.pathname === '/briefs' && 'Briefs Library'}
                {location.pathname === '/dashboard' && 'Analytics Dashboard'}
                {location.pathname === '/editor' && 'Brief Editor'}
                {location.pathname === '/settings' && 'Settings'}
              </span>
            </nav>
          </div>

          {/* Center: Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="search"
                placeholder="Search briefs... (Cmd+K)"
                className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-bg-surface transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>

            <NavLink
              to="/editor"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Brief
            </NavLink>

            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-surface transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
              <ChevronDown className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        {showSidebar && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Sidebar */}
            <aside
              className={cn(
                'fixed lg:sticky top-0 left-0 z-40 h-[calc(100vh-4rem)] bg-bg-elevated border-r border-border transition-transform duration-200 ease-in-out',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              <nav className="p-4 space-y-1" aria-label="Main navigation">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-light text-primary'
                        : 'text-text-secondary hover:bg-bg-surface hover:text-text'
                    )
                  }
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Home</span>}
                </NavLink>

                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/editor'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-light text-primary'
                          : 'text-text-secondary hover:bg-bg-surface hover:text-text'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </nav>

              {/* Collapse toggle (desktop) */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex absolute bottom-4 right-4 p-2 rounded-lg hover:bg-bg-surface transition-colors"
                aria-label="Toggle sidebar"
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-text-tertiary transition-transform',
                    sidebarCollapsed && 'rotate-180'
                  )}
                />
              </button>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main
          id="main-content"
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)]',
            fullWidth ? 'max-w-none' : 'max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Footer — Official Style */}
      {showSidebar && (
        <footer className="border-t border-border-strong bg-bg-elevated py-6 mt-auto">
          {/* Official Footer Bar */}
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="official-footer !py-0">
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="sm" color="monochrome" />
                <span className="text-text-tertiary">
                  Policy Intelligence Briefs for Strategic Decision-Making
                </span>
              </div>
              <div className="text-text-tertiary">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-border">
              <div className="flex items-center gap-6 text-sm text-text-secondary">
                <span>© 2026 Paparan Brief</span>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                <a href="#" className="hover:text-primary transition-colors">Contact</a>
              </div>
              <div className="text-xs text-text-tertiary">
                Classification: Unclassified
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
