import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

export interface OTelConfig {
  endpoint: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export function parseOTelHeaders(
  headerString?: string,
): Record<string, string> | undefined {
  if (!headerString) return undefined;

  const headers: Record<string, string> = {};
  const pairs = headerString.split(',');

  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');

    if (eqIndex > 0) {
      const key = pair.substring(0, eqIndex).trim();
      const value = pair.substring(eqIndex + 1).trim();

      headers[key] = value;
    }
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

let loggerProvider: LoggerProvider | null = null;

export function initializeOTelLogger(
  config: OTelConfig,
): LoggerProvider | null {
  if (!config.enabled || !config.endpoint) {
    return null;
  }

  const logsEndpoint = config.endpoint.endsWith('/v1/logs')
    ? config.endpoint
    : `${config.endpoint.replace(/\/$/, '')}/v1/logs`;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'yardvark-api',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    'deployment.environment.name': process.env.NODE_ENV || 'development',
  });

  const otlpExporter = new OTLPLogExporter({
    url: logsEndpoint,
    headers: config.headers,
  });

  const processors = [new SimpleLogRecordProcessor(otlpExporter)];

  if (process.env.NODE_ENV !== 'production') {
    processors.push(
      new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
    );
  }

  loggerProvider = new LoggerProvider({
    resource,
    processors,
  });

  logs.setGlobalLoggerProvider(loggerProvider);

  return loggerProvider;
}

export function getOTelLoggerProvider(): LoggerProvider | null {
  return loggerProvider;
}

const severityMap: Record<string, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

export function logToOTel(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  attributes?: Record<string, unknown>,
): void {
  const logger = logs.getLogger('yardvark-api');

  logger.emit({
    severityNumber: severityMap[level],
    severityText: level.toUpperCase(),
    body: message,
    attributes: flattenAttributes(attributes),
  });
}

function flattenAttributes(
  obj?: Record<string, unknown>,
  prefix = '',
): Record<string, string | number | boolean> {
  if (!obj) return {};

  const result: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenAttributes(value as Record<string, unknown>, newKey),
      );
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[newKey] = value;
    } else {
      result[newKey] = JSON.stringify(value);
    }
  }

  return result;
}

export async function shutdownOTelLogger(): Promise<void> {
  if (loggerProvider) {
    await loggerProvider.shutdown();
  }
}
