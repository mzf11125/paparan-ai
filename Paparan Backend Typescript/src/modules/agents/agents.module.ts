import { Module } from '@nestjs/common';
import { ToolsModule } from '@modules/tools/tools.module';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { ToolExecutionService } from './tools/tool-execution.service';
import { ResearcherAgent } from './researcher/researcher.agent';
import { AnalystAgent } from './analyst/analyst.agent';
import { GovIntelAgent } from './gov-intel/gov-intel.agent';
import { MetadataExtractorAgent } from './metadata-extractor/metadata-extractor.agent';
import { ConsistencyCheckerAgent } from './consistency-checker/consistency-checker.agent';
import { ConversationalAgent } from './conversational/conversational.agent';
import { ScraperAgent } from './scraper/scraper.agent';
import { RpjmnScorerAgent } from './rpjmn-scorer/rpjmn-scorer.agent';
import { RdtiiExtractorAgent } from './rdtii-extractor/rdtii-extractor.agent';
import { SynthesizerAgent } from './synthesizer/synthesizer.agent';
import { AseanSimulatorAgent } from './asean-simulator/asean-simulator.agent';

@Module({
  imports: [ToolsModule],
  providers: [
    OrchestratorService,
    ToolExecutionService,
    ResearcherAgent,
    AnalystAgent,
    GovIntelAgent,
    MetadataExtractorAgent,
    ConsistencyCheckerAgent,
    ConversationalAgent,
    ScraperAgent,
    RpjmnScorerAgent,
    RdtiiExtractorAgent,
    SynthesizerAgent,
    AseanSimulatorAgent,
  ],
  exports: [
    OrchestratorService,
    ToolExecutionService,
    ResearcherAgent,
    AnalystAgent,
    GovIntelAgent,
    MetadataExtractorAgent,
    ConsistencyCheckerAgent,
    ConversationalAgent,
    ScraperAgent,
    RpjmnScorerAgent,
    RdtiiExtractorAgent,
    SynthesizerAgent,
    AseanSimulatorAgent,
  ],
})
export class AgentsModule {}
