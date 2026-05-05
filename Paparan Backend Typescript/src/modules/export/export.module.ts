import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { DatabaseModule } from '@database/database.module';
import { AgentsModule } from '@modules/agents/agents.module';

@Module({
  imports: [DatabaseModule, AgentsModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
