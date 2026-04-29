import { useState, useEffect } from 'react'
import { User, Bell, Palette, Shield, Database, Moon, Sun, Grid3X3, List, Loader2, Check } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
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
  const { theme, setTheme, viewMode, setViewMode, user } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [settings, setSettings] = useState({
    // Profile
    name: user?.name || '',
    email: user?.email || '',
    organization: '',

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

  // Load real user data on mount
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        if (supabaseUser) {
          setSettings(prev => ({
            ...prev,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
            email: supabaseUser.email || '',
          }))
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Save profile to Supabase
  const saveProfile = async () => {
    setSaveStatus('saving')
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: settings.name }
      })
      if (error) throw error

      // Update local store
      if (user) {
        useAppStore.getState().setUser({ ...user, name: settings.name })
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Official Page Header */}
      <div className="mb-8 pb-6 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 bg-[#3B82F6] rounded-full" />
          <h1 className="text-3xl font-display font-bold text-[#F1F5F9]">Settings</h1>
        </div>
        <p className="text-[#94A3B8] font-ui">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Official Sidebar Navigation */}
        <nav className="lg:w-72 flex-shrink-0">
          <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors font-ui',
                  activeTab === tab.id
                    ? 'bg-[rgba(59,130,246,0.10)] text-[#3B82F6] border-l-2 border-[#3B82F6]'
                    : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)]'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Info Box */}
          <div className="mt-6 p-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg">
            <p className="text-xs text-[#64748B] font-ui leading-relaxed">
              Changes to your settings are saved automatically and sync across devices.
            </p>
          </div>
        </nav>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-[#F1F5F9] mb-6">Profile Settings</h2>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => updateSetting('name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={settings.email}
                        disabled
                        className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg font-ui text-[#64748B] cursor-not-allowed"
                        title="Email cannot be changed here"
                      />
                      <p className="text-xs text-[#64748B] mt-1">Email is managed through your authentication provider</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#F1F5F9] mb-2 font-ui">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={settings.organization}
                        onChange={(e) => updateSetting('organization', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                      />
                    </div>

                    <div className="pt-6 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                      <p className="text-sm text-[#94A3B8] font-ui">
                        {saveStatus === 'saved' ? 'Profile saved successfully' : 'Changes require saving to take effect'}
                      </p>
                      <button
                        onClick={saveProfile}
                        disabled={saveStatus === 'saving'}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg font-ui text-sm transition-colors',
                          saveStatus === 'saved'
                            ? 'bg-[rgba(16,185,129,0.20)] text-[#10B981] border border-[rgba(16,185,129,0.30)]'
                            : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
                          saveStatus === 'saving' && 'opacity-75 cursor-wait'
                        )}
                      >
                        {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saveStatus === 'saved' && <Check className="w-4 h-4" />}
                        {saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-[#F1F5F9] mb-6">Display Preferences</h2>

              <div className="space-y-8">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-3 font-ui">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-colors font-ui text-sm',
                        theme === 'light'
                          ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.10)] text-[#3B82F6]'
                          : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.20)] bg-[#0A0B0D] text-[#94A3B8]'
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
                          ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.10)] text-[#3B82F6]'
                          : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.20)] bg-[#0A0B0D] text-[#94A3B8]'
                      )}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-3 font-ui">
                    Font Size
                  </label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Default View Mode */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-3 font-ui">
                    Default Brief View
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 border-2 rounded-lg transition-colors font-ui text-sm',
                        viewMode === 'grid'
                          ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.10)] text-[#3B82F6]'
                          : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.20)] bg-[#0A0B0D] text-[#94A3B8]'
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
                          ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.10)] text-[#3B82F6]'
                          : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.20)] bg-[#0A0B0D] text-[#94A3B8]'
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
            <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-[#F1F5F9] mb-6">Notification Settings</h2>

              <div className="space-y-1">
                <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.08)]">
                  <div>
                    <p className="font-medium text-[#F1F5F9] font-ui">Email Notifications</p>
                    <p className="text-sm text-[#94A3B8] font-ui">Receive updates via email</p>
                  </div>
                  <button
                    onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50',
                      settings.emailNotifications ? 'bg-[#3B82F6]' : 'bg-[rgba(255,255,255,0.12)]'
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

                <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.08)]">
                  <div>
                    <p className="font-medium text-[#F1F5F9] font-ui">Push Notifications</p>
                    <p className="text-sm text-[#94A3B8] font-ui">Receive browser push notifications</p>
                  </div>
                  <button
                    onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50',
                      settings.pushNotifications ? 'bg-[#3B82F6]' : 'bg-[rgba(255,255,255,0.12)]'
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

                <div className="flex items-center justify-between py-4 border-b border-[rgba(255,255,255,0.08)]">
                  <div>
                    <p className="font-medium text-[#F1F5F9] font-ui">Weekly Digest</p>
                    <p className="text-sm text-[#94A3B8] font-ui">Summary of weekly brief updates</p>
                  </div>
                  <button
                    onClick={() => updateSetting('weeklyDigest', !settings.weeklyDigest)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50',
                      settings.weeklyDigest ? 'bg-[#3B82F6]' : 'bg-[rgba(255,255,255,0.12)]'
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
                    <p className="font-medium text-[#F1F5F9] font-ui">Brief Updates</p>
                    <p className="text-sm text-[#94A3B8] font-ui">Notifications when followed briefs are updated</p>
                  </div>
                  <button
                    onClick={() => updateSetting('briefUpdates', !settings.briefUpdates)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50',
                      settings.briefUpdates ? 'bg-[#3B82F6]' : 'bg-[rgba(255,255,255,0.12)]'
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
            <div className="bg-[#111318] border border-[rgba(255,255,255,0.12)] rounded-lg p-6">
              <h2 className="text-lg font-display font-semibold text-[#F1F5F9] mb-6">Data & Privacy</h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-3 font-ui">
                    Export Data
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={settings.dataExportFormat}
                      onChange={(e) => updateSetting('dataExportFormat', e.target.value)}
                      className="px-4 py-2.5 bg-[#181B22] border border-[rgba(255,255,255,0.12)] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.20)] font-ui text-[#F1F5F9] transition-colors"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors font-ui text-sm shadow-sm">
                      <Database className="w-4 h-4" />
                      Export All Data
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-[rgba(255,255,255,0.08)]">
                  <p className="text-sm text-[#94A3B8] font-ui leading-relaxed">
                    Export all your briefs, settings, and preferences in the selected format.
                    Data exports include all personally identifiable information and can be
                    used for data portability.
                  </p>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="p-4 bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] rounded-lg">
                    <h3 className="font-medium text-[#EF4444] font-ui mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Danger Zone
                    </h3>
                    <p className="text-sm text-[#94A3B8] font-ui mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-5 py-2.5 border border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.10)] hover:border-[rgba(239,68,68,0.40)] rounded-lg font-medium transition-colors font-ui text-sm">
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
