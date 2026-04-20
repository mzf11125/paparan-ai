import { Link } from 'react-router-dom'
import {
  ArrowRight,
  FileText,
  BarChart3,
  Search,
  Shield,
  Globe,
  FileCheck,
  Building,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/Brand/Logo'
import { BriefCard } from '@/components/brief/BriefCard'
import { mockBriefs } from '@/data/mockBriefs'

export function LandingPage() {
  const featuredBriefs = mockBriefs.slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="border-b border-border bg-bg-elevated/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" aria-label="Paparan Brief home">
            <Logo variant="wordmark" size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/briefs" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              Briefs Library
            </Link>
            <Link to="/dashboard" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/editor" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              Create Brief
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/briefs"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-text hover:text-text-secondary font-medium text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/briefs"
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              Access Briefs
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — Centered, Grand, Documentary Style */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        id="main-content"
      >
        {/* Multi-layered atmospheric background */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-bg-subtle/30 via-background to-bg-elevated/50" />

          {/* Subtle radial glow from center */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary-lighter)_0%,_transparent_70%)]" />

          {/* Fine noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Decorative geometric pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" className="text-primary" />
          </svg>
        </div>

        {/* Floating official seals - positioned for visual interest */}
        <div className="absolute top-16 left-8 lg:top-24 lg:left-16 w-20 h-20 lg:w-32 lg:h-32 opacity-[0.03] animate-[spin_60s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M50 15 L53 35 L75 35 L58 50 L68 70 L50 55 L32 70 L42 50 L25 35 L47 35 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="absolute bottom-20 right-8 lg:bottom-24 lg:right-16 w-24 h-24 lg:w-40 lg:h-40 opacity-[0.025]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 50 50)" />
          </svg>
        </div>

        {/* Centered hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8 py-20 lg:py-32 text-center">
          {/* Animated classification badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-green-light/40 text-green text-xs font-bold uppercase tracking-[0.2em] rounded-full border border-green/30 mb-8 lg:mb-12 animate-[fadeIn_0.8s_ease-out]"
            style={{ animationDelay: '0ms' }}
          >
            <Shield className="w-4 h-4" />
            Unclassified — For Public Release
          </div>

          {/* Decorative top divider line */}
          <div
            className="flex items-center justify-center gap-6 mb-8 lg:mb-10 animate-[fadeIn_0.8s_ease-out]"
            style={{ animationDelay: '100ms' }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="w-2 h-2 rotate-45 border border-primary/40" />
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          {/* Main headline with beautiful typography */}
          <h1
            className="font-display font-bold text-text mb-6 lg:mb-8 animate-[fadeInUp_0.8s_ease-out]"
            style={{
              animationDelay: '200ms',
              fontSize: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)',
              lineHeight: '1.15',
              letterSpacing: '-0.02em'
            }}
          >
            <span className="block text-text-secondary/80 font-medium text-lg lg:text-xl mb-4 tracking-wide">
              Policy Intelligence
            </span>
            Intelligence Briefs for
            <span className="text-primary block mt-2">Strategic Decision-Making</span>
          </h1>

          {/* Elegant description */}
          <p
            className="text-lg lg:text-xl text-text-secondary mb-10 lg:mb-12 leading-relaxed max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out]"
            style={{
              animationDelay: '300ms',
            }}
          >
            Transform complex policy developments into actionable intelligence.
            Track developments, assess implications, and coordinate responses
            <span className="text-text font-medium"> with government-grade briefs.</span>
          </p>

          {/* CTA buttons with elegant styling */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_0.8s_ease-out]"
            style={{ animationDelay: '400ms' }}
          >
            <Link
              to="/briefs"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-lg font-semibold text-base transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                Explore Intelligence Library
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Subtle shimmer effect on hover */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-bg-elevated text-text border-2 border-border-strong hover:border-primary hover:text-primary rounded-lg font-semibold text-base transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <BarChart3 className="w-5 h-5" />
              View Dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className="mt-16 lg:mt-20 flex flex-wrap items-center justify-center gap-8 lg:gap-12 text-sm text-text-tertiary animate-[fadeIn_0.8s_ease-out]"
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-ui tabular-nums">150+ Briefs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-ui tabular-nums">12 Regions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green" />
              <span className="font-ui tabular-nums">24/7 Monitoring</span>
            </div>
          </div>

          {/* Decorative bottom divider */}
          <div
            className="flex items-center justify-center gap-6 mt-12 lg:mt-16 animate-[fadeIn_0.8s_ease-out]"
            style={{ animationDelay: '600ms' }}
          >
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-[bounce_2s_infinite]"
          style={{ animationDelay: '1000ms' }}
        >
          <div className="w-6 h-10 border-2 border-border/30 rounded-full flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-primary/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section — Document Style Grid */}
      <section className="py-20 bg-bg-elevated border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-4">
              <FileCheck className="w-3.5 h-3.5" />
              Capabilities
            </div>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-text mb-4">
              Intelligence-Driven Decision Making
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Comprehensive policy briefs with real-time updates, impact assessment,
              and actionable recommendations for government and institutional use.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 bg-bg-surface border border-border rounded-lg hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-primary-lighter rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-light transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2 font-display">Curated Briefs</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Expert-curated policy intelligence on trade, security, and diplomatic developments.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-bg-surface border border-border rounded-lg hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-primary-lighter rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-light transition-colors">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2 font-display">Smart Search</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Find relevant intelligence instantly with powerful search across regions and topics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-bg-surface border border-border rounded-lg hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-green-lighter rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-light transition-colors">
                <BarChart3 className="w-6 h-6 text-green" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2 font-display">Impact Analysis</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Understand strategic implications with detailed risk and opportunity assessments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-bg-surface border border-border rounded-lg hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-amber-lighter rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-light transition-colors">
                <Globe className="w-6 h-6 text-amber" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2 font-display">Global Coverage</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Stay informed with delta tracking on new, updated, and escalating developments worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Briefs Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-3">
                <Building className="w-3.5 h-3.5" />
                Latest Intelligence
              </div>
              <h2 className="text-3xl font-display font-bold text-text mb-2">
                Featured Policy Briefs
              </h2>
              <p className="text-text-secondary">
                Latest developments from around the world
              </p>
            </div>
            <Link
              to="/briefs"
              className="hidden sm:inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-sm transition-colors"
            >
              View all briefs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBriefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/briefs"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-sm transition-colors"
            >
              View all briefs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section — Lighter, Government Style */}
      <section className="py-16 bg-bg-elevated border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center p-6 bg-bg-surface border border-border rounded-lg">
              <div className="text-4xl lg:text-5xl font-bold text-primary tabular-nums mb-2">150+</div>
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide">Policy Briefs</div>
            </div>
            <div className="text-center p-6 bg-bg-surface border border-border rounded-lg">
              <div className="text-4xl lg:text-5xl font-bold text-primary tabular-nums mb-2">12</div>
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide">Regions Covered</div>
            </div>
            <div className="text-center p-6 bg-bg-surface border border-border rounded-lg">
              <div className="text-4xl lg:text-5xl font-bold text-primary tabular-nums mb-2">500+</div>
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide">Developments Tracked</div>
            </div>
            <div className="text-center p-6 bg-bg-surface border border-border rounded-lg">
              <div className="text-4xl lg:text-5xl font-bold text-primary tabular-nums mb-2">24/7</div>
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-6">
            <Shield className="w-3.5 h-3.5" />
            Get Started
          </div>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-text mb-4">
            Ready to Enhance Your Policy Intelligence?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join government agencies, corporations, and research institutions
            who trust Paparan Brief for strategic decision-making.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/briefs"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Browse Intelligence Library
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/editor"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-bg-elevated hover:bg-bg-surface text-text border border-border-strong rounded-lg font-semibold transition-colors"
            >
              Create Your First Brief
            </Link>
          </div>
        </div>
      </section>

      {/* Footer — Official Style */}
      <footer className="py-12 bg-bg-elevated border-t border-border-strong">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Official Footer Bar */}
          <div className="official-footer mb-8">
            <div className="flex items-center gap-3">
              <Logo variant="compact" size="md" color="monochrome" />
              <span className="text-text-tertiary">
                Policy Intelligence Briefs for Strategic Decision-Making
              </span>
            </div>
            <div className="text-text-tertiary">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-border">
            <div className="text-sm text-text-secondary">
              © 2026 Paparan Brief. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <Link to="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="#" className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
