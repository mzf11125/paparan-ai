import React from 'react'
import { cn } from '@/utils/formatters'

interface OfficialSealProps {
  variant?: 'full' | 'compact' | 'icon-only'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  monochrome?: boolean
}

export const OfficialSeal = React.forwardRef<SVGSVGElement, OfficialSealProps>(
  ({ variant = 'full', size = 'md', className = '', monochrome = false }, ref) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const colors = monochrome
    ? { stroke: 'currentColor', secondary: 'currentColor' }
    : { stroke: 'var(--color-primary)', secondary: 'var(--color-primary-dim)' }

  if (variant === 'icon-only') {
    return (
      <svg
        ref={ref}
        viewBox="0 0 100 100"
        className={cn(sizes[size], className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle cx="50" cy="50" r="45" stroke={colors.stroke} strokeWidth="2" />
        {/* Inner circle */}
        <circle cx="50" cy="50" r="38" stroke={colors.secondary} strokeWidth="1" />
        {/* Star */}
        <path
          d="M50 10 L55 35 L80 35 L60 50 L70 75 L50 60 L30 75 L40 50 L20 35 L45 35 Z"
          fill={colors.secondary}
          stroke={colors.stroke}
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      className={cn(sizes[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="50" cy="50" r="45" stroke={colors.stroke} strokeWidth="2" />
      {/* Inner circle */}
      <circle cx="50" cy="50" r="38" stroke={colors.secondary} strokeWidth="1" />
      {/* Star */}
      <path
        d="M50 10 L55 35 L80 35 L60 50 L70 75 L50 60 L30 75 L40 50 L20 35 L45 35 Z"
        fill={colors.secondary}
        stroke={colors.stroke}
        strokeWidth="1.5"
      />
      {/* Text */}
      {variant === 'full' && (
        <>
          <text
            x="50"
            y="92"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill={colors.stroke}
            className="font-ui"
          >
            PAPARANBRIEF
          </text>
          <text
            x="50"
            y="99"
            textAnchor="middle"
            fontSize="4"
            fontWeight="600"
            fill={colors.secondary}
            letterSpacing="1"
          >
            BRIEF
          </text>
        </>
      )}
    </svg>
  )
})

OfficialSeal.displayName = 'OfficialSeal'
