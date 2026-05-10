import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/Brand/Logo'
import { mockBriefs } from '@/data/mockBriefs'
import { cn } from '@/utils/cn'
import { usePageMeta } from '@/hooks/usePageMeta'

const NEWS_SOURCES = [
  { name: 'Parliament Malaysia', domain: 'parliament.gov.my' },
  { name: 'Parliament Singapore', domain: 'parliament.gov.sg' },
  { name: 'DPR Indonesia', domain: 'dpr.go.id' },
  { name: 'Bank Indonesia', domain: 'bi.go.id' },
  { name: 'ASEAN Secretariat', domain: 'asean.org' },
  { name: 'World Bank', domain: 'worldbank.org' },
  { name: 'IMF', domain: 'imf.org' },
  { name: 'Congress Philippines', domain: 'congress.gov.ph' },
  { name: 'Reuters', domain: 'reuters.com' },
  { name: 'AP News', domain: 'apnews.com' },
  { name: 'Bloomberg', domain: 'bloomberg.com' },
  { name: 'Financial Times', domain: 'ft.com' },
  { name: 'Antara', domain: 'antaranews.com' },
  { name: 'Kontan', domain: 'kontan.co.id' },
  { name: 'Bisnis', domain: 'bisnis.com' },
  { name: 'OJK', domain: 'ojk.go.id' },
  { name: 'Salaam Gateway', domain: 'salaamgateway.com' },
]

const MODULES = [
  {
    no: '01',
    label: 'Monitor',
    title: 'Real-time signal capture',
    body: 'Continuous monitoring of 200+ official, multilateral, and tier-one sources across ten ASEAN economies. Classification, escalation, and provenance assigned within minutes of publication.',
  },
  {
    no: '02',
    label: 'Brief',
    title: 'Editorial-grade synthesis',
    body: 'AI agents draft policy briefs in the format your team expects — executive summary, developments, risks, opportunities, recommended actions — with full source attribution at every claim.',
  },
  {
    no: '03',
    label: 'Decide',
    title: 'Decision-ready intelligence',
    body: 'RPJMN alignment scoring, scenario simulation, and ASEAN-wide impact matrices. Designed for ministerial cabinets, embassy desks, and analyst teams who answer to a deadline.',
  },
]

const PERSONAS = [
  { role: 'Policy Director', focus: 'Cabinet briefings & weekly digests' },
  { role: 'Embassy Analyst', focus: 'Bilateral monitoring & cable drafting' },
  { role: 'Research Lead',   focus: 'Long-form briefs with citation chains' },
  { role: 'Comms Strategist',focus: 'Talking points & media monitoring' },
]

function Dateline() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  const fmt = now.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase()
  return (
    <div className="border-y border-border bg-bg-elevated">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex items-center justify-between text-[11px] font-mono tracking-wider text-text-tertiary uppercase">
        <span>{fmt}</span>
        <span className="hidden md:inline">Vol. I · ASEAN Policy Intelligence</span>
        <span className="hidden md:inline">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</span>
      </div>
    </div>
  )
}

