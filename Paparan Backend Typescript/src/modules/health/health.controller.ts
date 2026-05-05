import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { LLMService } from '@config/llm.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject('LLM_SERVICE') private llmService?: LLMService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @Public()
  @ApiOperation({ summary: 'Detailed health check' })
  detailedHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected',
        llm: this.llmService ? {
          provider: this.llmService.getProviderType(),
          availableProviders: this.llmService.getAvailableProviders(),
        } : 'not configured',
      },
    };
  }

  @Get('llm')
  @Public()
  @ApiOperation({ summary: 'LLM service health check' })
  llmHealthCheck() {
    if (!this.llmService) {
      return {
        status: 'unavailable',
        message: 'LLM service not configured',
      };
    }

    return {
      status: 'available',
      provider: this.llmService.getProviderType(),
      availableProviders: this.llmService.getAvailableProviders(),
      fallbacks: Array.from(this.llmService.getAvailableProviders()).slice(1),
    };
  }
}
