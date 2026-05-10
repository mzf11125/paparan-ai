// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch (fallbackErr) {
      console.error('Failed to copy:', fallbackErr)
      return false
    }
  }
}

// Format brief as plain text for copying
export function formatBriefAsText(brief: {
  title: string
  date: string
  region: string
  executiveSummary: string[]
  currentSituation: string
  developments: Array<{ impact: string; type: string; text: string }>
  implications: string
  risks: string[]
  opportunities: string[]
  actions: Array<{ text: string; priority: string }>
  sources: Array<{ title: string; url?: string }>
}): string {
  let text = `PAPARANBRIEF — ${brief.title}\n`
  text += `${brief.region} • ${brief.date}\n`
  text += `${'='.repeat(50)}\n\n`

  text += `EXECUTIVE SUMMARY\n`
  text += `${'-'.repeat(50)}\n`
  brief.executiveSummary.forEach((point, i) => {
    text += `${i + 1}. ${point}\n`
  })
  text += `\n`

  text += `CURRENT SITUATION\n`
  text += `${'-'.repeat(50)}\n`
  text += `${brief.currentSituation}\n\n`

  text += `KEY DEVELOPMENTS\n`
  text += `${'-'.repeat(50)}\n`
  brief.developments.forEach((dev, i) => {
    text += `${i + 1}. [${dev.type}] [${dev.impact}] ${dev.text}\n`
  })
  text += `\n`

  text += `STRATEGIC IMPLICATIONS\n`
  text += `${'-'.repeat(50)}\n`
  text += `${brief.implications}\n\n`

  text += `RISKS\n`
  text += `${'-'.repeat(50)}\n`
  brief.risks.forEach((risk, i) => {
    text += `${i + 1}. ${risk}\n`
  })
  text += `\n`

  text += `OPPORTUNITIES\n`
  text += `${'-'.repeat(50)}\n`
  brief.opportunities.forEach((opp, i) => {
    text += `${i + 1}. ${opp}\n`
  })
  text += `\n`

  text += `RECOMMENDED ACTIONS\n`
  text += `${'-'.repeat(50)}\n`
  brief.actions.forEach((action, i) => {
    text += `${i + 1}. [${action.priority}] ${action.text}\n`
  })
  text += `\n`

  text += `SOURCES\n`
  text += `${'-'.repeat(50)}\n`
  brief.sources.forEach((source, i) => {
    text += `${i + 1}. ${source.title}`
    if (source.url) {
      text += `\n   ${source.url}`
    }
    text += `\n`
  })

  return text
}
