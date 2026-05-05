import { Injectable } from '@nestjs/common';

@Injectable()
export class RdtiiService {
  async extractRegulations(topic: string, region?: string) {
    // TODO: Extract RDTII regulations
    return [];
  }
}
