import { Test, TestingModule } from '@nestjs/testing';
import { BappenasController } from './bappenas.controller';
import { BappenasService } from './bappenas.service';
import { SdiService } from '@modules/tools/sdi/sdi.service';
import { DocumentsRepository } from '@database/repositories/documents.repository';
import { IndicatorsRepository } from '@database/repositories/indicators.repository';
import { JobsRepository } from '@database/repositories/jobs.repository';
import { ConsistencyFlagsRepository } from '@database/repositories/consistency-flags.repository';
import { JobsService } from '@jobs/jobs.service';
import { MetadataExtractorAgent } from '@modules/agents/metadata-extractor/metadata-extractor.agent';
import { ConsistencyCheckerAgent } from '@modules/agents/consistency-checker/consistency-checker.agent';

describe('BappenasController', () => {
  let controller: BappenasController;
  let service: jest.Mocked<BappenasService>;

  const mockBappenasService = {
    uploadDocument: jest.fn(),
    getUserDocuments: jest.fn(),
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
    getIndicators: jest.fn(),
    getIndicator: jest.fn(),
    deleteIndicator: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
    checkConsistency: jest.fn(),
    checkIndicatorConsistency: jest.fn(),
    getConsistencyFlags: jest.fn(),
    resolveConsistencyFlag: jest.fn(),
    getKLCodes: jest.fn(),
    getSectors: jest.fn(),
    getSDIGoals: jest.fn(),
    searchKLCodes: jest.fn(),
    getSectorDefinitions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BappenasController],
      providers: [
        {
          provide: BappenasService,
          useValue: mockBappenasService,
        },
      ],
    }).compile();

    controller = module.get<BappenasController>(BappenasController);
    service = mockBappenasService as jest.Mocked<BappenasService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Document Endpoints', () => {
    it('should upload a document', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
      } as Express.Multer.File;

      const expectedResult = {
        id: 'doc-123',
        filename: 'test.pdf',
        storagePath: '/uploads/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        processingStatus: 'pending',
        uploadedAt: new Date().toISOString(),
      };

      mockBappenasService.uploadDocument.mockResolvedValue(expectedResult);

      const result = await controller.uploadDocument({ id: 'user-123' } as any, mockFile);

      expect(result).toEqual(expectedResult);
      expect(service.uploadDocument).toHaveBeenCalledWith('user-123', mockFile);
    });

    it('should get user documents', async () => {
      const expectedDocuments = [
        { id: 'doc-1', filename: 'test1.pdf' },
        { id: 'doc-2', filename: 'test2.pdf' },
      ];

      mockBappenasService.getUserDocuments.mockResolvedValue(expectedDocuments);

      const result = await controller.getDocuments({ id: 'user-123' } as any);

      expect(result).toEqual(expectedDocuments);
      expect(service.getUserDocuments).toHaveBeenCalledWith('user-123', expect.anything());
    });

    it('should get a specific document', async () => {
      const expectedDocument = { id: 'doc-123', filename: 'test.pdf' };

      mockBappenasService.getDocument.mockResolvedValue(expectedDocument);

      const result = await controller.getDocument({ id: 'user-123' } as any, 'doc-123');

      expect(result).toEqual(expectedDocument);
      expect(service.getDocument).toHaveBeenCalledWith('doc-123', 'user-123');
    });

    it('should delete a document', async () => {
      mockBappenasService.deleteDocument.mockResolvedValue({ deleted: true });

      const result = await controller.deleteDocument({ id: 'user-123' } as any, 'doc-123');

      expect(result).toEqual({ deleted: true });
      expect(service.deleteDocument).toHaveBeenCalledWith('doc-123', 'user-123');
    });
  });

  describe('Indicator Endpoints', () => {
    it('should get indicators', async () => {
      const expectedIndicators = [
        {
          id: 'ind-1',
          indicatorCode: 'K001L001',
          indicatorName: 'Test Indicator',
          klCode: '001',
        },
      ];

      mockBappenasService.getIndicators.mockResolvedValue(expectedIndicators);

      const result = await controller.getIndicators({ id: 'user-123' } as any);

      expect(result).toEqual(expectedIndicators);
      expect(service.getIndicators).toHaveBeenCalledWith('user-123', expect.anything());
    });

    it('should get a specific indicator', async () => {
      const expectedIndicator = {
        id: 'ind-1',
        indicatorCode: 'K001L001',
        indicatorName: 'Test Indicator',
      };

      mockBappenasService.getIndicator.mockResolvedValue(expectedIndicator);

      const result = await controller.getIndicator({ id: 'user-123' } as any, 'ind-1');

      expect(result).toEqual(expectedIndicator);
      expect(service.getIndicator).toHaveBeenCalledWith('ind-1', 'user-123');
    });

    it('should delete an indicator', async () => {
      mockBappenasService.deleteIndicator.mockResolvedValue({ deleted: true });

      const result = await controller.deleteIndicator({ id: 'user-123' } as any, 'ind-1');

      expect(result).toEqual({ deleted: true });
      expect(service.deleteIndicator).toHaveBeenCalledWith('ind-1', 'user-123');
    });
  });

  describe('Reference Data Endpoints', () => {
    it('should get all K/L codes', async () => {
      const expectedKLCodes = [
        { code: '001', name: 'Kementerian Koordinator', type: 'ministry' },
        { code: '101', name: 'Bappenas', type: 'agency' },
      ];

      mockBappenasService.getKLCodes.mockResolvedValue(expectedKLCodes);

      const result = await controller.getKLCodes();

      expect(result).toEqual(expectedKLCodes);
      expect(service.getKLCodes).toHaveBeenCalled();
    });

    it('should get all sectors', async () => {
      const expectedSectors = [
        { code: '1', name: 'Pembangunan Manusia' },
        { code: '2', name: 'Pembangunan Ekonomi' },
      ];

      mockBappenasService.getSectors.mockResolvedValue(expectedSectors);

      const result = await controller.getSectors();

      expect(result).toEqual(expectedSectors);
      expect(service.getSectors).toHaveBeenCalled();
    });

    it('should get all SDI goals', async () => {
      const expectedSDIGoals = [
        { code: 'SDI 1', name: 'Memperkuat data untuk pembangunan SDGs' },
        { code: 'SDI 2', name: 'Memperkuat data untuk pembangunan berkelanjutan' },
      ];

      mockBappenasService.getSDIGoals.mockResolvedValue(expectedSDIGoals);

      const result = await controller.getSDIGoals();

      expect(result).toEqual(expectedSDIGoals);
      expect(service.getSDIGoals).toHaveBeenCalled();
    });

    it('should search K/L codes', async () => {
      const expectedResults = [
        { code: '007', name: 'Kementerian Kesehatan', type: 'ministry' },
      ];

      mockBappenasService.searchKLCodes.mockResolvedValue(expectedResults);

      const result = await controller.searchKLCodes('kesehatan');

      expect(result).toEqual(expectedResults);
      expect(service.searchKLCodes).toHaveBeenCalledWith('kesehatan');
    });
  });

  describe('Consistency Check Endpoints', () => {
    it('should check consistency for indicators', async () => {
      const expectedResult = {
        checkedCount: 2,
        flagsCreated: 1,
        flags: [
          {
            id: 'flag-1',
            indicatorId: 'ind-1',
            flagType: 'duplicate',
            description: 'Potential duplicate found',
            status: 'open',
          },
        ],
      };

      mockBappenasService.checkConsistency.mockResolvedValue(expectedResult);

      const result = await controller.checkConsistency(
        { id: 'user-123' } as any,
        { indicatorIds: ['ind-1', 'ind-2'], checkType: 'duplicate' },
      );

      expect(result).toEqual(expectedResult);
      expect(service.checkConsistency).toHaveBeenCalledWith(
        'user-123',
        ['ind-1', 'ind-2'],
        'duplicate',
      );
    });

    it('should get consistency flags', async () => {
      const expectedFlags = [
        {
          id: 'flag-1',
          indicatorId: 'ind-1',
          flagType: 'duplicate',
          description: 'Potential duplicate',
          status: 'open',
        },
      ];

      mockBappenasService.getConsistencyFlags.mockResolvedValue(expectedFlags);

      const result = await controller.getConsistencyFlags({ id: 'user-123' } as any, 'open', 50);

      expect(result).toEqual(expectedFlags);
      expect(service.getConsistencyFlags).toHaveBeenCalledWith('user-123', 'open', 50);
    });

    it('should resolve a consistency flag', async () => {
      const expectedFlag = {
        id: 'flag-1',
        indicatorId: 'ind-1',
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      };

      mockBappenasService.resolveConsistencyFlag.mockResolvedValue(expectedFlag);

      const result = await controller.resolveConsistencyFlag(
        { id: 'user-123' } as any,
        'flag-1',
        { resolutionNotes: 'False positive' },
      );

      expect(result).toEqual(expectedFlag);
      expect(service.resolveConsistencyFlag).toHaveBeenCalledWith(
        'flag-1',
        'user-123',
        'False positive',
      );
    });
  });

  describe('Job Endpoints', () => {
    it('should get jobs', async () => {
      const expectedJobs = [
        {
          id: 'job-1',
          status: 'completed',
          progress: 100,
          resultIndicatorsCount: 5,
        },
      ];

      mockBappenasService.getJobs.mockResolvedValue(expectedJobs);

      const result = await controller.getJobs({ id: 'user-123' } as any, 'completed', 20);

      expect(result).toEqual(expectedJobs);
      expect(service.getJobs).toHaveBeenCalledWith('user-123', { status: 'completed', limit: 20 });
    });

    it('should get a specific job', async () => {
      const expectedJob = {
        id: 'job-1',
        status: 'processing',
        progress: 50,
        resultIndicatorsCount: 0,
      };

      mockBappenasService.getJob.mockResolvedValue(expectedJob);

      const result = await controller.getJob({ id: 'user-123' } as any, 'job-1');

      expect(result).toEqual(expectedJob);
      expect(service.getJob).toHaveBeenCalledWith('job-1', 'user-123');
    });
  });
});
