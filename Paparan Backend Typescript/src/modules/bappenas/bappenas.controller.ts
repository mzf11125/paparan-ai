import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SupabaseGuard } from '@modules/auth/supabase.guard';
import { CurrentUser } from '@common/decorators/user.decorator';
import { UserInfo } from '@modules/auth/auth.service';
import { BappenasService } from './bappenas.service';
import {
  UploadDocumentResponseDto,
  ListDocumentsQueryDto,
  ListIndicatorsQueryDto,
  IndicatorDto,
  ListJobsQueryDto,
  JobDto,
  ConsistencyCheckRequestDto,
  CheckConsistencyResponseDto,
  ListConsistencyFlagsQueryDto,
  ConsistencyFlagDto,
  ResolveFlagRequestDto,
  IndicatorConsistencyCheckResponseDto,
  KLCodeReferenceDto,
  SectorReferenceDto,
  SDIGoalReferenceDto,
} from './dto/upload.dto';

@ApiTags('bappenas')
@Controller('bappenas')
@UseGuards(SupabaseGuard)
@ApiBearerAuth()
export class BappenasController {
  constructor(private bappenasService: BappenasService) {}

  // ==================== Document Endpoints ====================

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for metadata extraction' })
  @ApiConsumes('multipart/form-data')
  async uploadDocument(
    @CurrentUser() user: UserInfo,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadDocumentResponseDto> {
    return this.bappenasService.uploadDocument(user.id, file);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List uploaded Bappenas documents' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getDocuments(
    @CurrentUser() user: UserInfo,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const query: ListDocumentsQueryDto = { status, limit, offset };
    return this.bappenasService.getUserDocuments(user.id, query);
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Get a specific Bappenas document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  async getDocument(@CurrentUser() user: UserInfo, @Param('documentId') documentId: string) {
    return this.bappenasService.getDocument(documentId, user.id);
  }

  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Delete a document and its related data' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  async deleteDocument(@CurrentUser() user: UserInfo, @Param('documentId') documentId: string) {
    return this.bappenasService.deleteDocument(documentId, user.id);
  }

  // ==================== Indicator Endpoints ====================

  @Get('indicators')
  @ApiOperation({ summary: 'List extracted SDI indicators' })
  @ApiQuery({ name: 'documentId', required: false })
  @ApiQuery({ name: 'klCode', required: false })
  @ApiQuery({ name: 'sector', required: false })
  @ApiQuery({ name: 'confidence', required: false, enum: ['HIGH', 'MEDIUM', 'LOW'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getIndicators(
    @CurrentUser() user: UserInfo,
    @Query('documentId') documentId?: string,
    @Query('klCode') klCode?: string,
    @Query('sector') sector?: string,
    @Query('confidence') confidence?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
  ): Promise<IndicatorDto[]> {
    const query: ListIndicatorsQueryDto = {
      documentId,
      klCode,
      sector,
      confidence: confidence as any,
      limit,
      page,
    };
    return this.bappenasService.getIndicators(user.id, query);
  }

  @Get('indicators/:indicatorId')
  @ApiOperation({ summary: 'Get a specific indicator' })
  @ApiParam({ name: 'indicatorId', description: 'Indicator ID' })
  async getIndicator(@CurrentUser() user: UserInfo, @Param('indicatorId') indicatorId: string): Promise<IndicatorDto> {
    return this.bappenasService.getIndicator(indicatorId, user.id);
  }

  @Delete('indicators/:indicatorId')
  @ApiOperation({ summary: 'Delete an indicator' })
  @ApiParam({ name: 'indicatorId', description: 'Indicator ID' })
  async deleteIndicator(@CurrentUser() user: UserInfo, @Param('indicatorId') indicatorId: string) {
    return this.bappenasService.deleteIndicator(indicatorId, user.id);
  }

  @Get('indicators/:indicatorId/check-consistency')
  @ApiOperation({ summary: 'Check a single indicator for consistency' })
  @ApiParam({ name: 'indicatorId', description: 'Indicator ID' })
  async checkIndicatorConsistency(
    @CurrentUser() user: UserInfo,
    @Param('indicatorId') indicatorId: string,
  ): Promise<IndicatorConsistencyCheckResponseDto> {
    return this.bappenasService.checkIndicatorConsistency(indicatorId, user.id);
  }

  // ==================== Job Endpoints ====================

  @Get('jobs')
  @ApiOperation({ summary: 'List extraction jobs' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getJobs(
    @CurrentUser() user: UserInfo,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<JobDto[]> {
    const query: ListJobsQueryDto = { status, limit };
    return this.bappenasService.getJobs(user.id, query);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get job status' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  async getJob(@CurrentUser() user: UserInfo, @Param('jobId') jobId: string): Promise<JobDto> {
    return this.bappenasService.getJob(jobId, user.id);
  }

  // ==================== Consistency Check Endpoints ====================

  @Post('indicators/check-consistency')
  @ApiOperation({ summary: 'Trigger consistency check for indicators' })
  async checkConsistency(
    @CurrentUser() user: UserInfo,
    @Body() body: ConsistencyCheckRequestDto,
  ): Promise<CheckConsistencyResponseDto> {
    return this.bappenasService.checkConsistency(user.id, body.indicatorIds, body.checkType);
  }

  @Get('consistency-flags')
  @ApiOperation({ summary: 'List consistency flags' })
  @ApiQuery({ name: 'status', required: false, defaultValue: 'open' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getConsistencyFlags(
    @CurrentUser() user: UserInfo,
    @Query('status') status: string = 'open',
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ): Promise<ConsistencyFlagDto[]> {
    return this.bappenasService.getConsistencyFlags(user.id, status, limit);
  }

  @Put('consistency-flags/:flagId/resolve')
  @ApiOperation({ summary: 'Resolve a consistency flag' })
  @ApiParam({ name: 'flagId', description: 'Flag ID' })
  async resolveConsistencyFlag(
    @CurrentUser() user: UserInfo,
    @Param('flagId') flagId: string,
    @Body() body: ResolveFlagRequestDto,
  ): Promise<ConsistencyFlagDto> {
    return this.bappenasService.resolveConsistencyFlag(flagId, user.id, body.resolutionNotes);
  }

  // ==================== Reference Data Endpoints ====================

  @Get('references/kl-codes')
  @ApiOperation({ summary: 'Get all K/L reference codes' })
  async getKLCodes(): Promise<KLCodeReferenceDto[]> {
    return this.bappenasService.getKLCodes();
  }

  @Get('references/sectors')
  @ApiOperation({ summary: 'Get all sector reference codes' })
  async getSectors(): Promise<SectorReferenceDto[]> {
    return this.bappenasService.getSectors();
  }

  @Get('references/sdi-goals')
  @ApiOperation({ summary: 'Get all SDI goal reference codes' })
  async getSDIGoals(): Promise<SDIGoalReferenceDto[]> {
    return this.bappenasService.getSDIGoals();
  }

  // ==================== Search Endpoints ====================

  @Get('search/kl-codes')
  @ApiOperation({ summary: 'Search K/L codes by name or code' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  async searchKLCodes(@Query('q') query: string): Promise<KLCodeReferenceDto[]> {
    return this.bappenasService.searchKLCodes(query);
  }

  @Get('references/sector-definitions')
  @ApiOperation({ summary: 'Get sector definitions' })
  async getSectorDefinitions(): Promise<Record<string, any>> {
    return this.bappenasService.getSectorDefinitions();
  }
}
