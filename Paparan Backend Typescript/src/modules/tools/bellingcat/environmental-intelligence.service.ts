import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '@modules/tools/http/http-client.service';
import { SpatialToolsService } from './spatial-tools.service';

/**
 * Deforestation alert result
 */
interface DeforestationAlerts {
  alert_count: number | null;
  area_ha: number | null;
  source_url: string;
  days: number;
}

/**
 * Fire hotspot result
 */
interface FireHotspots {
  count: number | null;
  source_url: string;
  days: number;
  note?: string;
}

/**
 * Fishing activity result
 */
interface FishingActivity {
  vessel_count: number | null;
  source_url: string;
  anomaly_flag: boolean;
}

/**
 * Environmental indicators result
 */
export interface EnvironmentalIndicators {
  region: string;
  timestamp: string;
  deforestation: DeforestationAlerts;
  fire_hotspots: FireHotspots;
  fishing_activity: FishingActivity;
}

@Injectable()
export class EnvironmentalIntelligenceService {
  private readonly logger = new Logger(EnvironmentalIntelligenceService.name);
  private readonly gfwUrl = 'https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query';
  private readonly firmsBaseUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
  private readonly gfwFishingUrl = 'https://gateway.api.globalfishingwatch.org/v3/events';

  constructor(
    private config: ConfigService,
    private http: HttpClientService,
    private spatial: SpatialToolsService,
  ) {}

  /**
   * Get deforestation alerts from Global Forest Watch
   */
  async getDeforestationAlerts(region: string, days = 30): Promise<DeforestationAlerts> {
    try {
      const bbox = await this.spatial.getRegionBBox(region);
      const { min_lon, max_lon, min_lat, max_lat } = bbox;

      const sql = (
        `SELECT count(*) as alert_count, sum(area__ha) as area_ha ` +
        `FROM data ` +
        `WHERE gfw_integrated_alerts__date >= CURRENT_DATE - INTERVAL '${days} days' ` +
        `AND longitude BETWEEN ${min_lon} AND ${max_lon} ` +
        `AND latitude BETWEEN ${min_lat} AND ${max_lat}`
      );

      const response = await this.http.post(this.gfwUrl, { sql }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const row = response.data.data[0];
        return {
          alert_count: row.alert_count || 0,
          area_ha: Math.round((row.area_ha || 0) * 100) / 100,
          source_url: 'https://www.globalforestwatch.org/map/',
          days,
        };
      }
    } catch (error) {
      this.logger.debug(`GFW deforestation query failed: ${error.message}`);
    }

    return {
      alert_count: null,
      area_ha: null,
      source_url: 'https://www.globalforestwatch.org',
      days,
    };
  }

  /**
   * Get fire/hotspot data from NASA FIRMS
   */
  async getFireHotspots(region: string, days = 7): Promise<FireHotspots> {
    const firmsKey = this.config.get('FIRMS_MAP_KEY');

    if (!firmsKey) {
      return {
        count: null,
        source_url: 'https://firms.modaps.eosdis.nasa.gov',
        days,
        note: 'FIRMS_MAP_KEY not set',
      };
    }

    try {
      const bbox = await this.spatial.getRegionBBox(region);
      const { min_lon, min_lat, max_lon, max_lat } = bbox;
      const bboxStr = `${min_lon},${min_lat},${max_lon},${max_lat}`;
      const maxDays = Math.min(days, 10); // FIRMS limits NRT data to 10 days

      const url = `${this.firmsBaseUrl}/${firmsKey}/VIIRS_SNPP_NRT/${bboxStr}/${maxDays}`;

      const response = await this.http.get(url, { timeout: 10000 });

      if (response.data && typeof response.data === 'string') {
        const lines = response.data
          .trim()
          .split('\n')
          .filter(line => line && !line.startsWith('latitude'));
        return {
          count: lines.length,
          source_url: 'https://firms.modaps.eosdis.nasa.gov/map/',
          days,
        };
      }
    } catch (error) {
      this.logger.debug(`FIRMS query failed: ${error.message}`);
    }

    return {
      count: null,
      source_url: 'https://firms.modaps.eosdis.nasa.gov',
      days,
    };
  }

  /**
   * Get fishing vessel activity from Global Fishing Watch
   */
  async getFishingActivity(region: string): Promise<FishingActivity> {
    try {
      const bbox = await this.spatial.getRegionBBox(region);
      const { min_lon, min_lat, max_lon, max_lat } = bbox;
      const bboxStr = `${min_lon},${min_lat},${max_lon},${max_lat}`;

      // Use current date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const params = {
        'datasets': 'public-global-fishing-events:latest',
        'start-date': startDate.toISOString().split('T')[0],
        'end-date': endDate.toISOString().split('T')[0],
        'bbox': bboxStr,
        'limit': '1',
      };

      const response = await this.http.get(this.gfwFishingUrl, { params, timeout: 10000 });

      if (response.data && typeof response.data.total === 'number') {
        const total = response.data.total;
        return {
          vessel_count: total,
          source_url: 'https://globalfishingwatch.org/map/',
          anomaly_flag: total > 500,
        };
      }
    } catch (error) {
      this.logger.debug(`GFW fishing query failed: ${error.message}`);
    }

    return {
      vessel_count: null,
      source_url: 'https://globalfishingwatch.org',
      anomaly_flag: false,
    };
  }

  /**
   * Get aggregated environmental indicators for a region
   */
  async getEnvironmentalIndicators(region: string): Promise<EnvironmentalIndicators> {
    return {
      region,
      timestamp: new Date().toISOString(),
      deforestation: await this.getDeforestationAlerts(region, 30),
      fire_hotspots: await this.getFireHotspots(region, 7),
      fishing_activity: await this.getFishingActivity(region),
    };
  }

  /**
   * Get environmental summary for all ASEAN countries
   */
  async getASEANEnvironmentalSummary(): Promise<Record<string, EnvironmentalIndicators>> {
    const regions = this.spatial.getAvailableRegions();
    const results: Record<string, EnvironmentalIndicators> = {};

    for (const region of regions) {
      if (region !== 'ASEAN') {
        results[region] = await this.getEnvironmentalIndicators(region);
      }
    }

    return results;
  }
}
