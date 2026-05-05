import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseGuard } from './supabase.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify authentication token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifyToken(@Body('token') token: string) {
    const user = await this.authService.validateToken(token);
    return { valid: true, user };
  }

  @Get('me')
  @UseGuards(SupabaseGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req) {
    return {
      id: req.user.id,
      email: req.user.email,
      metadata: req.user.metadata,
    };
  }
}
