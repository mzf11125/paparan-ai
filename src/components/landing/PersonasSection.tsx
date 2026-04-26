import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PERSONAS = [
  {
    title: 'Government Relations',
    // ASEAN parliament session / legislative chamber
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=75',
    imageAlt: 'Legislative chamber representing government relations work',
    points: [
      'Prep clients fast with bill analysis and redlines',
      'Generate meeting briefs and hearing summaries',
      'Track whip counts and position-aligned talking points',
    ],
  },
  {
    title: 'Regulatory Affairs',
    // Regulatory compliance / law books
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=75',
    imageAlt: 'Policy documents and regulatory paperwork',
    points: [
      'Automated 360° horizon scanning across jurisdictions',
      'Side-by-side regulatory comparisons and impact analysis',
      'Draft comment letters with source-backed intelligence',
    ],
  },
  {
    title: 'Public Affairs & Comms',
    // Press conference / public statement
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=75',
    imageAlt: 'Public affairs team in a policy briefing',
    points: [
      'Turn policy signals into client-ready messaging briefs',
      'Build stakeholder maps and weekly issue updates',
      'Respond first and own the narrative with proactive alerts',
    ],
  },
]

export function PersonasSection() {
  return (
    <section className="py-24 bg-bg-elevated">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 bg-primary-light text-primary">
            Solutions
          </div>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-text mb-4 text-balance">
            Built for Your Team
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            Whether you're managing client relationships, navigating regulation, or shaping public narratives — Paparan fits your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PERSONAS.map(({ title, image, imageAlt, points }) => (
            <div
              key={title}
              className="group rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={image}
                  alt={imageAlt}
                  width={600}
                  height={300}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(15,39,68,0.3) 0%, rgba(15,39,68,0.7) 100%)' }} aria-hidden="true" />
                <h3 className="absolute bottom-4 left-5 text-lg font-bold text-white font-display">{title}</h3>
              </div>
              <div className="p-6 bg-bg-surface">
                <ul className="space-y-3 mb-6">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/briefs"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 cursor-pointer text-primary hover:text-primary-dark"
                >
                  Learn more <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
