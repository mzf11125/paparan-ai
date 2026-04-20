/**
 * Tavily API Integration
 * Official SDK implementation
 */

import { tavily } from '@tavily/core'

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
}

// Lazy Tavily client creation
let tvlyClient: ReturnType<typeof tavily> | null = null

function getTavilyClient() {
  if (!tvlyClient) {
    if (!process.env.TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not set')
    }
    tvlyClient = tavily({
      apiKey: process.env.TAVILY_API_KEY,
    })
  }
  return tvlyClient
}

/**
 * Search with Tavily using the official SDK
 */
export async function searchWithTavily(queries: string[]): Promise<TavilySearchResult[]> {
  const client = getTavilyClient()

  const searchPromises = queries.map(query =>
    performTavilySearch(query, client)
  )

  const results = await Promise.all(searchPromises)
  const allResults = results.flatMap(r => r || [])

  return rankAndDeduplicate(allResults)
}

async function performTavilySearch(
  query: string,
  client: ReturnType<typeof tavily>
): Promise<TavilySearchResult[]> {
  try {
    const response = await client.search(query, {
      searchDepth: 'advanced',
      maxResults: 10,
      days: 30, // Last 30 days
    })

    // Transform Tavily results to our format
    const results = (response.results || []).map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      content: item.content || '',
      score: item.score || 0,
      publishedDate: item.publishedDate,
    }))

    return results
  } catch (error) {
    console.error(`Tavily search error for query "${query}":`, error)
    return []
  }
}

// Priority: government > major news > regional media > blogs
const DOMAIN_PRIORITY: Record<string, number> = {
  'gov': 4,
  'go': 4,
  'mil': 4,
  'reuters.com': 3,
  'bloomberg.com': 3,
  'apnews.com': 3,
  'channelnewsasia.com': 2,
  'straitstimes.com': 2,
  'bangkokpost.com': 2,
  'jakartapost.com': 2,
  'vietnamnews.vn': 2,
}

function getDomainPriority(url: string): number {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const domain = hostname as keyof typeof DOMAIN_PRIORITY

    if (DOMAIN_PRIORITY[domain]) {
      return DOMAIN_PRIORITY[domain]
    }

    const tld = hostname.split('.').pop()
    return DOMAIN_PRIORITY[tld as keyof typeof DOMAIN_PRIORITY] || 1
  } catch {
    return 1
  }
}

function rankAndDeduplicate(results: TavilySearchResult[]): TavilySearchResult[] {
  const seen = new Set<string>()
  const ranked: (TavilySearchResult & { priority: number })[] = []

  for (const result of results) {
    const normalizedUrl = result.url?.replace(/^(https?:\/\/)?(www\.)?/, '') || result.title

    if (seen.has(normalizedUrl)) {
      continue
    }

    seen.add(normalizedUrl)
    ranked.push({
      ...result,
      priority: getDomainPriority(result.url || ''),
    })
  }

  // Sort by priority then score
  ranked.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }
    return (b.score || 0) - (a.score || 0)
  })

  return ranked
}
