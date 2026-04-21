import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F2744 50%, #1a3a6b 100%)' }}>
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id="cta-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-grid)" />
      </svg>

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, #3b82f6, transparent)' }} aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-8 text-center">
        {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 text-white/70 text-xs font-semibold uppercase tracking-[0.2em] rounded-full mb-8">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Get Started
        </div> */}
        <h2 className="text-3xl lg:text-5xl font-display font-bold text-white mb-5 text-balance" style={{ lineHeight: '1.15' }}>
          Ready to Transform Your Policy Intelligence?
        </h2>
        <p className="text-lg text-white/55 mb-10 max-w-xl mx-auto leading-relaxed">
          Join government agencies, corporations, and research institutions who rely on Paparan for faster, more confident decision-making.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/briefs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#0F2744] rounded-lg font-semibold text-base transition-all duration-200 hover:bg-blue-50 hover:-translate-y-0.5 shadow-xl cursor-pointer"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/briefs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border border-white/30 hover:border-white/60 hover:bg-white/5 rounded-lg font-semibold text-base transition-all duration-200 cursor-pointer"
          >
            Browse Intelligence Library
          </Link>
        </div>
      </div>
    </section>
  )
}
