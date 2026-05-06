/**
 * Central API client — injects Supabase auth token into every request.
 * Falls back gracefully when backend is unreachable.
 */
import { supabase } from '@/lib/supabase'

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(err)
  }
  return res.json()
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  /** POST to an SSE endpoint; resolves with the first `done` event's data */
  postStream: async <T>(path: string, body: unknown): Promise<T> => {
    const token = await getToken()
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(err)
    }
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = JSON.parse(line.slice(6)) as { type: string; data?: T; message?: string }
        if (payload.type === 'error') throw new Error(payload.message ?? 'Generation failed')
        if (payload.type === 'chunk' && payload.data) return payload.data
      }
    }
    throw new Error('Stream ended without data')
  },
  getToken,
}
