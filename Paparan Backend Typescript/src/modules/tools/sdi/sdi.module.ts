import { Module, Global } from '@nestjs/common';
import { SdiService } from './sdi.service';

@Global()
@Module({
  providers: [SdiService],
  exports: [SdiService],
})
export class SdiModule {}
