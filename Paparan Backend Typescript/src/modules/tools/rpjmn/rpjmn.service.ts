import { Injectable } from '@nestjs/common';

@Injectable()
export class RpjmnService {
  async getPillars() {
    // TODO: Return RPJMN 2025-2029 pillars
    return [];
  }

  async scoreAgainstPillar(content: string, pillar: string) {
    // TODO: Score content against RPJMN pillar
    return { score: 0, rationale: '' };
  }
}
