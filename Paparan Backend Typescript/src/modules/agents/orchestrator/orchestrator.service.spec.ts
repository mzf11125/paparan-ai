import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorService } from './orchestrator.service';
import { LLMService } from '@config/llm.service';
import { ResearcherAgent } from '../researcher/researcher.agent';
import { AnalystAgent } from '../analyst/analyst.agent';
import { GovIntelAgent } from '../gov-intel/gov-intel.agent';
import { MetadataExtractorAgent } from '../metadata-extractor/metadata-extractor.agent';
import { RpjmnScorerAgent } from '../rpjmn-scorer/rpjmn-scorer.agent';
import { AseanSimulatorAgent } from '../asean-simulator/asean-simulator.agent';
import { RdtiiExtractorAgent } from '../rdtii-extractor/rdtii-extractor.agent';
import { TavilyService } from '@modules/tools/tavily/tavily.service';
import { SupabaseToolsService } from '@modules/tools/supabase-tools/supabase-tools.service';
import { DocumentProcessorService } from '@modules/tools/document-processor/document-processor.service';
import { SdiService } from '@modules/tools/sdi/sdi.service';
import { RpjmnService } from '@modules/tools/rpjmn/rpjmn.service';
import { RdtiiService } from '@modules/tools/rdtii/rdtii.service';
import { KnowledgeGraphService } from '@modules/tools/knowledge-graph/knowledge-graph.service';
import { HttpClientService } from '@modules/tools/http/http-client.service';

/**
 * Integration tests for OrchestratorService
 */
