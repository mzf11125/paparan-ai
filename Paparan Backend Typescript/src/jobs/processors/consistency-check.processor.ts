import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobsRepository, JobStatus } from '@database/repositories/jobs.repository';
import { ConsistencyCheckerAgent } from '@modules/agents/consistency-checker/consistency-checker.agent';

interface ConsistencyCheckJob {
  documentId: string;
  userId: string;
}

@Processor('consistency-check')
export class ConsistencyCheckProcessor {
  private readonly logger = new Logger(ConsistencyCheckProcessor.name);

  constructor(
    private jobsRepository: JobsRepository,
    private consistencyChecker: ConsistencyCheckerAgent,
  ) {}

  @Process('consistency-check')
  async handle(job: Job<ConsistencyCheckJob>) {
    const { documentId, userId } = job.data;
    const jobId = job.id as string;

    this.logger.log(`Processing consistency check for document: ${documentId}`);

    try {
      // Update job status to processing
      await this.jobsRepository.update(jobId, { status: JobStatus.PROCESSING });

      // Run consistency check
      const result = await this.consistencyChecker.checkDocument(documentId);

      // Update job status to completed
      await this.jobsRepository.update(jobId, {
        status: JobStatus.COMPLETED,
        result,
      });

      this.logger.log(`Completed consistency check for document: ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed consistency check for document: ${documentId}`,
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
