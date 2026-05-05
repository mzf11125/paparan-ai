import { Injectable } from '@nestjs/common';
import { FeedRepository } from '@database/repositories/feed.repository';

@Injectable()
export class FeedService {
  constructor(private feedRepository: FeedRepository) {}

  async getFeed(params: {
    limit?: number;
    offset?: number;
    source?: string;
    category?: string;
    region?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.feedRepository.findAll(params);
  }

  async search(query: string, limit = 10) {
    return this.feedRepository.search(query, limit);
  }
}
