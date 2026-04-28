import { useState, useCallback } from 'react'

export function useCollapsible(defaultExpanded = true) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    setIsExpanded
  }
}

// Multiple collapsible sections
export function useCollapsibles(sectionIds: string[], defaultAllExpanded = true) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(defaultAllExpanded ? sectionIds : [])
  )

  const toggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }, [])

  const isExpanded = useCallback((sectionId: string) => {
    return expandedSections.has(sectionId)
  }, [expandedSections])

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(sectionIds))
  }, [sectionIds])

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set())
  }, [])

  return {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
    expandedSections
  }
}
