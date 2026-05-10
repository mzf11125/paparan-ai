import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Globe, Zap, AlertTriangle, TrendingUp, Loader2, Search, Network } from 'lucide-react'
import { cn } from '@/utils/formatters'
import { usePageMeta } from '@/hooks/usePageMeta'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const getToken = () => localStorage.getItem('sb-token') || ''

const RDTII_PILLARS: Record<string, string> = {
  P1: 'Trade Facilitation',
  P2: 'Digital Infrastructure',
  P3: 'Payments & Fintech',
  P4: 'E-Commerce & Digital Trade',
  P5: 'Data Governance & Privacy',
  P6: 'Cybersecurity & Trust',
  P7: 'Digital Inclusion & Capacity',
}

const BASELINE_RDTII: Record<string, number> = {
  P1: 0.62, P2: 0.55, P3: 0.71, P4: 0.68, P5: 0.44, P6: 0.51, P7: 0.39,
}

async function fetchKnowledgeGraph(q: string) {
  const res = await fetch(`${API}/api/asean/knowledge-graph?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return res.ok ? res.json() : []
}

async function runSimulation(scenario: string, pillars: string[]) {
  const res = await fetch(`${API}/api/asean/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ scenario, affected_pillars: pillars }),
  })
  return res.json()
}

function PillarBar({ id, score, simScore }: { id: string; score: number; simScore?: number }) {
  const pct    = Math.round(score * 100)
  const simPct = simScore !== undefined ? Math.round(simScore * 100) : null
  const color  = pct >= 65 ? 'bg-success' : pct >= 45 ? 'bg-warning' : 'bg-error'

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-6 text-[10px] font-bold text-text-muted font-mono">{id}</span>
      <span className="w-40 text-xs text-text-secondary font-ui truncate">{RDTII_PILLARS[id]}</span>
      <div className="flex-1 h-2 bg-bg-subtle rounded-full overflow-hidden relative">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
        {simPct !== null && (
          <div
            className="absolute top-0 h-full rounded-full bg-primary/40 transition-all duration-700"
            style={{ width: `${simPct}%` }}
          />
        )}
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-text-secondary font-mono">{pct}%</span>
      {simPct !== null && (
        <span className={cn('w-10 text-right text-xs tabular-nums font-mono', simPct > pct ? 'text-success' : 'text-error')}>
          {simPct > pct ? '+' : ''}{simPct - pct}%
        </span>
      )}
    </div>
  )
}

function SimulatorResult({ result }: { result: Record<string, unknown> }) {
  const risks     = (result.risks as string[]) || []
  const opps      = (result.opportunities as string[]) || []
  const pillars   = (result.affected_rdtii_pillars as Record<string, number>) || {}
  const countries = (result.affected_countries as string[]) || []

  return (
    <div className="surface-card p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn(
          'badge border',
          result.confidence === 'HIGH'   ? 'bg-success/10 text-success border-success/25' :
          result.confidence === 'MEDIUM' ? 'bg-warning/10 text-warning border-warning/25' :
          'bg-error/10 text-error border-error/25'
        )}>
          {result.confidence as string} confidence
        </span>
        {countries.length > 0 && (
          <span className="text-xs text-text-tertiary font-ui">Affected: {countries.join(', ')}</span>
        )}
      </div>

      {Object.keys(pillars).length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3">RDTII Impact</p>
          <div className="space-y-1">
            {Object.entries(pillars).map(([id, score]) => (
              <PillarBar key={id} id={id} score={BASELINE_RDTII[id] || 0} simScore={score as number} />
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {risks.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-error font-ui mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Risks
            </p>
            <ul className="space-y-1.5">
              {risks.map((r, i) => <li key={i} className="text-xs text-text-secondary font-ui">• {r}</li>)}
            </ul>
          </div>
        )}
        {opps.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-success font-ui mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Opportunities
            </p>
            <ul className="space-y-1.5">
              {opps.map((o, i) => <li key={i} className="text-xs text-text-secondary font-ui">• {o}</li>)}
            </ul>
          </div>
        )}
      </div>

      {typeof result.summary === 'string' && result.summary && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-text-secondary font-ui leading-relaxed">{result.summary}</p>
        </div>
      )}
    </div>
  )
}

