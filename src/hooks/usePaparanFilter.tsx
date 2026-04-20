import { useState, useCallback, useMemo } from 'react'
import type { Development, FilterType } from '@/types'

export function usePaparanFilter(developments: Development[]) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [highlightMode, setHighlightMode] = useState(false)

  const filteredDevelopments = useMemo(() => {
    if (filter === 'high') {
      return developments.filter(dev => dev.impact === 'HIGH')
    }
    return developments
  }, [developments, filter])

  const setFilterAll = useCallback(() => {
    setFilter('all')
  }, [])

  const setFilterHigh = useCallback(() => {
    setFilter('high')
  }, [])

  const toggleHighlightMode = useCallback(() => {
    setHighlightMode(prev => !prev)
  }, [])

  return {
    filter,
    filteredDevelopments,
    highlightMode,
    setFilterAll,
    setFilterHigh,
    toggleHighlightMode,
    setHighlightMode
  }
}
