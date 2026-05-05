import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DocumentsRepository } from '@database/repositories/documents.repository';
import { IndicatorsRepository } from '@database/repositories/indicators.repository';
import { JobsRepository, JobType } from '@database/repositories/jobs.repository';
import { ConsistencyFlagsRepository } from '@database/repositories/consistency-flags.repository';
import { JobsService } from '@jobs/jobs.service';
import { SdiService } from '@modules/tools/sdi/sdi.service';
import { MetadataExtractorAgent } from '@modules/agents/metadata-extractor/metadata-extractor.agent';
import { ConsistencyCheckerAgent } from '@modules/agents/consistency-checker/consistency-checker.agent';
import {
  UploadDocumentResponseDto,
  ProcessingStatus,
  IndicatorDto,
  JobDto,
  ConsistencyFlagDto,
  ListDocumentsQueryDto,
  ListIndicatorsQueryDto,
  ListJobsQueryDto,
  CheckConsistencyResponseDto,
  IndicatorConsistencyCheckResponseDto,
  KLCodeReferenceDto,
  SectorReferenceDto,
  SDIGoalReferenceDto,
  ExtractionConfidence,
  ConsistencyCheckType,
} from './dto/upload.dto';

@Injectable()
export class BappenasService {
  private readonly logger = new Logger(BappenasService.name);

  constructor(
    private documentsRepository: DocumentsRepository,
    private indicatorsRepository: IndicatorsRepository,
    private jobsRepository: JobsRepository,
    private consistencyFlagsRepository: ConsistencyFlagsRepository,
    private jobsService: JobsService,
    private sdiService: SdiService,
    private metadataExtractor: MetadataExtractorAgent,
    private consistencyChecker: ConsistencyCheckerAgent,
  ) {}

  /**
   * Upload a document for metadata extraction
   */
  async uploadDocument(userId: string, file: Express.Multer.File): Promise<UploadDocumentResponseDto> {
    // Save document record
    const document = await this.documentsRepository.create({
      userId,
      filename: file.originalname,
      storagePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      processingStatus: ProcessingStatus.PENDING,
    });

    // Queue metadata extraction
    await this.jobsService.queueDocumentExtraction(document.id, userId);

    this.logger.log(`Document uploaded: ${document.id} by user ${userId}`);

    return {
      id: document.id,
      filename: document.filename,
      storagePath: document.storagePath,
      fileType: document.fileType,
      fileSize: document.fileSize,
      processingStatus: document.processingStatus as ProcessingStatus,
      uploadedAt: document.uploadedAt,
    };
  }

  /**
   * Get user's documents with optional filtering
   */
  async getUserDocuments(userId: string, query?: ListDocumentsQueryDto): Promise<any[]> {
    const status = query?.status;
    const limit = query?.limit || 20;
    const offset = query?.offset || 0;

    return this.documentsRepository.findByUser(userId, { status, limit, offset });
  }

  /**
   * Get a specific document
   */
  async getDocument(documentId: string, userId: string): Promise<any> {
    const document = await this.documentsRepository.findOne(documentId, userId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Delete a document and its related data
   */
  async deleteDocument(documentId: string, userId: string): Promise<{ deleted: boolean }> {
    const document = await this.documentsRepository.findOne(documentId, userId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete related indicators
    await this.indicatorsRepository.deleteByDocument(documentId);

    // Delete the document
    await this.documentsRepository.delete(documentId);

    this.logger.log(`Document deleted: ${documentId} by user ${userId}`);

    return { deleted: true };
  }

  /**
   * Get indicators with optional filtering
   */
  async getIndicators(userId: string, query?: ListIndicatorsQueryDto): Promise<IndicatorDto[]> {
    const filters = {
      documentId: query?.documentId,
      klCode: query?.klCode,
      sector: query?.sector,
      confidence: query?.confidence,
      limit: query?.limit || 20,
      page: query?.page || 1,
    };

    const indicators = await this.indicatorsRepository.findByUser(userId, filters);

    return indicators.map(ind => this.mapToIndicatorDto(ind));
  }

  /**
   * Get a specific indicator
   */
  async getIndicator(indicatorId: string, userId: string): Promise<IndicatorDto> {
    const indicator = await this.indicatorsRepository.findOne(indicatorId, userId);

    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }

    return this.mapToIndicatorDto(indicator);
  }

  /**
   * Delete an indicator
   */
  async deleteIndicator(indicatorId: string, userId: string): Promise<{ deleted: boolean }> {
    const indicator = await this.indicatorsRepository.findOne(indicatorId, userId);

    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }

    await this.indicatorsRepository.delete(indicatorId);

    this.logger.log(`Indicator deleted: ${indicatorId} by user ${userId}`);

    return { deleted: true };
  }

  /**
   * Get extraction jobs
   */
  async getJobs(userId: string, query?: ListJobsQueryDto): Promise<JobDto[]> {
    const status = query?.status;
    const limit = query?.limit || 20;

    const jobs = await this.jobsRepository.findByUser(userId, { status, limit });

    return jobs.map(job => this.mapToJobDto(job));
  }

  /**
   * Get a specific job
   */
  async getJob(jobId: string, userId: string): Promise<JobDto> {
    const job = await this.jobsRepository.findOne(jobId, userId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.mapToJobDto(job);
  }

  /**
   * Check consistency for multiple indicators
   */
  async checkConsistency(
    userId: string,
    indicatorIds: string[],
    checkType: ConsistencyCheckType,
  ): Promise<CheckConsistencyResponseDto> {
    this.logger.log(`Checking consistency for ${indicatorIds.length} indicators, type: ${checkType}`);

    // Get all indicators
    const indicators = await this.indicatorsRepository.findByIds(indicatorIds, userId);

    if (indicators.length === 0) {
      return {
        checkedCount: 0,
        flagsCreated: 0,
        flags: [],
      };
    }

    // Use ConsistencyChecker agent
    const context = { userId };
    const response = await this.consistencyChecker.executeSafe(
      {
        indicators,
        checkType,
      },
      context,
    );

    if (!response.success) {
      this.logger.error(`Consistency check failed: ${response.error}`);
      return {
        checkedCount: indicators.length,
        flagsCreated: 0,
        flags: [],
      };
    }

    // Save any flags that were created
    const flags = response.data.flags || [];
    for (const flag of flags) {
      await this.consistencyFlagsRepository.create({
        userId,
        indicatorId: flag.indicatorId,
        flagType: flag.flagType,
        description: flag.description,
        status: 'open',
      });
    }

    return {
      checkedCount: indicators.length,
      flagsCreated: flags.length,
      flags: flags.map(f => this.mapToConsistencyFlagDto(f)),
    };
  }

  /**
   * Check consistency for a single indicator
   */
  async checkIndicatorConsistency(indicatorId: string, userId: string): Promise<IndicatorConsistencyCheckResponseDto> {
    const indicator = await this.indicatorsRepository.findOne(indicatorId, userId);

    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }

    // Use ConsistencyChecker agent for single indicator
    const context = { userId };
    const response = await this.consistencyChecker.executeSafe(
      {
        indicators: [indicator],
        checkType: ConsistencyCheckType.ALL,
      },
      context,
    );

    const potentialConflicts = response.success ? (response.data.flags || []) : [];

    return {
      indicatorId,
      potentialConflicts: potentialConflicts.map(f => this.mapToConsistencyFlagDto(f)),
    };
  }

  /**
   * Get consistency flags
   */
  async getConsistencyFlags(userId: string, status: string = 'open', limit: number = 50): Promise<ConsistencyFlagDto[]> {
    const flags = await this.consistencyFlagsRepository.findByUser(userId, { status, limit });

    return flags.map(flag => this.mapToConsistencyFlagDto(flag));
  }

  /**
   * Resolve a consistency flag
   */
  async resolveConsistencyFlag(flagId: string, userId: string, resolutionNotes?: string): Promise<ConsistencyFlagDto> {
    const flag = await this.consistencyFlagsRepository.findOne(flagId, userId);

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    const updated = await this.consistencyFlagsRepository.update(flagId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolutionNotes,
    });

    this.logger.log(`Flag resolved: ${flagId} by user ${userId}`);

    return this.mapToConsistencyFlagDto(updated);
  }