describe('OrchestratorService', () => {
  let orchestrator: OrchestratorService;
  let llmService: jest.Mocked<LLMService>;

  // Mock LLM Service
  const mockLLMService = {
    chat: jest.fn(),
    stream: jest.fn(),
    generateStructured: jest.fn(),
    generateStructuredWithRetry: jest.fn(),
    classifyTopic: jest.fn(),
    generatePolicyBrief: jest.fn(),
    getProviderType: jest.fn().mockReturnValue('zai'),
  };

  // Mock Tool Services
  const mockTavilyService = {
    search: jest.fn().mockResolvedValue([]),
  };

  const mockSupabaseToolsService = {
    vectorSearch: jest.fn().mockResolvedValue([]),
  };

  const mockDocumentProcessorService = {
    extractText: jest.fn().mockResolvedValue({ content: 'mock content' }),
    processUrl: jest.fn().mockResolvedValue({ content: 'mock content', fileName: 'test.txt' }),
  };

  const mockSdiService = {
    lookupIndicator: jest.fn(),
  };

  const mockRpjmnService = {
    getPillars: jest.fn().mockResolvedValue([]),
  };

  const mockRdtiiService = {
    searchRegulations: jest.fn().mockResolvedValue([]),
  };

  const mockKnowledgeGraphService = {
    query: jest.fn().mockResolvedValue([]),
  };

  const mockHttpClientService = {
    get: jest.fn(),
    downloadFile: jest.fn().mockResolvedValue(Buffer.from('test')),
  };

  beforeEach(async () => {
    // Create mock providers
    const providers = {
      LLMService: {
        provide: LLMService,
        useValue: mockLLMService,
      },
      TavilyService: {
        provide: TavilyService,
        useValue: mockTavilyService,
      },
      SupabaseToolsService: {
        provide: SupabaseToolsService,
        useValue: mockSupabaseToolsService,
      },
      DocumentProcessorService: {
        provide: DocumentProcessorService,
        useValue: mockDocumentProcessorService,
      },
      SdiService: {
        provide: SdiService,
        useValue: mockSdiService,
      },
      RpjmnService: {
        provide: RpjmnService,
        useValue: mockRpjmnService,
      },
      RdtiiService: {
        provide: RdtiiService,
        useValue: mockRdtiiService,
      },
      KnowledgeGraphService: {
        provide: KnowledgeGraphService,
        useValue: mockKnowledgeGraphService,
      },
      HttpClientService: {
        provide: HttpClientService,
        useValue: mockHttpClientService,
      },
    };

    // Create the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        ResearcherAgent,
        AnalystAgent,
        GovIntelAgent,
        MetadataExtractorAgent,
        RpjmnScorerAgent,
        AseanSimulatorAgent,
        RdtiiExtractorAgent,
        ...Object.values(providers),
      ],
    }).compile();

    orchestrator = module.get<OrchestratorService>(OrchestratorService);
    llmService = mockLLMService as jest.Mocked<LLMService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent Registration', () => {
    it('should register all agents on initialization', () => {
      const agents = orchestrator.getRegisteredAgents();

      expect(agents).toContain('researcher');
      expect(agents).toContain('analyst');
      expect(agents).toContain('gov_intel');
      expect(agents).toContain('metadata_extractor');
      expect(agents).toContain('rpjmn_scorer');
      expect(agents).toContain('asean_simulator');
      expect(agents).toContain('rdtii_extractor');
    });

    it('should allow retrieving agents by name', () => {
      const researcher = orchestrator.getAgent('researcher');
      const analyst = orchestrator.getAgent('analyst');

      expect(researcher).toBeDefined();
      expect(researcher?.name).toBe('researcher');
      expect(analyst).toBeDefined();
      expect(analyst?.name).toBe('analyst');
    });
  });

  describe('Topic Classification', () => {
    it('should classify Bappenas-related topics', async () => {
      llmService.classifyTopic.mockResolvedValue({
        classification: 'bappenas',
        confidence: 0.9,
        reasoning: 'Contains SDI-related keywords',
      });

      const state = orchestrator.createInitialState('Indonesia RPJMN 2025-2029 development plan', 'user123');

      const classification = await orchestrator['classifyTopic'](state);

      expect(classification).toBe('bappenas');
    });

    it('should use keyword fallback when LLM fails', async () => {
      llmService.classifyTopic.mockRejectedValue(new Error('LLM failed'));

      const state = orchestrator.createInitialState('Bappenas SDI indicators for education', 'user123');

      const classification = await orchestrator['classifyTopic'](state);

      expect(classification).toBe('bappenas');
    });

    it('should classify financial topics', async () => {
      const state = orchestrator.createInitialState('Indonesia inflation and monetary policy', 'user123');

      const classification = await orchestrator['keywordClassification'](state.topic);

      expect(classification).toBe('financial');
    });

    it('should classify ASEAN topics', async () => {
      const state = orchestrator.createInitialState('ASEAN regional cooperation on trade', 'user123');

      const classification = await orchestrator['keywordClassification'](state.topic);

      expect(classification).toBe('asean');
    });
  });

  describe('Route Determination', () => {
    it('should determine correct routes based on classification', () => {
      const testCases = [
        { classification: 'bappenas', expectedRoute: 'bappenas' },
        { classification: 'financial', expectedRoute: 'financial' },
        { classification: 'asean', expectedRoute: 'asean' },
        { classification: 'general', expectedRoute: 'default' },
      ];

      for (const { classification, expectedRoute } of testCases) {
        const state = {
          classification,
          topic: 'test',
          context: { userId: 'test' },
          messages: [],
        };

        const route = orchestrator['determineRoute'](state);
        expect(route).toBe(expectedRoute);
      }
    });
  });

  describe('State Management', () => {
    it('should create initial state correctly', () => {
      const state = orchestrator.createInitialState('Test topic', 'user123', 'Jakarta');

      expect(state.topic).toBe('Test topic');
      expect(state.context.userId).toBe('user123');
      expect(state.region).toBe('Jakarta');
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].role).toBe('system');
      expect(state.messages[1].role).toBe('user');
    });

    it('should provide state summary', () => {
      const state: any = {
        topic: 'Test topic',
        region: 'Jakarta',
        classification: 'bappenas',
        route: 'bappenas',
        researchResult: {
          sources: [{ url: 'test', title: 'Test', summary: 'Test', tier: 'primary' }],
        },
        analysisResult: {
          implications: ['test'],
          recommendations: ['test'],
          riskLevel: 'medium',
        },
      };

      const summary = orchestrator.getStateSummary(state);

      expect(summary.topic).toBe('Test topic');
      expect(summary.classification).toBe('bappenas');
      expect(summary.route).toBe('bappenas');
      expect(summary.hasResearch).toBe(true);
      expect(summary.hasAnalysis).toBe(true);
      expect(summary.sourceCount).toBe(1);
      expect(summary.riskLevel).toBe('medium');
    });
  });

  describe('Available Routes', () => {
    it('should return all available routes', () => {
      const routes = orchestrator.getAvailableRoutes();

      expect(routes).toContain('bappenas');
      expect(routes).toContain('financial');
      expect(routes).toContain('asean');
      expect(routes).toContain('default');
    });
  });

  describe('Parallel Execution', () => {
    it('should execute multiple agents in parallel', async () => {
      // Mock agent execution
      const mockExecuteSafe = jest.fn().mockResolvedValue({
        success: true,
        data: { result: 'test' },
      });

      // Override the executeSafe method on agents
      for (const agent of orchestrator.getRegisteredAgents()) {
        const agentInstance = orchestrator.getAgent(agent);
        if (agentInstance) {
          agentInstance.executeSafe = mockExecuteSafe;
        }
      }

      const context = { userId: 'test' };
      const results = await orchestrator.executeParallel(
        ['researcher', 'analyst'],
        { topic: 'test' },
        context,
      );

      expect(results.size).toBe(2);
      expect(results.get('researcher')).toBeDefined();
      expect(results.get('analyst')).toBeDefined();
    });
  });

  describe('Sequential Execution', () => {
    it('should execute agents in sequence', async () => {
      let callCount = 0;
      const mockExecuteSafe = jest.fn().mockImplementation(async () => {
        callCount++;
        return {
          success: true,
          data: { step: callCount },
        };
      });

      // Set up agents
      const researcher = orchestrator.getAgent('researcher');
      const analyst = orchestrator.getAgent('analyst');
      if (researcher) researcher.executeSafe = mockExecuteSafe;
      if (analyst) analyst.executeSafe = mockExecuteSafe;

      const context = { userId: 'test' };
      const chain = [
        { agent: 'researcher' },
        { agent: 'analyst', inputMapper: (prev: any) => ({ prevData: prev }) },
      ];

      const result = await orchestrator.executeSequential(chain, { topic: 'test' }, context);

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });
  });
});
