import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  success: { bg: 'bg-bg-overlay', border: 'border-success/25', icon: CheckCircle,    iconColor: 'text-success' },
  error:   { bg: 'bg-bg-overlay', border: 'border-error/25',   icon: AlertCircle,    iconColor: 'text-error' },
  warning: { bg: 'bg-bg-overlay', border: 'border-warning/25', icon: AlertTriangle,  iconColor: 'text-warning' },
  info:    { bg: 'bg-bg-overlay', border: 'border-primary/25', icon: Info,           iconColor: 'text-primary' },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const { bg, border, icon: Icon, iconColor } = TOAST_STYLES[toast.type]

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10)
    // Auto-dismiss
    const duration = toast.duration ?? 4000
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, duration)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full',
        'transition-all duration-300',
        bg, border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text font-ui">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-secondary font-ui mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        className="p-0.5 rounded text-text-tertiary hover:text-text transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// Standalone toast trigger (for use outside context). Set by Toaster on mount.
const globalAddToast: { current: ((toast: Omit<Toast, 'id'>) => void) | null } = { current: null }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    globalAddToast.current = addToast
    return () => { globalAddToast.current = null }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {/* Portal */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function toast(options: Omit<Toast, 'id'>) {
  globalAddToast.current?.(options)
}

toast.success = (title: string, message?: string) => toast({ type: 'success', title, message })
toast.error   = (title: string, message?: string) => toast({ type: 'error',   title, message })
toast.warning = (title: string, message?: string) => toast({ type: 'warning', title, message })
toast.info    = (title: string, message?: string) => toast({ type: 'info',    title, message })
