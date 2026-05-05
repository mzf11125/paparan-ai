import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface JwtPayload {
  sub: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface UserInfo {
  id: string;
  email: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async validateToken(token: string): Promise<UserInfo> {
    try {
      // Verify with Supabase
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        metadata: data.user.user_metadata,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyJwt(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async login(userId: string, email: string): Promise<{ accessToken: string }> {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async refreshUser(userId: string): Promise<UserInfo> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      metadata: data.user.user_metadata,
    };
  }
}
