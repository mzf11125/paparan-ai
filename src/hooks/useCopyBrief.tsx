import { useState, useCallback } from 'react'
import { copyToClipboard, formatBriefAsText } from '@/utils/clipboard'

interface UseCopyBriefOptions {
  onSuccess?: () => void
  onError?: () => void
}

export function useCopyBrief({ onSuccess, onError }: UseCopyBriefOptions = {}) {
  const [isCopied, setIsCopied] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const copyBrief = useCallback(async (brief: Parameters<typeof formatBriefAsText>[0]) => {
    setIsCopying(true)
    const text = formatBriefAsText(brief)
    const success = await copyToClipboard(text)

    if (success) {
      setIsCopied(true)
      onSuccess?.()

      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } else {
      onError?.()
    }

    setIsCopying(false)
    return success
  }, [onSuccess, onError])

  return {
    isCopied,
    isCopying,
    copyBrief
  }
}
