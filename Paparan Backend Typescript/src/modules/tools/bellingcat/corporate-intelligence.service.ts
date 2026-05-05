import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '@modules/tools/http/http-client.service';

/**
 * Company patterns for extraction from Indonesian text
 */
const COMPANY_PATTERNS = [
  /\bPT\.?\s+([A-Z][A-Za-z\s&]+?)(?=\s+(?:Tbk|dan|,|\.|menandatangani|melakukan|akan))/gi,
  /\b([A-Z][A-Za-z\s]+?)\s+Tbk\b/gi,
  /\b([A-Z][A-Za-z\s&,\.]+?)\s+(?:Ltd|Limited|Corp|Corporation|Inc|Group|Holdings)\b/gi,
];

/**
 * ASEAN jurisdiction codes
 */
const ASEAN_JURISDICTIONS = ['id', 'my', 'sg', 'th', 'ph', 'vn', 'mm', 'kh', 'la', 'bn'] as const;

/**
 * Corporate actor result
 */
export interface CorporateActor {
  company: string;
  jurisdiction: string;
  registration_id?: string;
  status?: string;
  opencorporates_url: string;
}

/**
 * OpenCorporates API result
 */
interface OCResult {
  company?: {
    name: string;
    company_number?: string;
    current_status?: string;
    opencorporates_url?: string;
  };
}

@Injectable()
export class CorporateIntelligenceService {
  private readonly logger = new Logger(CorporateIntelligenceService.name);
  private readonly ocBaseUrl = 'https://api.opencorporates.com/v0.4';
  private readonly headers = { 'User-Agent': 'paparan-ai/1.0' };

  private requestCount = 0;
  private readonly maxDailyRequests = 490;

  constructor(private http: HttpClientService) {}

  /**
   * Identify and verify corporate entities named in policy text
   */
  async identifyCorporateActors(policyText: string): Promise<CorporateActor[]> {
    const companies = this.extractCompanyNames(policyText);
    const results: CorporateActor[] = [];

    for (const company of companies.slice(0, 8)) {
      const jurisdiction = this.detectJurisdiction(policyText);
      const result = await this.lookupCompany(company, jurisdiction);
      results.push(result);
    }

    return results;
  }

  /**
   * Look up a specific company on OpenCorporates
   */
  async lookupCompany(companyName: string, jurisdiction = 'id'): Promise<CorporateActor> {
    if (this.requestCount >= this.maxDailyRequests) {
      return this.createFallbackResult(companyName, jurisdiction);
    }

    try {
      this.requestCount++;

      const response = await this.http.get(
        `${this.ocBaseUrl}/companies/search`,
        {
          params: {
            q: companyName,
            jurisdiction_code: jurisdiction,
            per_page: '1',
          },
          headers: this.headers,
          timeout: 8000,
        },
      );

      const data = response.data as { results?: { companies?: OCResult[] } };

      if (data?.results?.companies?.[0]) {
        const c = data.results.companies[0].company;
        return {
          company: c?.name || companyName,
          jurisdiction,
          registration_id: c?.company_number,
          status: c?.current_status,
          opencorporates_url: c?.opencorporates_url || '',
        };
      }
    } catch (error) {
      this.logger.debug(`OpenCorporates lookup failed for ${companyName}: ${error.message}`);
    }

    return this.createFallbackResult(companyName, jurisdiction);
  }

  /**
   * Search for a company across all ASEAN jurisdictions
   */
  async getASEANSubsidiaries(companyName: string): Promise<CorporateActor[]> {
    const results: CorporateActor[] = [];

    for (const jur of ASEAN_JURISDICTIONS) {
      const result = await this.lookupCompany(companyName, jur);
      if (result.registration_id) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Extract company names from text using patterns
   */
  private extractCompanyNames(text: string): string[] {
    const companies = new Set<string>();

    for (const pattern of COMPANY_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const name = match[1].trim().replace(/[.,]+$/, '');
          if (name.length > 3) {
            companies.add(name);
          }
        }
      }
    }

    return Array.from(companies);
  }

  /**
   * Detect jurisdiction from text context
   */
  private detectJurisdiction(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('singapore') || lower.includes('sgd') || lower.includes('mas ')) {
      return 'sg';
    }
    if (lower.includes('malaysia') || lower.includes('ringgit') || lower.includes('bursa')) {
      return 'my';
    }
    if (lower.includes('thailand') || lower.includes('baht')) {
      return 'th';
    }
    if (lower.includes('philippines') || lower.includes('peso')) {
      return 'ph';
    }
    if (lower.includes('vietnam') || lower.includes('dong')) {
      return 'vn';
    }

    return 'id'; // Default to Indonesia
  }

  /**
   * Create a fallback result when API lookup fails
   */
  private createFallbackResult(companyName: string, jurisdiction: string): CorporateActor {
    return {
      company: companyName,
      jurisdiction,
      status: 'unverified',
      opencorporates_url: `https://opencorporates.com/companies/${jurisdiction}?q=${encodeURIComponent(companyName)}`,
    };
  }

  /**
   * Get current API request count
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request count (for testing)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
}
