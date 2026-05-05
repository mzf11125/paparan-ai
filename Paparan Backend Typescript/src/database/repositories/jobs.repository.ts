import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobType {
  DOCUMENT_EXTRACTION = 'document_extraction',
  CONSISTENCY_CHECK = 'consistency_check',
  SCRAPE = 'scrape',
}

@Injectable()
export class JobsRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findByUser(userId: string, options?: { status?: string; limit?: number }) {
    let query = this.supabase
      .from('extraction_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('extraction_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('extraction_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(job: {
    userId: string;
    type: JobType;
    documentId?: string;
    metadata?: Record<string, any>;
    progress?: number;
  }) {
    const { data, error } = await this.supabase
      .from('extraction_jobs')
      .insert({
        user_id: job.userId,
        type: job.type,
        document_id: job.documentId,
        status: JobStatus.PENDING,
        progress: job.progress || 0,
        metadata: job.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: {
    status?: JobStatus;
    progress?: number;
    result?: any;
    errorMessage?: string;
    resultIndicatorsCount?: number;
    startedAt?: string;
    completedAt?: string;
  }) {
    const { data, error } = await this.supabase
      .from('extraction_jobs')
      .update({
        ...updates,
        error_message: updates.errorMessage,
        result_indicators_count: updates.resultIndicatorsCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: JobStatus) {
    const updates: any = { status };

    if (status === JobStatus.PROCESSING) {
      updates.started_at = new Date().toISOString();
    } else if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      updates.completed_at = new Date().toISOString();
    }

    return this.update(id, updates);
  }

  async updateProgress(id: string, progress: number) {
    return this.update(id, { progress });
  }

  async findPending(type?: JobType, limit = 10) {
    let query = this.supabase
      .from('extraction_jobs')
      .select('*')
      .eq('status', JobStatus.PENDING)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findByDocument(documentId: string) {
    const { data, error } = await this.supabase
      .from('extraction_jobs')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('extraction_jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Legacy consistency flag methods (moved to ConsistencyFlagsRepository)
  async getConsistencyFlags(documentId?: string) {
    let query = this.supabase
      .from('consistency_flags')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async createConsistencyFlag(flag: {
    documentId: string;
    indicatorId?: string;
    flagType: string;
    description: string;
    relatedIndicators?: string[];
  }) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .insert({
        document_id: flag.documentId,
        indicator_id: flag.indicatorId,
        flag_type: flag.flagType,
        description: flag.description,
        related_indicators: flag.relatedIndicators || [],
        resolved: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async resolveConsistencyFlag(flagId: string) {
    const { data, error } = await this.supabase
      .from('consistency_flags')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
