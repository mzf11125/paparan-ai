import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/formatters'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

interface ToastProps {
  id: string
  variant?: ToastVariant
  title?: string
  message: string
  duration?: number
  onClose?: (id: string) => void
  position?: ToastPosition
  showProgress?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-light',
    textColor: 'text-green',
    iconColor: 'text-green',
    borderColor: 'border-green/30',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-light',
    textColor: 'text-red',
    iconColor: 'text-red',
    borderColor: 'border-red/30',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-light',
    textColor: 'text-amber',
    iconColor: 'text-amber',
    borderColor: 'border-amber/30',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-light',
    textColor: 'text-blue',
    iconColor: 'text-blue',
    borderColor: 'border-blue/30',
  },
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

export function Toast({
  id,
  variant = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  showProgress = true,
  action,
}: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)
  const config = variantConfig[variant]
  const Icon = config.icon

  useEffect(() => {
    if (duration > 0) {
      const interval = 10
      const step = 100 / (duration / interval)
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer)
            handleClose()
            return 0
          }
          return prev - step
        })
      }, interval)

      return () => clearInterval(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose?.(id)
    }, 300)
  }

  const handleAction = () => {
    action?.onClick()
    handleClose()
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-radius-lg shadow-lg border min-w-[320px] max-w-md',
        config.bgColor,
        config.textColor,
        config.borderColor,
        'animate-slide-in',
        isExiting && 'animate-fade-out'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1">{title}</p>
        )}
        <p className="text-sm leading-relaxed">{message}</p>
        {action && (
          <button
            onClick={handleAction}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-current opacity-30 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Toast Container for managing multiple toasts
interface ToastContainerProps {
  toasts: Array<{
    id: string
    variant?: ToastVariant
    title?: string
    message: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }>
  onClose: (id: string) => void
  position?: ToastPosition
}

export function ToastContainer({ toasts, onClose, position = 'top-right' }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={onClose}
            position={position}
            action={toast.action}
          />
        </div>
      ))}
    </div>
  )
}

// Toast hook for easy usage
let toastId = 0
const toastListeners = new Set<(toasts: any[]) => void>()
let currentToasts: any[] = []

function notifyToastListeners() {
  toastListeners.forEach((listener) => listener([...currentToasts]))
}

export const toast = {
  success: (message: string, options?: Omit<ToastProps, 'id' | 'message' | 'variant'>) => {
    const id = `toast-${toastId++}`
    const newToast = { ...options, id, message, variant: 'success' as const }
    currentToasts.push(newToast)
    notifyToastListeners()
    if (options?.duration !== 0) {
      setTimeout(() => toast.remove(id), options?.duration || 5000)
    }
    return id
  },
  error: (message: string, options?: Omit<ToastProps, 'id' | 'message' | 'variant'>) => {
    const id = `toast-${toastId++}`
    const newToast = { ...options, id, message, variant: 'error' as const }
    currentToasts.push(newToast)
    notifyToastListeners()
    if (options?.duration !== 0) {
      setTimeout(() => toast.remove(id), options?.duration || 5000)
    }
    return id
  },
  warning: (message: string, options?: Omit<ToastProps, 'id' | 'message' | 'variant'>) => {
    const id = `toast-${toastId++}`
    const newToast = { ...options, id, message, variant: 'warning' as const }
    currentToasts.push(newToast)
    notifyToastListeners()
    if (options?.duration !== 0) {
      setTimeout(() => toast.remove(id), options?.duration || 5000)
    }
    return id
  },
  info: (message: string, options?: Omit<ToastProps, 'id' | 'message' | 'variant'>) => {
    const id = `toast-${toastId++}`
    const newToast = { ...options, id, message, variant: 'info' as const }
    currentToasts.push(newToast)
    notifyToastListeners()
    if (options?.duration !== 0) {
      setTimeout(() => toast.remove(id), options?.duration || 5000)
    }
    return id
  },
  remove: (id: string) => {
    currentToasts = currentToasts.filter((t) => t.id !== id)
    notifyToastListeners()
  },
  clear: () => {
    currentToasts = []
    notifyToastListeners()
  },
}

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([])

  useEffect(() => {
    toastListeners.add(setToasts)
    setToasts([...currentToasts])

    return () => {
      toastListeners.delete(setToasts)
    }
  }, [])

  const remove = (id: string) => {
    toast.remove(id)
  }

  return {
    toasts,
    remove,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    clear: toast.clear,
  }
}

// Toast Provider component
export function Toaster() {
  const { toasts, remove } = useToast()

  return <ToastContainer toasts={toasts} onClose={remove} position="top-right" />
}

// Inline toast for specific use cases
interface InlineToastProps {
  variant?: ToastVariant
  message: string
  onClose?: () => void
  className?: string
}

export function InlineToast({ variant = 'info', message, onClose, className = '' }: InlineToastProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg',
      config.bgColor,
      config.textColor,
      config.borderColor,
      'border',
      className
    )}>
      <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconColor)} />
      <p className="text-sm flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
