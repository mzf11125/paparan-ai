import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Globe2, Bookmark, Bell, Sparkles } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/utils/cn'

const REGIONS = [
  { code: 'Indonesia',   label: 'Indonesia',   tag: 'IDN' },
  { code: 'Malaysia',    label: 'Malaysia',    tag: 'MYS' },
  { code: 'Singapore',   label: 'Singapore',   tag: 'SGP' },
  { code: 'Thailand',    label: 'Thailand',    tag: 'THA' },
  { code: 'Philippines', label: 'Philippines', tag: 'PHL' },
  { code: 'Vietnam',     label: 'Vietnam',     tag: 'VNM' },
  { code: 'Myanmar',     label: 'Myanmar',     tag: 'MMR' },
  { code: 'Cambodia',    label: 'Cambodia',    tag: 'KHM' },
  { code: 'Laos',        label: 'Laos',        tag: 'LAO' },
  { code: 'Brunei',      label: 'Brunei',      tag: 'BRN' },
  { code: 'ASEAN',       label: 'ASEAN-wide',  tag: 'ASEAN' },
  { code: 'Global',      label: 'Global',      tag: 'GLB' },
]

const TOPICS = [
  { slug: 'digital-trade-facilitation', label: 'Digital Trade Facilitation',  group: 'RDTII' },
  { slug: 'ecommerce-legal',            label: 'E-Commerce Legal Framework', group: 'RDTII' },
  { slug: 'cybersecurity',              label: 'Cybersecurity & Trust',      group: 'RDTII' },
  { slug: 'asean-economic-community',   label: 'ASEAN Economic Community',   group: 'ASEAN' },
  { slug: 'rcep-cptpp',                 label: 'RCEP & CPTPP',               group: 'ASEAN' },
  { slug: 'human-capital',              label: 'Human Capital & Education',  group: 'RPJMN' },
  { slug: 'public-health',              label: 'Public Health & UHC',        group: 'RPJMN' },
  { slug: 'climate-energy',             label: 'Climate & Energy Transition',group: 'RPJMN' },
  { slug: 'industrial-downstream',      label: 'Industrial Downstream',      group: 'RPJMN' },
  { slug: 'monetary-policy',            label: 'Monetary Policy',            group: 'Sectoral' },
  { slug: 'capital-markets',            label: 'Capital Markets',            group: 'Sectoral' },
  { slug: 'islamic-finance',            label: 'Islamic Finance',            group: 'Sectoral' },
]

const CADENCES: { value: 'realtime' | 'daily' | 'weekly' | 'off'; title: string; description: string }[] = [
  { value: 'realtime', title: 'Real-time',     description: 'Push every escalated or HIGH-impact development as it lands.' },
  { value: 'daily',    title: 'Daily digest',  description: 'One curated brief 06:00 WIB, Monday through Friday.' },
  { value: 'weekly',   title: 'Weekly summary',description: 'Monday-morning digest of the week ahead.' },
  { value: 'off',      title: 'Off',           description: 'No notifications. Pull updates manually from the dashboard.' },
]

const STEPS = [
  { no: 1, title: 'Regions',  icon: Globe2,   description: 'Where do you operate?' },
  { no: 2, title: 'Topics',   icon: Bookmark, description: 'What policy lanes matter?' },
  { no: 3, title: 'Cadence',  icon: Bell,     description: 'How often should we ping you?' },
]

