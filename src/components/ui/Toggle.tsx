import React from 'react';
import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  size = 'md'
}) => {
  const sizeStyles = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', thumbTranslate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', thumbTranslate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', thumbTranslate: 'translate-x-7' },
  };

  const currentSize = sizeStyles[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer',
        // Focus ring
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        // Disabled state
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Active state
        'active:scale-95 transition-transform duration-100'
      )}
    >
      <div
        className={cn(
          'relative rounded-full transition-all duration-200 ease-out',
          checked ? 'bg-primary' : 'bg-bg-subtle',
          !checked && !disabled && 'hover:bg-border-strong',
          disabled && 'opacity-50',
          currentSize.track,
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 bg-bg-elevated rounded-full shadow-sm transition-all duration-200 ease-out',
            currentSize.thumb,
            checked && currentSize.thumbTranslate,
            checked && !disabled && 'hover:scale-105',
          )}
        />
      </div>
      {label && (
        <span className={cn(
          'text-sm font-medium text-text font-ui transition-colors duration-200',
          checked && 'text-primary',
          disabled && 'text-text-tertiary'
        )}>
          {label}
        </span>
      )}
    </button>
  );
};
