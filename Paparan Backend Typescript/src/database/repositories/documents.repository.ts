import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

@Injectable()
export class DocumentsRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findByUser(
    userId: string,
    options?: { status?: string; limit?: number; offset?: number }
  ) {
    let query = this.supabase
      .from('bappenas_documents')
      .select('*')
      .eq('uploaded_by', userId)
      .order('uploaded_at', { ascending: false });

    if (options?.status) {
      query = query.eq('processing_status', options.status);
    }

    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('bappenas_documents')
      .select('*')
      .eq('id', id)
      .eq('uploaded_by', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('bappenas_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(document: {
    userId: string;
    filename: string;
    storagePath: string;
    fileType: string;
    fileSize: number;
    processingStatus?: string;
    title?: string;
  }) {
    const { data, error } = await this.supabase
      .from('bappenas_documents')
      .insert({
        uploaded_by: document.userId,
        filename: document.filename,
        storage_path: document.storagePath,
        file_type: document.fileType,
        file_size: document.fileSize,
        title: document.title || document.filename,
        processing_status: document.processingStatus || 'pending',
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('bappenas_documents')
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
      .from('bappenas_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, {
      processing_status: status,
      ...(status === 'processing' ? { started_at: new Date().toISOString() } : {}),
      ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {}),
    });
  }

  async findByStatus(status: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('bappenas_documents')
      .select('*')
      .eq('processing_status', status)
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
