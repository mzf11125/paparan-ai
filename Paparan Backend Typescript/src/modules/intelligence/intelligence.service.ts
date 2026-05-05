import { Injectable } from '@nestjs/common';
import { MaritimeIntelligenceService, MaritimeActivityResult } from '@modules/tools/bellingcat/maritime-intelligence.service';
import { EnvironmentalIntelligenceService, EnvironmentalIndicators } from '@modules/tools/bellingcat/environmental-intelligence.service';
import { ConflictIntelligenceService, ConflictEventsResult, StabilityIndexResult } from '@modules/tools/bellingcat/conflict-intelligence.service';
import { CorporateIntelligenceService, CorporateActor } from '@modules/tools/bellingcat/corporate-intelligence.service';
import { ArchiveService, ArchiveResult } from '@modules/tools/bellingcat/archive.service';

@Injectable()
export class IntelligenceService {
  constructor(
    private maritimeService: MaritimeIntelligenceService,
    private environmentalService: EnvironmentalIntelligenceService,
    private conflictService: ConflictIntelligenceService,
    private corporateService: CorporateIntelligenceService,
    private archiveService: ArchiveService,
  ) {}

  /**
   * Get maritime tracking data for an ASEAN region
   */
  async getMaritimeData(region: string, dateRange = '7d'): Promise<MaritimeActivityResult> {
    return this.maritimeService.trackMaritimeActivity(region, dateRange);
  }

  /**
   * Get strait traffic data
   */
  async getStraitTraffic(strait: string): Promise<MaritimeActivityResult & { strategic_importance: string }> {
    return this.maritimeService.getStraitTraffic(strait);
  }

  /**
   * Get all straits traffic
   */
  async getAllStraitsTraffic(): Promise<Record<string, MaritimeActivityResult>> {
    return this.maritimeService.getAllStraitsTraffic();
  }

  /**
   * Get environmental indicators for a region
   */
  async getEnvironmentalData(region: string): Promise<EnvironmentalIndicators> {
    return this.environmentalService.getEnvironmentalIndicators(region);
  }

  /**
   * Get deforestation alerts
   */
  async getDeforestationAlerts(region: string, days = 30) {
    return this.environmentalService.getDeforestationAlerts(region, days);
  }

  /**
   * Get fire hotspots
   */
  async getFireHotspots(region: string, days = 7) {
    return this.environmentalService.getFireHotspots(region, days);
  }

  /**
   * Get fishing activity
   */
  async getFishingActivity(region: string) {
    return this.environmentalService.getFishingActivity(region);
  }

  /**
   * Get ASEAN environmental summary
   */
  async getASEANEnvironmentalSummary(): Promise<Record<string, EnvironmentalIndicators>> {
    return this.environmentalService.getASEANEnvironmentalSummary();
  }

  /**
   * Get conflict and security events
   */
  async getConflictData(region: string, days = 30): Promise<ConflictEventsResult> {
    return this.conflictService.getConflictEvents(region, days);
  }

  /**
   * Get stability index for a country
   */
  async getStabilityIndex(country: string): Promise<StabilityIndexResult> {
    return this.conflictService.getStabilityIndex(country);
  }

  /**
   * Get ASEAN stability index
   */
  async getASEANStabilityIndex(): Promise<Record<string, StabilityIndexResult>> {
    return this.conflictService.getASEANStabilityIndex();
  }

  /**
   * Search conflict news
   */
  async searchConflictNews(region: string, days = 7): Promise<string> {
    return this.conflictService.searchConflictNews(region, days);
  }

  /**
   * Identify corporate actors in text
   */
  async identifyCorporateActors(text: string): Promise<CorporateActor[]> {
    return this.corporateService.identifyCorporateActors(text);
  }

  /**
   * Look up a specific company
   */
  async lookupCompany(companyName: string, jurisdiction = 'id'): Promise<CorporateActor> {
    return this.corporateService.lookupCompany(companyName, jurisdiction);
  }

  /**
   * Get ASEAN subsidiaries
   */
  async getASEANSubsidiaries(companyName: string): Promise<CorporateActor[]> {
    return this.corporateService.getASEANSubsidiaries(companyName);
  }

  /**
   * Archive a URL to the Wayback Machine
   */
  async archiveUrl(url: string): Promise<ArchiveResult> {
    return this.archiveService.archiveSource(url);
  }

  /**
   * Check if a URL is archived
   */
  async checkArchive(url: string) {
    return this.archiveService.checkArchive(url);
  }

  /**
   * Archive brief sources
   */
  async archiveBriefSources(sources: Array<{ url?: string; id?: string }>) {
    return this.archiveService.archiveBriefSources(sources);
  }
}
