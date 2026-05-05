import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '@modules/tools/http/http-client.service';

/**
 * Archive check result
 */
export interface ArchiveCheckResult {
  archived: boolean;
  archive_url: string | null;
  last_archived: string | null;
  recent: boolean;
}

/**
 * Archive result
 */
export interface ArchiveResult {
  archive_url: string;
  status: 'archived' | 'already_archived' | 'fallback_link';
  timestamp: string;
  original_url?: string;
}

/**
 * Brief source archive result
 */
export interface BriefSourceArchiveResult {
  source_id: string;
  original_url: string;
  archive_url: string | null;
  status: string;
}

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);
  private readonly cdxUrl = 'https://web.archive.org/cdx/search/cdx';
  private readonly saveUrl = 'https://web.archive.org/save/';
  private readonly headers = { 'User-Agent': 'paparan-ai/1.0' };

  constructor(private http: HttpClientService) {}

  /**
   * Check if a URL is already archived in the Wayback Machine
   */
  async checkArchive(url: string): Promise<ArchiveCheckResult> {
    try {
      const response = await this.http.get(this.cdxUrl, {
        params: {
          url: url,
          output: 'json',
          limit: '1',
          fl: 'timestamp,original,statuscode',
          filter: 'statuscode:200',
        },
        headers: this.headers,
        timeout: 8000,
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 1) {
        // First row is header, second row is data
        const ts = response.data[1][0]; // YYYYMMDDHHmmss
        const archiveUrl = `https://web.archive.org/web/${ts}/${url}`;

        // Check if archived within last 7 days
        const archivedDate = this.parseTimestamp(ts);
        const recent = this.isRecent(archivedDate, 7);

        return {
          archived: true,
          archive_url: archiveUrl,
          last_archived: ts,
          recent,
        };
      }
    } catch (error) {
      this.logger.debug(`Archive check failed for ${url}: ${error.message}`);
    }

    return {
      archived: false,
      archive_url: null,
      last_archived: null,
      recent: false,
    };
  }

  /**
   * Archive a URL to the Wayback Machine
   */
  async archiveSource(url: string): Promise<ArchiveResult> {
    // Check if already recently archived
    const existing = await this.checkArchive(url);
    if (existing.recent) {
      return {
        archive_url: existing.archive_url!,
        status: 'already_archived',
        timestamp: existing.last_archived!,
      };
    }

    try {
      const response = await this.http.get(`${this.saveUrl}${url}`, {
        headers: this.headers,
        timeout: 30000,
      });

      if (response.status === 200) {
        // Wayback returns the archived URL in Content-Location header
        const contentLocation = response.headers?.['content-location'];
        const ts = this.formatTimestamp(new Date());

        const archiveUrl = contentLocation
          ? `https://web.archive.org${contentLocation}`
          : `https://web.archive.org/web/${ts}/${url}`;

        return {
          archive_url: archiveUrl,
          status: 'archived',
          timestamp: ts,
          original_url: url,
        };
      }
    } catch (error) {
      this.logger.debug(`Archive failed for ${url}: ${error.message}`);
    }

    // Fallback: return archive.ph link
    const ts = this.formatTimestamp(new Date());
    return {
      archive_url: `https://archive.ph/${url}`,
      status: 'fallback_link',
      timestamp: ts,
      original_url: url,
    };
  }

  /**
   * Archive all sources from a brief to the Wayback Machine
   */
  async archiveBriefSources(sources: Array<{ url?: string; id?: string }>): Promise<BriefSourceArchiveResult[]> {
    const results: BriefSourceArchiveResult[] = [];

    for (const source of sources) {
      const url = source.url;
      if (!url || !url.startsWith('http')) {
        continue;
      }

      const result = await this.archiveSource(url);
      results.push({
        source_id: source.id || '',
        original_url: url,
        archive_url: result.archive_url,
        status: result.status,
      });
    }

    return results;
  }

  /**
   * Parse Wayback Machine timestamp
   */
  private parseTimestamp(ts: string): Date {
    // Format: YYYYMMDDHHmmss
    const year = parseInt(ts.substring(0, 4));
    const month = parseInt(ts.substring(4, 6)) - 1;
    const day = parseInt(ts.substring(6, 8));
    const hour = parseInt(ts.substring(8, 10));
    const minute = parseInt(ts.substring(10, 12));
    const second = parseInt(ts.substring(12, 14));

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Format date to Wayback Machine timestamp
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Check if a date is recent (within specified days)
   */
  private isRecent(date: Date, days = 7): boolean {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  }
}
