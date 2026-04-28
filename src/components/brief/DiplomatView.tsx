import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Download, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { Paparan } from '@/types/paparan'
import { cn } from '@/utils/formatters'

interface DiplomatViewProps {
  brief: Paparan
  onClose: () => void
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Fetch K/L codes for distribution list
async function fetchKlCodes() {
  const res = await fetch(`${API}/api/bappenas/references/kl-codes`)
  if (!res.ok) return []
  return res.json()
}

export function DiplomatView({ brief, onClose }: DiplomatViewProps) {
  const [to, setTo] = useState('')
  const [fromName, setFromName] = useState('Paparan Intelligence Unit')
  const [distribution, setDistribution] = useState<string[]>([])
  const [showTalkingPoints, setShowTalkingPoints] = useState(false)
  const [talkingPoints, setTalkingPoints] = useState<string[]>([])
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const { data: klCodes = [] } = useQuery({
    queryKey: ['kl-codes'],
    queryFn: fetchKlCodes,
    staleTime: Infinity,
  })

  const refNo = `PAP-${new Date().getFullYear()}-${brief.id.slice(-4).toUpperCase()}`
  const highActions = brief.actions.filter(a => a.priority === 'HIGH')

  const handleDownloadPdf = async () => {
    const token = localStorage.getItem('sb-token') || ''
    const res = await fetch(`${API}/api/briefs/${brief.id}/export/diplomat-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, from_name: fromName, ref: refNo, distribution }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `diplomat-${refNo}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleTalkingPoints = async () => {
    setLoadingPoints(true)
    const token = localStorage.getItem('sb-token') || ''
    const res = await fetch(`${API}/api/briefs/${brief.id}/talking-points`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setTalkingPoints(data.talking_points || [])
    }
    setLoadingPoints(false)
    setShowTalkingPoints(true)
  }

  const handleAcknowledge = async () => {
    const token = localStorage.getItem('sb-token') || ''
    await fetch(`${API}/api/briefs/${brief.id}/acknowledge?acknowledged_by=${encodeURIComponent(to || 'Unknown')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    setAcknowledged(true)
  }

  const toggleDistribution = (name: string) => {
    setDistribution(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name])
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl print:shadow-none print:rounded-none">
        {/* Screen-only controls */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 no-print">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Diplomat Briefing View</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={handleAcknowledge}
              disabled={acknowledged}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors',
                acknowledged ? 'bg-green/20 text-green border border-green' : 'border border-border hover:bg-bg-surface'
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {acknowledged ? 'Acknowledged' : 'Mark Acknowledged'}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Memo content */}
        <div className="p-8 print:p-12">
          {/* Classification banner top */}
          <div className="bg-primary text-white text-center py-1.5 text-xs font-bold uppercase tracking-widest mb-6 print:mb-8">
            {'— '.repeat(6)}{brief.classification?.toUpperCase()}{'— '.repeat(6)}
          </div>

          {/* Memo header */}
          <div className="border border-gray-300 rounded p-4 mb-6 space-y-2 text-sm">
            {[
              { label: 'TO', value: to, editable: true, setter: setTo, placeholder: 'H.E. Minister / Director General...' },
              { label: 'FROM', value: fromName, editable: true, setter: setFromName, placeholder: 'Sender name / unit' },
            ].map(({ label, value, editable, setter, placeholder }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="w-24 font-bold text-gray-500 uppercase text-xs pt-1.5">{label}:</span>
                {editable ? (
                  <input
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 border-b border-dashed border-gray-300 focus:outline-none focus:border-primary text-gray-800 bg-transparent no-print-border print:border-none"
                  />
                ) : (
                  <span className="flex-1 text-gray-800">{value}</span>
                )}
              </div>
            ))}
            {[
              { label: 'SUBJECT', value: brief.title },
              { label: 'DATE', value: brief.date },
              { label: 'REF', value: refNo },
              { label: 'CLASSIFICATION', value: brief.classification?.toUpperCase() },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="w-24 font-bold text-gray-500 uppercase text-xs pt-0.5">{label}:</span>
                <span className="flex-1 text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Executive Summary</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 mb-6">
            {brief.executiveSummary.slice(0, 3).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>

          {/* High priority actions */}
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Recommended Actions (High Priority)</h3>
          <ul className="space-y-1.5 text-sm text-gray-700 mb-6">
            {(highActions.length ? highActions : brief.actions.slice(0, 3)).map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">→</span>
                <span>{a.text}{a.owner ? ` (${a.owner})` : ''}{a.deadline ? ` · ${a.deadline}` : ''}</span>
              </li>
            ))}
          </ul>

          {/* Distribution list */}
          <div className="mb-6 no-print">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Distribution List</h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {klCodes.slice(0, 30).map((kl: { code: string; name: string }) => (
                <button
                  key={kl.code}
                  onClick={() => toggleDistribution(kl.name)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition-colors',
                    distribution.includes(kl.name)
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 text-gray-600 hover:border-primary'
                  )}
                >
                  {kl.code}: {kl.name.replace('Kementrian ', 'Kemen. ')}
                </button>
              ))}
            </div>
            {distribution.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">Selected: {distribution.join(' · ')}</p>
            )}
          </div>

          {/* Print-only distribution */}
          {distribution.length > 0 && (
            <div className="hidden print:block mb-6 text-xs text-gray-500 border-t pt-3">
              <strong>DISTRIBUTION:</strong> {distribution.join(' · ')}
            </div>
          )}

          {/* Talking points (collapsible) */}
          <div className="mb-6 no-print">
            <button
              onClick={talkingPoints.length ? () => setShowTalkingPoints(!showTalkingPoints) : handleTalkingPoints}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent-dark transition-colors"
              disabled={loadingPoints}
            >
              {showTalkingPoints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {loadingPoints ? 'Generating...' : 'Talking Points & Counterarguments'}
            </button>
            {showTalkingPoints && talkingPoints.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                {talkingPoints.map((pt, i) => (
                  <li key={i} className={cn('flex items-start gap-2', pt.startsWith('Counter:') && 'text-amber')}>
                    <span className="font-bold mt-0.5">{pt.startsWith('Counter:') ? '⚠' : '•'}</span>
                    <span>{pt.replace('Counter: ', '')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 flex items-center justify-between">
            <span>Prepared by Paparan Policy Intelligence System</span>
            <span>{brief.source_count || brief.sources.length} sources · {brief.confidence_score || 'MEDIUM'} confidence</span>
          </div>

          {/* Classification banner bottom */}
          <div className="bg-primary text-white text-center py-1.5 text-xs font-bold uppercase tracking-widest mt-6">
            {'— '.repeat(6)}{brief.classification?.toUpperCase()}{'— '.repeat(6)}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(.fixed) { display: none !important; }
          .no-print { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}
