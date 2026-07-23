import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix — all routes under /api/v1
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (configService.get<string>('app.corsOrigins') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  const isProduction = configService.get<string>('app.environment') === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Smacco API')
      .setDescription('Modular monolith API — users, places, reviews, search, AI chat, recommendations')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  const publicBaseUrl = configService.get<string>('app.publicBaseUrl') || `http://localhost:${port}`;
  await app.listen(port);
  console.log(`🚀 Smacco Monolith running on port ${port}`);
  if (!isProduction) {
    console.log(`📚 Swagger docs: ${publicBaseUrl}/api/docs`);
  }
}

bootstrap();
