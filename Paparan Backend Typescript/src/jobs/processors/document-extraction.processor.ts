import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobsRepository, JobStatus } from '@database/repositories/jobs.repository';
import { MetadataExtractorAgent } from '@modules/agents/metadata-extractor/metadata-extractor.agent';

interface DocumentExtractionJob {
  documentId: string;
  userId: string;
}

@Processor('document-extraction')
export class DocumentExtractionProcessor {
  private readonly logger = new Logger(DocumentExtractionProcessor.name);

  constructor(
    private jobsRepository: JobsRepository,
    private metadataExtractor: MetadataExtractorAgent,
  ) {}

  @Process('document-extraction')
  async handle(job: Job<DocumentExtractionJob>) {
    const { documentId, userId } = job.data;
    const jobId = job.id as string;

    this.logger.log(`Processing document extraction for document: ${documentId}`);

    try {
      // Update job status to processing
      await this.jobsRepository.update(jobId, { status: JobStatus.PROCESSING });

      // Run metadata extraction
      const result = await this.metadataExtractor.extractFromDocument(documentId);

      // Update job status to completed
      await this.jobsRepository.update(jobId, {
        status: JobStatus.COMPLETED,
        result,
      });

      this.logger.log(`Completed document extraction for document: ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed document extraction for document: ${documentId}`,
        error,
      );

      // Update job status to failed
      await this.jobsRepository.update(jobId, {
        status: JobStatus.FAILED,
        error: error.message,
      });

      throw error;
    }
  }
}
