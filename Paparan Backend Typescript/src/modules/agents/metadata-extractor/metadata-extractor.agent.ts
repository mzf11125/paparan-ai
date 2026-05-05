import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType } from './base/base.agent';
import { DocumentProcessorService } from '@modules/tools/document-processor/document-processor.service';
import { SdiService } from '@modules/tools/sdi/sdi.service';
import { SDIMetadataExtractionSchema } from '@models/schemas/common.schemas';

export interface MetadataExtractorInput {
  documentId?: string;
  documentContent?: string;
  documentUrl?: string;
  fileName?: string;
  fileType?: string;
  extractIndicators?: boolean;
  validateSDI?: boolean;
}

export interface SDIIndicator {
  code: string; // Format: K## for sector, L## for indicator
  name: string;
  definition: string;
  sector: string;
  unit?: string;
  source?: string;
}

export interface DocumentMetadata {
  title: string;
  author?: string;
  date?: string;
  source?: string;
  keywords: string[];
  summary?: string;
  documentType?: string;
}

export interface MetadataExtractionResult {
  indicators: SDIIndicator[];
  metadata: DocumentMetadata;
  validation?: {
    isSDICompliant: boolean;
    issues: string[];
    warnings: string[];
  };
  rawExtraction?: any;
}

/**
 * Metadata Extractor Agent - Extracts SDI-compliant metadata from documents
 */
@Injectable()
export class MetadataExtractorAgent extends BaseAgent {
  readonly name = 'metadata_extractor';
  readonly description = 'Extracts SDI-compliant metadata from documents';
  readonly type: AgentType = 'metadata_extractor';

  constructor(
    protected llm: LLMService,
    private documentProcessor: DocumentProcessorService,
    private sdi: SdiService,
  ) {
    super(llm, {
      systemPrompt: `You are a Metadata Extraction Specialist for Indonesian policy documents (SDI - Satuan Data Indikator).

Your role is to:
1. Extract policy indicators with proper K/L codes (K## for sector codes, L## for indicator codes)
2. Identify document metadata (title, author, date, source, keywords)
3. Validate SDI compliance according to Indonesian government standards
4. Ensure all indicators have proper definitions and sector classifications

K/L Code Format:
- K##: Sector code (e.g., K01 for Economic Affairs)
- L##: Indicator code within a sector
- Format: K##L## for complete indicator reference

When extracting:
- Use official SDI sector classifications when available
- Provide clear, concise definitions
- Identify units of measurement
- Note data sources when mentioned

Your output should be structured, accurate, and ready for database storage.`,
    });
  }

  async execute(input: MetadataExtractorInput, context: AgentContext): Promise<AgentResponse<MetadataExtractionResult>> {
    // Validate input
    if (!input.documentId && !input.documentContent && !input.documentUrl) {
      throw new Error('Must provide one of: documentId, documentContent, or documentUrl');
    }

    try {
      // Get document content
      let content = input.documentContent;
      let fileName = input.fileName;

      if (!content) {
        if (input.documentUrl) {
          // Fetch and process document from URL
          const result = await this.documentProcessor.processUrl(input.documentUrl);
          content = result.content;
          fileName = result.fileName || input.fileName;
        } else if (input.documentId) {
          // Retrieve from database (implement based on your storage)
          // For now, this would require a repository lookup
          throw new Error('Document retrieval by ID not yet implemented');
        }
      }

      if (!content || content.trim().length === 0) {
        throw new Error('No content could be extracted from the document');
      }

      // Truncate content if too long for LLM
      const truncatedContent = this.truncateText(content, 12000);

      // Extract metadata using LLM
      const extraction = await this.llm.generateStructuredWithRetry(
        this.buildExtractionPrompt(truncatedContent, fileName, input.fileType),
        SDIMetadataExtractionSchema,
        { temperature: 0.3, maxTokens: 4096 },
      );

      // Validate SDI compliance if requested
      let validation;
      if (input.validateSDI !== false) {
        validation = await this.validateSDICompliance(extraction);
      }

      // Enhance with SDI service data if available
      const enhancedIndicators = await this.enrichWithSDIData(extraction.indicators || []);

      return {
        success: true,
        data: {
          indicators: enhancedIndicators,
          metadata: extraction.metadata || this.getDefaultMetadata(),
          validation,
          rawExtraction: extraction,
        },
      };
    } catch (error) {
      this.logger.error(`Metadata extraction failed: ${error.message}`);

      // Return partial results on error
      return {
        success: false,
        error: error.message,
        data: {
          indicators: [],
          metadata: this.getDefaultMetadata(),
          validation: {
            isSDICompliant: false,
            issues: [error.message],
            warnings: [],
          },
        },
      };
    }
  }

