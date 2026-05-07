import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
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
      style={{ background: '#060d1a' }}
    >
      {/* Background — ASEAN parliament / government building aerial */}
      <img
        src="https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1920&q=80"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 0.35, filter: 'saturate(0.5) brightness(0.6)' }}
      />

      {/* Layered dark overlay — stronger at edges, lighter at center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(6,13,26,0.45) 0%, rgba(6,13,26,0.85) 100%)' }}
        aria-hidden="true"
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #060d1a, transparent)' }}
        aria-hidden="true"
      />

      {/* Content — centered */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 py-24 text-center">

        {/* Badge */}
        {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/15 text-white/70 text-xs font-semibold uppercase tracking-[0.2em] rounded-full mb-10">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Policy Intelligence Platform
        </div> */}

        {/* Headline */}
        <h1
          className="font-display font-bold text-white text-balance"
          style={{ fontSize: 'clamp(3rem, 5vw + 1rem, 5.5rem)', lineHeight: '1.08', letterSpacing: '-0.03em' }}
        >
          Policy Intelligence
        </h1>
        <h1
          className="font-display font-bold mb-8"
          style={{
            fontSize: 'clamp(3rem, 5vw + 1rem, 5.5rem)',
            lineHeight: '1.08',
            letterSpacing: '-0.03em',
            color: '#60a5fa',
            transition: 'opacity 0.3s ease',
            opacity: visible ? 1 : 0,
          }}
        >
          {ROTATING_WORDS[wordIndex]}
        </h1>

        {/* Subhead */}
        <p className="text-lg lg:text-xl text-white/60 mb-12 leading-relaxed max-w-2xl mx-auto">
          The only AI-powered policy intelligence platform built specifically for ASEAN and Southeast Asia.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/briefs"
            className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-white text-[#0F2744] rounded-lg font-semibold text-base transition-all duration-200 hover:bg-blue-50 hover:-translate-y-0.5 shadow-xl cursor-pointer"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/briefs"
            className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-transparent text-white border border-white/25 hover:border-white/50 hover:bg-white/5 rounded-lg font-semibold text-base transition-all duration-200 cursor-pointer"
          >
            Explore the Library
          </Link>
        </div>

        {/* Trust stats */}
        <div className="flex flex-wrap items-center justify-center gap-10">
          {[
            { value: 'ASEAN & SE Asia', label: 'Market Focus' },
            { value: '10M+', label: 'Documents Indexed' },
            { value: '24/7', label: 'Live Monitoring' },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex items-center gap-3">
              {i > 0 && <div className="w-px h-8 bg-white/15" aria-hidden="true" />}
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
                <div className="text-xs text-white/45 uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce" aria-hidden="true">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </div>
    </section>
  )
}
