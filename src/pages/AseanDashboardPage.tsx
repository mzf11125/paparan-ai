import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Globe, Zap, BarChart2, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'
import { cn } from '@/utils/formatters'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const getToken = () => localStorage.getItem('sb-token') || ''

const RDTII_PILLAR_LABELS: Record<string, string> = {
  P1: 'Trade Facilitation', P2: 'Digital Infrastructure',
  P3: 'Payments & Fintech', P4: 'E-Commerce & Digital Trade',
  P5: 'Data Governance & Privacy', P6: 'Cybersecurity & Trust',
  P7: 'Digital Inclusion & Capacity',
}

// Static RDTII baseline scores (representative, updated by simulator results)
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

function PillarBar({ id, score }: { id: string; score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 65 ? 'bg-green' : pct >= 45 ? 'bg-amber' : 'bg-red'
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-xs font-bold text-text-tertiary">{id}</span>
      <span className="w-44 text-xs text-text-secondary truncate">{RDTII_PILLAR_LABELS[id]}</span>
      <div className="flex-1 h-2.5 bg-bg-surface rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-text-tertiary">{pct}%</span>
    </div>
  )
}

function SimulatorResult({ result }: { result: Record<string, unknown> }) {
  const risks = (result.risks as string[]) || []
  const opps = (result.opportunities as string[]) || []
  const pillars = (result.affected_rdtii_pillars as Record<string, number>) || {}
  const countries = (result.affected_countries as string[]) || []

  return (
    <div className="mt-4 space-y-4 border border-border rounded-lg p-4 bg-bg-elevated">
      <div className="flex items-center gap-2">
        <span className={cn('px-2 py-0.5 text-xs font-bold rounded uppercase',
          result.confidence === 'HIGH' ? 'bg-green/20 text-green' :
          result.confidence === 'MEDIUM' ? 'bg-amber/20 text-amber' : 'bg-red/20 text-red')}>
          {result.confidence as string} confidence
        </span>
        {countries.length > 0 && (
          <span className="text-xs text-text-tertiary">Affected: {countries.join(', ')}</span>
        )}
      </div>

      {Object.keys(pillars).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">RDTII Impact</p>
          <div className="space-y-1.5">
            {Object.entries(pillars).map(([id, score]) => (
              <PillarBar key={id} id={id} score={score as number} />
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {risks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Risks
            </p>
            <ul className="space-y-1">
              {risks.map((r, i) => <li key={i} className="text-xs text-text-secondary">• {r}</li>)}
            </ul>
          </div>
        )}
        {opps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Opportunities
            </p>
            <ul className="space-y-1">
              {opps.map((o, i) => <li key={i} className="text-xs text-text-secondary">• {o}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export function AseanDashboardPage() {
  const [scenario, setScenario] = useState('')
  const [kgQuery, setKgQuery] = useState('ASEAN')
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null)

  const { data: kgEntities = [], refetch: refetchKg } = useQuery({
    queryKey: ['kg', kgQuery],
    queryFn: () => fetchKnowledgeGraph(kgQuery),
    staleTime: 30_000,
  })

  const simulate = useMutation({
    mutationFn: () => runSimulation(scenario, []),
    onSuccess: (data) => setSimResult(data),
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-lighter text-primary text-xs font-semibold uppercase tracking-wider rounded-official mb-3">
          <Globe className="w-3.5 h-3.5" /> ASEAN Intelligence
        </div>
        <h1 className="text-3xl font-display font-bold text-text mb-2">ASEAN Policy Dashboard</h1>
        <p className="text-text-secondary">RDTII pillar tracking, policy simulation, and knowledge graph</p>
      </div>

      {/* RDTII Pillar Scores */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-text">RDTII Pillar Baseline Scores</h2>
          <span className="ml-auto text-xs text-text-tertiary">ASEAN DTS Roadmap · Perpres 195/2024</span>
        </div>
        <div className="space-y-3">
          {Object.entries(BASELINE_RDTII).map(([id, score]) => (
            <PillarBar key={id} id={id} score={score} />
          ))}
        </div>
      </section>

      {/* Policy Simulator */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-text">Policy Scenario Simulator</h2>
        </div>
        <div className="flex gap-3">
          <textarea
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            placeholder="Describe an ASEAN policy scenario to simulate... e.g. 'ASEAN unified digital payment framework adopted by all 10 member states in 2026'"
            className="flex-1 min-h-[80px] px-3 py-2 text-sm border border-border rounded-lg bg-bg-surface focus:outline-none focus:border-primary resize-none"
          />
          <button
            onClick={() => simulate.mutate()}
            disabled={!scenario.trim() || simulate.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 self-start"
          >
            {simulate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Simulate
          </button>
        </div>
        {simResult && <SimulatorResult result={simResult} />}
      </section>

      {/* Knowledge Graph */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-green" />
          <h2 className="font-semibold text-text">Policy Knowledge Graph</h2>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={kgQuery}
            onChange={e => setKgQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && refetchKg()}
            placeholder="Search entities..."
            className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-bg-surface focus:outline-none focus:border-primary"
          />
          <button onClick={() => refetchKg()}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-surface transition-colors">
            Search
          </button>
        </div>
        {kgEntities.length === 0 ? (
          <p className="text-sm text-text-tertiary">No entities found. Generate briefs to populate the knowledge graph.</p>
        ) : (
          <div className="space-y-2">
            {kgEntities.map((entity: Record<string, unknown>, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-bg-surface rounded-lg">
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded font-mono">
                  {entity.type as string}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{entity.name as string}</p>
                  {(entity.relations as unknown[])?.length > 0 && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {(entity.relations as Array<{ target: string; relation: string }>)
                        .slice(0, 3).map(r => `→ ${r.target} (${r.relation})`).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
