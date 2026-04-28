const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('sb-token') || ''
}

async function downloadFile(url: string, method: string, body: object | null, filename: string) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl; a.download = filename; a.click()
  URL.revokeObjectURL(objectUrl)
}

export const exportService = {
  downloadPdf: (briefId: string) =>
    downloadFile(`${API}/api/briefs/${briefId}/export/pdf`, 'GET', null, `brief-${briefId}.pdf`),

  downloadPptx: (briefId: string) =>
    downloadFile(`${API}/api/briefs/${briefId}/export/pptx`, 'GET', null, `brief-${briefId}.pptx`),

  downloadDiplomatPdf: (briefId: string, to: string, fromName: string, ref: string, distribution: string[]) =>
    downloadFile(
      `${API}/api/briefs/${briefId}/export/diplomat-pdf`, 'POST',
      { to, from_name: fromName, ref, distribution },
      `diplomat-${ref}.pdf`
    ),

  recordOutcome: async (briefId: string, rating: number, notes: string, actionTaken: boolean) => {
    const res = await fetch(`${API}/api/briefs/${briefId}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ rating, outcome_notes: notes, action_taken: actionTaken }),
    })
    return res.json()
  },

  synthesize: async (briefIds: string[]) => {
    const res = await fetch(`${API}/api/briefs/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ brief_ids: briefIds }),
    })
    return res.json()
  },
}
