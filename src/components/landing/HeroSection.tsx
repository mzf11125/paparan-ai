import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { useEffect, useState } from 'react'

const ROTATING_WORDS = ['Monitor.', 'Analyze.', 'Brief.', 'Decide.']

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length)
        setVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      id="main-content"
      className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F2744 40%, #1a3a6b 100%)' }}
    >
      {/* Animated grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* Radial glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold uppercase tracking-[0.2em] rounded-full mb-8">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              Policy Intelligence Platform
            </div> */}

            <h1
              className="font-display font-bold text-white mb-2 text-balance"
              style={{ fontSize: 'clamp(2.5rem, 4vw + 1rem, 4.5rem)', lineHeight: '1.1', letterSpacing: '-0.02em' }}
            >
              Policy Intelligence
            </h1>
            <h1
              className="font-display font-bold mb-6"
              style={{
                fontSize: 'clamp(2.5rem, 4vw + 1rem, 4.5rem)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
                color: '#60a5fa',
                transition: 'opacity 0.3s ease',
                opacity: visible ? 1 : 0,
              }}
            >
              {ROTATING_WORDS[wordIndex]}
            </h1>

            <p className="text-lg text-white/65 mb-10 leading-relaxed max-w-lg">
              AI-powered briefs for government affairs, regulatory, and public sector teams across ASEAN and 140+ global markets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/briefs"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#0F2744] rounded-lg font-semibold text-base transition-all duration-200 hover:bg-blue-50 hover:-translate-y-0.5 shadow-lg cursor-pointer"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/briefs"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent text-white border border-white/30 hover:border-white/60 hover:bg-white/5 rounded-lg font-semibold text-base transition-all duration-200 cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                Watch Demo
              </Link>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap gap-8">
              {[
                { value: '140+', label: 'Markets Covered' },
                { value: '10M+', label: 'Documents Indexed' },
                { value: '24/7', label: 'Live Monitoring' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: dashboard screenshot */}
          <div className="relative hidden lg:block">
            {/* Glow behind image */}
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} aria-hidden="true" />

            {/* Browser chrome mockup */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="bg-[#1a2744] px-4 py-3 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 mx-4 bg-white/10 rounded px-3 py-1 text-xs text-white/40">
                  app.paparan.ai/briefs
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85"
                alt="Paparan Brief dashboard showing policy intelligence analytics"
                width={1200}
                height={700}
                loading="eager"
                fetchPriority="high"
                className="w-full object-cover"
                style={{ minHeight: '520px', maxHeight: '620px' }}
              />
              {/* Overlay gradient at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, #0F2744, transparent)' }} aria-hidden="true" />
            </div>

            {/* Floating stat card */}
            {/* <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-blue-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">New Alerts Today</div>
                <div className="text-xl font-bold text-gray-900 tabular-nums">47</div>
              </div>
            </div> */}

            {/* Floating badge */}
            {/* <div className="absolute -top-4 -right-4 bg-[#0F2744] border border-white/20 rounded-xl shadow-xl px-4 py-3">
              <div className="text-xs text-white/60 font-medium mb-1">Coverage</div>
              <div className="text-sm font-bold text-white">ASEAN + 140 Markets</div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </div>
    </section>
  )
}
