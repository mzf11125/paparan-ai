import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { JobsRepository, JobType } from '@database/repositories/jobs.repository';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('document-extraction') private documentExtractionQueue: Queue,
    @InjectQueue('consistency-check') private consistencyCheckQueue: Queue,
    @InjectQueue('scraping') private scrapingQueue: Queue,
    private jobsRepository: JobsRepository,
  ) {}

  async queueDocumentExtraction(documentId: string, userId: string) {
    // Create job record in database
    const job = await this.jobsRepository.create({
      userId,
      type: JobType.DOCUMENT_EXTRACTION,
      documentId,
    });

    // Add to queue
    await this.documentExtractionQueue.add(
      { documentId, userId },
      { jobId: job.id },
    );

    return job;
  }

  async queueConsistencyCheck(documentId: string, userId: string) {
    // Create job record in database
    const job = await this.jobsRepository.create({
      userId,
      type: JobType.CONSISTENCY_CHECK,
      documentId,
    });

    // Add to queue
    await this.consistencyCheckQueue.add(
      { documentId, userId },
      { jobId: job.id },
    );

    return job;
  }

  async queueScrape(source: string, userId: string) {
    // Create job record in database
    const job = await this.jobsRepository.create({
      userId,
      type: JobType.SCRAPE,
      metadata: { source },
    });

    // Add to queue
    await this.scrapingQueue.add(
      { source, userId },
      { jobId: job.id },
    );

    return job;
  }

  async getJobStatus(jobId: string) {
    return this.jobsRepository.findById(jobId);
  }

  async getUserJobs(userId: string, limit = 10, offset = 0) {
    return this.jobsRepository.findByUser(userId, limit, offset);
  }
}
