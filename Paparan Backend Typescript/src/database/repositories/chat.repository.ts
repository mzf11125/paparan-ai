import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../supabase.client';

@Injectable()
export class ChatRepository {
  constructor(private supabaseService: SupabaseClientService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async findThreadsByUser(userId: string, limit = 10, offset = 0) {
    const { data, error } = await this.supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async findThreadById(threadId: string) {
    const { data, error } = await this.supabase
      .from('chat_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (error) throw error;
    return data;
  }

  async createThread(userId: string, title?: string) {
    const { data, error } = await this.supabase
      .from('chat_threads')
      .insert({
        user_id: userId,
        title: title || 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateThread(threadId: string, updates: { title?: string }) {
    const { data, error } = await this.supabase
      .from('chat_threads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findMessagesByThread(threadId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async createMessage(message: {
    threadId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
  }) {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        thread_id: message.threadId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update thread's updated_at
    await this.supabase
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.threadId);

    return data;
  }

  async deleteThread(threadId: string) {
    // Delete messages first (due to foreign key)
    await this.supabase
      .from('chat_messages')
      .delete()
      .eq('thread_id', threadId);

    // Delete thread
    const { error } = await this.supabase
      .from('chat_threads')
      .delete()
      .eq('id', threadId);

    if (error) throw error;
  }
}
