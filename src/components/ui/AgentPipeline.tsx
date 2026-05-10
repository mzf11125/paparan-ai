import { Check, Loader2, Circle } from 'lucide-react'
import { cn } from '@/utils/cn'

/* ============================================
   AGENT PIPELINE — PROGRESS INDICATOR
   Shows multi-agent workflow progress
   ============================================ */

export interface AgentStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
  icon?: React.ReactNode
}

interface AgentPipelineProps {
  steps: AgentStep[]
  currentStep?: number
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export function AgentPipeline({
  steps,
  currentStep = 0,
  orientation = 'horizontal',
  size = 'md',
  showLabels = true,
  className,
}: AgentPipelineProps) {
  const sizeStyles = {
    sm: { step: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-xs', gap: 'gap-2' },
    md: { step: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-3' },
    lg: { step: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base', gap: 'gap-4' },
  }

  const styles = sizeStyles[size]

  const getStepStatus = (index: number): AgentStep['status'] => {
    if (index < currentStep) return 'completed'
    if (index === currentStep) return steps[index]?.status || 'running'
    return 'pending'
  }

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-start gap-4',
        className
      )}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index)
        const isRunning = status === 'running'
        const isCompleted = status === 'completed'
        const isError = status === 'error'

        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center',
              orientation === 'horizontal' ? styles.gap : 'gap-3',
              'flex-1',
              index === steps.length - 1 && 'flex-none'
            )}
          >
            {/* Step Icon */}
            <div
              className={cn(
                'flex-shrink-0',
                'rounded-full',
                'border-2',
                'flex',
                'items-center',
                'justify-center',
                'transition-all',
                'duration-300',
                styles.step,
                isCompleted && 'bg-unclassified border-unclassified',
                isRunning && 'bg-primary border-primary',
                isError && 'bg-secret border-secret',
                status === 'pending' && 'border-border bg-surface'
              )}
            >
              {isCompleted ? (
                <Check className={cn('text-white', styles.icon)} />
              ) : isRunning ? (
                <Loader2 className={cn('text-white animate-spin', styles.icon)} />
              ) : isError ? (
                <Circle className={cn('text-white fill-current', styles.icon)} />
              ) : (
                <span
                  className={cn(
                    'font-ui',
                    'font-semibold',
                    'text-text-tertiary',
                    styles.text
                  )}
                >
                  {index + 1}
                </span>
              )}
            </div>

            {/* Step Info */}
            {showLabels && (
              <div className={cn('flex-1 min-w-0', orientation === 'vertical' && 'ml-2')}>
                <p
                  className={cn(
                    'font-ui',
                    'font-medium',
                    'truncate',
                    isCompleted && 'text-text',
                    isRunning && 'text-text',
                    isError && 'text-secret',
                    status === 'pending' && 'text-text-tertiary',
                    styles.text
                  )}
                >
                  {step.name}
                </p>
                {isRunning && step.message && (
                  <p
                    className={cn(
                      'font-ui',
                      'text-xs',
                      'text-text-secondary',
                      'truncate',
                      'animate-pulse'
                    )}
                  >
                    {step.message}
                  </p>
                )}
                {isError && step.message && (
                  <p className="font-ui text-xs text-secret truncate">
                    {step.message}
                  </p>
                )}
              </div>
            )}

            {/* Connector Line */}
            {index < steps.length - 1 && orientation === 'horizontal' && (
              <div
                className={cn(
                  'flex-1 h-0.5',
                  'transition-all',
                  'duration-300',
                  index < currentStep ? 'bg-unclassified' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ============================================
   COMPACT AGENT STATUS — MINIMAL VERSION
   ============================================ */

interface AgentStatusProps {
  steps: AgentStep[]
  currentStep: number
  className?: string
}

export function AgentStatus({ steps, currentStep, className }: AgentStatusProps) {
  const completed = currentStep
  const total = steps.length
  const percent = Math.round((completed / total) * 100)

  const currentStepData = steps[currentStep]

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-ui text-xs font-medium text-text-secondary tabular-nums">
          {percent}%
        </span>
      </div>

      {/* Current Step */}
      {currentStepData && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="font-ui text-sm text-text-secondary">
            {currentStepData.name}
            {currentStepData.message && (
              <span className="text-text-tertiary"> — {currentStepData.message}</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
