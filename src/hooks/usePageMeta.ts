import { useEffect } from 'react'
import { BRAND_NAME } from '@/constants/brand'

const SITE_NAME = BRAND_NAME
const DEFAULT_DESCRIPTION = 'ASEAN policy intelligence — editorial-grade briefs, RDTII evidence, and decision-ready synthesis.'

interface PageMeta {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

function setMeta(name: string, value: string, attr: 'name' | 'property' = 'name') {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

/**
 * Set <title> + Open Graph tags per route.
 * Call from a page component:
 *   usePageMeta({ title: 'Reports', description: 'Long-form publications.' })
 */
export function usePageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription,
  ogImage,
}: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title

    const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle

    setMeta('description', description)
    setMeta('og:title',       ogTitle       ?? fullTitle,      'property')
    setMeta('og:description', ogDescription ?? description,    'property')
    setMeta('og:site_name',   SITE_NAME,                       'property')
    setMeta('og:type',        'website',                       'property')
    if (ogImage) setMeta('og:image', ogImage, 'property')

    setMeta('twitter:card',        'summary_large_image')
    setMeta('twitter:title',       ogTitle       ?? fullTitle)
    setMeta('twitter:description', ogDescription ?? description)
    if (ogImage) setMeta('twitter:image', ogImage)

    return () => {
      document.title = previousTitle
    }
  }, [title, description, ogTitle, ogDescription, ogImage])
}
