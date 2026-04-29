import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react'
import { apiClient } from '@/services/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? ''

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    let assistantContent = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const token = await apiClient.getToken()
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            assistantContent += line.slice(6)
            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: assistantContent },
            ])
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to connect to chat service. Please try again.'
      setError(errorMessage)
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: errorMessage, error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const retryLast = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      setInput(lastUserMessage.content)
      setMessages(prev => prev.slice(0, -2)) // Remove error and user message
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-serif font-bold text-[#F1F5F9]">Policy Intelligence Chat</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Ask about ASEAN policy developments, news sources, regulations, and uploaded documents.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center text-[#64748B] py-16 space-y-2">
            <Bot className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm">Ask anything about ASEAN policy intelligence</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                'What did OJK announce about crypto regulation?',
                'Latest ASEAN trade policy developments',
                'Bank Indonesia monetary policy 2026',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.12)] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors text-[#94A3B8]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[rgba(59,130,246,0.10)] flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-[#3B82F6]" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#3B82F6] text-white'
                  : msg.error
                    ? 'bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] text-[#EF4444]'
                    : 'bg-[#111318] border border-[rgba(255,255,255,0.12)] text-[#F1F5F9]'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && !msg.error && loading && i === messages.length - 1 && (
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="w-1 h-4 bg-[#3B82F6]/60 animate-pulse" />
                  <span className="w-1 h-4 bg-[#3B82F6]/60 animate-pulse delay-75" />
                  <span className="w-1 h-4 bg-[#3B82F6]/60 animate-pulse delay-150" />
                </span>
              )}
              {msg.error && (
                <button
                  onClick={retryLast}
                  className="flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 bg-[rgba(239,68,68,0.20)] hover:bg-[rgba(239,68,68,0.30)] rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#3B82F6] flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about ASEAN policy..."
          className="flex-1 px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#181B22] text-[#F1F5F9] text-sm focus:outline-none focus:border-[#3B82F6] transition-colors placeholder:text-[#64748B]"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
