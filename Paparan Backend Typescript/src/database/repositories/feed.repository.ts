import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

@Injectable()
export class FeedRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findAll(params: {
    limit?: number;
    offset?: number;
    source?: string;
    category?: string;
    region?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let query = this.supabase
      .from('feed_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(params.limit || 20);

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
    }

    if (params.source) {
      query = query.eq('source', params.source);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.region) {
      query = query.contains('regions', [params.region]);
    }

    if (params.startDate) {
      query = query.gte('published_at', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('published_at', params.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('feed_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(feedItem: {
    title: string;
    url: string;
    source: string;
    category: string;
    summary?: string;
    content?: string;
    publishedAt?: string;
    regions?: string[];
    metadata?: Record<string, any>;
  }) {
    const { data, error } = await this.supabase
      .from('feed_items')
      .insert({
        title: feedItem.title,
        url: feedItem.url,
        source: feedItem.source,
        category: feedItem.category,
        summary: feedItem.summary,
        content: feedItem.content,
        published_at: feedItem.publishedAt || new Date().toISOString(),
        regions: feedItem.regions || [],
        metadata: feedItem.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async search(query: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('feed_items')
      .select('*')
      .textSearch('title', query)
      .or(`summary.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
