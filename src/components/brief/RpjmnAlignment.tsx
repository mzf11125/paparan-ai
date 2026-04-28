import { cn } from '@/utils/formatters'

interface RpjmnAlignmentProps {
  alignment: Record<string, Record<string, number>>
  className?: string
}

const PILLAR_LABELS: Record<string, string> = {
  AC1: 'Ideologi Pancasila',
  AC2: 'Pertahanan & Keamanan',
  AC3: 'Lapangan Kerja',
  AC4: 'Pembangunan Desa',
  AC5: 'Hilirisasi & Industri',
  AC6: 'Pemerataan Ekonomi',
  AC7: 'Reformasi Birokrasi',
  AC8: 'Harmoni & Inovasi',
}

const RDTII_LABELS: Record<string, string> = {
  P1: 'Trade Facilitation', P2: 'Digital Infrastructure',
  P3: 'Payments & Fintech', P4: 'E-Commerce',
  P5: 'Data Governance', P6: 'Cybersecurity',
  P7: 'Digital Inclusion',
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.round(score * 100)
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 text-text-secondary truncate font-ui text-xs">{label}</span>
      <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-text-tertiary">{pct}%</span>
    </div>
  )
}

export function RpjmnAlignment({ alignment, className }: RpjmnAlignmentProps) {
  const rpjmn = alignment?.rpjmn || {}
  const rdtii = alignment?.rdtii || {}

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 font-ui">
          RPJMN 2025–2029 Asta Cita Alignment
        </h4>
        <div className="space-y-2">
          {Object.entries(rpjmn).map(([id, score]) => (
            <ScoreBar
              key={id}
              label={PILLAR_LABELS[id] || id}
              score={score as number}
              color={(score as number) > 0.6 ? 'bg-primary' : (score as number) > 0.3 ? 'bg-amber' : 'bg-border'}
            />
          ))}
        </div>
      </div>
      {Object.keys(rdtii).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3 font-ui">
            RDTII Pillar Relevance
          </h4>
          <div className="space-y-2">
            {Object.entries(rdtii).map(([id, score]) => (
              <ScoreBar
                key={id}
                label={RDTII_LABELS[id] || id}
                score={score as number}
                color={(score as number) > 0.6 ? 'bg-accent' : (score as number) > 0.3 ? 'bg-green' : 'bg-border'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
