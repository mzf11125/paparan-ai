import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from '@database/repositories/reports.repository';
import { OrchestratorService } from '@modules/agents/orchestrator/orchestrator.service';

@Injectable()
export class PaparanService {
  constructor(
    private reportsRepository: ReportsRepository,
    private orchestrator: OrchestratorService,
  ) {}

  async generateBrief(userId: string, topic: string, region?: string) {
    // Run the orchestrator to generate the brief
    const brief = await this.orchestrator.generateBrief({
      topic,
      region,
      userId,
    });

    // Save to database
    const report = await this.reportsRepository.create({
      userId,
      topic,
      region: region || 'global',
      classification: brief.classification || 'general',
      brief,
    });

    return {
      id: report.id,
      ...brief,
    };
  }

  async getUserBriefs(userId: string, limit = 10, offset = 0) {
    return this.reportsRepository.findByUser(userId, limit, offset);
  }

  async getBrief(id: string, userId: string) {
    const brief = await this.reportsRepository.findById(id);
    if (!brief || brief.user_id !== userId) {
      throw new NotFoundException('Brief not found');
    }
    return brief;
  }
}
