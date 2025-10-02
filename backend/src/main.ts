/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './logger/logger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Add helmet for security headers
  app.use(helmet());

  app.useGlobalInterceptors(new LoggingInterceptor());

  // Security: Global validation pipe for input validation and sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true, // Enable automatic type conversion
      },
    }),
  );

  // Configure CORS to allow production, local dev, and Netlify preview domains
  app.enableCors({
    origin: [
      'https://yardvark.netlify.app', // Production
      'http://localhost:4200', // Local development
      /^https:\/\/deploy-preview-\d+--yardvark\.netlify\.app$/, // Netlify deploy previews
      /^https:\/\/[a-zA-Z0-9-]+--yardvark\.netlify\.app$/, // Netlify branch previews
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
