import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpatialToolsService } from './spatial-tools.service';
import { MaritimeIntelligenceService } from './maritime-intelligence.service';
import { EnvironmentalIntelligenceService } from './environmental-intelligence.service';
import { ConflictIntelligenceService } from './conflict-intelligence.service';
import { CorporateIntelligenceService } from './corporate-intelligence.service';
import { ArchiveService } from './archive.service';

// Keep backward compatibility with existing service names if they exist
import { MaritimeService } from './maritime.service';
import { EnvironmentalService } from './environmental.service';
import { ConflictService } from './conflict.service';
import { CorporateService } from './corporate.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SpatialToolsService,
    MaritimeIntelligenceService,
    EnvironmentalIntelligenceService,
    ConflictIntelligenceService,
    CorporateIntelligenceService,
    ArchiveService,
    // Legacy services for backward compatibility
    MaritimeService,
    EnvironmentalService,
    ConflictService,
    CorporateService,
  ],
  exports: [
    SpatialToolsService,
    MaritimeIntelligenceService,
    EnvironmentalIntelligenceService,
    ConflictIntelligenceService,
    CorporateIntelligenceService,
    ArchiveService,
    MaritimeService,
    EnvironmentalService,
    ConflictService,
    CorporateService,
  ],
})
export class BellingcatModule {}
