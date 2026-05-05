import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

@Injectable()
export class ConsistencyFlagsRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findByUser(userId: string, filters?: { status?: string; limit?: number }) {
    let query = this.supabase
      .from('consistency_flags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(flag: {
    userId: string;
    indicatorId: string;
    flagType: string;
    description: string;
    status?: string;
    relatedIndicators?: string[];
  }) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .insert({
        user_id: flag.userId,
        indicator_id: flag.indicatorId,
        flag_type: flag.flagType,
        description: flag.description,
        status: flag.status || 'open',
        related_indicators: flag.relatedIndicators || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: {
    status?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
  }) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('consistency_flags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async findByIndicator(indicatorId: string) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .select('*')
      .eq('indicator_id', indicatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOpenByIndicator(indicatorId: string) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .select('*')
      .eq('indicator_id', indicatorId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
