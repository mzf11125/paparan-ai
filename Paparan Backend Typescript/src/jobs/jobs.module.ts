import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { DocumentExtractionProcessor } from './processors/document-extraction.processor';
import { ConsistencyCheckProcessor } from './processors/consistency-check.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'document-extraction',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
      {
        name: 'consistency-check',
        defaultJobOptions: {
          attempts: 2,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
      {
        name: 'scraping',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
    ),
  ],
  providers: [JobsService, DocumentExtractionProcessor, ConsistencyCheckProcessor],
  exports: [JobsService],
})
export class JobsModule {}
