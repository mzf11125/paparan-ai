import { cn } from '@/utils/cn'
import { BRAND_NAME, BRAND_TAGLINE } from '@/constants/brand'

export interface LogoProps {
  variant?: 'wordmark' | 'icon' | 'compact'
  color?: 'full' | 'monochrome' | 'inverted'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function Logo({ variant = 'wordmark', color = 'full', size = 'md', className, text = BRAND_NAME }: LogoProps) {
  const iconSize = { sm: 22, md: 28, lg: 36 }[size]
  const wordSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size]

  const palette = {
    full:       { mark: 'var(--color-primary)', word: 'var(--color-text)' },
    monochrome: { mark: 'currentColor',         word: 'currentColor' },
    inverted:   { mark: 'rgb(var(--color-bg-elevated-rgb))', word: 'rgb(var(--color-bg-elevated-rgb))' },
  }[color]

  const Mark = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18.5" stroke={palette.mark} strokeWidth="1.5" fill="none" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontFamily="Newsreader, Source Serif 4, Georgia, serif"
        fontSize="22"
        fontWeight="600"
        fill={palette.mark}
        letterSpacing="-0.02em"
      >
        P
      </text>
    </svg>
  )

  if (variant === 'icon') {
    return <span className={cn('inline-flex', className)} aria-label={text}>{Mark}</span>
  }

  if (variant === 'compact') {
    return (
      <span className={cn('inline-flex items-center gap-2', className)} aria-label={text}>
        {Mark}
        <span
          className={cn('font-display font-semibold tracking-tight leading-none', wordSize)}
          style={{ color: palette.word }}
        >
          {text}
        </span>
      </span>
    )
  }

  // Wordmark variant — serif brand name with editorial kicker beneath
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label={`${text} — ${BRAND_TAGLINE}`}>
      {Mark}
      <span className="inline-flex flex-col leading-none gap-0.5">
        <span
          className={cn('font-display font-semibold tracking-tight leading-none', wordSize)}
          style={{ color: palette.word }}
        >
          {text}
        </span>
        <span
          className="text-[9px] font-mono uppercase tracking-[0.18em] leading-none opacity-80"
          style={{ color: palette.word }}
        >
          Policy Intelligence
        </span>
      </span>
    </span>
  )
}
