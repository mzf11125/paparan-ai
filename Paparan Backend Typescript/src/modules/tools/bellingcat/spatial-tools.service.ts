import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '@modules/tools/http/http-client.service';

/**
 * Bounding box interface for spatial queries
 */
export interface BoundingBox {
  min_lon: number;
  max_lon: number;
  min_lat: number;
  max_lat: number;
  centroid: [number, number]; // [lat, lon]
}

/**
 * ASEAN bounding boxes
 */
const ASEAN_BBOXES: Record<string, BoundingBox> = {
  Malaysia: { min_lon: 99.6, max_lon: 119.3, min_lat: 0.8, max_lat: 7.4, centroid: [4.2, 108.0] },
  Singapore: { min_lon: 103.6, max_lon: 104.0, min_lat: 1.2, max_lat: 1.5, centroid: [1.35, 103.82] },
  Indonesia: { min_lon: 95.0, max_lon: 141.0, min_lat: -11.0, max_lat: 6.0, centroid: [-2.5, 118.0] },
  Thailand: { min_lon: 97.3, max_lon: 105.6, min_lat: 5.6, max_lat: 20.5, centroid: [13.0, 101.5] },
  Philippines: { min_lon: 116.9, max_lon: 126.6, min_lat: 4.6, max_lat: 21.1, centroid: [12.9, 121.8] },
  Vietnam: { min_lon: 102.1, max_lon: 109.5, min_lat: 8.4, max_lat: 23.4, centroid: [16.0, 106.0] },
  Myanmar: { min_lon: 92.2, max_lon: 101.2, min_lat: 9.8, max_lat: 28.5, centroid: [19.0, 96.5] },
  Cambodia: { min_lon: 102.3, max_lon: 107.6, min_lat: 10.4, max_lat: 14.7, centroid: [12.6, 104.9] },
  Laos: { min_lon: 100.1, max_lon: 107.6, min_lat: 13.9, max_lat: 22.5, centroid: [18.0, 103.8] },
  Brunei: { min_lon: 114.1, max_lon: 115.4, min_lat: 4.0, max_lat: 5.1, centroid: [4.5, 114.7] },
  ASEAN: { min_lon: 92.0, max_lon: 141.0, min_lat: -11.0, max_lat: 28.0, centroid: [8.5, 116.5] },
};

/**
 * Strait bounding boxes for maritime tracking
 */
const STRAIT_BBOXES: Record<string, [number, number, number, number]> = {
  'Malacca Strait': [99.0, 1.0, 104.5, 6.5],
  'Lombok Strait': [115.5, -9.0, 116.5, -8.0],
  'Sunda Strait': [105.5, -6.5, 106.5, -5.5],
  'South China Sea': [109.0, 0.0, 121.0, 22.0],
  'Makassar Strait': [116.0, -5.0, 120.0, 2.0],
  'Banda Sea': [124.0, -8.0, 132.0, -3.0],
};

/**
 * Known ASEAN place name patterns for extraction
 */
const PLACE_PATTERNS = [
  /\b(Kalimantan\s+\w+)\b/gi,
  /\b(Sumatera\s+\w+)\b/gi,
  /\b(Jawa\s+\w+)\b/gi,
  /\b(Sulawesi\s+\w+)\b/gi,
  /\b(Papua\s+\w*)\b/gi,
  /\b(IKN|Nusantara)\b/gi,
  /\b(Provinsi\s+[\w\s]+?)(?=\s+(?:dan|,|\.))/gi,
  /\b(Kabupaten\s+[\w\s]+?)(?=\s+(?:dan|,|\.))/gi,
  /\b(Malaysia|Singapore|Indonesia|Thailand|Philippines|Vietnam|Myanmar|Cambodia|Laos|Brunei)\b/gi,
  /\b(Jakarta|Surabaya|Bandung|Medan|Makassar|Kuala Lumpur|Bangkok|Manila|Hanoi|Yangon)\b/gi,
];

