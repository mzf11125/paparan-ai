interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

interface TavilyResponse {
  answer: string
  query: string
  results: TavilySearchResult[]
}

interface TavilySearchParams {
  api_key: string
  query: string
  search_depth?: 'basic' | 'advanced'
  max_results?: number
  include_domains?: string[]
  exclude_domains?: string[]
  days?: number
}

export async function searchWithTavily(queries: string[]): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  const searchPromises = queries.map(query =>
    performTavilySearch({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      max_results: 10,
      days: 30, // Last 30 days
    })
  )

  const results = await Promise.all(searchPromises)
  const allResults = results.flatMap(r => r.results)

  return rankAndDeduplicate(allResults)
}

async function performTavilySearch(params: TavilySearchParams): Promise<TavilyResponse> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.statusText}`)
  }

  return response.json()
}

// Priority: government > major news > regional media > blogs
const DOMAIN_PRIORITY = {
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
