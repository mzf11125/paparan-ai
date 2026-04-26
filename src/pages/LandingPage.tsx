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
  'parliament.gov.my', 'parliament.gov.sg', 'dpr.go.id', 'bi.go.id',
  'asean.org', 'worldbank.org', 'imf.org', 'congress.gov.ph', 'quochoi.vn',
  // Tier 1 news
  'reuters.com', 'apnews.com', 'bloomberg.com', 'ft.com',
  // Indonesia
  'antaranews.com', 'kontan.co.id', 'bisnis.com', 'ojk.go.id',
  // Islamic / Web3
  'salaamgateway.com', 'coindesk.com', 'theblock.co',
]

function NewsSourcesCarousel() {
  const doubled = [...NEWS_SOURCES, ...NEWS_SOURCES]
  return (
    <div
      className="relative"
      style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}
    >
      <div
        className="flex gap-8 items-center marquee-sources motion-safe:[animation-play-state:running]"
        style={{ animation: 'marquee-sources 35s linear infinite', width: 'max-content' }}
      >
        {doubled.map((source, i) => (
          <span
            key={i}
            className="text-sm font-medium text-text-secondary hover:text-text transition-colors whitespace-nowrap cursor-default px-3 py-1.5 rounded-md border border-border bg-bg-elevated"
          >
            {source}
          </span>
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
              <p className="text-text-secondary">Latest developments from across the region</p>
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