function Marquee() {
  const doubled = [...NEWS_SOURCES, ...NEWS_SOURCES]
  return (
    <div
      className="relative"
      style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}
    >
      <div
        className="flex gap-8 items-center motion-safe:animate-ticker motion-reduce:animate-none"
        style={{ width: 'max-content' }}
      >
        {doubled.map(({ name, domain }, i) => (
          <span
            key={i}
            title={domain}
            className="inline-flex items-center gap-2 text-text-tertiary whitespace-nowrap"
          >
            <img
              src={`https://logo.clearbit.com/${domain}`}
              alt=""
              width={18}
              height={18}
              loading="lazy"
              className="w-[18px] h-[18px] grayscale opacity-70 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-sm font-mono tracking-tight">{name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function LandingPage() {
  usePageMeta({
    title:       undefined, // 'Paparan.ai' alone reads better as the home title
    description: 'ASEAN policy intelligence — editorial-grade briefs, RDTII evidence, and decision-ready synthesis for ministers, embassies, and analyst teams.',
  })
  const featured = mockBriefs.slice(0, 3)

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* ── Top nav (light editorial masthead) ── */}
      <nav className="border-b border-border bg-bg-elevated sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" aria-label="PaparanBrief home" className="flex items-center">
            <Logo variant="wordmark" size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: 'Briefs',   to: '/briefs' },
              { label: 'Reports',  to: '/briefs' },
              { label: 'Topics',   to: '/search' },
              { label: 'Methods',  to: '/landing' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-sm font-medium text-text-secondary hover:text-primary transition-colors duration-fast"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-bg-elevated rounded-md text-sm font-semibold transition-colors duration-fast"
            >
              Request access
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      <Dateline />

      <main id="main">
        {/* ── HERO — editorial 12-col layout ── */}
        <section className="paper-grain relative overflow-hidden">
          {/* Decorative gradient background mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-accent/6 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl motion-safe:animate-float pointer-events-none" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32 grid grid-cols-12 gap-6 lg:gap-10 relative">
            {/* Left: editorial headline — staggered entrance */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 stagger-children">
              <span className="editorial-eyebrow motion-safe:animate-fade-in-up" style={{ '--i': 0 } as React.CSSProperties}>No. 001 · Issue brief</span>
              <h1 className="font-display font-semibold text-text leading-[1.04] tracking-[-0.02em] text-[clamp(2.6rem,7vw,5rem)] motion-safe:animate-fade-in-up" style={{ '--i': 1 } as React.CSSProperties}>
                Policy intelligence,{' '}
                <em className="font-medium text-primary">written for the desk that decides.</em>
              </h1>
              <p className="font-display italic text-xl lg:text-2xl text-text-secondary leading-snug max-w-2xl motion-safe:animate-fade-in-up" style={{ '--i': 2 } as React.CSSProperties}>
                PaparanBrief turns a continuous stream of ASEAN policy signal into editorial-grade briefs —
                classified, sourced, and shaped to fit the morning red folder.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 motion-safe:animate-fade-in-up" style={{ '--i': 3 } as React.CSSProperties}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-semibold transition-all duration-150 hover:-translate-y-px active:scale-[0.97] hover:shadow-glow-primary"
                >
                  Request a demo
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/briefs"
                  className="inline-flex items-center gap-2 px-5 py-3 border border-border-strong text-text hover:bg-accent/8 hover:border-accent hover:text-accent rounded-md text-sm font-semibold transition-all duration-150"
                >
                  Browse today's briefs
                </Link>
              </div>
              <dl className="grid grid-cols-3 gap-6 pt-8 max-w-xl">
                {[
                  { k: '200+', v: 'Sources monitored' },
                  { k: '10',   v: 'ASEAN economies' },
                  { k: '< 7m', v: 'Brief turnaround' },
                ].map(({ k, v }) => (
                  <div key={v}>
                    <dt className="text-3xl font-display font-semibold text-text tabular">{k}</dt>
                    <dd className="text-xs uppercase tracking-wider text-text-tertiary mt-1 font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right: featured "issue cover" */}
            <div className="col-span-12 lg:col-span-4 lg:pt-2">
              <article className="surface-card p-6 lg:p-7 motion-safe:animate-fade-in" style={{ animationDelay: '120ms' }}>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                  <span className="editorial-eyebrow text-primary">Today's lead</span>
                  <span className="text-[11px] font-mono text-text-tertiary tabular">09 · MAY · 2026</span>
                </div>
                <h2 className="font-display font-semibold text-text leading-[1.15] text-2xl mb-3 text-balance">
                  ASEAN finance ministers signal coordinated CBDC framework ahead of Jakarta summit
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  Joint communiqué prepared in advance positions Indonesia, Singapore, and Malaysia as
                  the lead jurisdictions on cross-border settlement infrastructure.
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                  <span>Region · ASEAN-wide</span>
                  <span className="inline-flex items-center gap-1.5 text-confidential">
                    <span className="w-1.5 h-1.5 rounded-full bg-confidential" aria-hidden="true" />
                    Confidential
                  </span>
                </div>
                <Link
                  to="/briefs"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover group"
                >
                  Read brief
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-fast group-hover:translate-x-0.5" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ── Trusted-by ticker ── */}
        <section className="border-y border-border bg-bg-surface overflow-hidden py-7">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-5">
            <p className="editorial-eyebrow text-center">Intelligence sourced from</p>
          </div>
          <Marquee />
        </section>

        {/* ── Three modules — numbered editorial cards ── */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mb-12 lg:mb-16">
              <span className="editorial-eyebrow">The pipeline</span>
              <h2 className="mt-3 font-display font-semibold text-text text-3xl lg:text-4xl text-balance">
                Three modules. One newsroom-grade workflow.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-px bg-border">
              {MODULES.map((m, i) => {
                const moduleTones = [
                  { chip: 'bg-primary/10 text-primary', glow: 'hover:shadow-glow-primary' },
                  { chip: 'bg-accent/10 text-accent',   glow: 'hover:shadow-glow-accent' },
                  { chip: 'bg-gold/10 text-gold',        glow: 'hover:shadow-glow-gold' },
                ]
                const tone = moduleTones[i % moduleTones.length]
                return (
                <article
                  key={m.no}
                  className={cn(
                    'bg-bg-elevated p-7 lg:p-9 flex flex-col gap-4 motion-safe:animate-fade-in-up card-lift',
                    tone.glow,
                  )}
                  style={{ animationDelay: `${80 * i}ms` }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className={cn('font-mono text-xs tracking-widest tabular px-2 py-0.5 rounded-md font-bold', tone.chip)}>{m.no}</span>
                    <span className="editorial-eyebrow">{m.label}</span>
                  </div>
                  <h3 className="font-display font-semibold text-2xl text-text leading-snug">
                    {m.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">{m.body}</p>
                </article>
              )})}
            </div>
          </div>
        </section>

        {/* ── Featured briefs — 3-up cards with byline ── */}
        <section className="py-20 lg:py-28 border-t border-border bg-bg-elevated">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
              <div className="max-w-xl">
                <span className="editorial-eyebrow">Today's intelligence</span>
                <h2 className="mt-3 font-display font-semibold text-text text-3xl lg:text-4xl">
                  Featured policy briefs
                </h2>
              </div>
              <Link
                to="/briefs"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover group"
              >
                View all briefs
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-fast group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {featured.map((brief, i) => (
                <Link
                  key={brief.id}
                  to={`/briefs/${brief.id}`}
                  className={cn(
                    'group surface-card p-6 flex flex-col gap-4 motion-safe:animate-fade-in-up',
                    'hover:border-text/20 transition-all duration-base',
                  )}
                  style={{ animationDelay: `${100 * i}ms` }}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                    <span>{brief.region || 'ASEAN'}</span>
                    <span className="tabular">{new Date(brief.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-text leading-snug text-balance group-hover:text-primary transition-colors">
                    {brief.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 flex-1">
                    {brief.executiveSummary?.[0] ?? ''}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-primary pt-2 border-t border-border">
                    Continue reading
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-fast group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personas — who reads Paparan ── */}
        <section className="py-20 lg:py-28 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
              <div className="lg:col-span-5">
                <span className="editorial-eyebrow">Subscribers</span>
                <h2 className="mt-3 font-display font-semibold text-text text-3xl lg:text-4xl text-balance">
                  Built for the people who answer to a deadline.
                </h2>
                <p className="font-display italic text-text-secondary text-lg lg:text-xl mt-5 leading-relaxed">
                  Whether you draft talking points at 6am or set policy direction for a quarter,
                  Paparan adapts to your routine — not the other way round.
                </p>
              </div>
              <ul className="lg:col-span-7 hairline-divide border border-border rounded-lg bg-bg-elevated">
                {PERSONAS.map((p) => (
                  <li key={p.role} className="flex items-baseline gap-6 px-6 py-5">
                    <span className="font-display font-semibold text-text text-lg flex-1">{p.role}</span>
                    <span className="text-text-secondary text-sm">{p.focus}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Editorial CTA — pull-quote style ── */}
        <section className="py-20 lg:py-28 border-t border-border bg-bg-surface">
          <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
            <span className="editorial-eyebrow">Get started</span>
            <p className="font-display italic text-text text-3xl lg:text-4xl leading-snug text-balance mt-5">
              "We replaced three monitoring contracts and a 5am routine with one Paparan brief."
            </p>
            <p className="mt-4 text-sm text-text-tertiary font-mono uppercase tracking-wider">
              — Director of Policy, ASEAN-member ministry
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-text text-bg rounded-md text-sm font-semibold hover:bg-text-secondary transition-colors duration-fast"
              >
                Request a demo
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/briefs"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border-strong text-text hover:bg-bg-elevated rounded-md text-sm font-semibold transition-colors duration-fast"
              >
                Browse the library
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer — masthead colophon ── */}
      <footer className="border-t border-border bg-bg-elevated">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Logo variant="wordmark" size="md" />
            <p className="text-text-secondary text-sm mt-4 leading-relaxed max-w-xs">
              Editorial-grade policy intelligence for ASEAN and Southeast Asia. Built in Jakarta.
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="editorial-eyebrow mb-3">Product</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link to="/briefs" className="hover:text-primary">Briefs</Link></li>
              <li><Link to="/search" className="hover:text-primary">Search</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Dashboards</Link></li>
              <li><Link to="/asean" className="hover:text-primary">ASEAN view</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="editorial-eyebrow mb-3">Company</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-primary">About</a></li>
              <li><a href="#" className="hover:text-primary">Methodology</a></li>
              <li><a href="#" className="hover:text-primary">Careers</a></li>
              <li><a href="#" className="hover:text-primary">Contact</a></li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="editorial-eyebrow mb-3">The morning brief</p>
            <p className="text-text-secondary text-sm mb-3">
              Curated headlines and one analyst note. Weekdays, by 7am WIB.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="you@ministry.go.id"
                aria-label="Email address"
                className="input-base flex-1 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-bg-elevated rounded-md text-sm font-semibold transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
            <p className="font-mono uppercase tracking-wider">© 2026 PaparanBrief · Jakarta · Singapore · Kuala Lumpur</p>
            <p className="flex gap-5">
              <a href="#" className="hover:text-primary">Privacy</a>
              <a href="#" className="hover:text-primary">Terms</a>
              <a href="#" className="hover:text-primary">Security</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
