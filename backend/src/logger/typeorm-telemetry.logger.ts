import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import { LogHelpers } from './logger.helpers';

export class TelemetryLogger implements TypeOrmLogger {
  private queryStartTimes: Map<string, number> = new Map();

  logQuery(query: string, parameters?: unknown[], queryRunner?: QueryRunner) {
    const key = this.createQueryKey();
    this.queryStartTimes.set(key, Date.now());
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    queryRunner?: QueryRunner,
  ) {
    const key = this.findMostRecentQueryKey();

    if (key) {
      const startTime = this.queryStartTimes.get(key);

      if (startTime) {
        const duration = Date.now() - startTime;
        LogHelpers.recordDatabaseCall(duration, true);
        this.queryStartTimes.delete(key);
      }
    }
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: unknown[],
    queryRunner?: QueryRunner,
  ) {
    const key = this.findMostRecentQueryKey();

    if (key) {
      const startTime = this.queryStartTimes.get(key);

      if (startTime) {
        const duration = Date.now() - startTime;
        LogHelpers.recordDatabaseCall(duration, false);
        this.queryStartTimes.delete(key);
      }
    }
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    // Not tracking schema builds
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    // Not tracking migrations
  }

  log(
    level: 'log' | 'info' | 'warn',
    message: unknown,
    queryRunner?: QueryRunner,
  ) {
    // Called after a successful query - track the duration
    const key = this.findMostRecentQueryKey();

    if (key) {
      const startTime = this.queryStartTimes.get(key);

      if (startTime) {
        const duration = Date.now() - startTime;
        LogHelpers.recordDatabaseCall(duration, false);
        this.queryStartTimes.delete(key);
      }
    }
  }

  private createQueryKey(): string {
    return `${Date.now()}_${Math.random()}`;
  }

  private findMostRecentQueryKey(): string | undefined {
    const keys = Array.from(this.queryStartTimes.keys());
    return keys.length > 0 ? keys[keys.length - 1] : undefined;
  }
}
