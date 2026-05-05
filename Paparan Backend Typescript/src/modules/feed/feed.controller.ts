import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseGuard } from '../auth/supabase.guard';
import { Public } from '@common/decorators/public.decorator';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get feed items' })
  async getFeed(@Query() query: any) {
    return this.feedService.getFeed(query);
  }
}
