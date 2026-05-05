import { Injectable, Logger } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import { DocumentExtractionResult, DocumentChunkMetadata } from '../tools.types';

export interface ChunkOptions {
  maxChunkSize?: number;
  chunkOverlap?: number;
  includeMetadata?: boolean;
}

/**
 * Document processing service for text extraction and chunking
 */
@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  /**
   * Extract text and metadata from a file buffer
   */
  async extractText(file: Buffer, mimeType: string, filename?: string): Promise<DocumentExtractionResult> {
    try {
      this.logger.debug(`Extracting text from ${mimeType} file: ${filename || 'unknown'}`);

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPdf(file);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromDocx(file);
        case 'application/msword':
          return await this.extractFromDoc(file);
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          return this.extractFromPlainText(file, mimeType, filename);
        case 'application/json':
          return this.extractFromJson(file);
        case 'text/html':
          return this.extractFromHtml(file);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to extract text from file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPdf(buffer: Buffer): Promise<DocumentExtractionResult> {
    const data = await pdf(buffer);

    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
      },
    };
  }

  /**
   * Extract text from DOCX
   */
  private async extractFromDocx(buffer: Buffer): Promise<DocumentExtractionResult> {
    const result = await mammoth.extractRawText({ buffer });

    // Try to extract more metadata
    const metadataResult = await mammoth.extractRawText({
      buffer,
      includeDefaultStyleMap: true,
    });

    return {
      text: result.value,
      metadata: {
        title: this.extractTitle(result.messages),
      },
    };
  }

  /**
   * Extract text from legacy DOC
   */
  private async extractFromDoc(buffer: Buffer): Promise<DocumentExtractionResult> {
    // Mammoth can handle some DOC files, but not all
    // For legacy DOC, we might need a different library
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
        metadata: {},
      };
    } catch {
      throw new Error('Legacy DOC files not fully supported. Please convert to DOCX or PDF.');
    }
  }

  /**
   * Extract from plain text
   */
  private extractFromPlainText(
    buffer: Buffer,
    mimeType: string,
    filename?: string,
  ): DocumentExtractionResult {
    const text = buffer.toString('utf-8');

    return {
      text,
      metadata: {
        title: filename,
      },
    };
  }

  /**
   * Extract from JSON
   */
  private extractFromJson(buffer: Buffer): DocumentExtractionResult {
    try {
      const json = JSON.parse(buffer.toString('utf-8'));
      const text = JSON.stringify(json, null, 2);

      return {
        text,
        metadata: {
          title: json.title || json.name,
        },
      };
    } catch {
      throw new Error('Invalid JSON file');
    }
  }

  /**
   * Extract from HTML
   */
  private extractFromHtml(buffer: Buffer): DocumentExtractionResult {
    const html = buffer.toString('utf-8');
    // Basic HTML stripping
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Try to extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    return {
      text,
      metadata: { title },
    };
  }

  /**
   * Extract title from mammoth messages
   */
  private extractTitle(messages: mammoth.Messages[]): string | undefined {
    for (const message of messages) {
      if (message.type === 'warning') {
        const match = message.message.match(/(?:title|subject):\s*([^\n]+)/i);
        if (match) return match[1].trim();
      }
    }
    return undefined;
  }

  /**
   * Chunk text into smaller pieces for processing
   */
  chunkText(text: string, options: ChunkOptions = {}): Array<{
    content: string;
    metadata: DocumentChunkMetadata;
  }> {
    const {
      maxChunkSize = 1000,
      chunkOverlap = 200,
      includeMetadata = true,
    } = options;

    const chunks: Array<{ content: string; metadata: DocumentChunkMetadata }> = [];
    const sentences = this.splitIntoSentences(text);

    let currentChunk = '';
    let currentStartPosition = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          metadata: includeMetadata ? {
            id: this.generateChunkId(chunkIndex),
            chunkIndex,
            startPosition: currentStartPosition,
            endPosition: currentStartPosition + currentChunk.length,
          } : undefined,
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + sentence;
        currentStartPosition += currentChunk.length - overlapText.length;
        chunkIndex++;
      } else {
        if (currentChunk.length === 0) {
          currentStartPosition = text.indexOf(sentence, currentStartPosition);
        }
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: includeMetadata ? {
          id: this.generateChunkId(chunkIndex),
          chunkIndex,
          startPosition: currentStartPosition,
          endPosition: currentStartPosition + currentChunk.length,
        } : undefined,
      });
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting
    // In production, use a more sophisticated NLP library
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize <= 0 || text.length <= overlapSize) return '';

    const sentences = this.splitIntoSentences(text);
    let overlapText = '';
    let i = sentences.length - 1;

    while (i >= 0 && overlapText.length < overlapSize) {
      overlapText = sentences[i] + ' ' + overlapText;
      i--;
    }

    return overlapText.trim();
  }

  /**
   * Generate chunk ID
   */
  private generateChunkId(index: number): string {
    return `chunk_${index}_${Date.now()}`;
  }

  /**
   * Clean and normalize text
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  /**
   * Extract metadata from text
   */
  extractMetadata(text: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract common patterns
    const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
    const dates = text.match(datePattern);
    if (dates) {
      metadata.extractedDates = dates;
    }

    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) {
      metadata.extractedEmails = emails;
    }

    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern);
    if (urls) {
      metadata.extractedUrls = urls;
    }

    // Estimate word count
    metadata.wordCount = text.split(/\s+/).length;

    // Estimate character count
    metadata.characterCount = text.length;

    return metadata;
  }

  /**
   * Validate document before processing
   */
  validateDocument(file: Buffer, mimeType: string, maxSize = 10 * 1024 * 1024): void {
    if (!file || file.length === 0) {
      throw new Error('File is empty');
    }

    if (file.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'text/html',
    ];

    if (!supportedTypes.includes(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  }

  /**
   * Get document statistics
   */
  getStats(text: string): {
    characters: number;
    words: number;
    sentences: number;
    paragraphs: number;
    lines: number;
  } {
    const characters = text.length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentences = this.splitIntoSentences(text).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const lines = text.split(/\n/).length;

    return { characters, words, sentences, paragraphs, lines };
  }
}
