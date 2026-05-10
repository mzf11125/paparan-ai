import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, RefreshCw, Sparkles, FileText } from 'lucide-react'
import { apiClient } from '@/services/api'
import { cn } from '@/utils/cn'
import { usePageMeta } from '@/hooks/usePageMeta'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: SourceReference[]
  error?: boolean
  timestamp: Date
}

interface SourceReference {
  id: string
  title: string
  url?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  excerpt?: string
}

const SUGGESTED_QUERIES = [
  { category: 'Policy Research', queries: [
    'What are the latest OJK regulations on digital banking?',
    'Summarize ASEAN trade policy developments this month',
    "What is Bank Indonesia's current monetary policy stance?",
  ]},
  { category: 'Brief Analysis', queries: [
    "Compare briefs about Indonesia's digital economy",
    'Show me escalated developments in Southeast Asia',
    'What are the high-impact risks in my briefs?',
  ]},
  { category: 'Source Verification', queries: [
    'Verify claims about recent trade agreements',
    'Find primary sources for Indonesia energy policy',
    'Cross-reference recent regulatory announcements',
  ]},
]

const CONF_STYLES: Record<string, string> = {
  HIGH:   'bg-success/10 text-success border-success/20',
  MEDIUM: 'bg-warning/10 text-warning border-warning/20',
  LOW:    'bg-error/10 text-error border-error/20',
}

export function ChatPage() {
  usePageMeta({ title: 'AI Chat' })
  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return
    setShowSuggestions(false)

    const userMsg: Message = {
      id: `u-${Date.now()}`, role: 'user', content: content.trim(), timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await apiClient.post('/api/chat', {
        message: content.trim(),
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      })
      const data = await (response as Response).json()
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant',
        content: data.response || data.message || 'No response received.',
        sources: data.sources || [],
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: 'assistant',
        content: 'Unable to connect to the intelligence assistant. Please ensure the backend is running.',
        error: true, timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-4 border-b border-border bg-bg-elevated/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-text">Intelligence Assistant</h1>
              <p className="text-xs text-text-secondary font-ui">Conversational RAG · Policy Research</p>
            </div>
          </div>
          <button
            onClick={() => { setMessages([]); setShowSuggestions(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong text-xs font-ui font-medium transition-all duration-150"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-6">
        {messages.length === 0 && showSuggestions ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Welcome */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-text mb-2">Intelligence Assistant</h2>
              <p className="text-text-secondary text-sm font-ui max-w-md mx-auto">
                Ask questions about ASEAN policy, analyze briefs, or research regulatory developments.
              </p>
            </div>

            {/* Suggestions */}
            <div className="grid md:grid-cols-3 gap-4">
              {SUGGESTED_QUERIES.map(({ category, queries }) => (
                <div key={category} className="surface-card p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui mb-3">{category}</h3>
                  <div className="space-y-2">
                    {queries.map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left text-xs text-text-secondary hover:text-primary p-2 rounded-lg hover:bg-primary/5 transition-all duration-150 font-ui leading-relaxed"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                  msg.role === 'user'
                    ? 'bg-primary/15 border border-primary/25'
                    : msg.error
                      ? 'bg-error/10 border border-error/20'
                      : 'bg-bg-subtle border border-border'
                )}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-primary" />
                    : <Bot className={cn('w-4 h-4', msg.error ? 'text-error' : 'text-text-secondary')} />}
                </div>

                {/* Bubble */}
                <div className={cn(
                  'flex-1 max-w-[85%]',
                  msg.role === 'user' && 'flex flex-col items-end'
                )}>
                  <div className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed font-ui',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : msg.error
                        ? 'bg-error/10 text-error border border-error/20 rounded-tl-sm'
                        : 'bg-bg-elevated border border-border text-text rounded-tl-sm'
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-ui">Sources</p>
                      {msg.sources.map(src => (
                        <div key={src.id} className="flex items-start gap-2 p-2 bg-bg-surface rounded-lg border border-border">
                          <FileText className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-text font-ui truncate">{src.title}</p>
                            {src.excerpt && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{src.excerpt}</p>}
                          </div>
                          <span className={cn('badge border text-[10px] flex-shrink-0', CONF_STYLES[src.confidence])}>
                            {src.confidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-text-muted font-ui mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-bg-subtle border border-border flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-text-secondary" />
                </div>
                <div className="bg-bg-elevated border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-4 border-t border-border bg-bg-elevated/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-bg-surface border border-border rounded-2xl p-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-150">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about ASEAN policy, regulations, or your briefs…"
              rows={1}
              className="flex-1 bg-transparent text-text text-sm font-ui placeholder:text-text-tertiary resize-none outline-none max-h-32 leading-relaxed"
              style={{ minHeight: '24px' }}
              aria-label="Chat input"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-teal"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-text-muted font-ui text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
