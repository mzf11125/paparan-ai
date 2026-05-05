import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

@Injectable()
export class IndicatorsRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findByUser(
    userId: string,
    filters?: {
      documentId?: string;
      klCode?: string;
      sector?: string;
      confidence?: string;
      limit?: number;
      page?: number;
    }
  ) {
    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('sdi_indicators')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.documentId) {
      query = query.eq('document_id', filters.documentId);
    }

    if (filters?.klCode) {
      query = query.eq('kl_code', filters.klCode);
    }

    if (filters?.sector) {
      query = query.eq('sector', filters.sector);
    }

    if (filters?.confidence) {
      query = query.eq('extraction_confidence', filters.confidence);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByIds(ids: string[], userId?: string) {
    let query = this.supabase
      .from('sdi_indicators')
      .select('*')
      .in('id', ids);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findByDocument(documentId: string) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findAll(filters?: {
    sector?: string;
    klCode?: string;
    confidence?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.supabase
      .from('sdi_indicators')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.sector) {
      query = query.eq('sector', filters.sector);
    }

    if (filters?.klCode) {
      query = query.eq('kl_code', filters.klCode);
    }

    if (filters?.confidence) {
      query = query.eq('extraction_confidence', filters.confidence);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async create(indicator: {
    userId?: string;
    documentId?: string;
    indicatorCode: string;
    indicatorName: string;
    definition?: string;
    klCode: string;
    klName?: string;
    sector?: string;
    sdiGoal?: string;
    unitType?: string;
    temporalResolution?: string;
    dataAvailability?: string;
    extractionConfidence?: string;
    kCode?: string;
    lCode?: string;
    subsector?: string;
    unit?: string;
    data?: any;
  }) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .insert({
        user_id: indicator.userId,
        document_id: indicator.documentId,
        indicator_code: indicator.indicatorCode,
        indicator_name: indicator.indicatorName,
        definition: indicator.definition,
        kl_code: indicator.klCode,
        kl_name: indicator.klName,
        sector: indicator.sector,
        sdi_goal: indicator.sdiGoal,
        unit_type: indicator.unitType,
        temporal_resolution: indicator.temporalResolution,
        data_availability: indicator.dataAvailability,
        extraction_confidence: indicator.extractionConfidence || 'MEDIUM',
        k_code: indicator.kCode,
        l_code: indicator.lCode,
        subsector: indicator.subsector,
        unit: indicator.unit,
        data: indicator.data || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
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
      .from('sdi_indicators')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByDocument(documentId: string) {
    const { error } = await this.supabase
      .from('sdi_indicators')
      .delete()
      .eq('document_id', documentId);

    if (error) throw error;
  }

  async findByKLCode(klCode: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .select('*')
      .eq('kl_code', klCode)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async findBySector(sector: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .select('*')
      .eq('sector', sector)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async searchByName(query: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('sdi_indicators')
      .select('*')
      .ilike('indicator_name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
