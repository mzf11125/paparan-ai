import { useState } from 'react'
import { User, Bell, Palette, Shield, Database, Moon, Sun, Grid3X3, List } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { cn } from '@/utils/formatters'

type TabId = 'profile' | 'preferences' | 'notifications' | 'data'

const tabs = [
  { id: 'profile' as TabId, label: 'Profile', icon: User },
  { id: 'preferences' as TabId, label: 'Preferences', icon: Palette },
  { id: 'notifications' as TabId, label: 'Notifications', icon: Bell },
  { id: 'data' as TabId, label: 'Data & Privacy', icon: Shield }
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const { theme, setTheme, viewMode, setViewMode } = useAppStore()
  const [settings, setSettings] = useState({
    // Profile
    name: 'User',
    email: 'user@example.com',
    organization: 'Organization Name',

    // Preferences
    fontSize: 'medium',
    sidebarCollapsed: false,

    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    briefUpdates: true,

    // Data
    dataExportFormat: 'json'
  })

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Official Page Header */}
      <div className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-accent rounded-full" />
          <h1 className="text-3xl font-display font-bold text-text">Settings</h1>
        </div>
        <p className="text-text-secondary font-ui">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Official Sidebar Navigation */}
        <nav className="lg:w-72 flex-shrink-0">
          <div className="bg-bg-elevated border border-border rounded-lg p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors font-ui',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-text-secondary hover:bg-bg-surface'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Info Box */}
          <div className="mt-6 p-4 bg-bg-surface border border-border rounded-lg">
            <p className="text-xs text-text-tertiary font-ui leading-relaxed">
              Changes to your settings are saved automatically and sync across devices.
            </p>
          </div>
        </nav>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-bg-elevated border border-border rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-text mb-6">Profile Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2 font-ui">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => updateSetting('name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2 font-ui">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2 font-ui">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={settings.organization}
                    onChange={(e) => updateSetting('organization', e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                  />
                </div>

                <div className="pt-6 border-t border-border flex items-center justify-between">
                  <p className="text-sm text-text-secondary font-ui">
                    Profile changes are saved automatically
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-light/40 text-green text-xs font-semibold uppercase tracking-wider rounded border border-green/30 font-ui">
                    <Shield className="w-3 h-3" />
                    Synced
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-bg-elevated border border-border rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-text mb-6">Display Preferences</h2>

              <div className="space-y-8">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-text mb-3 font-ui">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-colors font-ui text-sm',
                        theme === 'light'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-border-strong bg-background text-text-secondary'
                      )}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-colors font-ui text-sm',
                        theme === 'dark'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-border-strong bg-background text-text-secondary'
                      )}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-text mb-3 font-ui">
                    Font Size
                  </label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Default View Mode */}
                <div>
                  <label className="block text-sm font-medium text-text mb-3 font-ui">
                    Default Brief View
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-colors font-ui text-sm',
                        viewMode === 'grid'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-border-strong bg-background text-text-secondary'
                      )}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      <span>Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-colors font-ui text-sm',
                        viewMode === 'list'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-border-strong bg-background text-text-secondary'
                      )}
                    >
                      <List className="w-4 h-4" />
                      <span>List</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-bg-elevated border border-border rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-text mb-6">Notification Settings</h2>

              <div className="space-y-1">
                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <p className="font-medium text-text font-ui">Email Notifications</p>
                    <p className="text-sm text-text-secondary font-ui">Receive updates via email</p>
                  </div>
                  <button
                    onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
                      settings.emailNotifications ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                        settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <p className="font-medium text-text font-ui">Push Notifications</p>
                    <p className="text-sm text-text-secondary font-ui">Receive browser push notifications</p>
                  </div>
                  <button
                    onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
                      settings.pushNotifications ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                        settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <p className="font-medium text-text font-ui">Weekly Digest</p>
                    <p className="text-sm text-text-secondary font-ui">Summary of weekly brief updates</p>
                  </div>
                  <button
                    onClick={() => updateSetting('weeklyDigest', !settings.weeklyDigest)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
                      settings.weeklyDigest ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                        settings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-text font-ui">Brief Updates</p>
                    <p className="text-sm text-text-secondary font-ui">Notifications when followed briefs are updated</p>
                  </div>
                  <button
                    onClick={() => updateSetting('briefUpdates', !settings.briefUpdates)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
                      settings.briefUpdates ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                        settings.briefUpdates ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="bg-bg-elevated border border-border rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-text mb-6">Data & Privacy</h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-text mb-3 font-ui">
                    Export Data
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={settings.dataExportFormat}
                      onChange={(e) => updateSetting('dataExportFormat', e.target.value)}
                      className="px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-ui text-text transition-colors"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors font-ui text-sm shadow-sm">
                      <Database className="w-4 h-4" />
                      Export All Data
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-text-secondary font-ui leading-relaxed">
                    Export all your briefs, settings, and preferences in the selected format.
                    Data exports include all personally identifiable information and can be
                    used for data portability.
                  </p>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-border">
                  <div className="p-4 bg-red-light/10 border border-red/20 rounded-lg">
                    <h3 className="font-medium text-red font-ui mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Danger Zone
                    </h3>
                    <p className="text-sm text-text-secondary font-ui mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-5 py-2.5 border border-red text-red hover:bg-red-light hover:border-red/60 rounded-lg font-medium transition-colors font-ui text-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
