import { Controller, Get, Post, Param, Body, UseGuards, Res, Query, ParseIntPipe } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseGuard } from '@modules/auth/supabase.guard';
import { CurrentUser } from '@common/decorators/user.decorator';
import { UserInfo } from '@modules/auth/auth.service';
import { ExportService } from './export.service';

@ApiTags('briefs')
@Controller('briefs')
@UseGuards(SupabaseGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  // ==================== Export Endpoints ====================

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export brief as PDF' })
  async exportPdf(
    @Param('id') id: string,
    @CurrentUser() user: UserInfo,
    @Res() res: Response,
  ) {
    const result = await this.exportService.generatePdf(id, user.id);
    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size,
    });
    res.send(result.buffer);
  }

  @Get(':id/export/pptx')
  @ApiOperation({ summary: 'Export brief as PowerPoint' })
  async exportPptx(
    @Param('id') id: string,
    @CurrentUser() user: UserInfo,
    @Res() res: Response,
  ) {
    const result = await this.exportService.generatePptx(id, user.id);
    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size,
    });
    res.send(result.buffer);
  }

  @Post(':id/export/diplomat-pdf')
  @ApiOperation({ summary: 'Export brief as formal diplomatic memo PDF' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        fromName: { type: 'string' },
        ref: { type: 'string' },
        distribution: { type: 'array', items: { type: 'string' } },
      },
      required: ['to', 'fromName'],
    },
  })
  async exportDiplomatPdf(
    @Param('id') id: string,
    @Body() body: { to: string; fromName: string; ref?: string; distribution?: string[] },
    @CurrentUser() user: UserInfo,
    @Res() res: Response,
  ) {
    const result = await this.exportService.generateDiplomaticPdf(id, body, user.id);
    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size,
    });
    res.send(result.buffer);
  }

  // ==================== Brief Enhancement Endpoints ====================

  @Post(':id/rpjmn-score')
  @ApiOperation({ summary: 'Score a brief against RPJMN 2025-2029 Asta Cita pillars' })
  async scoreRpjmn(
    @Param('id') id: string,
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.scoreRpjmn(id, user.id);
  }

  @Post(':id/talking-points')
  @ApiOperation({ summary: 'Generate diplomat talking points for a brief' })
  async getTalkingPoints(
    @Param('id') id: string,
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.generateTalkingPoints(id, user.id);
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Record read receipt / acknowledgement for a diplomat brief' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        acknowledged_by: { type: 'string' },
      },
      required: ['acknowledged_by'],
    },
  })
  async acknowledgeBrief(
    @Param('id') id: string,
    @Body() body: { acknowledged_by: string },
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.acknowledgeBrief(id, body.acknowledged_by, user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a brief' })
  async getBriefVersions(
    @Param('id') id: string,
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.getBriefVersions(id);
  }

  // ==================== Synthesis Endpoints ====================

  @Post('synthesize')
  @ApiOperation({ summary: 'Synthesize insights across multiple briefs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        brief_ids: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 10 },
        synthesis_type: { type: 'string', enum: ['comprehensive', 'comparative', 'trend', 'gaps'] },
      },
      required: ['brief_ids'],
    },
  })
  async synthesizeBriefs(
    @Body() body: { brief_ids: string[]; synthesis_type?: string },
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.synthesizeBriefs(body.brief_ids, user.id, {
      synthesisType: body.synthesis_type,
    });
  }

  // ==================== Outcome Endpoints ====================

  @Post(':id/outcome')
  @ApiOperation({ summary: 'Record policymaker outcome and rating for a brief' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rating: { type: 'number', minimum: 1, maximum: 5 },
        outcome_notes: { type: 'string' },
        action_taken: { type: 'boolean' },
      },
      required: ['rating'],
    },
  })
  async recordOutcome(
    @Param('id') id: string,
    @Body() body: { rating: number; outcome_notes?: string; action_taken?: boolean },
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.recordOutcome(id, body.rating, body.outcome_notes, body.action_taken);
  }

  @Get(':id/outcome')
  @ApiOperation({ summary: 'Get outcomes and ratings for a brief' })
  async getOutcomes(
    @Param('id') id: string,
    @CurrentUser() user: UserInfo,
  ) {
    return this.exportService.getOutcomes(id);
  }
}
