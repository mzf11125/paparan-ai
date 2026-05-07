import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Brand/Logo'
import { BriefCard } from '@/components/brief/BriefCard'
import { mockBriefs } from '@/data/mockBriefs'
import { HeroSection } from '@/components/landing/HeroSection'
import { TrustedBySection } from '@/components/landing/TrustedBySection'
import { ModulesSection } from '@/components/landing/ModulesSection'
import { PersonasSection } from '@/components/landing/PersonasSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { FooterSection } from '@/components/landing/FooterSection'

const NEWS_SOURCES = [
  // Gov / Multilateral
  { name: 'Parliament Malaysia', domain: 'parliament.gov.my' },
  { name: 'Parliament Singapore', domain: 'parliament.gov.sg' },
  { name: 'DPR Indonesia', domain: 'dpr.go.id' },
  { name: 'Bank Indonesia', domain: 'bi.go.id' },
  { name: 'ASEAN', domain: 'asean.org' },
  { name: 'World Bank', domain: 'worldbank.org' },
  { name: 'IMF', domain: 'imf.org' },
  { name: 'Congress Philippines', domain: 'congress.gov.ph' },
  // Tier 1 news
  { name: 'Reuters', domain: 'reuters.com' },
  { name: 'AP News', domain: 'apnews.com' },
  { name: 'Bloomberg', domain: 'bloomberg.com' },
  { name: 'Financial Times', domain: 'ft.com' },
  // Indonesia
  { name: 'Antara News', domain: 'antaranews.com' },
  { name: 'Kontan', domain: 'kontan.co.id' },
  { name: 'Bisnis', domain: 'bisnis.com' },
  { name: 'OJK', domain: 'ojk.go.id' },
  // Islamic / Web3
  { name: 'Salaam Gateway', domain: 'salaamgateway.com' },
  { name: 'CoinDesk', domain: 'coindesk.com' },
  { name: 'The Block', domain: 'theblock.co' },
]

function NewsSourcesCarousel() {
  const doubled = [...NEWS_SOURCES, ...NEWS_SOURCES]
  return (
    <div
      className="relative"
      style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}
    >
      <div
        className="marquee-sources flex gap-6 items-center"
        style={{ animation: 'marquee-sources 40s linear infinite', width: 'max-content' }}
      >
        {doubled.map(({ name, domain }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-bg-elevated whitespace-nowrap cursor-default hover:border-primary/40 transition-colors duration-200"
            title={domain}
          >
            <img
              src={`https://logo.clearbit.com/${domain}`}
              alt={name}
              width={20}
              height={20}
              loading="lazy"
              className="w-5 h-5 rounded-sm object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-sm font-medium text-text-secondary">{name}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee-sources {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-sources { animation: none; }
        }
      `}</style>
    </div>
  )
}

export function LandingPage() {
  const featuredBriefs = mockBriefs.slice(0, 3)

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Navigation ── */}
      <nav className="border-b border-white/10 sticky top-0 z-50 backdrop-blur-md" style={{ background: 'rgba(10,22,40,0.95)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" aria-label="Paparan Brief home">
            <Logo variant="wordmark" size="md" color="inverted" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Monitor', to: '/briefs' },
              { label: 'Research', to: '/briefs' },
              { label: 'Brief', to: '/editor' },
              { label: 'Dashboard', to: '/dashboard' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className="text-white/65 hover:text-white transition-colors duration-200 text-sm font-medium">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/briefs" className="hidden sm:inline-flex text-white/65 hover:text-white font-medium text-sm transition-colors duration-200">
              Sign In
            </Link>
            <Link
              to="/briefs"
              className="inline-flex items-center gap-2 px-5 py-2 bg-bg-elevated text-text rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-bg-surface hover:-translate-y-0.5 shadow-sm cursor-pointer border border-border"
              style={{ color: '#0F2744' }}
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <TrustedBySection />
      <ModulesSection />
      <PersonasSection />
      {/* <TestimonialsSection /> */}

      {/* ── Featured Briefs ── */}
      <section className="py-24 bg-bg-elevated">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 bg-primary-light text-primary">
                Latest Intelligence
              </div>
              <h2 className="text-3xl font-display font-bold text-text mb-1">Featured Policy Briefs</h2>
              <p className="text-text-secondary">Latest developments from across ASEAN and Southeast Asia</p>
            </div>
            <Link to="/briefs" className="hidden sm:inline-flex items-center gap-2 font-medium text-sm transition-colors duration-200 cursor-pointer text-primary hover:text-primary-dark">
              View all briefs <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBriefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      {/* ── News Sources Carousel ── */}
      <section className="py-10 border-t border-border bg-bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-text-tertiary">
            Intelligence sourced from
          </p>
        </div>
        <NewsSourcesCarousel />
      </section>

      <CtaSection />
      <FooterSection />
    </div>
  )
}
