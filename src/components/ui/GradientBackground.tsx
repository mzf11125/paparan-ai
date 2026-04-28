import { cn } from '@/utils/formatters'

interface GradientBackgroundProps {
  variant?: 'warm' | 'gold' | 'gold-subtle' | 'mesh' | 'radial' | 'dark'
  intensity?: 'subtle' | 'medium' | 'strong'
  animated?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * GradientBackground — Atmospheric gradient backgrounds
 *
 * Provides refined, atmospheric gradient backgrounds that add
 * depth and warmth to any section. Supports multiple variants
 * and optional animation.
 */
export function GradientBackground({
  variant = 'warm',
  intensity = 'subtle',
  animated = false,
  className = '',
  children,
}: GradientBackgroundProps) {
  const variantStyles: Record<typeof variant, string> = {
    warm: 'from-[#FAFAF8] via-[#F5F3F0] to-[#FAFAF8]',
    gold: 'from-[#C8A96A]/20 via-[#D4B87A]/10 to-[#C8A96A]/20',
    'gold-subtle': 'from-[#C8A96A]/5 via-[#D4B87A]/3 to-transparent',
    mesh: '',
    radial: '',
    dark: 'from-[#2D2D2D] via-[#1A1A1A] to-[#0D0D0D]',
  }

  const intensityStyles: Record<typeof intensity, string> = {
    subtle: 'opacity-60',
    medium: 'opacity-80',
    strong: 'opacity-100',
  }

  const meshGradient = (
    <div className="absolute inset-0 opacity-40">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C8A96A]/10 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#2D7A4D]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#2E5C8A]/5 rounded-full blur-3xl" />
    </div>
  )

  const radialGradient = (
    <div className="absolute inset-0 bg-gradient-radial from-[#C8A96A]/5 via-transparent to-transparent" />
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        className
      )}
    >
      {/* Base gradient */}
      {variant === 'mesh' ? (
        meshGradient
      ) : variant === 'radial' ? (
        radialGradient
      ) : (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br transition-opacity duration-1000',
            variantStyles[variant],
            intensityStyles[intensity],
            animated && 'animate-pulse-slow'
          )}
        />
      )}

      {/* Noise texture overlay */}
      <div
        className={cn(
          'absolute inset-0 texture-paper pointer-events-none',
          intensity === 'subtle' ? 'opacity-30' : intensity === 'medium' ? 'opacity-50' : 'opacity-70'
        )}
      />

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * AnimatedGradient — Continuously animated gradient background
 *
 * Creates a subtle, continuously shifting gradient effect
 * for hero sections and feature highlights.
 */
interface AnimatedGradientProps {
  variant?: 'warm' | 'gold' | 'cool'
  speed?: 'slow' | 'medium' | 'fast'
  className?: string
}

export function AnimatedGradient({
  variant = 'warm',
  speed = 'slow',
  className = '',
}: AnimatedGradientProps) {
  const speedStyles = {
    slow: 'animate-[gradient-shift_10s_ease-in-out_infinite]',
    medium: 'animate-[gradient-shift_5s_ease-in-out_infinite]',
    fast: 'animate-[gradient-shift_3s_ease-in-out_infinite]',
  }

  const variantColors = {
    warm: 'from-[#FAFAF8] via-[#F5F3F0] to-[#EDE8E0]',
    gold: 'from-[#C8A96A]/20 via-[#D4B87A]/15 to-[#C8A96A]/20',
    cool: 'from-[#E8F0F8] via-[#F0F6FC] to-[#E8F0F8]',
  }

  return (
    <div
      className={cn(
        'absolute inset-0 bg-gradient-to-br bg-[length:200%_200%]',
        variantColors[variant],
        speedStyles[speed],
        className
      )}
      style={{
        animation: 'gradient-shift 10s ease-in-out infinite',
      }}
    />
  )
}

/**
 * HeroGradient — Dramatic gradient for hero sections
 *
 * Creates a bold, atmospheric background specifically
 * designed for landing page hero sections.
 */
interface HeroGradientProps {
  children: React.ReactNode
  className?: string
}

export function HeroGradient({ children, className = '' }: HeroGradientProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main gradient */}
      <div className="absolute inset-0 bg-gradient-mesh" />

      {/* Gold accent glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C8A96A]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C8A96A]/3 rounded-full blur-3xl" />

      {/* Noise texture */}
      <div className="absolute inset-0 texture-paper opacity-40" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

/**
 * SectionDivider — Decorative gradient divider
 *
 * Creates elegant section dividers with gradient accents.
 */
interface SectionDividerProps {
  variant?: 'gold' | 'subtle' | 'fade'
  className?: string
}

export function SectionDivider({ variant = 'gold', className = '' }: SectionDividerProps) {
  return (
    <div className={cn('w-full h-px', className)}>
      {variant === 'gold' && (
        <div className="h-full w-full bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
      )}
      {variant === 'subtle' && (
        <div className="h-full w-full bg-gradient-to-r from-transparent via-[#E8E4DC] to-transparent" />
      )}
      {variant === 'fade' && (
        <div className="h-full w-full bg-gradient-to-r from-[#E8E4DC]/0 via-[#E8E4DC] to-[#E8E4DC]/0" />
      )}
    </div>
  )
}
