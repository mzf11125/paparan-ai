import { Link } from 'react-router-dom'
import { Logo } from '@/components/Brand/Logo'

export function FooterSection() {
  return (
    <footer className="py-14 border-t border-white/10" style={{ background: '#070F1E' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Logo variant="wordmark" size="md" />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              AI-powered policy intelligence for government affairs, regulatory, and public sector teams across ASEAN.
            </p>
          </div>

          {[
            {
              heading: 'Platform',
              links: ['Monitor', 'Research', 'Brief', 'Workspace'],
            },
            {
              heading: 'Solutions',
              links: ['Government Relations', 'Regulatory Affairs', 'Public Affairs'],
            },
            {
              heading: 'Company',
              links: ['About', 'Security', 'Resources', 'Contact'],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {heading}
              </div>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to="#"
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Paparan Brief. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service'].map((item) => (
              <Link
                key={item}
                to="#"
                className="text-xs transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
