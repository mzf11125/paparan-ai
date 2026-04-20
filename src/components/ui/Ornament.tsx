import { cn } from '@/utils/formatters'

/**
 * Ornament — Decorative elements and borders
 *
 * Provides refined decorative elements that add
 * sophistication and authority to the interface.
 */

interface OrnamentProps {
  className?: string
}

/**
 * CornerOrnament — Decorative corner elements
 *
 * Adds elegant corner ornaments to cards and sections.
 */
interface CornerOrnamentProps extends OrnamentProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'all'
  size?: 'sm' | 'md' | 'lg'
  color?: 'gold' | 'subtle'
}

export function CornerOrnament({
  position = 'top-left',
  size = 'md',
  color = 'gold',
  className = '',
}: CornerOrnamentProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const colorStyles = {
    gold: 'border-[#C8A96A]',
    subtle: 'border-[#E8E4DC]',
  }

  const renderCorner = (pos: string) => {
    const baseClass = cn('absolute border-2', sizeStyles[size], colorStyles[color])

    switch (pos) {
      case 'top-left':
        return (
          <>
            <div className={cn(baseClass, 'top-0 left-0 border-r-0 border-b-0')} />
            <div className={cn(baseClass, 'top-1 left-1 border-r-0 border-b-0 opacity-40')} />
          </>
        )
      case 'top-right':
        return (
          <>
            <div className={cn(baseClass, 'top-0 right-0 border-l-0 border-b-0')} />
            <div className={cn(baseClass, 'top-1 right-1 border-l-0 border-b-0 opacity-40')} />
          </>
        )
      case 'bottom-left':
        return (
          <>
            <div className={cn(baseClass, 'bottom-0 left-0 border-r-0 border-t-0')} />
            <div className={cn(baseClass, 'bottom-1 left-1 border-r-0 border-t-0 opacity-40')} />
          </>
        )
      case 'bottom-right':
        return (
          <>
            <div className={cn(baseClass, 'bottom-0 right-0 border-l-0 border-t-0')} />
            <div className={cn(baseClass, 'bottom-1 right-1 border-l-0 border-t-0 opacity-40')} />
          </>
        )
      default:
        return null
    }
  }

  if (position === 'all') {
    return (
      <div className={cn('absolute inset-0 pointer-events-none', className)}>
        {renderCorner('top-left')}
        {renderCorner('top-right')}
        {renderCorner('bottom-left')}
        {renderCorner('bottom-right')}
      </div>
    )
  }

  return (
    <div className={cn('absolute pointer-events-none', className)}>
      {renderCorner(position)}
    </div>
  )
}

/**
 * SideAccent — Decorative side accent line
 *
 * Adds a refined accent line to the side of content.
 */
interface SideAccentProps extends OrnamentProps {
  position?: 'left' | 'right' | 'top' | 'bottom'
  thickness?: 'thin' | 'medium' | 'thick'
  color?: 'gold' | 'subtle'
}

export function SideAccent({
  position = 'left',
  thickness = 'medium',
  color = 'gold',
  className = '',
}: SideAccentProps) {
  const thicknessStyles = {
    thin: 'w-0.5',
    medium: 'w-1',
    thick: 'w-2',
  }

  const colorStyles = {
    gold: 'bg-gradient-to-b from-[#C8A96A] via-[#D4B87A] to-[#C8A96A]',
    subtle: 'bg-gradient-to-b from-[#E8E4DC] via-[#D4D0C8] to-[#E8E4DC]',
  }

  const positionStyles = {
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0',
    top: 'top-0 left-0 right-0 h-0.5',
    bottom: 'bottom-0 left-0 right-0 h-0.5',
  }

  if (position === 'top' || position === 'bottom') {
    return (
      <div
        className={cn(
          'absolute',
          position === 'top' ? 'top-0' : 'bottom-0',
          'left-0 right-0',
          color === 'gold' ? 'h-0.5 bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent' : 'h-px bg-[#E8E4DC]',
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'absolute',
        positionStyles[position],
        thicknessStyles[thickness],
        colorStyles[color],
        className
      )}
    />
  )
}

/**
 * DecorativeDivider — Elegant section divider
 *
 * Creates ornamental dividers between sections.
 */
interface DecorativeDividerProps extends OrnamentProps {
  variant?: 'gold-line' | 'diamond' | 'double' | 'fade'
  fullWidth?: boolean
}

export function DecorativeDivider({
  variant = 'gold-line',
  fullWidth = false,
  className = '',
}: DecorativeDividerProps) {
  const containerClass = fullWidth ? 'w-full' : 'max-w-md mx-auto'

  return (
    <div className={cn(containerClass, 'my-8', className)}>
      {variant === 'gold-line' && (
        <div className="relative h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#C8A96A] rotate-45" />
        </div>
      )}

      {variant === 'diamond' && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#E8E4DC]" />
          <div className="w-2 h-2 bg-[#C8A96A] rotate-45" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#E8E4DC]" />
        </div>
      )}

      {variant === 'double' && (
        <div className="flex gap-2">
          <div className="flex-1 h-px bg-[#C8A96A]/50" />
          <div className="flex-1 h-px bg-[#C8A96A]/30" />
        </div>
      )}

      {variant === 'fade' && (
        <div className="h-px bg-gradient-to-r from-transparent via-[#E8E4DC]/50 to-transparent" />
      )}
    </div>
  )
}

