import { Link } from 'react-router-dom'
import { ArrowRight, FileText, BarChart3, Zap, Search, Bell } from 'lucide-react'
import { Logo } from '@/components/Brand/Logo'
import { BriefCard } from '@/components/brief/BriefCard'
import { mockBriefs } from '@/data/mockBriefs'

export function LandingPage() {
  const featuredBriefs = mockBriefs.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav className="border-b border-[#E8E4DC] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo variant="wordmark" size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/briefs" className="text-gray-600 hover:text-[#C8A96A] transition-colors">
              Briefs Library
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-[#C8A96A] transition-colors">
              Dashboard
            </Link>
            <Link to="/editor" className="text-gray-600 hover:text-[#C8A96A] transition-colors">
              Create Brief
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/briefs"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/briefs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C8A96A]/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C8A96A]/10 text-[#C8A96A] text-sm font-medium rounded-full mb-6">
              <Zap className="w-4 h-4" />
              Policy Intelligence for Strategic Decisions
            </div>
            <h1 className="text-4xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight mb-6">
              Intelligence Briefs for
              <span className="text-[#C8A96A]"> Government-Grade </span>
              Decision Making
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform complex policy developments into actionable intelligence.
              Track developments, assess implications, and coordinate responses across
              your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/briefs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-semibold transition-colors"
              >
                Explore Briefs Library
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-semibold transition-colors"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
              Intelligence-Driven Decision Making
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive policy briefs with real-time updates, impact assessment,
              and actionable recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-[#C8A96A]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-[#C8A96A]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Curated Briefs</h3>
              <p className="text-gray-600">
                Expert-curated policy intelligence on trade, security, and diplomatic developments.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Find relevant intelligence instantly with powerful search across regions and topics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Impact Analysis</h3>
              <p className="text-gray-600">
                Understand strategic implications with detailed risk and opportunity assessments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Stay informed with delta tracking on new, updated, and escalating developments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Briefs Section */}
      <section className="py-20 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                Featured Intelligence Briefs
              </h2>
              <p className="text-gray-600">
                Latest policy developments from around the world
              </p>
            </div>
            <Link
              to="/briefs"
              className="hidden sm:inline-flex items-center gap-2 text-[#C8A96A] hover:text-[#A88B4A] font-medium transition-colors"
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
              className="inline-flex items-center gap-2 text-[#C8A96A] hover:text-[#A88B4A] font-medium transition-colors"
            >
              View all briefs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#2D2D2D] text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-[#C8A96A] mb-2">150+</div>
              <div className="text-gray-400">Policy Briefs</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-[#C8A96A] mb-2">12</div>
              <div className="text-gray-400">Regions Covered</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-[#C8A96A] mb-2">500+</div>
              <div className="text-gray-400">Developments Tracked</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-[#C8A96A] mb-2">24/7</div>
              <div className="text-gray-400">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
            Ready to Enhance Your Policy Intelligence?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join government agencies, corporations, and research institutions
            who trust Paparan Brief for strategic decision-making.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/briefs"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C8A96A] hover:bg-[#A88B4A] text-white rounded-lg font-semibold transition-colors"
            >
              Browse Intelligence Library
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/editor"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-semibold transition-colors"
            >
              Create Your First Brief
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FAFAF8] border-t border-[#E8E4DC]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo variant="compact" size="md" color="monochrome" />
              <p className="text-sm text-gray-600">
                Policy intelligence briefs for strategic decision-making
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>© 2026 Paparan Brief</span>
              <a href="#" className="hover:text-[#C8A96A] transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-[#C8A96A] transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
