import { useState, useEffect } from 'react'
import {
  User, Bell, Palette, Shield, Moon, Sun, Grid3X3, List,
  Loader2, Check, Settings, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/stores'
import { supabase } from '@/lib/supabase'
import { cn } from '@/utils/cn'
import { usePageMeta } from '@/hooks/usePageMeta'

type TabId = 'profile' | 'preferences' | 'notifications' | 'data'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',        icon: User },
  { id: 'preferences',   label: 'Preferences',    icon: Palette },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'data',          label: 'Data & Privacy', icon: Shield },
]

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text font-ui">{label}</p>
        {description && <p className="text-xs text-text-secondary font-ui mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative w-10 h-5.5 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        checked ? 'bg-primary' : 'bg-bg-subtle border border-border-strong'
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </button>
  )
}

export function SettingsPage() {
  usePageMeta({ title: 'Settings' })
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const { theme, setTheme, viewMode, setViewMode, user } = useAppStore()
  const [isLoading, setIsLoading]   = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: '',
    title: '',
    fontSize: 'medium',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    briefUpdates: true,
    escalationAlerts: true,
    dataExportFormat: 'json',
  })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (u) {
          setSettings(prev => ({
            ...prev,
            name:  u.user_metadata?.full_name || u.email?.split('@')[0] || '',
            email: u.email || '',
          }))
        }
      } finally { setIsLoading(false) }
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaveStatus('saving')
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: settings.name } })
      if (error) throw error
      if (user) useAppStore.getState().setUser({ ...user, name: settings.name })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  const FIELD_CLS = 'input-base w-full'
  const LABEL_CLS = 'block text-xs font-semibold text-text-secondary font-ui mb-1.5 uppercase tracking-wide'

  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-subtle text-text-secondary text-[10px] font-bold uppercase tracking-widest rounded-full border border-border mb-3 font-ui">
          <Settings className="w-3 h-3" />
          Configuration
        </div>
        <h1 className="text-3xl font-display font-bold text-text">Settings</h1>
        <p className="text-text-secondary text-sm mt-1 font-ui">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-48 flex-shrink-0 space-y-1" aria-label="Settings navigation">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-ui transition-all duration-150 text-left',
                activeTab === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:text-text hover:bg-bg-subtle'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="surface-card p-6 space-y-5">
              <h2 className="font-display font-bold text-text text-lg">Profile</h2>

              {isLoading ? (
                <div className="flex items-center gap-2 text-text-secondary text-sm font-ui">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white text-2xl font-bold font-display">
                      {settings.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-text font-ui">{settings.name || 'User'}</p>
                      <p className="text-sm text-text-secondary font-ui">{settings.email}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Full Name</label>
                      <input type="text" value={settings.name} onChange={e => update('name', e.target.value)} className={FIELD_CLS} placeholder="Your name" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Email</label>
                      <input type="email" value={settings.email} disabled className={cn(FIELD_CLS, 'opacity-50 cursor-not-allowed')} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Organization</label>
                      <input type="text" value={settings.organization} onChange={e => update('organization', e.target.value)} className={FIELD_CLS} placeholder="Ministry / Agency" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Title</label>
                      <input type="text" value={settings.title} onChange={e => update('title', e.target.value)} className={FIELD_CLS} placeholder="Policy Analyst" />
                    </div>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={saveStatus === 'saving'}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold font-ui transition-all duration-150',
                      saveStatus === 'saved'  ? 'bg-success/10 text-success border border-success/20' :
                      saveStatus === 'error'  ? 'bg-error/10 text-error border border-error/20' :
                      'bg-primary hover:bg-primary-hover text-white shadow-teal'
                    )}
                  >
                    {saveStatus === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>}
                    {saveStatus === 'saved'  && <><Check className="w-4 h-4" /> Saved</>}
                    {saveStatus === 'error'  && 'Save failed — retry'}
                    {saveStatus === 'idle'   && 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-text text-lg mb-5">Preferences</h2>
              <div>
                <SettingRow label="Theme" description="Choose your preferred color scheme">
                  <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-lg p-1">
                    {[
                      { value: 'dark',  icon: Moon, label: 'Dark' },
                      { value: 'light', icon: Sun,  label: 'Light' },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value as 'dark' | 'light')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-ui transition-all duration-150',
                          theme === value ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Default View" description="Grid or list layout for briefs">
                  <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-lg p-1">
                    {[
                      { value: 'grid', icon: Grid3X3, label: 'Grid' },
                      { value: 'list', icon: List,    label: 'List' },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setViewMode(value as 'grid' | 'list')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-ui transition-all duration-150',
                          viewMode === value ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Language" description="Interface language">
                  <select value={settings.language} onChange={e => update('language', e.target.value)} className="input-base w-auto text-xs py-1.5">
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </SettingRow>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-text text-lg mb-5">Notifications</h2>
              <div>
                {[
                  { key: 'emailNotifications', label: 'Email Notifications',  desc: 'Receive updates via email' },
                  { key: 'weeklyDigest',        label: 'Weekly Digest',        desc: 'Summary of intelligence activity' },
                  { key: 'briefUpdates',        label: 'Brief Updates',        desc: 'When watched briefs are updated' },
                  { key: 'escalationAlerts',    label: 'Escalation Alerts',    desc: 'Immediate alerts for HIGH impact escalations' },
                  { key: 'pushNotifications',   label: 'Push Notifications',   desc: 'Browser push notifications' },
                ].map(({ key, label, desc }) => (
                  <SettingRow key={key} label={label} description={desc}>
                    <Toggle
                      checked={settings[key as keyof typeof settings] as boolean}
                      onChange={() => toggle(key as keyof typeof settings)}
                      label={label}
                    />
                  </SettingRow>
                ))}
              </div>
            </div>
          )}

          {/* Data & Privacy */}
          {activeTab === 'data' && (
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-text text-lg mb-5">Data & Privacy</h2>
              <div>
                <SettingRow label="Export Format" description="Format for data exports">
                  <select value={settings.dataExportFormat} onChange={e => update('dataExportFormat', e.target.value)} className="input-base w-auto text-xs py-1.5">
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </select>
                </SettingRow>

                <SettingRow label="Export All Data" description="Download all your briefs and data">
                  <button className="px-4 py-2 border border-border text-text-secondary hover:text-text hover:border-border-strong rounded-lg text-xs font-semibold font-ui transition-all duration-150">
                    Export
                  </button>
                </SettingRow>

                <SettingRow label="Delete Account" description="Permanently delete your account and all data">
                  <button className="px-4 py-2 bg-error/10 text-error border border-error/20 hover:bg-error/20 rounded-lg text-xs font-semibold font-ui transition-all duration-150">
                    Delete Account
                  </button>
                </SettingRow>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
