/* eslint-disable @typescript-eslint/no-floating-promises */

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { initializeOTelTracing } from "./logger/otel.tracing";
import {
	initializeOTelLogger,
	type OTelConfig,
	parseOTelHeaders,
} from "./logger/otel.transport";

async function bootstrap() {
	const otelConfig: OTelConfig = {
		endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "",
		headers: parseOTelHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
		enabled: process.env.OTEL_ENABLED === "true",
	};

	initializeOTelTracing(otelConfig);
	initializeOTelLogger(otelConfig);

	const app = await NestFactory.create(AppModule, { rawBody: true });

	app.use(
		helmet({
			contentSecurityPolicy:
				process.env.NODE_ENV === "production"
					? undefined
					: {
							directives: {
								defaultSrc: ["'self'"],
								styleSrc: [
									"'self'",
									"'unsafe-inline'",
									"https://cdn.jsdelivr.net",
								],
								scriptSrc: [
									"'self'",
									"'unsafe-inline'",
									"'unsafe-eval'",
									"https://cdn.jsdelivr.net",
									"https://embeddable-sandbox.cdn.apollographql.com",
								],
								imgSrc: [
									"'self'",
									"data:",
									"https://cdn.jsdelivr.net",
									"https://apollo-server-landing-page.cdn.apollographql.com",
								],
								connectSrc: ["'self'", "https://*"],
								frameSrc: ["'self'", "https://sandbox.embed.apollographql.com"],
								fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
							},
						},
		}),
	);

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
			"https://yardvark.netlify.app",
			"http://localhost:4200",
			"capacitor://localhost",
			/^https:\/\/deploy-preview-\d+--yardvark\.netlify\.app$/,
			/^https:\/\/[a-zA-Z0-9-]+--yardvark\.netlify\.app$/,
			"https://t8x2587c-4200.usw3.devtunnels.ms",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	});

	await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
