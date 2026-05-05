import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Validation failed',
          errors: errors.map(e => ({
            field: e.property,
            constraints: e.constraints,
          })),
        });
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Paparan AI Backend API')
    .setDescription('TypeScript/Node.js backend for Paparan AI - Policy Intelligence Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health check endpoints')
    .addTag('paparan', 'Policy brief generation')
    .addTag('chat', 'Conversational AI chat')
    .addTag('feed', 'Feed and search')
    .addTag('bappenas', 'Bappenas SDI metadata extraction')
    .addTag('intelligence', 'OSINT intelligence')
    .addTag('asean', 'ASEAN intelligence')
    .addTag('export', 'Document export')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
    =====================================
    🚀 Paparan AI Backend Server
    =====================================
    Environment: ${process.env.NODE_ENV || 'development'}
    API Prefix: /${apiPrefix}
    Docs: http://localhost:${port}/docs
    Port: ${port}
    =====================================
  `);
}

bootstrap();
