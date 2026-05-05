import { z } from 'zod';

// ============================================================================
// LLM Configuration DTOs
// ============================================================================

export const LLMChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
});

export const LLMStructuredRequestSchema = z.object({
  prompt: z.string(),
  schema: z.any(), // Zod schema passed as object
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

export const TopicClassificationRequestSchema = z.object({
  topic: z.string().min(1),
});

export const PolicyBriefRequestSchema = z.object({
  topic: z.string().min(1),
  region: z.string().optional(),
  classification: z.string().optional(),
  research: z.string().optional(),
});

// ============================================================================
// Export Types
// ============================================================================

export type LLMChatRequest = z.infer<typeof LLMChatRequestSchema>;
export type LLMStructuredRequest = z.infer<typeof LLMStructuredRequestSchema>;
export type TopicClassificationRequest = z.infer<typeof TopicClassificationRequestSchema>;
export type PolicyBriefRequest = z.infer<typeof PolicyBriefRequestSchema>;

// ============================================================================
// Class Validator DTOs for Swagger
// ============================================================================

import { IsString, IsArray, IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LLMMessageDto {
  @ApiProperty()
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;
}

export class LLMChatRequestDto {
  @ApiProperty({ type: [LLMMessageDto] })
  @IsArray()
  messages: LLMMessageDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2 })
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

export class TopicClassificationRequestDto {
  @ApiProperty()
  @IsString()
  topic: string;
}

export class PolicyBriefRequestDto {
  @ApiProperty()
  @IsString()
  topic: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  classification?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  research?: string;
}