@Injectable()
export class SpatialToolsService {
  private readonly logger = new Logger(SpatialToolsService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly headers = { 'User-Agent': 'paparan-ai/1.0 (policy-intelligence)' };

  constructor(private http: HttpClientService) {}

  /**
   * Get bounding box for an ASEAN region
   */
  async getRegionBBox(region: string): Promise<{ region: string } & BoundingBox> {
    const normalizedRegion = this.normalizeRegionName(region);

    if (normalizedRegion in ASEAN_BBOXES) {
      return { region: normalizedRegion, ...ASEAN_BBOXES[normalizedRegion] };
    }

    // Try Nominatim for unknown regions
    try {
      const geo = await this.nominatimGeocode(region);
      if (geo) {
        return {
          region,
          min_lat: geo.lat - 2,
          max_lat: geo.lat + 2,
          min_lon: geo.lon - 2,
          max_lon: geo.lon + 2,
          centroid: [geo.lat, geo.lon],
        };
      }
    } catch (error) {
      this.logger.warn(`Geocoding failed for ${region}: ${error.message}`);
    }

    // Fallback to ASEAN bbox
    return { region, ...ASEAN_BBOXES.ASEAN };
  }

  /**
   * Get strait bounding box
   */
  getStraitBBox(strait: string): [number, number, number, number] | null {
    return STRAIT_BBOXES[strait] || null;
  }

  /**
   * Get all available straits
   */
  getAvailableStraits(): string[] {
    return Object.keys(STRAIT_BBOXES);
  }

  /**
   * Get all available countries/regions
   */
  getAvailableRegions(): string[] {
    return Object.keys(ASEAN_BBOXES);
  }

  /**
   * Geocode a place name via Nominatim
   */
  async nominatimGeocode(place: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
    try {
      const params = { q: place, format: 'json', limit: '1' };
      const response = await this.http.get(this.nominatimUrl, { params, headers: this.headers });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          display_name: result.display_name || place,
        };
      }
    } catch (error) {
      this.logger.debug(`Geocoding failed for ${place}: ${error.message}`);
    }
    return null;
  }

  /**
   * Extract and geocode policy-relevant locations from text
   */
  async geolocatePolicyArea(briefText: string): Promise<{
    locations: Array<{
      name: string;
      lat: number;
      lon: number;
      display_name: string;
      map_url: string;
      satellite_url: string;
    }>;
    primary_region: string;
    map_url: string;
    spatial_context_summary: string;
  }> {
    // Extract place names
    const places = new Set<string>();
    for (const pattern of PLACE_PATTERNS) {
      const matches = briefText.match(pattern);
      if (matches) {
        matches.forEach(m => {
          const trimmed = m.trim();
          if (trimmed.length > 3) {
            places.add(trimmed);
          }
        });
      }
    }

    // Geocode locations
    const locations = [];
    const uniquePlaces = Array.from(places).slice(0, 5);

    for (const place of uniquePlaces) {
      const geo = await this.nominatimGeocode(place);
      if (geo) {
        locations.push({
          name: place,
          lat: geo.lat,
          lon: geo.lon,
          display_name: geo.display_name,
          map_url: `https://www.openstreetmap.org/#map=10/${geo.lat}/${geo.lon}`,
          satellite_url: `https://apps.sentinel-hub.com/eo-browser/?zoom=10&lat=${geo.lat}&lng=${geo.lon}&themeId=DEFAULT-THEME`,
        });
      }
    }

    // Determine primary region
    let primaryRegion = 'ASEAN';
    for (const country of ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Philippines', 'Vietnam', 'Myanmar']) {
      if (country.toLowerCase() in briefText.toLowerCase()) {
        primaryRegion = country;
        break;
      }
    }

    const bbox = ASEAN_BBOXES[primaryRegion] || ASEAN_BBOXES.ASEAN;
    const [lat, lon] = bbox.centroid;

    return {
      locations,
      primary_region: primaryRegion,
      map_url: this.generateOSMEmbedUrl(lat, lon),
      spatial_context_summary: `${locations.length} location(s) identified in ${primaryRegion}`,
    };
  }

  /**
   * Generate OSM embed URL
   */
  generateOSMEmbedUrl(lat: number, lon: number, zoom = 8): string {
    const delta = 360 / (2 ** zoom);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik`;
  }

  /**
   * Normalize region name
   */
  private normalizeRegionName(region: string): string {
    const regionMap: Record<string, string> = {
      'myanmar': 'Myanmar',
      'burma': 'Myanmar',
      'phil': 'Philippines',
      'vn': 'Vietnam',
      'th': 'Thailand',
      'id': 'Indonesia',
      'my': 'Malaysia',
      'sg': 'Singapore',
      'kh': 'Cambodia',
      'la': 'Laos',
      'bn': 'Brunei',
    };

    const lower = region.toLowerCase();
    return regionMap[lower] || region;
  }
}
