/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './logger/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  
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
