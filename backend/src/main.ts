/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './logger/logger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? undefined
          : {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  'https://cdn.jsdelivr.net',
                ],
                scriptSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  "'unsafe-eval'",
                  'https://cdn.jsdelivr.net',
                  'https://embeddable-sandbox.cdn.apollographql.com',
                ],
                imgSrc: [
                  "'self'",
                  'data:',
                  'https://cdn.jsdelivr.net',
                  'https://apollo-server-landing-page.cdn.apollographql.com',
                ],
                connectSrc: ["'self'", 'https://*'],
                frameSrc: ["'self'", 'https://sandbox.embed.apollographql.com'],
                fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
              },
            },
    }),
  );

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
      /^https:\/\/deploy-preview-\d+--yardvark\.netlify\.app$/,
      /^https:\/\/[a-zA-Z0-9-]+--yardvark\.netlify\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
