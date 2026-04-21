import { Bell, Search, FileText, LayoutDashboard } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const MODULES = [
  {
    icon: Bell,
    name: 'Monitor',
    tagline: 'Catch policy signals before they become crises.',
    description: 'Real-time alerts on legislative and regulatory developments across ASEAN and 140+ global markets — with draft-ready insights attached.',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=75',
    imageAlt: 'Policy monitoring dashboard with real-time alerts',
  },
  {
    icon: Search,
    name: 'Research',
    tagline: 'Turn hours of research into minutes.',
    description: 'Search bills, hearings, rulemakings, and agency filings alongside expert analysis from think tanks and advocacy organisations.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=75',
    imageAlt: 'Research interface showing document search results',
  },
  {
    icon: FileText,
    name: 'Brief',
    tagline: 'Generate fully cited briefs in seconds.',
    description: 'Ask targeted questions or upload documents. Paparan produces executive-ready memos, issue analysis, and talking points — fully sourced.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=75',
    imageAlt: 'AI-generated policy brief document',
  },
  {
    icon: LayoutDashboard,
    name: 'Workspace',
    tagline: 'Deliver work product your team can use immediately.',
    description: 'Hearing summaries, side-by-side comparisons, stakeholder maps, and meeting prep — structured to match how your team actually works.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=75',
    imageAlt: 'Workspace dashboard with policy work products',
  },
]

function ModuleCard({ icon: Icon, name, tagline, description, image, imageAlt, index }: typeof MODULES[0] & { index: number }) {
  const ref = useScrollReveal()
  return (
    <div
      ref={ref}
      className="reveal-on-scroll group bg-bg-elevated border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative h-44 overflow-hidden bg-bg-surface">
        <img
          src={image}
          alt={imageAlt}
          width={600}
          height={300}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(15,39,68,0.9) 100%)' }} aria-hidden="true" />
        <div className="absolute top-4 left-4 w-10 h-10 rounded-lg flex items-center justify-center shadow-md bg-navy">
          <Icon className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
      </div>
      <div className="p-6">
        <div className="text-xs font-bold uppercase tracking-widest mb-1 text-primary">{name}</div>
        <h3 className="text-base font-semibold text-text mb-2 leading-snug font-display">{tagline}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function ModulesSection() {
  return (
    <section className="py-24 bg-bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 bg-primary-light text-primary">
            The Platform
          </div>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-text mb-4 text-balance">
            Four Modules. One Workflow.
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            From raw policy signal to decision-ready work product — without the manual effort.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULES.map((mod, i) => (
            <ModuleCard key={mod.name} {...mod} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