  /**
   * Build extraction prompt
   */
  private buildExtractionPrompt(content: string, fileName?: string, fileType?: string): string {
    let prompt = 'Extract SDI-compliant metadata from the following document.';

    if (fileName) {
      prompt += `\n\nFile: ${fileName}`;
    }
    if (fileType) {
      prompt += `\nType: ${fileType}`;
    }

    prompt += `\n\nDocument content:\n${content}`;

    prompt += `\n\nExtract:
1. All policy indicators with K/L codes (format: K## for sector, L## for indicator)
2. Document metadata:
   - Title (main title or first heading)
   - Author (organization or person)
   - Date (publication or last modified)
   - Source (department, ministry, or website)
   - Keywords (5-10 relevant terms)
   - Summary (brief 2-3 sentence overview)
   - Document type (regulation, policy brief, report, etc.)

3. Ensure all indicators have:
   - Proper K##L## code format
   - Clear name/label
   - Definition
   - Sector classification
   - Unit of measurement (if applicable)
   - Data source (if mentioned)`;

    return prompt;
  }

  /**
   * Validate SDI compliance
   */
  private async validateSDICompliance(extraction: any): Promise<{
    isSDICompliant: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for required metadata
    if (!extraction.metadata?.title) {
      issues.push('Missing document title');
    }
    if (!extraction.metadata?.source) {
      warnings.push('Document source not identified');
    }
    if (!extraction.metadata?.date) {
      warnings.push('Document date not identified');
    }
    if (!extraction.metadata?.keywords || extraction.metadata.keywords.length === 0) {
      warnings.push('No keywords extracted');
    }

    // Validate indicators
    if (!extraction.indicators || extraction.indicators.length === 0) {
      warnings.push('No indicators found - document may not be SDI-related');
    } else {
      for (const indicator of extraction.indicators) {
        // Check K/L code format
        if (!indicator.code) {
          issues.push(`Indicator missing code: ${indicator.name || 'unnamed'}`);
        } else if (!/^K\d+L?\d*$/.test(indicator.code)) {
          warnings.push(`Indicator code may not follow SDI format: ${indicator.code}`);
        }

        // Check for required fields
        if (!indicator.name) {
          issues.push('Indicator found without name');
        }
        if (!indicator.definition) {
          warnings.push(`Indicator missing definition: ${indicator.code}`);
        }
        if (!indicator.sector) {
          warnings.push(`Indicator missing sector: ${indicator.code}`);
        }
      }
    }

    // Check for duplicate indicators
    if (extraction.indicators && extraction.indicators.length > 1) {
      const codes = extraction.indicators.map((i: any) => i.code).filter(Boolean);
      const duplicates = codes.filter((code: string, index: number) => codes.indexOf(code) !== index);
      if (duplicates.length > 0) {
        warnings.push(`Potential duplicate indicators: ${[...new Set(duplicates)].join(', ')}`);
      }
    }

    return {
      isSDICompliant: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Enrich indicators with SDI service data
   */
  private async enrichWithSDIData(indicators: any[]): Promise<SDIIndicator[]> {
    if (!indicators || indicators.length === 0) {
      return [];
    }

    const enriched: SDIIndicator[] = [];

    for (const indicator of indicators) {
      try {
        // Try to fetch official SDI data if code is provided
        let sdiData = null;
        if (indicator.code) {
          sdiData = await this.sdi.lookupIndicator(indicator.code);
        }

        enriched.push({
          code: indicator.code || '',
          name: indicator.name || '',
          definition: indicator.definition || '',
          sector: indicator.sector || sdiData?.sector || '',
          unit: indicator.unit || sdiData?.unit,
          source: indicator.source || sdiData?.source,
        });
      } catch {
        // Use extracted data if SDI lookup fails
        enriched.push({
          code: indicator.code || '',
          name: indicator.name || '',
          definition: indicator.definition || '',
          sector: indicator.sector || '',
          unit: indicator.unit,
          source: indicator.source,
        });
      }
    }

    return enriched;
  }

  /**
   * Get default metadata
   */
  private getDefaultMetadata(): DocumentMetadata {
    return {
      title: 'Untitled Document',
      keywords: [],
    };
  }

  /**
   * Extract indicators from text (simplified version)
   */
  async extractIndicatorsFromText(text: string): Promise<SDIIndicator[]> {
    const prompt = `Extract policy indicators from the following text. Return as JSON array with:
- code: K/L code (K## format for sector, L## for indicator)
- name: Indicator name
- definition: Brief definition
- sector: Sector name

Text:
${this.truncateText(text, 3000)}`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.3 });

    try {
      const extracted = this.extractJson(response.content);
      return Array.isArray(extracted) ? extracted : [];
    } catch {
      return [];
    }
  }

