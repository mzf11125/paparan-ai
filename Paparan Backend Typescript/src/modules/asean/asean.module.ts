import { Module } from '@nestjs/common';
import { AseanController } from './asean.controller';
import { AseanService } from './asean.service';

@Module({
  controllers: [AseanController],
  providers: [AseanService],
  exports: [AseanService],
})
export class AseanModule {}
