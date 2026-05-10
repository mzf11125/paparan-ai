import type { Paparan, Source } from '@/types/paparan'
import { BRAND_NAME } from '@/constants/brand'

export type CitationStyle = 'apa' | 'chicago' | 'mla'

const SITE_NAME = BRAND_NAME

function formatDate(d: string | Date, style: CitationStyle): string {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  switch (style) {
    case 'apa':
      return `(${date.getFullYear()}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})`
    case 'chicago':
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    case 'mla':
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '')
  }
}

/** Format a single brief as a citation. */
export function formatBriefCitation(brief: Paparan, style: CitationStyle): string {
  const date = formatDate(brief.date, style)
  switch (style) {
    case 'apa':
      return `${SITE_NAME}. ${date}. ${brief.title}. ${SITE_NAME}.`
    case 'chicago':
      return `"${brief.title}." ${SITE_NAME}, ${date}.`
    case 'mla':
      return `"${brief.title}." ${SITE_NAME}, ${date}.`
  }
}

/** Format a single source as a citation. */
export function formatSourceCitation(source: Source, style: CitationStyle): string {
  const date = formatDate(source.date, style)
  switch (style) {
    case 'apa':
      return `${date}. ${source.title}.${source.url ? ` ${source.url}` : ''}`
    case 'chicago':
      return `"${source.title}." ${date}.${source.url ? ` ${source.url}.` : ''}`
    case 'mla':
      return `"${source.title}." ${date}.${source.url ? ` Web. <${source.url}>.` : ''}`
  }
}

/** Format the brief plus all sources as a multi-line bibliography. */
export function formatBibliography(brief: Paparan, style: CitationStyle): string {
  const lines: string[] = []
  lines.push(formatBriefCitation(brief, style))
  if (brief.sources?.length) {
    lines.push('') // blank separator
    lines.push('Sources:')
    for (const s of brief.sources) {
      lines.push(`  · ${formatSourceCitation(s, style)}`)
    }
  }
  return lines.join('\n')
}

export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa:     'APA',
  chicago: 'Chicago',
  mla:     'MLA',
}
