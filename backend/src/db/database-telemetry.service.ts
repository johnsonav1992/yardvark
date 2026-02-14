import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LogHelpers } from '../logger/logger.helpers';

@Injectable()
export class DatabaseTelemetryService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Wrap the query method to add telemetry
    const originalQuery = this.dataSource.query.bind(this.dataSource);

    this.dataSource.query = async function (
      query: string,
      parameters?: any[],
    ) {
      const start = Date.now();

      try {
        const result = await originalQuery(query, parameters);
        LogHelpers.recordDatabaseCall(Date.now() - start, false);
        return result;
      } catch (error) {
        LogHelpers.recordDatabaseCall(Date.now() - start, true);
        throw error;
      }
    };

    // Also wrap the EntityManager's query method
    const manager = this.dataSource.manager;
    const originalManagerQuery = manager.query.bind(manager);

    manager.query = async function (query: string, parameters?: any[]) {
      const start = Date.now();

      try {
        const result = await originalManagerQuery(query, parameters);
        LogHelpers.recordDatabaseCall(Date.now() - start, false);
        return result;
      } catch (error) {
        LogHelpers.recordDatabaseCall(Date.now() - start, true);
        throw error;
      }
    };
  }
}
