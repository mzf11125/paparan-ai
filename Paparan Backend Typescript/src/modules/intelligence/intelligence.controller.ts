import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SupabaseGuard } from '@modules/auth/supabase.guard';
import { IntelligenceService } from './intelligence.service';

@ApiTags('intelligence')
@Controller('intelligence')
@UseGuards(SupabaseGuard)
export class IntelligenceController {
  constructor(private intelligenceService: IntelligenceService) {}

  // ==================== Maritime Endpoints ====================

  @Get('maritime/:region')
  @ApiOperation({ summary: 'Get vessel tracking data for an ASEAN maritime region' })
  @ApiParam({ name: 'region', description: 'Region name (e.g. Malacca Strait, South China Sea, Indonesia)' })
  @ApiQuery({ name: 'dateRange', required: false, description: 'Time range (e.g. 7d, 30d)', example: '7d' })
  async getMaritime(
    @Param('region') region: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.intelligenceService.getMaritimeData(region, dateRange);
  }

  @Get('maritime/straits')
  @ApiOperation({ summary: 'Get traffic data for all ASEAN straits' })
  async getAllStraits() {
    return this.intelligenceService.getAllStraitsTraffic();
  }

  @Get('maritime/straits/:strait')
  @ApiOperation({ summary: 'Get traffic data for a specific strait' })
  @ApiParam({ name: 'strait', description: 'Strait name (Malacca Strait, Lombok Strait, etc.)' })
  async getStraitTraffic(@Param('strait') strait: string) {
    return this.intelligenceService.getStraitTraffic(strait);
  }

  // ==================== Environmental Endpoints ====================

  @Get('environment/:region')
  @ApiOperation({ summary: 'Get environmental indicators for a region' })
  @ApiParam({ name: 'region', description: 'Region name (e.g. Kalimantan, Indonesia, Riau)' })
  async getEnvironment(@Param('region') region: string) {
    return this.intelligenceService.getEnvironmentalData(region);
  }

  @Get('environment/:region/deforestation')
  @ApiOperation({ summary: 'Get deforestation alerts from Global Forest Watch' })
  @ApiParam({ name: 'region', description: 'Region name' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  async getDeforestation(@Param('region') region: string, @Query('days') days?: number) {
    return this.intelligenceService.getDeforestationAlerts(region, days);
  }

  @Get('environment/:region/fire')
  @ApiOperation({ summary: 'Get fire/hotspot data from NASA FIRMS' })
  @ApiParam({ name: 'region', description: 'Region name' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  async getFireHotspots(@Param('region') region: string, @Query('days') days?: number) {
    return this.intelligenceService.getFireHotspots(region, days);
  }

  @Get('environment/:region/fishing')
  @ApiOperation({ summary: 'Get fishing vessel activity from Global Fishing Watch' })
  @ApiParam({ name: 'region', description: 'Region name' })
  async getFishing(@Param('region') region: string) {
    return this.intelligenceService.getFishingActivity(region);
  }

  @Get('environment/asean/summary')
  @ApiOperation({ summary: 'Get environmental summary for all ASEAN countries' })
  async getASEANEnvironmentalSummary() {
    return this.intelligenceService.getASEANEnvironmentalSummary();
  }

  // ==================== Conflict Endpoints ====================

  @Get('conflict/:region')
  @ApiOperation({ summary: 'Get conflict and security events for an ASEAN region' })
  @ApiParam({ name: 'region', description: 'Country or region name (e.g. Myanmar, Papua, Philippines)' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  async getConflict(
    @Param('region') region: string,
    @Query('days') days?: number,
  ) {
    return this.intelligenceService.getConflictData(region, days);
  }

  @Get('conflict/:region/stability')
  @ApiOperation({ summary: 'Get stability index for an ASEAN country' })
  @ApiParam({ name: 'region', description: 'Country name' })
  async getStability(@Param('region') region: string) {
    return this.intelligenceService.getStabilityIndex(region);
  }

  @Get('conflict/asean/stability')
  @ApiOperation({ summary: 'Get stability index for all ASEAN countries' })
  async getASEANStability() {
    return this.intelligenceService.getASEANStabilityIndex();
  }

  @Get('conflict/:region/news')
  @ApiOperation({ summary: 'Search conflict and security news' })
  @ApiParam({ name: 'region', description: 'Region or country name' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  async searchConflictNews(@Param('region') region: string, @Query('days') days?: number) {
    return this.intelligenceService.searchConflictNews(region, days);
  }

  // ==================== Corporate Endpoints ====================

  @Post('corporate')
  @ApiOperation({ summary: 'Identify corporate actors in policy text' })
  @ApiBody({ schema: { type: 'object', properties: { text: { type: 'string' } } } })
  async identifyCorporate(@Body() body: { text: string }) {
    return this.intelligenceService.identifyCorporateActors(body.text);
  }

  @Post('corporate/lookup')
  @ApiOperation({ summary: 'Look up a specific company on OpenCorporates' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string' },
        jurisdiction: { type: 'string', example: 'id' },
      },
    },
  })
  async lookupCompany(
    @Body() body: { companyName: string; jurisdiction?: string },
  ) {
    return this.intelligenceService.lookupCompany(body.companyName, body.jurisdiction);
  }

  @Get('corporate/:companyName/asean')
  @ApiOperation({ summary: 'Search for a company across all ASEAN jurisdictions' })
  @ApiParam({ name: 'companyName', description: 'Company name' })
  async getASEANSubsidiaries(@Param('companyName') companyName: string) {
    return this.intelligenceService.getASEANSubsidiaries(companyName);
  }

  // ==================== Archive Endpoints ====================

  @Post('archive')
  @ApiOperation({ summary: 'Archive a URL to the Wayback Machine' })
  @ApiBody({ schema: { type: 'object', properties: { url: { type: 'string' } } } })
  async archiveUrl(@Body() body: { url: string }) {
    return this.intelligenceService.archiveUrl(body.url);
  }

  @Post('archive/check')
  @ApiOperation({ summary: 'Check if a URL is already archived' })
  @ApiBody({ schema: { type: 'object', properties: { url: { type: 'string' } } } })
  async checkArchive(@Body() body: { url: string }) {
    return this.intelligenceService.checkArchive(body.url);
  }

  @Post('archive/brief')
  @ApiOperation({ summary: 'Archive all sources from a brief' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: { type: 'object', properties: { url: { type: 'string' }, id: { type: 'string' } } },
        },
      },
    },
  })
  async archiveBriefSources(@Body() body: { sources: Array<{ url?: string; id?: string }> }) {
    return this.intelligenceService.archiveBriefSources(body.sources);
  }
}
