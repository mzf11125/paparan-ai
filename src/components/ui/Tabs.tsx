import React, { useState, useRef, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/formatters'

export interface Tab {
  id: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
  content?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'underline' | 'pill' | 'segmented'
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Tabs = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'underline',
  orientation = 'horizontal',
  size = 'md',
  className = '',
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const activeTabElement = tabRefs.current.get(activeTab)

  useEffect(() => {
    if (activeTabElement && tabsRef.current && variant === 'underline' && orientation === 'horizontal') {
      const { offsetWidth, offsetLeft } = activeTabElement
      setIndicatorStyle({
        width: offsetWidth,
        transform: `translateX(${offsetLeft}px)`,
      })
    }
  }, [activeTab, activeTabElement, variant, orientation])

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (tab && !tab.disabled) {
      setActiveTab(tabId)
      onChange?.(tabId)
    }
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const baseTabClasses = 'relative flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

  const variantStyles = {
    underline: cn(
      baseTabClasses,
      'text-text-tertiary hover:text-text border-b-2 border-transparent',
      'data-[active=true]:text-accent data-[active=true]:border-accent'
    ),
    pill: cn(
      baseTabClasses,
      'text-text-tertiary hover:text-text rounded-full',
      'data-[active=true]:bg-accent data-[active=true]:text-white'
    ),
    segmented: cn(
      baseTabClasses,
      'text-text-tertiary hover:text-text rounded-radius-lg',
      'data-[active=true]:bg-bg-elevated data-[active=true]:text-text data-[active=true]:shadow-sm'
    ),
  }

  const containerStyles = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col',
  }

  const currentTab = tabs.find((t) => t.id === activeTab)

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div
        ref={tabsRef}
        className={cn(
          'relative',
          variant === 'underline' && 'border-b border-border',
          variant === 'pill' && 'gap-2',
          variant === 'segmented' && 'bg-gray-100 p-1 rounded-radius-lg gap-1',
          containerStyles[orientation]
        )}
        role="tablist"
        aria-orientation={orientation}
      >
        {variant === 'underline' && orientation === 'horizontal' && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-200 ease-out"
            style={indicatorStyle}
          />
        )}
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
              }}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                variantStyles[variant],
                sizeStyles[size],
                tab.disabled && 'opacity-50 cursor-not-allowed',
                'whitespace-nowrap'
              )}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-disabled={tab.disabled}
              data-active={activeTab === tab.id}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4" role="tabpanel">
        {currentTab?.content}
      </div>
    </div>
  )
}

// Controlled Tabs component for when you want to manage state externally
interface ControlledTabsProps extends Omit<TabsProps, 'defaultTab'> {
  value: string
}

export const ControlledTabs = ({ value, onChange, ...props }: ControlledTabsProps) => {
  return (
    <Tabs
      {...props}
      defaultTab={value}
      onChange={(tabId) => {
        if (tabId !== value) {
          onChange?.(tabId)
        }
      }}
    />
  )
}

// Tab Panel component for manual tab content rendering
interface TabPanelProps {
  children: React.ReactNode
  value: string
  activeTab: string
  className?: string
}

export const TabPanel = ({ children, value, activeTab, className = '' }: TabPanelProps) => {
  if (value !== activeTab) return null

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  )
}

// Vertical Tabs with separate content area
interface VerticalTabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
}

export const VerticalTabs = ({
  tabs,
  defaultTab,
  onChange,
  className = '',
}: VerticalTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId)
    if (tab && !tab.disabled) {
      setActiveTab(tabId)
      onChange?.(tabId)
    }
  }

  const currentTab = tabs.find((t) => t.id === activeTab)

  return (
    <div className={cn('flex gap-6', className)}>
      {/* Tab Headers */}
      <div
        className="flex flex-col gap-1 w-48 flex-shrink-0"
        role="tablist"
        aria-orientation="vertical"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-radius-lg text-sm font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                'whitespace-nowrap',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-tertiary hover:text-text hover:bg-gray-100',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-w-0" role="tabpanel">
        <div className="animate-fade-in">
          {currentTab?.content}
        </div>
      </div>
    </div>
  )
}

// Simple tab trigger for manual tab lists
interface TabTriggerProps {
  value: string
  activeTab: string
  onClick: (value: string) => void
  children: React.ReactNode
  icon?: LucideIcon
  disabled?: boolean
  className?: string
}

export const TabTrigger = ({
  value,
  activeTab,
  onClick,
  children,
  icon: Icon,
  disabled = false,
  className = '',
}: TabTriggerProps) => {
  const isActive = activeTab === value

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      disabled={disabled}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'border-b-2',
        isActive
          ? 'text-accent border-accent'
          : 'text-text-tertiary border-transparent hover:text-text',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// Tab List container
interface TabListProps {
  children: React.ReactNode
  className?: string
}

export const TabList = ({ children, className = '' }: TabListProps) => {
  return (
    <div
      className={cn('flex border-b border-border', className)}
      role="tablist"
    >
      {children}
    </div>
  )
}