  /**
   * Get all K/L code references
   */
  async getKLCodes(): Promise<KLCodeReferenceDto[]> {
    return this.sdiService.getAllKLCodes();
  }

  /**
   * Get all sector references
   */
  async getSectors(): Promise<SectorReferenceDto[]> {
    return this.sdiService.getAllSectors();
  }

  /**
   * Get all SDI goal references
   */
  async getSDIGoals(): Promise<SDIGoalReferenceDto[]> {
    return this.sdiService.getAllSDIGoals();
  }

  /**
   * Search K/L codes
   */
  async searchKLCodes(query: string): Promise<KLCodeReferenceDto[]> {
    return this.sdiService.searchKLCodes(query);
  }

  /**
   * Validate an indicator structure
   */
  async validateIndicator(indicator: any): Promise<{ valid: boolean; errors: string[] }> {
    return this.sdiService.validateIndicator(indicator);
  }

  /**
   * Format an indicator code
   */
  async formatIndicatorCode(klCode: string, indicatorNumber: string): Promise<string> {
    return this.sdiService.formatIndicatorCode(klCode, indicatorNumber);
  }

  /**
   * Parse an indicator code
   */
  async parseIndicatorCode(code: string): Promise<{ klCode: string; indicatorNumber: string } | null> {
    return this.sdiService.parseIndicatorCode(code);
  }

  /**
   * Get sector definitions
   */
  async getSectorDefinitions(): Promise<Record<string, any>> {
    return this.sdiService.getSectorDefinitions();
  }

  // ==================== Private Methods ====================

  private mapToIndicatorDto(indicator: any): IndicatorDto {
    return {
      id: indicator.id,
      documentId: indicator.documentId,
      indicatorCode: indicator.indicatorCode,
      indicatorName: indicator.indicatorName,
      definition: indicator.definition,
      klCode: indicator.klCode,
      klName: indicator.klName || this.sdiService.getKLName(indicator.klCode),
      sector: indicator.sector,
      sdiGoal: indicator.sdiGoal,
      unitType: indicator.unitType,
      temporalResolution: indicator.temporalResolution,
      dataAvailability: indicator.dataAvailability,
      extractionConfidence: indicator.extractionConfidence as ExtractionConfidence,
      createdAt: indicator.createdAt,
    };
  }

  private mapToJobDto(job: any): JobDto {
    return {
      id: job.id,
      status: job.status,
      progress: job.progress || 0,
      errorMessage: job.errorMessage,
      resultIndicatorsCount: job.resultIndicatorsCount || 0,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  private mapToConsistencyFlagDto(flag: any): ConsistencyFlagDto {
    return {
      id: flag.id,
      indicatorId: flag.indicatorId,
      flagType: flag.flagType,
      description: flag.description,
      status: flag.status,
      createdAt: flag.createdAt,
      resolvedAt: flag.resolvedAt,
      resolutionNotes: flag.resolutionNotes,
    };
  }
}
