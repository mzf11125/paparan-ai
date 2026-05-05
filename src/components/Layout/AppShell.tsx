import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  FileText, BarChart3, PlusCircle, Settings, Menu, X,
  Bell, ChevronDown, Bookmark, Newspaper, Sun, Moon, LogOut, MessageSquare,
} from 'lucide-react'
import { Logo } from '@/components/Brand/Logo'
import { RegionQuickSwitcherCompact } from './RegionQuickSwitcher'
import { cn } from '@/utils/formatters'
import { useAppStore } from '@/contexts/AppContext'

const navItems = [
  { path: '/home', label: 'News Feed', icon: Newspaper },
  { path: '/briefs', label: 'Briefs Library', icon: FileText },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/watchlist', label: 'My Watchlist', icon: Bookmark },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { theme, setTheme, user, logout } = useAppStore()
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

      {/* Top Navigation Bar — Glassmorphism */}
      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-[rgba(10,11,13,0.85)] backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-shadow duration-200">
        {/* Classification Banner */}
        {/* <div className="classification-banner classification-banner-unclassified py-1">
          <Shield className="w-3 h-3" />
          <span>Unclassified — For Public Release</span>
        </div> */}

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
              <span className="text-[#64748B]">Paparan</span>
              <span className="text-[#64748B]">/</span>
              <span className="font-medium text-[#F1F5F9]">
                {location.pathname === '/home' && 'News Feed'}
                {location.pathname === '/briefs' && 'Briefs Library'}
                {location.pathname === '/watchlist' && 'My Watchlist'}
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/editor' && 'Brief Editor'}
                {location.pathname === '/settings' && 'Settings'}
                {location.pathname === '/chat' && 'Chat'}
              </span>
            </nav>
          </div>

          {/* Center: Region Quick Switcher (desktop) */}
          <div className="hidden md:flex flex-1 max-w-xs mx-8 justify-center">
            <RegionQuickSwitcherCompact />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="w-5 h-5 text-[#94A3B8]" />
                : <Moon className="w-5 h-5 text-[#94A3B8]" />
              }
            </button>

            <button
              className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#94A3B8]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#3B82F6] rounded-full" />
            </button>

            <NavLink
              to="/editor"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#5183EB] hover:bg-[#3d6fd4] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-[0_2px_8px_rgba(81,131,235,0.3)] hover:shadow-[0_4px_16px_rgba(81,131,235,0.4)] hover:-translate-y-px"
            >
              <PlusCircle className="w-4 h-4" />
              New Brief
            </NavLink>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-[#F1F5F9]">{user?.name || 'User'}</span>
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg shadow-lg py-1 z-20">
                    <div className="px-4 py-2 border-b border-b-[rgba(255,255,255,0.08)]">
                      <p className="text-xs font-medium text-[#64748B]">Signed in as</p>
                      <p className="text-sm font-medium text-[#F1F5F9] truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout()
                        setUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
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
                'fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] bg-[#0D0F14] border-r border-r-[rgba(255,255,255,0.08)] transition-transform duration-200 ease-in-out',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              <nav className="p-4 space-y-1" aria-label="Main navigation">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/editor'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                        isActive
                          ? 'text-[#5183EB] bg-[rgba(81,131,235,0.10)]'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.04)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#5183EB] rounded-r-full" />
                        )}
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </>
                    )}
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
          style={{ backgroundColor: 'var(--pb-bg)' }}
        >
          <Outlet />
        </main>
      </div>

      {/* Footer — Official Style */}
      {showSidebar && (
        <footer className="border-t border-t-[rgba(255,255,255,0.08)] bg-[#0D0F14] py-6 mt-auto">
          {/* Official Footer Bar */}
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            {/* <div className="official-footer !py-0">
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="sm" color="monochrome" />
                <span className="text-text-tertiary">
                  Policy Intelligence Briefs for Strategic Decision-Making
                </span>
              </div>
              <div className="text-text-tertiary">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div> */}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-t-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-6 text-sm text-[#94A3B8]">
                <span>© 2026 Paparan Brief</span>
                <a href="#" className="hover:text-[#3B82F6] transition-colors">Privacy</a>
                <a href="#" className="hover:text-[#3B82F6] transition-colors">Terms</a>
                <a href="#" className="hover:text-[#3B82F6] transition-colors">Contact</a>
              </div>
              <div className="text-xs text-[#64748B]">
                Classification: Unclassified
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
