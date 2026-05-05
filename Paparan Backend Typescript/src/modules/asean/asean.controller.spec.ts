import { Test, TestingModule } from '@nestjs/testing';
import { AseanController } from './asean.controller';
import { AseanService } from './asean.service';

describe('AseanController', () => {
  let controller: AseanController;
  let service: jest.Mocked<AseanService>;

  const mockAseanService = {
    simulate: jest.fn(),
    queryKnowledgeGraph: jest.fn(),
    getCountries: jest.fn(),
    getPillars: jest.fn(),
    simulateVoting: jest.fn(),
    identifyCompromises: jest.fn(),
    getHistoricalPrecedents: jest.fn(),
    generateTalkingPoints: jest.fn(),
    assessRegionalImpact: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AseanController],
      providers: [
        {
          provide: AseanService,
          useValue: mockAseanService,
        },
      ],
    }).compile();

    controller = module.get<AseanController>(AseanController);
    service = mockAseanService as unknown as jest.Mocked<AseanService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ASEAN Simulation', () => {
    it('should simulate ASEAN scenario', async () => {
      const expectedResult = {
        success: true,
        data: {
          scenario: 'ASEAN digital trade agreement',
          outcome: {
            consensusLikelihood: 0.7,
            outcome: 'compromise',
            timeline: '6-12 months',
            nextSteps: ['Working group formation', 'Draft agreement'],
          },
          positions: [
            { country: 'Indonesia', position: 'support', reasoning: 'Aligns with digital economy goals' },
            { country: 'Singapore', position: 'support', reasoning: 'Hub for digital trade' },
          ],
          keyIssues: ['Data localization', 'Cross-border payments'],
          recommendations: ['Phase implementation', 'Capacity building'],
        },
      };

      service.simulate.mockResolvedValue(expectedResult);

      const result = await controller.simulate({
        scenario: 'ASEAN digital trade agreement',
      });

      expect(result).toEqual(expectedResult);
      expect(service.simulate).toHaveBeenCalledWith('ASEAN digital trade agreement', undefined);
    });
  });

  describe('Knowledge Graph', () => {
    it('should query knowledge graph', async () => {
      const expectedResult = [
        { entity: 'ASEAN Economic Community', relation: 'includes', target: 'AEC' },
        { entity: 'Digital trade', relation: 'related to', target: 'E-commerce' },
      ];

      service.queryKnowledgeGraph.mockResolvedValue(expectedResult);

      const result = await controller.queryKnowledgeGraph('digital trade');

      expect(result).toEqual(expectedResult);
      expect(service.queryKnowledgeGraph).toHaveBeenCalledWith('digital trade');
    });
  });

  describe('Reference Data', () => {
    it('should get ASEAN countries', async () => {
      const expectedCountries = [
        { code: 'ID', name: 'Indonesia', population: 273000000, capital: 'Jakarta' },
        { code: 'SG', name: 'Singapore', population: 5700000, capital: 'Singapore' },
      ];

      service.getCountries.mockResolvedValue(expectedCountries);

      const result = await controller.getCountries();

      expect(result).toEqual(expectedCountries);
      expect(service.getCountries).toHaveBeenCalled();
    });

    it('should get ASEAN pillars', async () => {
      const expectedPillars = [
        {
          id: 'APSC',
          name: 'ASEAN Political-Security Community',
          description: 'Peaceful, secure, and resilient environment',
          goals: ['Rule of law', 'Conflict resolution'],
        },
        {
          id: 'AEC',
          name: 'ASEAN Economic Community',
          description: 'Cohesive, responsive, competitive economy',
          goals: ['Single market', 'Economic integration'],
        },
      ];

      service.getPillars.mockResolvedValue(expectedPillars);

      const result = await controller.getPillars();

      expect(result).toEqual(expectedPillars);
    });
  });

  describe('Voting Simulation', () => {
    it('should simulate voting', async () => {
      const expectedResult = {
        success: true,
        data: {
          votes: {
            Indonesia: 'yes',
            Singapore: 'yes',
            Malaysia: 'abstain',
            Thailand: 'yes',
          },
          result: 'passed',
          analysis: 'Strong support for the proposal',
        },
      };

      service.simulateVoting.mockResolvedValue(expectedResult);

      const result = await controller.simulateVoting({
        scenario: 'Climate cooperation framework',
        proposal: 'Establish ASEAN climate fund',
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('Compromise Identification', () => {
    it('should identify compromises', async () => {
      const expectedResult = {
        success: true,
        data: {
          compromises: [
            {
              description: 'Phased implementation with flexible timeline',
              supporters: ['Indonesia', 'Vietnam'],
              opponents: ['Singapore'],
              viability: 0.8,
            },
          ],
        },
      };

      service.identifyCompromises.mockResolvedValue(expectedResult);

      const result = await controller.identifyCompromises({
        scenario: 'Data sharing agreement',
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('Talking Points', () => {
    it('should generate talking points', async () => {
      const expectedResult = {
        success: true,
        data: {
          opening: 'Your Excellency, thank you for this opportunity to discuss...',
          keyPoints: [
            'Point 1: Economic integration benefits',
            'Point 2: Environmental sustainability',
          ],
          concessions: ['Extended timeline', 'Technical assistance'],
          redLines: ['Sovereignty protection', 'Data localization'],
        },
      };

      service.generateTalkingPoints.mockResolvedValue(expectedResult);

      const result = await controller.generateTalkingPoints({
        scenario: 'Digital economy framework',
        targetCountry: 'Singapore',
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('Impact Assessment', () => {
    it('should assess regional impact', async () => {
      const expectedResult = {
        success: true,
        data: {
          economicImpact: 'Positive overall growth in cross-border trade',
          politicalImpact: 'Strengthened regional integration',
          securityImpact: 'Enhanced cooperation on cyber threats',
          countryImpacts: {
            Indonesia: 'Major economic gains',
            Singapore: 'Increased trade volume',
          },
        },
      };

      service.assessRegionalImpact.mockResolvedValue(expectedResult);

      const result = await controller.assessRegionalImpact({
        scenario: 'Digital trade agreement',
        outcome: 'consensus',
      });

      expect(result).toEqual(expectedResult);
    });
  });
});
