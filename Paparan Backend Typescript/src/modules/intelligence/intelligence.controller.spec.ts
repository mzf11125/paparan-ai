import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { BellingcatModule } from '@modules/tools/bellingcat/bellingcat.module';

describe('IntelligenceController', () => {
  let controller: IntelligenceController;
  let service: jest.Mocked<IntelligenceService>;

  const mockIntelligenceService = {
    getMaritimeData: jest.fn(),
    getAllStraitsTraffic: jest.fn(),
    getStraitTraffic: jest.fn(),
    getEnvironmentalData: jest.fn(),
    getDeforestationAlerts: jest.fn(),
    getFireHotspots: jest.fn(),
    getFishingActivity: jest.fn(),
    getASEANEnvironmentalSummary: jest.fn(),
    getConflictData: jest.fn(),
    getStabilityIndex: jest.fn(),
    getASEANStabilityIndex: jest.fn(),
    searchConflictNews: jest.fn(),
    identifyCorporateActors: jest.fn(),
    lookupCompany: jest.fn(),
    getASEANSubsidiaries: jest.fn(),
    archiveUrl: jest.fn(),
    checkArchive: jest.fn(),
    archiveBriefSources: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BellingcatModule],
      controllers: [IntelligenceController],
      providers: [
        {
          provide: IntelligenceService,
          useValue: mockIntelligenceService,
        },
      ],
    }).compile();

    controller = module.get<IntelligenceController>(IntelligenceController);
    service = mockIntelligenceService as jest.Mocked<IntelligenceService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Maritime Endpoints', () => {
    it('should get maritime data for a region', async () => {
      const expectedResult = {
        region: 'South China Sea',
        vessel_count: 150,
        baseline: 400,
        anomaly_flag: false,
        date_range: '7d',
        source_url: 'https://www.marinetraffic.com/...',
        vesselfinder_url: 'https://www.vesselfinder.com/...',
      };

      mockIntelligenceService.getMaritimeData.mockResolvedValue(expectedResult);

      const result = await controller.getMaritime('South China Sea');

      expect(result).toEqual(expectedResult);
      expect(service.getMaritimeData).toHaveBeenCalledWith('South China Sea', undefined);
    });

    it('should get all straits traffic', async () => {
      const expectedResult = {
        'Malacca Strait': { vessel_count: 280, anomaly_flag: true },
        'South China Sea': { vessel_count: 420, anomaly_flag: true },
      };

      mockIntelligenceService.getAllStraitsTraffic.mockResolvedValue(expectedResult);

      const result = await controller.getAllStraits();

      expect(result).toEqual(expectedResult);
      expect(service.getAllStraitsTraffic).toHaveBeenCalled();
    });

    it('should get strait traffic', async () => {
      const expectedResult = {
        region: 'Malacca Strait',
        vessel_count: 280,
        anomaly_flag: true,
        strategic_importance: "World's busiest shipping lane",
      };

      mockIntelligenceService.getStraitTraffic.mockResolvedValue(expectedResult);

      const result = await controller.getStraitTraffic('Malacca Strait');

      expect(result).toEqual(expectedResult);
      expect(service.getStraitTraffic).toHaveBeenCalledWith('Malacca Strait');
    });
  });

  describe('Environmental Endpoints', () => {
    it('should get environmental data', async () => {
      const expectedResult = {
        region: 'Kalimantan',
        timestamp: new Date().toISOString(),
        deforestation: { alert_count: 150, area_ha: 2500 },
        fire_hotspots: { count: 45 },
        fishing_activity: { vessel_count: 120, anomaly_flag: false },
      };

      mockIntelligenceService.getEnvironmentalData.mockResolvedValue(expectedResult);

      const result = await controller.getEnvironment('Kalimantan');

      expect(result).toEqual(expectedResult);
      expect(service.getEnvironmentalData).toHaveBeenCalledWith('Kalimantan');
    });

    it('should get deforestation alerts', async () => {
      const expectedResult = { alert_count: 150, area_ha: 2500, days: 30 };

      mockIntelligenceService.getDeforestationAlerts.mockResolvedValue(expectedResult);

      const result = await controller.getDeforestation('Kalimantan', 30);

      expect(result).toEqual(expectedResult);
      expect(service.getDeforestationAlerts).toHaveBeenCalledWith('Kalimantan', 30);
    });

    it('should get fire hotspots', async () => {
      const expectedResult = { count: 45, days: 7 };

      mockIntelligenceService.getFireHotspots.mockResolvedValue(expectedResult);

      const result = await controller.getFireHotspots('Sumatera', 7);

      expect(result).toEqual(expectedResult);
      expect(service.getFireHotspots).toHaveBeenCalledWith('Sumatera', 7);
    });
  });

  describe('Conflict Endpoints', () => {
    it('should get conflict data', async () => {
      const expectedResult = {
        region: 'Myanmar',
        event_count: 45,
        fatalities: 120,
        dominant_event_type: 'Violence against civilians',
        source: 'acled',
      };

      mockIntelligenceService.getConflictData.mockResolvedValue(expectedResult);

      const result = await controller.getConflict('Myanmar', 30);

      expect(result).toEqual(expectedResult);
      expect(service.getConflictData).toHaveBeenCalledWith('Myanmar', 30);
    });

    it('should get stability index', async () => {
      const expectedResult = {
        country: 'Myanmar',
        stability_score: 0.35,
        trend: 'deteriorating',
        event_count_30d: 45,
        fatalities_30d: 120,
      };

      mockIntelligenceService.getStabilityIndex.mockResolvedValue(expectedResult);

      const result = await controller.getStability('Myanmar');

      expect(result).toEqual(expectedResult);
      expect(service.getStabilityIndex).toHaveBeenCalledWith('Myanmar');
    });

    it('should get ASEAN stability index', async () => {
      const expectedResult = {
        Indonesia: { stability_score: 0.85, trend: 'stable' },
        Myanmar: { stability_score: 0.35, trend: 'deteriorating' },
      };

      mockIntelligenceService.getASEANStabilityIndex.mockResolvedValue(expectedResult);

      const result = await controller.getASEANStability();

      expect(result).toEqual(expectedResult);
      expect(service.getASEANStabilityIndex).toHaveBeenCalled();
    });
  });

  describe('Corporate Endpoints', () => {
    it('should identify corporate actors', async () => {
      const text = 'PT Telekomunikasi Indonesia Tbk and PT Bank Rakyat Indonesia signed an agreement.';
      const expectedResult = [
        {
          company: 'PT Telekomunikasi Indonesia',
          jurisdiction: 'id',
          status: 'Active',
          registration_id: '123456',
        },
        {
          company: 'PT Bank Rakyat Indonesia',
          jurisdiction: 'id',
          status: 'Active',
          registration_id: '789012',
        },
      ];

      mockIntelligenceService.identifyCorporateActors.mockResolvedValue(expectedResult);

      const result = await controller.identifyCorporate({ text });

      expect(result).toEqual(expectedResult);
      expect(service.identifyCorporateActors).toHaveBeenCalledWith(text);
    });

    it('should lookup company', async () => {
      const expectedResult = {
        company: 'PT Telekomunikasi Indonesia',
        jurisdiction: 'id',
        status: 'Active',
        registration_id: '123456',
      };

      mockIntelligenceService.lookupCompany.mockResolvedValue(expectedResult);

      const result = await controller.lookupCompany({ companyName: 'PT Telkom', jurisdiction: 'id' });

      expect(result).toEqual(expectedResult);
      expect(service.lookupCompany).toHaveBeenCalledWith('PT Telkom', 'id');
    });
  });

  describe('Archive Endpoints', () => {
    it('should archive URL', async () => {
      const expectedResult = {
        archive_url: 'https://web.archive.org/web/20240101000000/https://example.com',
        status: 'archived',
        timestamp: '20240101000000',
      };

      mockIntelligenceService.archiveUrl.mockResolvedValue(expectedResult);

      const result = await controller.archiveUrl({ url: 'https://example.com' });

      expect(result).toEqual(expectedResult);
      expect(service.archiveUrl).toHaveBeenCalledWith('https://example.com');
    });

    it('should check archive', async () => {
      const expectedResult = {
        archived: true,
        archive_url: 'https://web.archive.org/web/20240101000000/https://example.com',
        recent: true,
      };

      mockIntelligenceService.checkArchive.mockResolvedValue(expectedResult);

      const result = await controller.checkArchive({ url: 'https://example.com' });

      expect(result).toEqual(expectedResult);
      expect(service.checkArchive).toHaveBeenCalledWith('https://example.com');
    });

    it('should archive brief sources', async () => {
      const sources = [
        { id: '1', url: 'https://example.com/1' },
        { id: '2', url: 'https://example.com/2' },
      ];
      const expectedResult = [
        { source_id: '1', archive_url: 'https://web.archive.org/...', status: 'archived' },
        { source_id: '2', archive_url: 'https://web.archive.org/...', status: 'archived' },
      ];

      mockIntelligenceService.archiveBriefSources.mockResolvedValue(expectedResult);

      const result = await controller.archiveBriefSources({ sources });

      expect(result).toEqual(expectedResult);
      expect(service.archiveBriefSources).toHaveBeenCalledWith(sources);
    });
  });
});
