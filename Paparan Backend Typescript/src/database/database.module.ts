import { Module, Global } from '@nestjs/common';
import { SupabaseClientService } from './supabase.client';
import { ReportsRepository } from './repositories/reports.repository';
import { FeedRepository } from './repositories/feed.repository';
import { DocumentsRepository } from './repositories/documents.repository';
import { IndicatorsRepository } from './repositories/indicators.repository';
import { JobsRepository } from './repositories/jobs.repository';
import { ChatRepository } from './repositories/chat.repository';
import { ConsistencyFlagsRepository } from './repositories/consistency-flags.repository';

@Global()
@Module({
  providers: [
    SupabaseClientService,
    ReportsRepository,
    FeedRepository,
    DocumentsRepository,
    IndicatorsRepository,
    JobsRepository,
    ChatRepository,
    ConsistencyFlagsRepository,
  ],
  exports: [
    SupabaseClientService,
    ReportsRepository,
    FeedRepository,
    DocumentsRepository,
    IndicatorsRepository,
    JobsRepository,
    ChatRepository,
    ConsistencyFlagsRepository,
  ],
})
export class DatabaseModule {}
