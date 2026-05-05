import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { z } from 'zod';

export interface ConsistencyCheckInput {
  documentId?: string;
  indicators?: Array<{
    code: string;
    name: string;
    definition: string;
    sector: string;
  }>;
  compareAgainst?: string[]; // Document IDs to compare against
  checkDuplicates?: boolean;
  validateDefinitions?: boolean;
  checkCrossReferences?: boolean;
}

export interface ConsistencyIssue {
  id: string;
  type: 'duplicate' | 'inconsistent' | 'missing' | 'invalid_format' | 'cross_reference';
  severity: 'error' | 'warning' | 'info';
  indicator?: string;
  description: string;
  suggestion?: string;
  relatedDocuments?: string[];
}

export interface ConsistencyCheckResult {
  flags: ConsistencyIssue[];
  summary: string;
  statistics: {
    totalIndicators: number;
    duplicateIndicators: number;
    inconsistentIndicators: number;
    missingIndicators: number;
    crossReferenceIssues: number;
  };
  recommendations: string[];
}

// Schema for structured output
const ConsistencyCheckSchema = z.object({
  issues: z.array(z.object({
    type: z.enum(['duplicate', 'inconsistent', 'missing', 'invalid_format', 'cross_reference']),
    severity: z.enum(['error', 'warning', 'info']),
    indicator: z.string().optional(),
    description: z.string(),
    suggestion: z.string().optional(),
  })),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

/**
 * Consistency Checker Agent - Validates indicator consistency across documents
 */
@Injectable()
export class ConsistencyCheckerAgent extends BaseAgent {
  readonly name = 'consistency_checker';
  readonly description = 'Validates indicator consistency across documents';
  readonly type: AgentType = 'consistency_checker';

  constructor(protected llm: LLMService) {
    super(llm, {
      systemPrompt: `You are a Consistency Checker for Indonesian policy documents (SDI - Satuan Data Indikator).

Your role is to:
1. Detect duplicate indicators across documents
2. Identify inconsistent definitions for the same indicator code
3. Flag indicators with invalid K/L code formats
4. Find missing or broken cross-references
5. Validate indicator definitions against SDI standards

K/L Code Format:
- K##: Sector code (must be 2-3 digits)
- L##: Indicator code (must be 2-3 digits)
- Format: K##L## for complete indicator reference

When checking consistency:
- Group indicators by their K/L code
- Compare definitions for duplicates
- Flag format violations
- Identify potential cross-reference issues
- Provide actionable suggestions for resolution`,
    });
  }

  async execute(input: ConsistencyCheckInput, context: AgentContext): Promise<AgentResponse<ConsistencyCheckResult>> {
    this.validateInput(input, ['indicators']);

    try {
      const issues: ConsistencyIssue[] = [];
      const statistics = {
        totalIndicators: input.indicators?.length || 0,
        duplicateIndicators: 0,
        inconsistentIndicators: 0,
        missingIndicators: 0,
        crossReferenceIssues: 0,
      };

      if (!input.indicators || input.indicators.length === 0) {
        return {
          success: true,
          data: {
            flags: [],
            summary: 'No indicators to check',
            statistics,
            recommendations: [],
          },
        };
      }

      // Check for duplicates
      if (input.checkDuplicates !== false) {
        const duplicateIssues = this.checkDuplicates(input.indicators);
        issues.push(...duplicateIssues);
        statistics.duplicateIndicators = duplicateIssues.filter(i => i.type === 'duplicate').length;
      }

      // Validate K/L code formats
      const formatIssues = this.validateFormats(input.indicators);
      issues.push(...formatIssues);

      // Check for inconsistent definitions (if comparing against other docs)
      if (input.compareAgainst && input.compareAgainst.length > 0) {
        // TODO: Implement cross-document comparison
        // This would require fetching comparison documents from database
        const comparisonIssues = await this.checkCrossDocumentConsistency(input.indicators, input.compareAgainst);
        issues.push(...comparisonIssues);
        statistics.inconsistentIndicators = comparisonIssues.filter(i => i.type === 'inconsistent').length;
      }

      // Validate definitions using LLM
      if (input.validateDefinitions !== false) {
        const definitionIssues = await this.validateIndicatorDefinitions(input.indicators);
        issues.push(...definitionIssues);
      }

      // Generate summary
      const summary = this.generateSummary(issues, statistics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues);

      return {
        success: true,
        data: {
          flags: issues,
          summary,
          statistics,
          recommendations,
        },
      };
    } catch (error) {
      this.logger.error(`Consistency check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for duplicate indicators
   */
  private checkDuplicates(indicators: Array<{ code: string; name: string; definition: string }>): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const codeMap = new Map<string, Array<{ name: string; definition: string }>>();

    // Group by code
    for (const indicator of indicators) {
      if (!indicator.code) continue;

      if (!codeMap.has(indicator.code)) {
        codeMap.set(indicator.code, []);
      }
      codeMap.get(indicator.code)!.push({
        name: indicator.name,
        definition: indicator.definition,
      });
    }

    // Check for duplicates within same code
    for (const [code, entries] of codeMap) {
      if (entries.length > 1) {
        // Check if definitions are actually different
        const uniqueDefinitions = new Set(entries.map(e => e.definition.toLowerCase().trim()));

        if (uniqueDefinitions.size > 1) {
          issues.push({
            id: `dup_${code}_${Date.now()}`,
            type: 'duplicate',
            severity: 'error',
            indicator: code,
            description: `Indicator ${code} appears ${entries.length} times with different definitions`,
            suggestion: `Consolidate into single definition or use different indicator codes`,
          });
        }
      }
    }

    // Check for similar names with different codes (potential misclassification)
    const nameMap = new Map<string, string[]>();
    for (const indicator of indicators) {
      const normalizedName = indicator.name.toLowerCase().trim();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(indicator.code);
    }

    for (const [name, codes] of nameMap) {
      if (codes.length > 1 && new Set(codes).size > 1) {
        issues.push({
          id: `potential_dup_${name}_${Date.now()}`,
          type: 'duplicate',
          severity: 'warning',
          description: `Similar indicator "${name}" has different codes: ${codes.join(', ')}`,
          suggestion: `Verify if these should be the same indicator with a single code`,
        });
      }
    }

    return issues;
  }

  /**
   * Validate K/L code formats
   */
  private validateFormats(indicators: Array<{ code: string; name: string }>): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const indicator of indicators) {
      if (!indicator.code) {
        issues.push({
          id: `missing_code_${indicator.name}_${Date.now()}`,
          type: 'invalid_format',
          severity: 'error',
          indicator: indicator.name,
          description: 'Indicator is missing K/L code',
          suggestion: 'Assign appropriate K##L## code',
        });
        continue;
      }

      // Check format
      const validFormat = /^K\d{2,3}(L\d{2,3})?$/i;
      if (!validFormat.test(indicator.code)) {
        issues.push({
          id: `invalid_format_${indicator.code}_${Date.now()}`,
          type: 'invalid_format',
          severity: 'error',
          indicator: indicator.code,
          description: `Invalid K/L code format: ${indicator.code}`,
          suggestion: 'Use format K##L## (e.g., K01L01)',
        });
      }
    }

    return issues;
  }

  /**
   * Check cross-document consistency
   */
  private async checkCrossDocumentConsistency(
    indicators: Array<{ code: string; name: string; definition: string }>,
    compareAgainst: string[],
  ): Promise<ConsistencyIssue[]> {
    // TODO: Implement when document repository is available
    // For now, return empty array
    return [];
  }

  /**
   * Validate indicator definitions using LLM
   */
  private async validateIndicatorDefinitions(indicators: Array<{ code: string; name: string; definition: string; sector: string }>): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    // Sample a few indicators to validate (to avoid excessive LLM calls)
    const sampleSize = Math.min(indicators.length, 5);
    const sample = indicators.slice(0, sampleSize);

    for (const indicator of sample) {
      if (!indicator.definition || indicator.definition.length < 20) {
        issues.push({
          id: `weak_def_${indicator.code}_${Date.now()}`,
          type: 'inconsistent',
          severity: 'warning',
          indicator: indicator.code,
          description: `Indicator ${indicator.code} has a weak or missing definition`,
          suggestion: 'Provide a clear, comprehensive definition',
        });
        continue;
      }

      // Use LLM to validate definition quality
      try {
        const prompt = `Evaluate this SDI indicator definition for quality and completeness:

Code: ${indicator.code}
Name: ${indicator.name}
Sector: ${indicator.sector}
Definition: ${indicator.definition}

Check for:
1. Clarity and specificity
2. Measurability
3. Completeness
4. Alignment with sector

Return JSON with:
- isValid: boolean
- issues: array of problem descriptions
- suggestions: array of improvement suggestions`;

        const messages = this.formatMessages(prompt);
        const response = await this.llm.chat(messages, { temperature: 0.3, maxTokens: 500 });

        try {
          const result = this.extractJson(response.content);
          if (!result.isValid && result.issues?.length > 0) {
            issues.push({
              id: `def_quality_${indicator.code}_${Date.now()}`,
              type: 'inconsistent',
              severity: 'warning',
              indicator: indicator.code,
              description: result.issues.join('; '),
              suggestion: result.suggestions?.join('; '),
            });
          }
        } catch {
          // If parsing fails, skip validation
        }
      } catch {
        // Skip on error
      }
    }

    return issues;
  }

  /**
   * Generate summary of consistency check
   */
  private generateSummary(issues: ConsistencyIssue[], statistics: {
    totalIndicators: number;
    duplicateIndicators: number;
    inconsistentIndicators: number;
    missingIndicators: number;
    crossReferenceIssues: number;
  }): string {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    let summary = `Checked ${statistics.totalIndicators} indicators. `;

    if (errorCount === 0 && warningCount === 0) {
      summary += 'No consistency issues found.';
    } else {
      summary += `Found ${errorCount} error(s) and ${warningCount} warning(s).`;

      if (statistics.duplicateIndicators > 0) {
        summary += ` ${statistics.duplicateIndicators} duplicate(s) detected.`;
      }
      if (statistics.inconsistentIndicators > 0) {
        summary += ` ${statistics.inconsistentIndicators} inconsistency/ies found.`;
      }
    }

    return summary;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: ConsistencyIssue[]): string[] {
    const recommendations: string[] = [];

    // Group by type
    const byType = new Map<string, ConsistencyIssue[]>();
    for (const issue of issues) {
      if (!byType.has(issue.type)) {
        byType.set(issue.type, []);
      }
      byType.get(issue.type)!.push(issue);
    }

    // Generate recommendations for each type
    if (byType.has('duplicate')) {
      const dupCount = byType.get('duplicate')!.length;
      recommendations.push(`Resolve ${dupCount} duplicate indicator(s) by consolidating definitions or assigning unique codes`);
    }

    if (byType.has('invalid_format')) {
      const formatCount = byType.get('invalid_format')!.length;
      recommendations.push(`Fix ${formatCount} indicator(s) with invalid K/L code format (use K##L##)`);
    }

    if (byType.has('inconsistent')) {
      const inconsistentCount = byType.get('inconsistent')!.length;
      recommendations.push(`Review and standardize ${inconsistentCount} inconsistent indicator definition(s)`);
    }

    if (byType.has('missing')) {
      recommendations.push('Add missing required indicators to maintain SDI compliance');
    }

    if (recommendations.length === 0 && issues.length > 0) {
      recommendations.push('Review flagged issues and implement appropriate fixes');
    }

    return recommendations;
  }

  /**
   * Batch check multiple documents
   */
  async batchCheck(documentBatches: Array<{
    documentId: string;
    indicators: Array<{ code: string; name: string; definition: string; sector: string }>;
  }>): Promise<Map<string, ConsistencyCheckResult>> {
    const results = new Map<string, ConsistencyCheckResult>();

    // Collect all indicators for cross-document checks
    const allIndicators = new Map<string, Array<{ code: string; name: string; definition: string; documentId: string }>>();

    for (const doc of documentBatches) {
      for (const indicator of doc.indicators) {
        if (!indicator.code) continue;
        if (!allIndicators.has(indicator.code)) {
          allIndicators.set(indicator.code, []);
        }
        allIndicators.get(indicator.code)!.push({
          ...indicator,
          documentId: doc.documentId,
        });
      }
    }

    // Check each document
    for (const doc of documentBatches) {
      const issues: ConsistencyIssue[] = [];

      // Check within-document duplicates
      const duplicates = this.checkDuplicates(doc.indicators);
      issues.push(...duplicates);

      // Check format
      const formatIssues = this.validateFormats(doc.indicators);
      issues.push(...formatIssues);

      // Check cross-document duplicates
      for (const indicator of doc.indicators) {
        if (!indicator.code) continue;
        const allVersions = allIndicators.get(indicator.code) || [];
        if (allVersions.length > 1) {
          const uniqueDocs = new Set(allVersions.map(v => v.documentId));
          if (uniqueDocs.size > 1) {
            issues.push({
              id: `cross_doc_dup_${indicator.code}_${Date.now()}`,
              type: 'duplicate',
              severity: 'warning',
              indicator: indicator.code,
              description: `Indicator ${indicator.code} also appears in other documents: ${Array.from(uniqueDocs).filter(d => d !== doc.documentId).join(', ')}`,
              suggestion: 'Ensure consistent definition across all documents',
              relatedDocuments: Array.from(uniqueDocs),
            });
          }
        }
      }

      results.set(doc.documentId, {
        flags: issues,
        summary: this.generateSummary(issues, {
          totalIndicators: doc.indicators.length,
          duplicateIndicators: duplicates.filter(i => i.type === 'duplicate').length,
          inconsistentIndicators: 0,
          missingIndicators: 0,
          crossReferenceIssues: 0,
        }),
        statistics: {
          totalIndicators: doc.indicators.length,
          duplicateIndicators: duplicates.filter(i => i.type === 'duplicate').length,
          inconsistentIndicators: 0,
          missingIndicators: 0,
          crossReferenceIssues: 0,
        },
        recommendations: this.generateRecommendations(issues),
      });
    }

    return results;
  }

  /**
   * Generate a consistency report
   */
  async generateReport(checkResults: Map<string, ConsistencyCheckResult>): Promise<string> {
    let report = '# SDI Consistency Check Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    let totalIssues = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const [docId, result] of checkResults) {
      report += `## Document: ${docId}\n\n`;
      report += `**Summary:** ${result.summary}\n\n`;
      report += `**Statistics:**\n`;
      report += `- Total Indicators: ${result.statistics.totalIndicators}\n`;
      report += `- Duplicates: ${result.statistics.duplicateIndicators}\n`;
      report += `- Inconsistencies: ${result.statistics.inconsistentIndicators}\n\n`;

      if (result.flags.length > 0) {
        report += `**Issues:**\n\n`;
        for (const flag of result.flags) {
          const emoji = flag.severity === 'error' ? '❌' : flag.severity === 'warning' ? '⚠️' : 'ℹ️';
          report += `${emoji} **[${flag.type}]** ${flag.description}\n`;
          if (flag.suggestion) {
            report += `   💡 *Suggestion:* ${flag.suggestion}\n`;
          }
          report += '\n';
        }
      }

      if (result.recommendations.length > 0) {
        report += `**Recommendations:**\n\n`;
        for (const rec of result.recommendations) {
          report += `- ${rec}\n`;
        }
        report += '\n';
      }

      report += '---\n\n';

      totalIssues += result.flags.length;
      totalErrors += result.flags.filter(f => f.severity === 'error').length;
      totalWarnings += result.flags.filter(f => f.severity === 'warning').length;
    }

    report += `## Overall Summary\n\n`;
    report += `- **Total Documents Checked:** ${checkResults.size}\n`;
    report += `- **Total Issues:** ${totalIssues}\n`;
    report += `- **Errors:** ${totalErrors}\n`;
    report += `- **Warnings:** ${totalWarnings}\n`;

    return report;
  }
}
