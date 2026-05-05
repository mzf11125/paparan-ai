import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '@modules/tools/http/http-client.service';
import { SpatialToolsService } from './spatial-tools.service';

/**
 * Baseline vessel counts for anomaly detection
 */
const BASELINE_VESSELS: Record<string, number> = {
  'Malacca Strait': 250,
  'South China Sea': 400,
  'Lombok Strait': 80,
  'Sunda Strait': 60,
  'Makassar Strait': 120,
  'Banda Sea': 50,
};

/**
 * Strategic importance descriptions for key straits
 */
const STRATEGIC_IMPORTANCE: Record<string, string> = {
  'Malacca Strait': "World's busiest shipping lane — 80,000+ vessels/year",
  'South China Sea': 'Disputed waters — $3.4T annual trade',
  'Lombok Strait': 'Deep-water alternative to Malacca',
  'Sunda Strait': "Indonesia's western gateway",
  'Makassar Strait': 'Eastern Indonesia trade route',
  'Banda Sea': 'Remote eastern Indonesia',
};

/**
 * Maritime activity result
 */
export interface MaritimeActivityResult {
  region: string;
  vessel_count: number | null;
  baseline: number;
  anomaly_flag: boolean;
  date_range: string;
  source_url: string;
  vesselfinder_url: string;
  strategic_importance?: string;
}

@Injectable()
export class MaritimeIntelligenceService {
  private readonly logger = new Logger(MaritimeIntelligenceService.name);
  private readonly vesselFinderUrl = 'https://www.vesselfinder.com/api/pub/vesselsonmap';
  private readonly headers = { 'User-Agent': 'paparan-ai/1.0' };

  constructor(
    private http: HttpClientService,
    private spatial: SpatialToolsService,
  ) {}

  /**
   * Track vessel activity in an ASEAN maritime region
   */
  async trackMaritimeActivity(region: string, dateRange = '7d'): Promise<MaritimeActivityResult> {
    const bbox = await this.getBBoxForRegion(region);
    const vesselCount = await this.queryVesselFinder(bbox);
    const baseline = BASELINE_VESSELS[region] || 100;

    const anomaly = vesselCount !== null && (vesselCount > baseline * 1.5 || vesselCount < baseline * 0.5);

    const [minLon, minLat, maxLon, maxLat] = bbox;

    return {
      region,
      vessel_count: vesselCount,
      baseline,
      anomaly_flag: anomaly,
      date_range: dateRange,
      source_url: `https://www.marinetraffic.com/en/ais/home/centerx:${(minLon + maxLon) / 2}/centery:${(minLat + maxLat) / 2}/zoom:6`,
      vesselfinder_url: `https://www.vesselfinder.com/?lat=${(minLat + maxLat) / 2}&lon=${(minLon + maxLon) / 2}&zoom=6`,
    };
  }

  /**
   * Get vessel traffic data for a specific strait
   */
  async getStraitTraffic(strait: string): Promise<MaritimeActivityResult & { strategic_importance: string }> {
    const result = await this.trackMaritimeActivity(strait);
    return {
      ...result,
      strategic_importance: STRATEGIC_IMPORTANCE[strait] || 'ASEAN maritime corridor',
    };
  }

  /**
   * Search recent maritime and shipping news
   */
  async searchMaritimeNews(region: string, days = 7): Promise<string> {
    // This would integrate with Tavily service
    // For now, return a placeholder
    return `Maritime news search for ${region} (last ${days} days) - integrate with Tavily service`;
  }

  /**
   * Get traffic summary for all straits
   */
  async getAllStraitsTraffic(): Promise<Record<string, MaritimeActivityResult>> {
    const straits = this.spatial.getAvailableStraits();
    const results: Record<string, MaritimeActivityResult> = {};

    for (const strait of straits) {
      results[strait] = await this.getStraitTraffic(strait);
    }

    return results;
  }

  /**
   * Get available straits
   */
  getAvailableStraits(): string[] {
    return this.spatial.getAvailableStraits();
  }

  /**
   * Get bounding box for a region
   */
  private async getBBoxForRegion(region: string): Promise<[number, number, number, number]> {
    // First check if it's a known strait
    const straitBBox = this.spatial.getStraitBBox(region);
    if (straitBBox) {
      return straitBBox;
    }

    // Otherwise get country bbox
    const bbox = await this.spatial.getRegionBBox(region);
    return [bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat];
  }

  /**
   * Query VesselFinder public map API for vessel count
   */
  private async queryVesselFinder(bbox: [number, number, number, number]): Promise<number | null> {
    try {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const params = {
        bbox: `${minLat},${minLon},${maxLat},${maxLon}`,
        zoom: '6',
      };

      const response = await this.http.get(this.vesselFinderUrl, {
        params,
        headers: this.headers,
        timeout: 8000,
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.length;
      }
    } catch (error) {
      this.logger.debug(`VesselFinder query failed: ${error.message}`);
    }
    return null;
  }
}