  /**
   * Suggest K/L codes for an indicator
   */
  async suggestKLCode(indicatorName: string, sector?: string): Promise<{
    code: string;
    confidence: number;
    alternatives: string[];
  }> {
    const prompt = `Suggest the appropriate K/L (Satuan Data Indikator) code for this indicator:

Indicator: ${indicatorName}
${sector ? `Sector: ${sector}` : ''}

Return the most likely K##L## code with confidence score (0-1) and alternative codes if applicable.

Known Indonesian SDI sectors include:
- K01: Economic Affairs
- K02: Poverty Reduction
- K03: Employment
- K04: Health
- K05: Education
- K06: Infrastructure
- K07: Environment
- K08: Governance
- etc.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.3 });

    try {
      const result = this.extractJson(response.content);
      return {
        code: result.code || 'K99L99',
        confidence: result.confidence || 0.5,
        alternatives: result.alternatives || [],
      };
    } catch {
      return {
        code: 'K99L99',
        confidence: 0.1,
        alternatives: [],
      };
    }
  }

  /**
   * Compare two documents for indicator consistency
   */
  async compareIndicators(doc1Indicators: SDIIndicator[], doc2Indicators: SDIIndicator[]): Promise<{
    common: SDIIndicator[];
    uniqueToDoc1: SDIIndicator[];
    uniqueToDoc2: SDIIndicator[];
    conflicts: Array<{ indicator: string; value1: any; value2: any }>;
  }> {
    const map1 = new Map(doc1Indicators.map(i => [i.code, i]));
    const map2 = new Map(doc2Indicators.map(i => [i.code, i]));

    const common: SDIIndicator[] = [];
    const uniqueToDoc1: SDIIndicator[] = [];
    const uniqueToDoc2: SDIIndicator[] = [];
    const conflicts: any[] = [];

    // Find common and unique
    for (const [code, indicator] of map1) {
      if (map2.has(code)) {
        common.push(indicator);
        // Check for conflicts
        const doc2Indicator = map2.get(code)!;
        if (indicator.definition !== doc2Indicator.definition ||
            indicator.sector !== doc2Indicator.sector) {
          conflicts.push({
            indicator: code,
            value1: indicator,
            value2: doc2Indicator,
          });
        }
      } else {
        uniqueToDoc1.push(indicator);
      }
    }

    for (const [code, indicator] of map2) {
      if (!map1.has(code)) {
        uniqueToDoc2.push(indicator);
      }
    }

    return { common, uniqueToDoc1, uniqueToDoc2, conflicts };
  }
}
