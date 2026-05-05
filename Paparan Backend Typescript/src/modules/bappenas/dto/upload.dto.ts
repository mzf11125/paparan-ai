import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExtractionConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ConsistencyCheckType {
  DUPLICATE = 'duplicate',
  DEFINITION = 'definition',
  CALCULATION = 'calculation',
  ALL = 'all',
}

export class UploadDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  processingStatus: ProcessingStatus;

  @ApiProperty()
  uploadedAt: string;
}

export class ListDocumentsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by processing status', enum: ProcessingStatus })
  @IsOptional()
  @IsEnum(ProcessingStatus)
  status?: ProcessingStatus;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class ListIndicatorsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by document ID' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Filter by K/L code' })
  @IsOptional()
  @IsString()
  klCode?: string;

  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Filter by confidence level', enum: ExtractionConfidence })
  @IsOptional()
  @IsEnum(ExtractionConfidence)
  confidence?: ExtractionConfidence;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;
}

export class IndicatorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  indicatorCode: string;

  @ApiProperty()
  indicatorName: string;

  @ApiProperty()
  definition?: string;

  @ApiProperty()
  klCode: string;

  @ApiProperty()
  klName: string;

  @ApiProperty()
  sector?: string;

  @ApiProperty()
  sdiGoal?: string;

  @ApiProperty()
  unitType?: string;

  @ApiProperty()
  temporalResolution?: string;

  @ApiProperty()
  dataAvailability?: string;

  @ApiProperty({ enum: ExtractionConfidence })
  extractionConfidence: ExtractionConfidence;

  @ApiProperty()
  createdAt: string;
}

export class ListJobsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by job status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class JobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  progress: number;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  resultIndicatorsCount: number;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional()
  startedAt?: string;

  @ApiPropertyOptional()
  completedAt?: string;
}

export class ConsistencyCheckRequestDto {
  @ApiProperty({ description: 'List of indicator IDs to check', type: [String] })
  @IsString({ each: true })
  indicatorIds: string[];

  @ApiProperty({ enum: ConsistencyCheckType })
  @IsEnum(ConsistencyCheckType)
  checkType: ConsistencyCheckType;
}

export class ConsistencyFlagDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  indicatorId: string;

  @ApiProperty()
  flagType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional()
  resolvedAt?: string;

  @ApiPropertyOptional()
  resolutionNotes?: string;
}

export class ListConsistencyFlagsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', default: 'open' })
  @IsOptional()
  @IsString()
  status?: string = 'open';

  @ApiPropertyOptional({ description: 'Number of results to return', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class ResolveFlagRequestDto {
  @ApiProperty({ description: 'Notes about how the flag was resolved' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class KLCodeReferenceDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: 'ministry' | 'agency';

  @ApiProperty()
  rpjmnPillar?: string;
}

export class SectorReferenceDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  alternatives?: string[];
}

export class SDIGoalReferenceDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  perpresReference?: string;
}

export class CheckConsistencyResponseDto {
  @ApiProperty()
  checkedCount: number;

  @ApiProperty()
  flagsCreated: number;

  @ApiProperty()
  flags: ConsistencyFlagDto[];
}

export class IndicatorConsistencyCheckResponseDto {
  @ApiProperty()
  indicatorId: string;

  @ApiProperty({ type: [ConsistencyFlagDto] })
  potentialConflicts: ConsistencyFlagDto[];
}
