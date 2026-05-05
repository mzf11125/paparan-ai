import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SupabaseGuard } from '@modules/auth/supabase.guard';
import { AseanService } from './asean.service';

@ApiTags('asean')
@Controller('asean')
@UseGuards(SupabaseGuard)
export class AseanController {
  constructor(private aseanService: AseanService) {}

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate an ASEAN policy scenario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scenario: { type: 'string' },
        affected_pillars: { type: 'array', items: { type: 'string' } },
        meetingType: { type: 'string', enum: ['summit', 'ministerial', 'senior_officials', 'ad_hoc'] },
      },
      required: ['scenario'],
    },
  })
  async simulate(@Body() body: { scenario: string; affected_pillars?: string[]; meetingType?: string }) {
    return this.aseanService.simulate(body.scenario, body.affected_pillars);
  }

  @Get('knowledge-graph')
  @ApiOperation({ summary: 'Query the ASEAN policy knowledge graph' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query', example: 'ASEAN' })
  async queryKnowledgeGraph(@Query('q') query: string = 'ASEAN') {
    return this.aseanService.queryKnowledgeGraph(query);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get all ASEAN member states info' })
  async getCountries() {
    return this.aseanService.getCountries();
  }

  @Get('pillars')
  @ApiOperation({ summary: 'Get ASEAN community pillars' })
  async getPillars() {
    return this.aseanService.getPillars();
  }

  @Post('simulate/voting')
  @ApiOperation({ summary: 'Simulate ASEAN voting scenario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scenario: { type: 'string' },
        proposal: { type: 'string' },
      },
      required: ['scenario', 'proposal'],
    },
  })
  async simulateVoting(@Body() body: { scenario: string; proposal: string }) {
    return this.aseanService.simulateVoting(body.scenario, body.proposal);
  }

  @Post('simulate/compromises')
  @ApiOperation({ summary: 'Identify potential compromises for ASEAN scenario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scenario: { type: 'string' },
        positions: { type: 'array', items: { type: 'object' } },
      },
      required: ['scenario'],
    },
  })
  async identifyCompromises(@Body() body: { scenario: string; positions?: any[] }) {
    return this.aseanService.identifyCompromises(body.scenario, body.positions);
  }

  @Get('history/:caseId')
  @ApiOperation({ summary: 'Get historical ASEAN precedents for a scenario' })
  async getHistoricalPrecedents(@Body() body: { scenario: string }) {
    return this.aseanService.getHistoricalPrecedents(body.scenario);
  }

  @Post('talking-points')
  @ApiOperation({ summary: 'Generate diplomatic talking points for ASEAN discussions' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scenario: { type: 'string' },
        targetCountry: { type: 'string' },
      },
      required: ['scenario'],
    },
  })
  async generateTalkingPoints(@Body() body: { scenario: string; targetCountry?: string }) {
    return this.aseanService.generateTalkingPoints(body.scenario, body.targetCountry);
  }

  @Post('impact-assessment')
  @ApiOperation({ summary: 'Assess regional impact of ASEAN scenario outcome' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scenario: { type: 'string' },
        outcome: { type: 'string' },
      },
      required: ['scenario', 'outcome'],
    },
  })
  async assessRegionalImpact(@Body() body: { scenario: string; outcome: string }) {
    return this.aseanService.assessRegionalImpact(body.scenario, body.outcome);
  }
}