export function AseanDashboardPage() {
  usePageMeta({ title: 'ASEAN Dashboard', description: 'RDTII pillars, scenario simulator, and knowledge graph for the ten ASEAN economies.' })
  const [scenario, setScenario]         = useState('')
  const [selectedPillars, setSelectedPillars] = useState<string[]>([])
  const [kgQuery, setKgQuery]           = useState('')
  const [kgResults, setKgResults]       = useState<unknown[]>([])
  const [kgLoading, setKgLoading]       = useState(false)
  const [simResult, setSimResult]       = useState<Record<string, unknown> | null>(null)

  const simMutation = useMutation({
    mutationFn: () => runSimulation(scenario, selectedPillars),
    onSuccess: (data) => setSimResult(data),
  })

  const handleKgSearch = async () => {
    if (!kgQuery.trim()) return
    setKgLoading(true)
    try {
      const results = await fetchKnowledgeGraph(kgQuery)
      setKgResults(Array.isArray(results) ? results : results.nodes || [])
    } finally { setKgLoading(false) }
  }

  const togglePillar = (id: string) =>
    setSelectedPillars(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20 mb-3 font-ui">
          <Globe className="w-3 h-3" />
          ASEAN Intelligence
        </div>
        <h1 className="text-3xl font-display font-bold text-text">ASEAN Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1 font-ui">
          RDTII tracker, policy simulator, and knowledge graph
        </p>
      </div>

      {/* RDTII Baseline */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-text">RDTII Pillar Scores</h2>
            <p className="text-xs text-text-secondary font-ui mt-0.5">ASEAN Digital Trade Roadmap baseline</p>
          </div>
          <span className="badge bg-primary/10 text-primary border border-primary/20">Perpres 195/2024</span>
        </div>
        <div className="space-y-1">
          {Object.entries(BASELINE_RDTII).map(([id, score]) => (
            <PillarBar key={id} id={id} score={score} simScore={simResult ? (simResult.affected_rdtii_pillars as Record<string, number>)?.[id] : undefined} />
          ))}
        </div>
        {simResult && (
          <p className="text-[10px] text-text-muted font-ui mt-3">
            Teal overlay shows simulated impact. Positive delta = improvement.
          </p>
        )}
      </div>

      {/* Two-column: Simulator + Knowledge Graph */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Policy Simulator */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-text">Policy Simulator</h2>
              <p className="text-xs text-text-secondary font-ui">Simulate ASEAN policy scenarios</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-2">
              Scenario
            </label>
            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder="e.g. Indonesia implements new digital trade tariffs affecting ASEAN e-commerce platforms"
              className="input-base resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-2">
              Affected Pillars
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(RDTII_PILLARS).map(([id]) => (
                <button
                  key={id}
                  onClick={() => togglePillar(id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold font-ui border transition-all duration-150',
                    selectedPillars.includes(id)
                      ? 'bg-primary text-white border-primary'
                      : 'text-text-secondary border-border hover:border-border-strong hover:text-text'
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => simMutation.mutate()}
            disabled={!scenario.trim() || simMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold font-ui transition-all duration-150 shadow-teal disabled:opacity-50"
          >
            {simMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating…</>
              : <><Zap className="w-4 h-4" /> Run Simulation</>}
          </button>

          {simMutation.isError && (
            <p className="text-xs text-error font-ui">Simulation failed. Ensure the backend is running.</p>
          )}

          {simResult && <SimulatorResult result={simResult} />}
        </div>

        {/* Knowledge Graph */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Network className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h2 className="font-display font-bold text-text">Knowledge Graph</h2>
              <p className="text-xs text-text-secondary font-ui">Query policy entity relationships</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={kgQuery}
                onChange={e => setKgQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleKgSearch()}
                placeholder="Search entities, policies, actors…"
                className="input-base pl-9"
              />
            </div>
            <button
              onClick={handleKgSearch}
              disabled={kgLoading || !kgQuery.trim()}
              className="px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/25 rounded-lg text-sm font-semibold font-ui transition-all duration-150 disabled:opacity-50"
            >
              {kgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>

          {kgResults.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {kgResults.map((node, i) => {
                const n = (node ?? {}) as { name?: string; entity?: string; title?: string; type?: string; description?: string }
                const label = n.name || n.entity || n.title || JSON.stringify(node).slice(0, 60)
                return (
                  <div key={i} className="p-3 bg-bg-surface rounded-lg border border-border hover:border-border-strong transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text font-ui">{String(label)}</p>
                      {n.type && (
                        <span className="badge bg-bg-subtle text-text-secondary border border-border text-[10px] flex-shrink-0">
                          {n.type}
                        </span>
                      )}
                    </div>
                    {n.description && (
                      <p className="text-xs text-text-secondary font-ui mt-1 line-clamp-2">{n.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : kgLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Network className="w-10 h-10 text-text-muted mb-3" />
              <p className="text-sm text-text-secondary font-ui">Search to explore policy entities</p>
              <p className="text-xs text-text-muted font-ui mt-1">Try "ASEAN trade", "Bank Indonesia", "digital economy"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
