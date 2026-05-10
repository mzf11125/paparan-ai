import React from 'react'
import { cn } from '@/utils/cn'

import type { ClassificationLevel } from '@/components/ui/ClassificationBadge'

interface DocumentFrameProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
  showWatermark?: boolean
  watermark?: string | boolean
  classification?: ClassificationLevel
}

export const DocumentFrame = React.forwardRef<HTMLDivElement, DocumentFrameProps>(
  ({ children, className = '', variant = 'default', showWatermark = false, watermark, classification }, ref) => {
    // Determine watermark text
    const watermarkText = watermark === true ? (classification || '').toUpperCase() : (watermark as string) || ''
    const shouldShowWatermark = showWatermark || watermark === true || typeof watermark === 'string'
    const variantStyles = {
      default: 'bg-document-bg border-2 border-document-frame shadow-md',
      elevated: 'bg-document-bg border-2 border-document-frame shadow-lg',
      subtle: 'bg-document-bg border border-border shadow-sm',
    }

    return (
    <div
      ref={ref}
      className={cn(
        'document-frame relative overflow-hidden',
        variantStyles[variant],
        shouldShowWatermark && 'document-watermark',
        className
      )}
      style={
        shouldShowWatermark && watermarkText
          ? { '--watermark-text': `"${watermarkText}"` } as React.CSSProperties
          : undefined
      }
    >
      {/* Inner border for official look */}
      <div className="absolute inset-0 border border-border-strong pointer-events-none" style={{ top: '4px', left: '4px', right: '4px', bottom: '4px' }} />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
})

DocumentFrame.displayName = 'DocumentFrame'

// Document Header with classification
interface DocumentHeaderProps {
  title: string
  classification?: 'unclassified' | 'official' | 'confidential' | 'secret'
  documentNumber?: string
  date?: string
  className?: string
}

export const DocumentHeader = React.forwardRef<HTMLDivElement, DocumentHeaderProps>(
  ({ title, classification = 'unclassified', documentNumber, date, className = '' }, ref) => {
  const classColors = {
    unclassified: 'bg-green-light border-green text-green',
    official: 'bg-primary-light border-primary text-primary',
    confidential: 'bg-amber-light border-amber text-amber',
    secret: 'bg-red-light border-red text-red',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'official-header mb-6',
        className
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={cn(
            'px-2 py-0.5 text-xs font-bold uppercase tracking-wider border rounded',
            classColors[classification]
          )}>
            {classification.toUpperCase()}
          </span>
          {documentNumber && (
            <span className="text-xs text-text-tertiary tabular-nums">
              DOC NO: {documentNumber}
            </span>
          )}
        </div>
        <h1 className="font-display font-bold text-xl text-text">
          {title}
        </h1>
      </div>
      {date && (
        <div className="text-sm text-text-tertiary tabular-nums">
          {date}
        </div>
      )}
    </div>
  )
})

DocumentHeader.displayName = 'DocumentHeader'
