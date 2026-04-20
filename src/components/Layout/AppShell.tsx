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
  Home
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
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E8E4DC]">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Left: Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <NavLink to="/" className="flex-shrink-0">
              <Logo variant="compact" size="md" />
            </NavLink>
          </div>

          {/* Center: Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search briefs... (Cmd+K)"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96A] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <NavLink
              to="/editor"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Brief
            </NavLink>

            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8A96A] to-[#A88B4A] flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        {showSidebar && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside
              className={cn(
                'fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-[#E8E4DC] transition-transform duration-200 ease-in-out',
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
                        ? 'bg-[#C8A96A]/10 text-[#C8A96A]'
                        : 'text-gray-700 hover:bg-gray-100'
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
                          ? 'bg-[#C8A96A]/10 text-[#C8A96A]'
                          : 'text-gray-700 hover:bg-gray-100'
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
                className="hidden lg:flex absolute bottom-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform',
                    sidebarCollapsed && 'rotate-180'
                  )}
                />
              </button>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)]',
            fullWidth ? 'max-w-none' : 'max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      {showSidebar && (
        <footer className="border-t border-[#E8E4DC] bg-white py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Logo variant="icon" size="sm" color="monochrome" />
                <span className="text-sm text-gray-600">
                  Policy intelligence briefs for strategic decision-making
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>© 2026 Paparan Brief</span>
                <a href="#" className="hover:text-[#C8A96A] transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-[#C8A96A] transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
