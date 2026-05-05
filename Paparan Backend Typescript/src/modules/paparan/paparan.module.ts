import { Module } from '@nestjs/common';
import { PaparanController } from './paparan.controller';
import { PaparanService } from './paparan.service';

@Module({
  controllers: [PaparanController],
  providers: [PaparanService],
  exports: [PaparanService],
})
export class PaparanModule {}
