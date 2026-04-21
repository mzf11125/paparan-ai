import { Quote } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const TESTIMONIALS = [
  {
    quote: 'Paparan redefined how we track and interpret legislative and regulatory activity. Its AI-powered insights help our teams craft sharper narratives and strategic guidance across industries.',
    name: 'Ahmad Razif',
    title: 'Managing Director',
    org: 'Regional Policy Advisors',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=75',
  },
  {
    quote: 'The research and monitoring tools have helped us stay up to speed on policy issues relevant to our mission — identifying key insights faster so we can focus on engaging partners.',
    name: 'Dr. Siti Norzahira',
    title: 'Head of Research',
    org: 'Institute for Strategic Studies',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=75',
  },
  {
    quote: 'Paparan has reshaped how we track the evolving policy landscape. Our team can quickly understand what matters most and act with greater speed and confidence.',
    name: 'James Lim',
    title: 'Head of Global Public Policy',
    org: 'ASEAN Affairs Council',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=75',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 bg-primary-light text-primary">
            Customer Stories
          </div>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-text text-balance">
            Trusted by Policy Professionals
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, title, org, avatar }, i) => (
            <div
              key={name}
              ref={useScrollReveal()}
              className="reveal-on-scroll bg-bg-elevated rounded-2xl p-7 border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              style={{ borderTop: '3px solid #60a5fa', transitionDelay: `${i * 100}ms` }}
            >
              <Quote className="w-7 h-7 mb-4 shrink-0 text-primary-light" aria-hidden="true" />
              <p className="text-text-secondary text-sm leading-relaxed font-serif italic flex-1">"{quote}"</p>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <img
                  src={avatar}
                  alt={`Portrait of ${name}`}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div>
                  <div className="font-semibold text-text text-sm">{name}</div>
                  <div className="text-xs text-text-tertiary mt-0.5">{title} · {org}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
