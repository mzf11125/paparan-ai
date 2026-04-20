import { useState, useEffect } from 'react'

export function useScrollProgress(): number {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollableHeight = documentHeight - windowHeight
      const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))
    }

    // Add event listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Initial calculation
    handleScroll()

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return scrollProgress
}
