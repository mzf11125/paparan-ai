import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FileText, BarChart3, PlusCircle, Settings, Menu, X,
  Bell, ChevronDown, Bookmark, Newspaper, Sun, Moon,
  LogOut, MessageSquare, Globe, ChevronLeft, Zap,
  BookOpen, Search, Clock, GitCompareArrows, Library, ScrollText,
} from 'lucide-react'
import { Logo } from '@/components/Brand/Logo'
import { RegionQuickSwitcherCompact } from './RegionQuickSwitcher'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/contexts/AppContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { openKeyboardHelp } from '@/components/ui/KeyboardHelp'
import { IconButton } from '@/components/ui/Button'

const navItems = [
  // Discover
  { path: '/home',      label: 'Intelligence Feed', icon: Newspaper,        group: 'discover' },
  { path: '/search',    label: 'Search',            icon: Search,           group: 'discover' },
  { path: '/topics',    label: 'Topics',            icon: Library,          group: 'discover' },
  { path: '/reports',   label: 'Publications',      icon: BookOpen,         group: 'discover' },
  { path: '/timeline',  label: 'Timeline',          icon: Clock,            group: 'discover' },
  { path: '/asean',     label: 'ASEAN Dashboard',   icon: Globe,            group: 'discover' },

  // My Work
  { path: '/briefs',        label: 'Briefs Library', icon: FileText,         group: 'work' },
  { path: '/watchlist',     label: 'Watchlist',      icon: Bookmark,         group: 'work' },
  { path: '/compare',       label: 'Compare',        icon: GitCompareArrows, group: 'work' },
  { path: '/notifications', label: 'Inbox',          icon: Bell,             group: 'work' },
  { path: '/chat',          label: 'AI Chat',        icon: MessageSquare,    group: 'work' },
  { path: '/editor',        label: 'Create Brief',   icon: PlusCircle,       group: 'work' },
  { path: '/dashboard',     label: 'Analytics',      icon: BarChart3,        group: 'work' },

  // Reference
  { path: '/sources',  label: 'Sources',  icon: ScrollText, group: 'reference' },
  { path: '/glossary', label: 'Glossary', icon: BookOpen,   group: 'reference' },

  // Account
  { path: '/settings', label: 'Settings', icon: Settings, group: 'account' },
]

const navGroups = [
  { key: 'discover',  label: 'Discover'  },
  { key: 'work',      label: 'My Work'   },
  { key: 'reference', label: 'Reference' },
  { key: 'account',   label: 'Account'   },
]

export function AppShell() {
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen]     = useState(false)
  const { theme, setTheme, user, logout }   = useAppStore()
  const unreadCount = useAppStore(s => s.notifications.filter(n => !n.read).length)
  const location = useLocation()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const isLandingPage = location.pathname === '/'
  if (isLandingPage) return <Outlet />

  const pageLabel = navItems.find(n => location.pathname.startsWith(n.path))?.label ?? ''

  return (
    <div className="min-h-screen min-h-dvh bg-bg flex flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-[60] h-14 flex items-center border-b border-border bg-bg-elevated">
        <div className="flex items-center justify-between w-full px-4 lg:px-5">

          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <NavLink to="/" aria-label="PaparanBrief home" className="flex-shrink-0">
              <Logo variant="compact" size="md" />
            </NavLink>

            {pageLabel && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-text-muted">/</span>
                <span className="font-medium text-text-secondary font-ui">{pageLabel}</span>
              </div>
            )}
          </div>

          {/* Center */}
          <div className="hidden md:flex flex-1 max-w-xs mx-6 justify-center">
            <RegionQuickSwitcherCompact />
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <IconButton
              icon={theme === 'dark' ? Sun : Moon}
              label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              tone="primary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />

            {/* Notifications bell — pulses when unread */}
            <NavLink
              to="/notifications"
              className="relative p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/8 transition-colors"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            >
              <Bell className={cn('w-4.5 h-4.5', unreadCount > 0 && 'motion-safe:animate-tilt-bell')} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary text-white rounded-full ring-1 ring-bg-elevated flex items-center justify-center text-[10px] font-bold tabular-nums font-ui animate-glow-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>

            {/* New Brief CTA */}
            <NavLink
              to="/editor"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 ml-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal hover:shadow-glow-primary hover:-translate-y-px active:translate-y-0"
            >
              <Zap className="w-3.5 h-3.5" />
              New Brief
            </NavLink>

            {/* User menu */}
            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-bg-subtle transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white text-xs font-bold font-ui flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium text-text font-ui max-w-[100px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-bg-overlay border border-border-strong rounded-xl shadow-lg py-1.5 z-20 animate-scale-in">
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-xs text-text-tertiary font-ui">Signed in as</p>
                      <p className="text-sm font-medium text-text font-ui truncate mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-error hover:bg-bg-subtle transition-colors font-ui"
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

      <div className="flex flex-1 min-h-0">
        {/* ── SIDEBAR ── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside
            className={cn(
              'fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] h-[calc(100dvh-3.5rem)]',
              'bg-bg-surface border-r border-border',
              'flex flex-col',
              'transition-all duration-300 ease-spring',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
              sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
            )}
          >
            {/* Nav groups */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5" aria-label="Main navigation">
              {navGroups.map(group => {
                const items = navItems.filter(n => n.group === group.key)
                return (
                  <div key={group.key}>
                    {!sidebarCollapsed && (
                      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui">
                        {group.label}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/editor'}
                          className={({ isActive }) => cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-ui relative',
                            'transition-[transform,background-color,color] duration-150',
                            'hover:-translate-x-0',
                            isActive
                              ? 'text-primary bg-primary/6'
                              : 'text-text-secondary hover:text-text hover:bg-bg-subtle'
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active-rail"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                              )}
                              <item.icon className={cn(
                                'flex-shrink-0 transition-colors',
                                sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                                isActive ? 'text-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                              )} />
                              {!sidebarCollapsed && (
                                <span className="truncate">{item.label}</span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-2 border-t border-border">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-text-tertiary hover:text-text hover:bg-bg-subtle transition-colors"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className={cn(
                  'w-4 h-4 transition-transform duration-300',
                  sidebarCollapsed && 'rotate-180'
                )} />
              </button>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ── */}
        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-x-hidden"
        >
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.2, 0.7, 0.1, 1] }}
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-bg-surface py-4 mt-auto" data-print-hidden>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5 text-xs text-text-tertiary">
            <span className="font-mono">© 2026 PaparanBrief</span>
            <NavLink to="/sources"  className="hover:text-primary transition-colors">Sources</NavLink>
            <NavLink to="/glossary" className="hover:text-primary transition-colors">Glossary</NavLink>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <button
              onClick={openKeyboardHelp}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:text-text hover:bg-bg-subtle transition-colors font-ui"
              aria-label="Show keyboard shortcuts"
            >
              <kbd className="font-mono text-[10px] px-1 py-0 border border-border rounded bg-bg-elevated">?</kbd>
              <span>Shortcuts</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" aria-hidden="true" />
              <span className="editorial-eyebrow text-text-muted">All systems operational</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
