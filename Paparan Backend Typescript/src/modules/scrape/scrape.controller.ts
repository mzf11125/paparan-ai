import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseGuard } from '../auth/supabase.guard';
import { ScrapeService } from './scrape.service';

@ApiTags('scrape')
@Controller('scrape')
@UseGuards(SupabaseGuard)
export class ScrapeController {
  constructor(private scrapeService: ScrapeService) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger scraping' })
  async trigger(@Body() body: { source?: string }) {
    return this.scrapeService.trigger(body.source);
  }
}
