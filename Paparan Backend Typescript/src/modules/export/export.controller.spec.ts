import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { DatabaseModule } from '@database/database.module';
import { AgentsModule } from '@modules/agents/agents.module';

describe('ExportController', () => {
  let controller: ExportController;
  let service: jest.Mocked<ExportService>;

  const mockExportService = {
    generatePdf: jest.fn(),
    generatePptx: jest.fn(),
    generateDiplomaticPdf: jest.fn(),
    generateTalkingPoints: jest.fn(),
    scoreRpjmn: jest.fn(),
    synthesizeBriefs: jest.fn(),
    simulateAsean: jest.fn(),
    getBriefVersions: jest.fn(),
    acknowledgeBrief: jest.fn(),
    recordOutcome: jest.fn(),
    getOutcomes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AgentsModule],
      controllers: [ExportController],
      providers: [
        {
          provide: ExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
    service = mockExportService as jest.Mocked<ExportService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Export', () => {
    it('should generate PDF', async () => {
      const mockBuffer = Buffer.from('PDF content');
      mockExportService.generatePdf.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'brief-123.pdf',
        mimeType: 'application/pdf',
        size: mockBuffer.length,
      });

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.exportPdf('123', { id: 'user-1' }, mockRes);

      expect(service.generatePdf).toHaveBeenCalledWith('123', 'user-1');
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="brief-123.pdf"',
        'Content-Length': mockBuffer.length,
      });
      expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('PPTX Export', () => {
    it('should generate PowerPoint', async () => {
      const mockBuffer = Buffer.from('PPTX content');
      mockExportService.generatePptx.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'brief-123.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: mockBuffer.length,
      });

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.exportPptx('123', { id: 'user-1' }, mockRes);

      expect(service.generatePptx).toHaveBeenCalledWith('123', 'user-1');
      expect(mockRes.set).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('Diplomatic PDF Export', () => {
    it('should generate diplomatic PDF', async () => {
      const mockBuffer = Buffer.from('Diplomatic PDF');
      mockExportService.generateDiplomaticPdf.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'diplomat-PAP-2024-0001.pdf',
        mimeType: 'application/pdf',
        size: mockBuffer.length,
      });

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.exportDiplomatPdf('123', {
        to: 'Minister of Foreign Affairs',
        fromName: 'Policy Director',
      }, { id: 'user-1' }, mockRes);

      expect(service.generateDiplomaticPdf).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('Talking Points', () => {
    it('should generate talking points', async () => {
      mockExportService.generateTalkingPoints.mockResolvedValue({
        brief_id: '123',
        talking_points: [
          'Economic growth remains steady at 5% annually',
          'Inflation control measures are showing positive results',
          'Regional cooperation needs strengthening',
        ],
      });

      const result = await controller.getTalkingPoints('123', { id: 'user-1' });

      expect(result).toEqual({
        brief_id: '123',
        talking_points: [
          'Economic growth remains steady at 5% annually',
          'Inflation control measures are showing positive results',
          'Regional cooperation needs strengthening',
        ],
      });
    });
  });

  describe('RPJMN Scoring', () => {
    it('should score brief against RPJMN', async () => {
      const mockBrief = {
        id: '123',
        title: 'Test Brief',
        rpjmnAlignment: {
          pillar: 'Pembangunan Manusia',
          score: 0.85,
          rationale: 'Strong alignment with human development goals',
        },
      };

      mockExportService.scoreRpjmn.mockResolvedValue(mockBrief);

      const result = await controller.scoreRpjmn('123', { id: 'user-1' });

      expect(result).toEqual(mockBrief);
      expect(service.scoreRpjmn).toHaveBeenCalledWith('123', 'user-1');
    });
  });

  describe('Synthesis', () => {
    it('should synthesize multiple briefs', async () => {
      const mockSynthesis = {
        summary: 'Combined analysis of economic policies',
        keyInsights: ['Insight 1', 'Insight 2'],
        recommendations: ['Recommendation 1'],
        briefReferences: [
          { id: '1', title: 'Brief 1', relevanceScore: 1 },
          { id: '2', title: 'Brief 2', relevanceScore: 1 },
        ],
      };

      mockExportService.synthesizeBriefs.mockResolvedValue(mockSynthesis);

      const result = await controller.synthesizeBriefs(
        { brief_ids: ['1', '2'], synthesis_type: 'comprehensive' },
        { id: 'user-1' },
      );

      expect(result).toEqual(mockSynthesis);
      expect(service.synthesizeBriefs).toHaveBeenCalledWith(['1', '2'], 'user-1', {
        synthesisType: 'comprehensive',
      });
    });

    it('should reject synthesis with less than 2 briefs', async () => {
      await expect(
        controller.synthesizeBriefs(
          { brief_ids: ['1'] },
          { id: 'user-1' },
        ),
      ).rejects.toThrow('Provide at least 2 brief IDs');
    });
  });

  describe('Outcomes', () => {
    it('should record outcome', async () => {
      const mockOutcome = {
        brief_id: '123',
        rating: 4,
        outcome_notes: 'Brief was helpful',
        action_taken: true,
        recorded_at: new Date().toISOString(),
      };

      mockExportService.recordOutcome.mockResolvedValue(mockOutcome);

      const result = await controller.recordOutcome('123', {
        rating: 4,
        outcome_notes: 'Brief was helpful',
        action_taken: true,
      }, { id: 'user-1' });

      expect(result).toEqual(mockOutcome);
    });

    it('should reject invalid rating', async () => {
      await expect(
        controller.recordOutcome('123', { rating: 6 }, { id: 'user-1' }),
      ).rejects.toThrow();
    });
  });
});
