/**
 * Domain colour helpers — single source of truth for region / impact /
 * classification / delta / confidence visual encoding.
 *
 * All values resolve to design tokens in tailwind.config.js (no raw hex).
 * Each helper returns { text, bg, border, dot } class strings so the same
 * triple works for badges, banners, cards, and inline tags.
 */

import type {
  Impact,
  Delta,
  Confidence,
  ClassificationLevel,
} from '@/types/paparan'

export type Tone = 'primary' | 'accent' | 'gold' | 'success' | 'warning' | 'error' | 'neutral'

export interface ToneClasses {
  /** Solid text colour (foreground) */
  text: string
  /** 10%-tint background — subtle pill */
  bg: string
  /** 30%-tint border */
  border: string
  /** Solid 1px×1px dot bg (for status indicators) */
  dot: string
  /** Strong solid background — banners, classification strips */
  solid: string
}

const TONES: Record<Tone, ToneClasses> = {
  primary: {
    text:   'text-primary',
    bg:     'bg-primary/10',
    border: 'border-primary/30',
    dot:    'bg-primary',
    solid:  'bg-primary text-bg-elevated',
  },
  accent: {
    text:   'text-accent',
    bg:     'bg-accent/10',
    border: 'border-accent/30',
    dot:    'bg-accent',
    solid:  'bg-accent text-bg-elevated',
  },
  gold: {
    text:   'text-gold',
    bg:     'bg-gold/10',
    border: 'border-gold/30',
    dot:    'bg-gold',
    solid:  'bg-gold text-bg-elevated',
  },
  success: {
    text:   'text-success',
    bg:     'bg-success/10',
    border: 'border-success/30',
    dot:    'bg-success',
    solid:  'bg-success text-bg-elevated',
  },
  warning: {
    text:   'text-warning',
    bg:     'bg-warning/10',
    border: 'border-warning/30',
    dot:    'bg-warning',
    solid:  'bg-warning text-bg-elevated',
  },
  error: {
    text:   'text-error',
    bg:     'bg-error/10',
    border: 'border-error/30',
    dot:    'bg-error',
    solid:  'bg-error text-bg-elevated',
  },
  neutral: {
    text:   'text-text-secondary',
    bg:     'bg-bg-subtle',
    border: 'border-border',
    dot:    'bg-text-tertiary',
    solid:  'bg-text text-bg',
  },
}

/** ───────── Classification ───────── */
const CLASSIFICATION_TONE: Record<ClassificationLevel, Tone> = {
  unclassified: 'success',
  official:     'primary',
  confidential: 'warning',
  secret:       'error',
}
export function classificationTone(level?: ClassificationLevel | string): Tone {
  if (!level) return 'neutral'
  return CLASSIFICATION_TONE[level as ClassificationLevel] ?? 'neutral'
}
export function classificationColors(level?: ClassificationLevel | string): ToneClasses {
  return TONES[classificationTone(level)]
}
export function classificationLabel(level?: ClassificationLevel | string): string {
  if (!level) return 'Unclassified'
  return level.toString().charAt(0).toUpperCase() + level.toString().slice(1)
}

/** ───────── Impact ───────── */
const IMPACT_TONE: Record<Impact, Tone> = {
  HIGH:   'error',
  MEDIUM: 'warning',
  LOW:    'success',
}
export function impactTone(impact?: Impact): Tone {
  if (!impact) return 'neutral'
  return IMPACT_TONE[impact] ?? 'neutral'
}
export function impactColors(impact?: Impact): ToneClasses {
  return TONES[impactTone(impact)]
}

/** ───────── Delta ───────── */
const DELTA_TONE: Record<Delta, Tone> = {
  NEW:            'primary',
  UPDATED:        'warning',
  ESCALATED:      'error',
  'DE-ESCALATED': 'success',
}
export function deltaTone(delta?: Delta): Tone {
  if (!delta) return 'neutral'
  return DELTA_TONE[delta] ?? 'neutral'
}
export function deltaColors(delta?: Delta): ToneClasses {
  return TONES[deltaTone(delta)]
}

/** ───────── Confidence ───────── */
const CONFIDENCE_TONE: Record<Confidence, Tone> = {
  HIGH:   'success',
  MEDIUM: 'warning',
  LOW:    'error',
}
export function confidenceTone(c?: Confidence): Tone {
  if (!c) return 'neutral'
  return CONFIDENCE_TONE[c] ?? 'neutral'
}
export function confidenceColors(c?: Confidence): ToneClasses {
  return TONES[confidenceTone(c)]
}

/** ───────── Region ─────────
 *  Each ASEAN economy gets a deterministic tone so colour reads consistent
 *  across pages. We rotate through the available palette without re-using
 *  the semantic colours (success/warning/error) that carry meaning elsewhere.
 */
const REGION_TONE: Record<string, Tone> = {
  // Canonical ASEAN
  Indonesia:    'primary',
  Malaysia:     'accent',
  Singapore:    'gold',
  Thailand:     'primary',
  Philippines:  'accent',
  Vietnam:      'gold',
  Myanmar:      'accent',
  Cambodia:     'gold',
  Laos:         'primary',
  Brunei:       'accent',

  // Bloc-level / extra
  ASEAN:        'primary',
  'ASEAN-wide': 'primary',
  Global:       'neutral',
  APAC:         'accent',
  EMEA:         'gold',
  Americas:     'accent',
}

const REGION_ABBR: Record<string, string> = {
  Indonesia: 'IDN', Malaysia: 'MYS', Singapore: 'SGP', Thailand: 'THA',
  Philippines: 'PHL', Vietnam: 'VNM', Myanmar: 'MMR', Cambodia: 'KHM',
  Laos: 'LAO', Brunei: 'BRN', ASEAN: 'ASEAN', Global: 'GLB',
  APAC: 'APAC', EMEA: 'EMEA', Americas: 'AME',
}

export function regionTone(region?: string): Tone {
  if (!region) return 'neutral'
  return REGION_TONE[region] ?? 'neutral'
}
export function regionColors(region?: string): ToneClasses {
  return TONES[regionTone(region)]
}
export function regionAbbr(region?: string): string {
  if (!region) return '—'
  return REGION_ABBR[region] ?? region.slice(0, 3).toUpperCase()
}

/** Generic accessor — useful when callers know they want a tone. */
export function toneClasses(tone: Tone): ToneClasses {
  return TONES[tone]
}
