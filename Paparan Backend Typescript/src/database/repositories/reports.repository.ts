import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

@Injectable()
export class ReportsRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findByUser(userId: string, limit = 10, offset = 0) {
    const { data, error } = await this.supabase
      .from('paparan_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('paparan_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(report: {
    userId: string;
    topic: string;
    region: string;
    classification: string;
    brief: any;
  }) {
    const { data, error } = await this.supabase
      .from('paparan_reports')
      .insert({
        user_id: report.userId,
        topic: report.topic,
        region: report.region,
        classification: report.classification,
        brief: report.brief,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('paparan_reports')
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
      .from('paparan_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async acknowledgeBrief(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('paparan_reports')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getVersions(id: string) {
    const { data, error } = await this.supabase
      .from('paparan_report_versions')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createVersion(version: {
    reportId: string;
    brief: any;
    changeSummary: string;
  }) {
    const { data, error } = await this.supabase
      .from('paparan_report_versions')
      .insert({
        report_id: version.reportId,
        brief: version.brief,
        change_summary: version.changeSummary,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
