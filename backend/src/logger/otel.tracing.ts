import { trace } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
	SimpleSpanProcessor,
	ConsoleSpanExporter,
	BatchSpanProcessor,
	SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

export interface OTelTracingConfig {
	endpoint: string;
	headers?: Record<string, string>;
	enabled?: boolean;
}

let tracerProvider: NodeTracerProvider | null = null;

export function initializeOTelTracing(
	config: OTelTracingConfig,
): NodeTracerProvider | null {
	if (!config.enabled || !config.endpoint) {
		return null;
	}

	const tracesEndpoint = config.endpoint.endsWith("/v1/traces")
		? config.endpoint
		: `${config.endpoint.replace(/\/$/, "")}/v1/traces`;

	const resource = resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "yardvark-api",
		[ATTR_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
		"deployment.environment.name": process.env.NODE_ENV || "development",
	});

	const otlpExporter = new OTLPTraceExporter({
		url: tracesEndpoint,
		headers: config.headers,
	});

	const spanProcessors: SpanProcessor[] = [
		new BatchSpanProcessor(otlpExporter),
	];

	if (process.env.NODE_ENV === "development") {
		spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
	}

	tracerProvider = new NodeTracerProvider({
		resource,
		spanProcessors,
	});

	tracerProvider.register();

	registerInstrumentations({
		instrumentations: [
			new HttpInstrumentation({
				ignoreIncomingRequestHook: (request) => {
					const url = request.url || "";

					return url.includes("/health") || url.includes("/metrics");
				},
			}),
		],
	});

	trace.setGlobalTracerProvider(tracerProvider);

	return tracerProvider;
}

export function getOTelTracerProvider(): NodeTracerProvider | null {
	return tracerProvider;
}

export async function shutdownOTelTracing(): Promise<void> {
	if (tracerProvider) {
		await tracerProvider.shutdown();
	}
}
