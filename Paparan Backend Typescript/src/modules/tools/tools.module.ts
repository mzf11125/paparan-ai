import { Module } from '@nestjs/common';
import { TavilyService } from './tavily/tavily.service';
import { SupabaseToolsService } from './supabase-tools/supabase-tools.service';
import { HttpClientService } from './http/http-client.service';
import { BellingcatModule } from './bellingcat/bellingcat.module';
import { SdiService } from './sdi/sdi.service';
import { BappenasToolsService } from './bappenas/bappenas.service';
import { RpjmnService } from './rpjmn/rpjmn.service';
import { RdtiiService } from './rdtii/rdtii.service';
import { DocumentProcessorService } from './document-processor/document-processor.service';
import { ExportToolsService } from './export/export.service';
import { KnowledgeGraphService } from './knowledge-graph/knowledge-graph.service';

@Module({
  imports: [BellingcatModule],
  providers: [
    TavilyService,
    SupabaseToolsService,
    HttpClientService,
    SdiService,
    BappenasToolsService,
    RpjmnService,
    RdtiiService,
    DocumentProcessorService,
    ExportToolsService,
    KnowledgeGraphService,
  ],
  exports: [
    TavilyService,
    SupabaseToolsService,
    HttpClientService,
    BellingcatModule,
    SdiService,
    BappenasToolsService,
    RpjmnService,
    RdtiiService,
    DocumentProcessorService,
    ExportToolsService,
    KnowledgeGraphService,
  ],
})
export class ToolsModule {}
