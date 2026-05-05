import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaparanModule } from './modules/paparan/paparan.module';
import { ChatModule } from './modules/chat/chat.module';
import { BappenasModule } from './modules/bappenas/bappenas.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { AseanModule } from './modules/asean/asean.module';
import { ScrapeModule } from './modules/scrape/scrape.module';
import { ExportModule } from './modules/export/export.module';
import { FeedModule } from './modules/feed/feed.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ToolsModule } from './modules/tools/tools.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthController } from './modules/health/health.controller';
import { LLMModule } from './config/llm.module';
import { LLMService } from './config/llm.service';

@Module({
  controllers: [HealthController],
  providers: [
    { provide: 'LLM_SERVICE', useExisting: LLMService },
  ],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // BullMQ for background jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', undefined),
        },
      }),
      inject: [ConfigService],
    }),

    // Core modules
    LLMModule.registerAsync(),
    DatabaseModule,
    AuthModule,
    JobsModule,

    // Feature modules
    PaparanModule,
    ChatModule,
    BappenasModule,
    IntelligenceModule,
    AseanModule,
    ScrapeModule,
    ExportModule,
    FeedModule,
    AgentsModule,
    ToolsModule,
  ],
  providers: [],
})
export class AppModule {}
