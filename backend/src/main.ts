/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './logger/logger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import {
  initializeOTelLogger,
  parseOTelHeaders,
} from './logger/otel.transport';

async function bootstrap() {
  initializeOTelLogger({
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '',
    headers: parseOTelHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    enabled: process.env.OTEL_ENABLED === 'true',
  });

  const app = await NestFactory.create(AppModule);

  app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

  app.use(helmet());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: [
      'https://yardvark.netlify.app',
      'http://localhost:4200',
      'capacitor://localhost',
      /^https:\/\/deploy-preview-\d+--yardvark\.netlify\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+--yardvark\.netlify\.app$/,
      'https://t8x2587c-4200.usw3.devtunnels.ms',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
