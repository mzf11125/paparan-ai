import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from '@database/repositories/reports.repository';
import { RpjmnScorerAgent } from '@modules/agents/rpjmn-scorer/rpjmn-scorer.agent';
import { AseanSimulatorAgent } from '@modules/agents/asean-simulator/asean-simulator.agent';
import { SynthesizerAgent } from '@modules/agents/synthesizer/synthesizer.agent';
import { LLMService } from '@config/llm.service';

/**
 * Policy Brief interface for export
 */
interface PolicyBrief {
  id: string;
  title: string;
  summary?: string;
  currentSituation?: string;
  implications?: string;
  executiveSummary?: string[];
  keyDevelopments?: Array<{
    title: string;
    description: string;
    significance: string;
    timeframe?: string;
  }>;
  recommendations?: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
    stakeholders?: string[];
  }>;
  sources?: Array<{
    url: string;
    title: string;
    confidence: string;
  }>;
  region?: string;
  date?: string;
  classification?: string;
  confidence_score?: number;
  source_count?: number;
  actions?: Array<{
    text: string;
    priority: string;
    owner?: string;
    deadline?: string;
  }>;
  developments?: Array<{
    text: string;
    impact: string;
  }>;
  keyPoints?: string[];
  risks?: string[];
  opportunities?: string[];
  talkingPoints?: string[];
  rpjmnAlignment?: any;
  aseanSimulation?: any;
  createdAt?: string;
}

/**
 * Diplomat export options
 */
interface DiplomatExportOptions {
  to: string;
  fromName: string;
  ref?: string;
  distribution?: string[];
}

/**
 * Export result with metadata
 */
interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Watermark colors for different classification levels
 */
