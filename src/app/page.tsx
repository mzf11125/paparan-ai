import Link from 'next/link'
import { FileText, TrendingUp, Shield, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-paparan-deep/10">
        <div className="container">
          <div className="py-20 md:py-32">
            <div className="max-w-3xl">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-paparan-deep leading-tight">
                Strategic Briefs for Policymakers
              </h1>
              <p className="mt-6 text-lg text-paparan-slate max-w-2xl">
                Paparan transforms fragmented information into structured, decision-ready intelligence briefs.
                Built for ASEAN policymakers.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button variant="primary" size="lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white border-b border-paparan-deep/10">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-paparan-deep/10 rounded-lg">
                <FileText className="h-6 w-6 text-paparan-deep" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-paparan-deep">
                  Structured Output
                </h3>
                <p className="mt-1 text-sm text-paparan-slate">
                  Consistent 7-section brief format with executive summary, developments, and recommended actions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-paparan-deep/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-paparan-deep" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-paparan-deep">
                  Delta Tracking
                </h3>
                <p className="mt-1 text-sm text-paparan-slate">
                  See what changed since your last briefing with NEW, UPDATED, ESCALATED, and DE-ESCALATED labels.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-paparan-deep/10 rounded-lg">
                <Shield className="h-6 w-6 text-paparan-deep" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-paparan-deep">
                  Sourced Intelligence
                </h3>
                <p className="mt-1 text-sm text-paparan-slate">
                  Every claim attributed to government sources, major news outlets, or research institutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-paparan-cream">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-semibold text-paparan-deep">
              How It Works
            </h2>
            <p className="mt-3 text-paparan-slate max-w-2xl mx-auto">
              Generate actionable intelligence briefs in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Enter Your Topic',
                description: 'Specify a policy topic and region. Optionally upload documents for additional context.',
              },
              {
                step: '02',
                title: 'AI Retrieval & Analysis',
                description: 'Our system searches government sources, news, and research to gather relevant information.',
              },
              {
                step: '03',
                title: 'Receive Structured Brief',
                description: 'Get a comprehensive 7-section brief with developments, implications, and recommendations.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-card p-6 border border-paparan-deep/10">
                  <span className="text-5xl font-serif font-bold text-paparan-deep/10 absolute top-4 right-6">
                    {item.step}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-paparan-deep">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-paparan-slate">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Output Preview */}
      <section className="py-20 bg-white border-t border-paparan-deep/10">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-semibold text-paparan-deep">
              Sample Brief Output
            </h2>
            <p className="mt-3 text-paparan-slate">
              See what a Paparan brief looks like
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-paparan-cream rounded-card p-8 border border-paparan-deep/10">
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-paparan-deep border-b border-paparan-deep/10 pb-2 mb-3">
                  Executive Summary
                </h3>
                <ul className="space-y-2 text-sm text-paparan-ink">
                  <li className="flex gap-2">
                    <span className="text-paparan-amber">•</span>
                    <span>Indonesia announces new nickel export quotas for Q2 2026</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-paparan-amber">•</span>
                    <span>Philippines seeks coordination on regional EV supply chain policy</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-paparan-amber">•</span>
                    <span>EU Critical Raw Materials Act creates new compliance requirements</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-xl text-paparan-deep border-b border-paparan-deep/10 pb-2 mb-3">
                  Key Developments
                </h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-paparan-deep/10">
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                        NEW
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-medium">
                        HIGH
                      </span>
                    </div>
                    <p className="text-sm text-paparan-ink">
                      Indonesia&apos;s Ministry of Trade issued Regulation No. 15/2026, reducing nickel ore export quotas by 15% effective immediately.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-paparan-deep/10">
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                        UPDATED
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
                        MEDIUM
                      </span>
                    </div>
                    <p className="text-sm text-paparan-ink">
                      Philippines DTI updates EV investment incentives framework, expanding tax holidays for domestic battery manufacturing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-paparan-deep text-paparan-cream">
        <div className="container text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
            Ready to Transform Your Policy Research?
          </h2>
          <p className="text-paparan-cream/80 max-w-2xl mx-auto mb-8">
            Join policymakers and analysts using Paparan for faster, more accurate intelligence briefs.
          </p>
          <Link href="/signup">
            <Button variant="secondary" size="lg">
              Create Your First Brief
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-paparan-sage text-paparan-cream/60 text-sm">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} Paparan.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
