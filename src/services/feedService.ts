import { apiClient } from './api'

export interface FeedItem {
  id: string
  title: string
  summary: string
  url: string
  source: string
  region: string
  topic_tags: string[]
  published_at: string
  classification: string
  delta: string
}

export const feedService = {
  getFeedItems: (region?: string, topic?: string): Promise<FeedItem[]> => {
    const params = new URLSearchParams()
    if (region && region !== 'All') params.set('region', region)
    if (topic) params.set('topic', topic)
    const qs = params.toString()
    return apiClient.get<FeedItem[]>(`/api/feed${qs ? `?${qs}` : ''}`)
  },
}
