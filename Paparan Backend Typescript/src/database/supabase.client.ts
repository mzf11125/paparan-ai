import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseClientService implements OnModuleInit, OnModuleDestroy {
  private client: SupabaseClient;
  private serviceRoleClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !anonKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (serviceRoleKey) {
      this.serviceRoleClient = createClient(url, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  async onModuleDestroy() {
    // Supabase client doesn't require explicit cleanup
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  getServiceRoleClient(): SupabaseClient {
    if (!this.serviceRoleClient) {
      throw new Error('Supabase service role client not initialized');
    }
    return this.serviceRoleClient;
  }
}
