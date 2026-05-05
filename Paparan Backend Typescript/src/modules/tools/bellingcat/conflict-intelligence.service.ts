import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '@modules/tools/http/http-client.service';

/**
 * ASEAN country name → ISO code mapping for ACLED
 */
const COUNTRY_MAP: Record<string, string> = {
  myanmar: 'Myanmar',
  burma: 'Myanmar',
  philippines: 'Philippines',
  phil: 'Philippines',
  indonesia: 'Indonesia',
  papua: 'Indonesia',
  thailand: 'Thailand',
  malaysia: 'Malaysia',
  vietnam: 'Vietnam',
  cambodia: 'Cambodia',
  laos: 'Laos',
  singapore: 'Singapore',
};

/**
 * Conflict event
 */
interface ConflictEvent {
  event_date: string;
  event_type: string;
  actor1: string;
  location: string;
  fatalities: number;
  notes: string;
}

/**
 * Conflict events result
 */
export interface ConflictEventsResult {
  region: string;
  country?: string;
  event_count: number | null;
  fatalities: number | null;
  dominant_event_type?: string;
  event_type_breakdown?: Record<string, number>;
  events: ConflictEvent[];
  source: string;
  acled_url: string;
  news_summary?: string;
}

/**
 * Stability index result
 */
export interface StabilityIndexResult {
  country: string;
  stability_score: number;
  trend: 'stable' | 'fragile' | 'deteriorating';
  event_count_30d: number;
  fatalities_30d: number;
  dominant_event_type: string;
}

@Injectable()
export class ConflictIntelligenceService {
  private readonly logger = new Logger(ConflictIntelligenceService.name);
  private readonly acledUrl = 'https://api.acleddata.com/acled/read';

  constructor(
    private config: ConfigService,
    private http: HttpClientService,
  ) {}

  /**
   * Get conflict and security events from ACLED
   */
  async getConflictEvents(region: string, days = 30): Promise<ConflictEventsResult> {
    const country = COUNTRY_MAP[region.toLowerCase()] || region;
    const events = await this.queryACLED(country, days);

    if (!events || events.length === 0) {
      // Fallback to Tavily
      return {
        region,
        event_count: null,
        fatalities: null,
        events: [],
        source: 'tavily_fallback',
        acled_url: `https://acleddata.com/data-export-tool/?country=${country}`,
        news_summary: `Conflict news search for ${region} (last ${days} days) - integrate with Tavily service`,
      };
    }

    const fatalities = events.reduce((sum, e) => sum + (e.fatalities || 0), 0);

    // Calculate event type breakdown
    const eventTypes: Record<string, number> = {};
    for (const event of events) {
      const et = event.event_type || 'Unknown';
      eventTypes[et] = (eventTypes[et] || 0) + 1;
    }

    const dominantEventType = Object.keys(eventTypes).reduce((a, b) =>
      eventTypes[a] > eventTypes[b] ? a : b,
    );

    return {
      region,
      country,
      event_count: events.length,
      fatalities,
      dominant_event_type: dominantEventType,
      event_type_breakdown: eventTypes,
      events: events.slice(0, 10),
      source: 'acled',
      acled_url: `https://acleddata.com/data-export-tool/?country=${country}`,
    };
  }

  /**
   * Compute a simple stability score for an ASEAN country
   */
  async getStabilityIndex(country: string): Promise<StabilityIndexResult> {
    const conflictResult = await this.getConflictEvents(country, 30);
    const eventCount = conflictResult.event_count || 0;
    const fatalities = conflictResult.fatalities || 0;

    // Score: 1 = stable, 0 = highly unstable
    const eventPenalty = Math.min(eventCount / 100, 0.7);
    const fatalityPenalty = Math.min(fatalities / 500, 0.3);
    const stabilityScore = Math.round(Math.max(0, 1 - eventPenalty - fatalityPenalty) * 1000) / 1000;

    let trend: 'stable' | 'fragile' | 'deteriorating' = 'stable';
    if (stabilityScore < 0.4) {
      trend = 'deteriorating';
    } else if (stabilityScore < 0.65) {
      trend = 'fragile';
    }

    return {
      country,
      stability_score: stabilityScore,
      trend,
      event_count_30d: eventCount,
      fatalities_30d: fatalities,
      dominant_event_type: conflictResult.dominant_event_type || 'Unknown',
    };
  }

  /**
   * Search conflict and security news
   */
  async searchConflictNews(region: string, days = 7): Promise<string> {
    // This would integrate with Tavily service
    const domains = [
      'acleddata.com',
      'crisisgroup.org',
      'reliefweb.int',
      'hrw.org',
      'amnesty.org',
      'iseas.edu.sg',
    ];

    return `Conflict news search for ${region} (last ${days} days) from ${domains.join(', ')} - integrate with Tavily service`;
  }

  /**
   * Get stability index for all ASEAN countries
   */
  async getASEANStabilityIndex(): Promise<Record<string, StabilityIndexResult>> {
    const countries = Object.keys(COUNTRY_MAP).filter(c => !['papua', 'burma', 'phil'].includes(c));
    const results: Record<string, StabilityIndexResult> = {};

    for (const country of new Set(countries.map(c => COUNTRY_MAP[c]))) {
      results[country] = await this.getStabilityIndex(country);
    }

    return results;
  }

  /**
   * Query ACLED API for conflict events
   */
  private async queryACLED(country: string, days: number): Promise<ConflictEvent[]> {
    const apiKey = this.config.get('ACLED_API_KEY');
    const email = this.config.get('ACLED_EMAIL');

    if (!apiKey || !email) {
      this.logger.debug('ACLED credentials not configured');
      return [];
    }

    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const params = {
        key: apiKey,
        email: email,
        country: country,
        event_date: since,
        event_date_where: '>=',
        limit: '50',
        fields: 'event_date|event_type|actor1|location|fatalities|notes',
      };

      const response = await this.http.get(this.acledUrl, { params, timeout: 10000 });

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (error) {
      this.logger.debug(`ACLED query failed: ${error.message}`);
    }

    return [];
  }
}
