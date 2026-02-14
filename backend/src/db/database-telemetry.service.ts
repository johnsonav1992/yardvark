import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LogHelpers } from '../logger/logger.helpers';

@Injectable()
export class DatabaseTelemetryService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Helper function to wrap query methods with telemetry
    const wrapQueryMethod = (originalFn: Function) => {
      return async function (this: any, query: string, parameters?: any[]) {
        const start = Date.now();

        try {
          const result = await originalFn.call(this, query, parameters);
          LogHelpers.recordDatabaseCall(Date.now() - start, false);
          return result;
        } catch (error) {
          LogHelpers.recordDatabaseCall(Date.now() - start, true);
          throw error;
        }
      };
    };

    // Wrap the DataSource query method
    const originalQuery = this.dataSource.query.bind(this.dataSource);
    this.dataSource.query = wrapQueryMethod(originalQuery);

    // Wrap the EntityManager query method
    const manager = this.dataSource.manager;
    const originalManagerQuery = manager.query.bind(manager);
    manager.query = wrapQueryMethod(originalManagerQuery);

    // Intercept query runner creation to wrap individual query runners
    const originalCreateQueryRunner =
      this.dataSource.createQueryRunner.bind(this.dataSource);

    this.dataSource.createQueryRunner = function (mode?: 'master' | 'slave') {
      const queryRunner = originalCreateQueryRunner(mode);
      const originalRunnerQuery = queryRunner.query.bind(queryRunner);
      queryRunner.query = wrapQueryMethod(originalRunnerQuery);
      return queryRunner;
    };
  }
}
