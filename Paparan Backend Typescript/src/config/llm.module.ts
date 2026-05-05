import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMFactory } from './llm.factory';
import { LLMService } from './llm.service';

@Module({})
export class LLMModule {
  static registerAsync(): DynamicModule {
    return {
      module: LLMModule,
      providers: [
        {
          provide: 'LLM_PROVIDER',
          useFactory: (config: ConfigService) => {
            return LLMFactory.createProvider(config);
          },
          inject: [ConfigService],
        },
        LLMService,
      ],
      exports: ['LLM_PROVIDER', LLMService],
      global: true,
    };
  }
}

// Re-export types and error classes for convenience
export * from './llm.factory';
export * from './llm.service';
export * from '@models/types/llm.types';
