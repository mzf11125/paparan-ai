const TRUSTED_BY = [
  'ASEAN Secretariat',
  'Ministry of Trade & Industry',
  'Institute of Strategic Studies',
  'National Policy Foundation',
  'Regional Affairs Council',
  'Public Policy Institute',
  'Asia Pacific Forum',
  'Centre for Governance',
]

export function TrustedBySection() {
  return (
    <section className="py-10 border-b border-white/10" style={{ background: '#0A1628' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/35 mb-8">
          Trusted by policy teams at
        </p>
        {/* Marquee scroll */}
        <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div
            className="flex gap-12 items-center"
            style={{
              animation: 'marquee 30s linear infinite',
              width: 'max-content',
            }}
          >
            {[...TRUSTED_BY, ...TRUSTED_BY].map((org, i) => (
              <span key={i} className="text-sm font-medium text-white/45 hover:text-white/70 transition-colors whitespace-nowrap cursor-default">
                {org}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </section>
  )
}
