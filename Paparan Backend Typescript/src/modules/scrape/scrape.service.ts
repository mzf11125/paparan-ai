import { Injectable } from '@nestjs/common';
import { ScraperAgent } from '@modules/agents/scraper/scraper.agent';

@Injectable()
export class ScrapeService {
  constructor(private scraper: ScraperAgent) {}

  async trigger(source?: string) {
    return this.scraper.scrape(source);
  }
}