const WATERMARK_COLORS = {
  unclassified: { r: 0.85, g: 0.85, b: 0.85 },
  official: { r: 0.7, g: 0.8, b: 1.0 },
  confidential: { r: 1.0, g: 0.85, b: 0.6 },
  secret: { r: 1.0, g: 0.7, b: 0.7 },
};

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private reportsRepository: ReportsRepository,
    private rpjmnScorer: RpjmnScorerAgent,
    private aseanSimulator: AseanSimulatorAgent,
    private synthesizer: SynthesizerAgent,
    private llm: LLMService,
  ) {}

  /**
   * Generate PDF from policy brief
   */
  async generatePdf(briefId: string, userId: string): Promise<ExportResult> {
    const brief = await this.getBrief(briefId, userId);
    const pdfBuffer = await this.createPdfContent(brief);

    return {
      buffer: pdfBuffer,
      filename: `brief-${briefId}.pdf`,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
    };
  }

  /**
   * Generate PowerPoint from policy brief
   */
  async generatePptx(briefId: string, userId: string): Promise<ExportResult> {
    const brief = await this.getBrief(briefId, userId);
    const pptxBuffer = await this.createPptxContent(brief);

    return {
      buffer: pptxBuffer,
      filename: `brief-${briefId}.pptx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: pptxBuffer.length,
    };
  }

  /**
   * Generate diplomatic memo PDF
   */
  async generateDiplomaticPdf(briefId: string, options: DiplomatExportOptions, userId: string): Promise<ExportResult> {
    const brief = await this.getBrief(briefId, userId);

    // Generate reference number if not provided
    let refNo = options.ref;
    if (!refNo) {
      refNo = await this.generateRefNumber();
    }

    const pdfBuffer = await this.createDiplomatPdfContent(brief, options.to, options.fromName, refNo, options.distribution);

    return {
      buffer: pdfBuffer,
      filename: `diplomat-${refNo}.pdf`,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
    };
  }

  /**
   * Generate talking points for a brief
   */
  async generateTalkingPoints(briefId: string, userId: string): Promise<{ brief_id: string; talking_points: string[] }> {
    const brief = await this.getBrief(briefId, userId);

    // Use the synthesizer agent or LLM to generate talking points
    const briefText = `${brief.title}\n${brief.summary || brief.currentSituation || ''}\n${brief.implications || ''}`;

    try {
      const response = await this.llm.generateStructuredWithRetry(
        `Generate 5-7 diplomatic talking points for this policy brief. Each point should be:
- Concise (1-2 sentences)
- Actionable
- Suitable for diplomatic communication

Brief: ${briefText}

Return as JSON array of strings.`,
        { talking_points: ['string'] },
        { temperature: 0.7, maxTokens: 1000 },
      );

      return {
        brief_id: briefId,
        talking_points: response.talking_points || [],
      };
    } catch (error) {
      this.logger.error(`Failed to generate talking points: ${error.message}`);
      return {
        brief_id: briefId,
        talking_points: brief.keyPoints || brief.executiveSummary || [],
      };
    }
  }

  /**
   * Score brief against RPJMN pillars
   */
  async scoreRpjmn(briefId: string, userId: string): Promise<PolicyBrief> {
    const brief = await this.getBrief(briefId, userId);

    // Use the RPJMN scorer agent
    try {
      const response = await this.rpjmnScorer.executeSafe(
        {
          briefContent: JSON.stringify(brief),
          topic: brief.title,
          summary: brief.summary,
          keyDevelopments: brief.keyDevelopments?.map(d => d.title) || [],
        },
        { userId },
      );

      if (response.success && response.data) {
        // Update brief with RPJMN alignment
        brief.rpjmnAlignment = response.data;
        await this.reportsRepository.update(briefId, {
          content: { ...brief, rpjmnAlignment: response.data },
        });
      }
    } catch (error) {
      this.logger.error(`RPJMN scoring failed: ${error.message}`);
    }

    return brief;
  }

  /**
   * Synthesize multiple briefs
   */
  async synthesizeBriefs(briefIds: string[], userId: string, options?: { synthesisType?: string }): Promise<any> {
    if (briefIds.length < 2) {
      throw new Error('Provide at least 2 brief IDs');
    }
    if (briefIds.length > 10) {
      throw new Error('Maximum 10 briefs per synthesis');
    }

    // Fetch briefs
    const briefs = [];
    for (const id of briefIds) {
      const brief = await this.getBrief(id, userId);
      briefs.push(brief);
    }

    if (briefs.length === 0) {
      throw new NotFoundException('No briefs found');
    }

    // Use synthesizer agent
    const response = await this.synthesizer.executeSafe(
      {
        briefIds,
        synthesisType: options?.synthesisType || 'comprehensive',
      },
      { userId },
    );

    if (!response.success) {
      throw new Error(response.error || 'Synthesis failed');
    }

    return response.data;
  }

  /**
   * Simulate ASEAN scenario
   */
  async simulateAsean(scenario: string, affectedPillars?: string[]): Promise<any> {
    const response = await this.aseanSimulator.executeSafe(
      {
        scenario,
        countries: undefined, // Will use all ASEAN countries by default
        meetingType: 'ministerial',
      },
      { userId: 'system' },
    );

    if (!response.success) {
      throw new Error(response.error || 'Simulation failed');
    }

    return response.data;
  }

  /**
   * Get brief version history
   */
  async getBriefVersions(briefId: string): Promise<any[]> {
    // TODO: Implement with version repository
    return [];
  }

  /**
   * Acknowledge brief
   */
  async acknowledgeBrief(briefId: string, acknowledgedBy: string, userId: string): Promise<any> {
    const brief = await this.getBrief(briefId, userId);

    const diplomatMeta = {
      ...brief.diplomatMeta,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy,
    };

    // Update brief with acknowledgment
    await this.reportsRepository.update(briefId, {
      content: { ...brief, diplomatMeta },
    });

    return {
      acknowledged_at: diplomatMeta.acknowledgedAt,
      acknowledged_by: acknowledgedBy,
    };
  }

  /**
   * Record outcome for brief
   */
  async recordOutcome(briefId: string, rating: number, outcomeNotes?: string, actionTaken?: boolean): Promise<any> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be 1-5');
    }

    // TODO: Implement with outcomes repository
    return {
      brief_id: briefId,
      rating,
      outcome_notes: outcomeNotes,
      action_taken: actionTaken || false,
      recorded_at: new Date().toISOString(),
    };
  }

  /**
   * Get outcomes for brief
   */
  async getOutcomes(briefId: string): Promise<any[]> {
    // TODO: Implement with outcomes repository
    return [];
  }

  // ==================== Private Methods ====================

  /**
   * Get brief by ID for user
   */
  private async getBrief(briefId: string, userId: string): Promise<PolicyBrief> {
    const report = await this.reportsRepository.findById(briefId);

    if (!report || report.userId !== userId) {
      throw new NotFoundException('Brief not found');
    }

    return report.content || report;
  }

  /**
   * Generate reference number for diplomatic briefs
   */
  private async generateRefNumber(): Promise<string> {
    // Format: PAP-YYYY-#### where #### is a sequence number
    const year = new Date().getFullYear();
    const seq = await this.getNextSequenceNumber();
    return `PAP-${year}-${String(seq).padStart(4, '0')}`;
  }

  /**
   * Get next sequence number
   */
  private async getNextSequenceNumber(): Promise<number> {
    // TODO: Implement with database sequence
    return Math.floor(Math.random() * 10000);
  }

  /**
   * Create PDF content using pdfkit
   */
  private async createPdfContent(brief: PolicyBrief): Promise<Buffer> {
    // Placeholder implementation - would use pdfkit in production
    const content = `
POLICY INTELLIGENCE BRIEF
${'='.repeat(50)}

${brief.title}
${brief.region || ''} · ${brief.date || ''} · ${brief.classification?.toUpperCase() || 'UNCLASSIFIED'}

EXECUTIVE SUMMARY
${(brief.executiveSummary || brief.keyPoints || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}

CURRENT SITUATION
${brief.currentSituation || brief.summary || ''}

STRATEGIC IMPLICATIONS
${brief.implications || ''}

RECOMMENDED ACTIONS
${(brief.recommendations || []).map(r => `- [${r.priority?.toUpperCase()}] ${r.action}`).join('\n')}

SOURCES
${(brief.sources || []).map(s => `- ${s.title} [${s.confidence}]`).join('\n')}
    `.trim();

    return Buffer.from(content);
  }

  /**
   * Create PPTX content using pptxgenjs
   */
  private async createPptxContent(brief: PolicyBrief): Promise<Buffer> {
    // Placeholder implementation - would use pptxgenjs in production
    const content = `
SLIDE 1: TITLE
${brief.title}
${brief.region || ''} · ${brief.date || ''}

SLIDE 2: EXECUTIVE SUMMARY
${(brief.executiveSummary || brief.keyPoints || []).join('\n')}

SLIDE 3: CURRENT SITUATION
${brief.currentSituation || brief.summary || ''}

SLIDE 4: KEY DEVELOPMENTS & ACTIONS
${(brief.keyDevelopments || []).map(d => `[${d.significance}] ${d.title}`).join('\n')}

SLIDE 5: SOURCES
${(brief.sources || []).map(s => `[${s.confidence}] ${s.title}`).join('\n')}
    `.trim();

    return Buffer.from(content);
  }

  /**
   * Create diplomatic PDF content
   */
  private async createDiplomatPdfContent(
    brief: PolicyBrief,
    to: string,
    fromName: string,
    refNo: string,
    distribution?: string[],
  ): Promise<Buffer> {
    const content = `
DIPLOMATIC MEMORANDUM

${'='.repeat(20)}  ${brief.classification?.toUpperCase() || 'UNCLASSIFIED'}  ${'='.repeat(20)}

TO: ${to}
FROM: ${fromName}
SUBJECT: ${brief.title}
DATE: ${brief.date || new Date().toISOString().split('T')[0]}
REF: ${refNo}
CLASSIFICATION: ${brief.classification?.toUpperCase() || 'UNCLASSIFIED'}

EXECUTIVE SUMMARY
${(brief.executiveSummary || []).slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n')}

RECOMMENDED ACTIONS (HIGH PRIORITY)
${(brief.recommendations?.filter(r => r.priority === 'high') || []).map(a => `→ ${a.action}`).join('\n')}

${distribution ? `
DISTRIBUTION:
${distribution.join(' · ')}
` : ''}
${'='.repeat(80)}

Prepared by Paparan Policy Intelligence System
Source confidence: ${brief.confidence_score || 'N/A'} · ${brief.sources?.length || 0} sources verified
    `.trim();

    return Buffer.from(content);
  }
}
