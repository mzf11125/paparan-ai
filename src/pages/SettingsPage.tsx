import { useState } from 'react'
import { User, Bell, Palette, Shield, Database, Moon, Sun } from 'lucide-react'
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
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and application settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-[#E8E4DC] rounded-lg p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-[#C8A96A]/10 text-[#C8A96A]'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Settings Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#E8E4DC] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => updateSetting('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={settings.organization}
                    onChange={(e) => updateSetting('organization', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                  />
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button className="px-6 py-2 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-medium transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-white border border-[#E8E4DC] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Display Preferences</h2>

              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-colors',
                        theme === 'light'
                          ? 'border-[#C8A96A] bg-[#C8A96A]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Sun className="w-5 h-5" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-colors',
                        theme === 'dark'
                          ? 'border-[#C8A96A] bg-[#C8A96A]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Moon className="w-5 h-5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Font Size
                  </label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Default View Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Default Brief View
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-colors',
                        viewMode === 'grid'
                          ? 'border-[#C8A96A] bg-[#C8A96A]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 border-2 rounded-lg transition-colors',
                        viewMode === 'list'
                          ? 'border-[#C8A96A] bg-[#C8A96A]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                      <span>List</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-[#E8E4DC] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <button
                    onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      settings.emailNotifications ? 'bg-[#C8A96A]' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.emailNotifications ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <button
                    onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      settings.pushNotifications ? 'bg-[#C8A96A]' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.pushNotifications ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Digest</p>
                    <p className="text-sm text-gray-500">Summary of weekly brief updates</p>
                  </div>
                  <button
                    onClick={() => updateSetting('weeklyDigest', !settings.weeklyDigest)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      settings.weeklyDigest ? 'bg-[#C8A96A]' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.weeklyDigest ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">Brief Updates</p>
                    <p className="text-sm text-gray-500">Notifications when followed briefs are updated</p>
                  </div>
                  <button
                    onClick={() => updateSetting('briefUpdates', !settings.briefUpdates)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      settings.briefUpdates ? 'bg-[#C8A96A]' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.briefUpdates ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="bg-white border border-[#E8E4DC] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Data & Privacy</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Data
                  </label>
                  <div className="flex gap-4">
                    <select
                      value={settings.dataExportFormat}
                      onChange={(e) => updateSetting('dataExportFormat', e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="px-6 py-2 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Export All Data
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    Export all your briefs, settings, and preferences in the selected format.
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="px-6 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
