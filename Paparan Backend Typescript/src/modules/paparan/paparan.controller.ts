import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseGuard } from '../auth/supabase.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/user.decorator';
import { UserInfo } from '../auth/auth.service';
import { PaparanService } from './paparan.service';

@ApiTags('paparan')
@Controller('paparan')
@UseGuards(SupabaseGuard)
@ApiBearerAuth()
export class PaparanController {
  constructor(private paparanService: PaparanService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a policy brief' })
  async generateBrief(
    @CurrentUser() user: UserInfo,
    @Body() body: { topic: string; region?: string },
  ) {
    return this.paparanService.generateBrief(user.id, body.topic, body.region);
  }

  @Get('briefs')
  @ApiOperation({ summary: 'Get user briefs' })
  async getBriefs(
    @CurrentUser() user: UserInfo,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paparanService.getUserBriefs(user.id, limit, offset);
  }

  @Get('briefs/:id')
  @ApiOperation({ summary: 'Get a specific brief' })
  async getBrief(@CurrentUser() user: UserInfo, @Param('id') id: string) {
    return this.paparanService.getBrief(id, user.id);
  }
}