export function OnboardingPage() {
  usePageMeta({ title: 'Welcome' })
  const navigate     = useNavigate()
  const onboarding   = useAppStore(s => s.onboarding)
  const setOnboarding = useAppStore(s => s.setOnboarding)
  const completeOnboarding = useAppStore(s => s.completeOnboarding)
  const addNotification = useAppStore(s => s.addNotification)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)

  const [step, setStep] = useState(1)

  // Already onboarded users skip
  if (onboarding.completed) return <Navigate to="/home" replace />
  if (!isAuthenticated)     return <Navigate to="/login" replace />

  const toggleRegion = (code: string) => {
    setOnboarding({
      regions: onboarding.regions.includes(code)
        ? onboarding.regions.filter(r => r !== code)
        : [...onboarding.regions, code],
    })
  }

  const toggleTopic = (slug: string) => {
    setOnboarding({
      topics: onboarding.topics.includes(slug)
        ? onboarding.topics.filter(t => t !== slug)
        : [...onboarding.topics, slug],
    })
  }

  const handleFinish = () => {
    completeOnboarding()
    addNotification({
      kind: 'system',
      title: 'Onboarding complete',
      body: `Tracking ${onboarding.regions.length} regions and ${onboarding.topics.length} topics. Cadence: ${onboarding.cadence}.`,
    })
    navigate('/home')
  }

  const canAdvance = (() => {
    if (step === 1) return onboarding.regions.length > 0
    if (step === 2) return onboarding.topics.length > 0
    return true
  })()

  return (
    <div className="min-h-screen min-h-dvh bg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-bg-elevated">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-display font-bold text-text">Welcome to PaparanBrief</p>
          </div>
          <button
            onClick={() => { completeOnboarding(); navigate('/home') }}
            className="text-xs text-text-tertiary hover:text-text font-ui transition-colors"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-3xl mx-auto w-full px-4 py-8">
        <ol className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <li key={s.no} className="flex items-center gap-3 flex-1">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold transition-all',
                step > s.no   && 'bg-gradient-to-br from-primary to-accent border-primary text-white',
                step === s.no && 'border-primary text-primary animate-glow-pulse',
                step < s.no   && 'border-border text-text-tertiary'
              )}>
                {step > s.no ? <Check className="w-4 h-4" /> : s.no}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className={cn(
                  'text-sm font-semibold font-ui',
                  step >= s.no ? 'text-text' : 'text-text-tertiary'
                )}>
                  {s.title}
                </p>
                <p className="text-[11px] text-text-tertiary font-ui">{s.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-2 bg-bg-subtle rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-accent to-success-bright rounded-full"
                    animate={{ width: step > s.no ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: [0.2, 0.7, 0.1, 1] }}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Progress bar */}
        <div className="h-1 bg-bg-subtle rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-success-bright rounded-full"
            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.1, 1] }}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.1, 1] }}
            className="bg-bg-elevated border border-border rounded-2xl p-6 lg:p-8"
          >
            {step === 1 && (
              <StepRegions
                selected={onboarding.regions}
                toggle={toggleRegion}
              />
            )}
            {step === 2 && (
              <StepTopics
                selected={onboarding.topics}
                toggle={toggleTopic}
              />
            )}
            {step === 3 && (
              <StepCadence
                selected={onboarding.cadence}
                setCadence={(c) => setOnboarding({ cadence: c })}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold font-ui border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              disabled={!canAdvance}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold font-ui bg-accent hover:bg-accent-hover text-white transition-all duration-150 hover:-translate-y-px active:scale-[0.97] hover:shadow-glow-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold font-ui bg-success-bright hover:shadow-glow-success text-white transition-all duration-150 hover:-translate-y-px active:scale-[0.97]"
            >
              Finish setup
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepRegions({ selected, toggle }: { selected: string[]; toggle: (code: string) => void }) {
  return (
    <>
      <h2 className="font-display font-bold text-text text-2xl mb-2">Pick the regions you watch</h2>
      <p className="text-sm text-text-secondary font-ui mb-6">
        Briefs are tagged by region — your selection seeds the watchlist and the dashboard&rsquo;s default lens.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {REGIONS.map(r => {
          const active = selected.includes(r.code)
          return (
            <button
              key={r.code}
              onClick={() => toggle(r.code)}
              className={cn(
                'relative flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all text-left',
                active
                  ? 'border-primary bg-primary/8 text-primary'
                  : 'border-border bg-bg-surface text-text-secondary hover:border-border-strong hover:text-text'
              )}
            >
              <span className="font-medium font-ui text-sm">{r.label}</span>
              <span className={cn(
                'flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums tracking-wider',
                active ? 'bg-primary/15 text-primary' : 'bg-bg-subtle text-text-tertiary'
              )}>
                {r.tag}
              </span>
              {active && (
                <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-primary" />
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

function StepTopics({ selected, toggle }: { selected: string[]; toggle: (slug: string) => void }) {
  const grouped = TOPICS.reduce<Record<string, typeof TOPICS>>((acc, t) => {
    if (!acc[t.group]) acc[t.group] = []
    acc[t.group].push(t)
    return acc
  }, {})
  return (
    <>
      <h2 className="font-display font-bold text-text text-2xl mb-2">Pick your topics</h2>
      <p className="text-sm text-text-secondary font-ui mb-6">
        These seed your saved searches and the daily digest. You can change them any time from Settings.
      </p>
      <div className="space-y-5">
        {Object.entries(grouped).map(([group, list]) => (
          <div key={group}>
            <p className="editorial-eyebrow text-text-muted mb-2">{group}</p>
            <div className="flex flex-wrap gap-2">
              {list.map(t => {
                const active = selected.includes(t.slug)
                return (
                  <button
                    key={t.slug}
                    onClick={() => toggle(t.slug)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium font-ui border transition-colors',
                      active
                        ? 'bg-primary text-white border-primary'
                        : 'bg-bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text'
                    )}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function StepCadence({ selected, setCadence }: { selected: 'realtime' | 'daily' | 'weekly' | 'off'; setCadence: (c: 'realtime' | 'daily' | 'weekly' | 'off') => void }) {
  return (
    <>
      <h2 className="font-display font-bold text-text text-2xl mb-2">When should we notify you?</h2>
      <p className="text-sm text-text-secondary font-ui mb-6">
        You can also adjust this per saved search. Defaults to daily.
      </p>
      <div className="space-y-2">
        {CADENCES.map(c => {
          const active = selected === c.value
          return (
            <button
              key={c.value}
              onClick={() => setCadence(c.value)}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-xl border transition-colors text-left',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-bg-surface hover:border-border-strong'
              )}
            >
              <div className={cn(
                'flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                active ? 'border-primary' : 'border-border-strong'
              )}>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('font-display font-semibold text-sm', active ? 'text-primary' : 'text-text')}>{c.title}</p>
                <p className="text-xs text-text-secondary font-ui mt-0.5 leading-relaxed">{c.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