/**
 * GoldUnderline — Decorative text underline
 *
 * Adds an elegant gold underline to headings.
 */
interface GoldUnderlineProps {
  className?: string
  position?: 'center' | 'left' | 'right'
  length?: 'short' | 'medium' | 'full'
}

export function GoldUnderline({
  className = '',
  position = 'center',
  length = 'short',
}: GoldUnderlineProps) {
  const lengthStyles = {
    short: 'w-16',
    medium: 'w-24',
    full: 'w-full',
  }

  const positionStyles = {
    center: 'mx-auto',
    left: 'ml-0',
    right: 'ml-auto',
  }

  return (
    <div
      className={cn(
        'h-0.5 bg-gradient-to-r from-[#C8A96A] via-[#D4B87A] to-[#C8A96A]',
        lengthStyles[length],
        positionStyles[position],
        'mt-4',
        className
      )}
    />
  )
}

/**
 * SectionHeader — Styled section header with ornament
 *
 * Complete section header component with title and decorative element.
 */
interface SectionHeaderProps {
  title: string
  subtitle?: string
  variant?: 'default' | 'centered' | 'with-accent'
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  variant = 'default',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-8', variant === 'centered' && 'text-center', className)}>
      <h2 className="font-display font-bold text-display-xs text-text mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body-md text-text-secondary max-w-2xl">
          {subtitle}
        </p>
      )}
      {(variant === 'with-accent' || variant === 'centered') && (
        <div className={cn(
          'w-12 h-0.5 bg-[#C8A96A] mt-4',
          variant === 'centered' && 'mx-auto'
        )} />
      )}
    </div>
  )
}

/**
 * BorderGlow — Animated border glow effect
 *
 * Creates a subtle animated glow on the border of an element.
 */
interface BorderGlowProps extends OrnamentProps {
  color?: 'gold' | 'blue' | 'green'
  intensity?: 'subtle' | 'medium' | 'strong'
}

export function BorderGlow({
  color = 'gold',
  intensity = 'subtle',
  className = '',
}: BorderGlowProps) {
  const colorStyles = {
    gold: 'shadow-[0_0_20px_rgba(200,169,106,0.3)]',
    blue: 'shadow-[0_0_20px_rgba(46,92,138,0.3)]',
    green: 'shadow-[0_0_20px_rgba(45,122,77,0.3)]',
  }

  const intensityStyles = {
    subtle: 'opacity-60',
    medium: 'opacity-80',
    strong: 'opacity-100',
  }

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-inherit pointer-events-none transition-opacity duration-500',
        colorStyles[color],
        intensityStyles[intensity],
        className
      )}
    />
  )
}

/**
 * Watermark — Subtle background watermark
 *
 * Adds a subtle watermark text or pattern to the background.
 */
interface WatermarkProps {
  text?: string
  opacity?: number
  className?: string
}

export function Watermark({
  text = 'PAPARAN',
  opacity = 0.03,
  className = '',
}: WatermarkProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center pointer-events-none select-none',
        className
      )}
      style={{ opacity }}
    >
      <span className="font-display font-bold text-[20vw] text-[#C8A96A] whitespace-nowrap">
        {text}
      </span>
    </div>
  )
}

/**
 * CardFrame — Decorative card frame
 *
 * Adds a refined decorative frame around card content.
 */
interface CardFrameProps extends OrnamentProps {
  children: React.ReactNode
  variant?: 'gold' | 'subtle' | 'none'
  hover?: boolean
}

export function CardFrame({
  children,
  variant = 'gold',
  hover = false,
  className = '',
}: CardFrameProps) {
  const variantStyles = {
    gold: 'border-[#C8A96A]/30 hover:border-[#C8A96A]/60',
    subtle: 'border-[#E8E4DC] hover:border-[#D4D0C8]',
    none: 'border-transparent',
  }

  return (
    <div
      className={cn(
        'relative p-6 bg-bg-elevated border rounded-radius-xl transition-all duration-300',
        variantStyles[variant],
        hover && 'hover:shadow-layered-md hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  )
}
