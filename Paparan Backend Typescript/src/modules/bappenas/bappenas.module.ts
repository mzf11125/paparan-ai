import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-multer';
import { BappenasController } from './bappenas.controller';
import { BappenasService } from './bappenas.service';
import { SdiModule } from '@modules/tools/sdi/sdi.module';
import { DatabaseModule } from '@database/database.module';
import { JobsModule } from '@jobs/jobs.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
    SdiModule,
    DatabaseModule,
    JobsModule,
  ],
  controllers: [BappenasController],
  providers: [BappenasService],
  exports: [BappenasService],
})
export class BappenasModule {}
