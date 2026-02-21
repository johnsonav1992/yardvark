import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { DataSource, QueryRunner, ReplicationMode } from "typeorm";
import { LogHelpers } from "../logger/logger.helpers";

@Injectable()
export class DatabaseTelemetryService implements OnModuleInit {
	constructor(private dataSource: DataSource) {}

	onModuleInit() {
		const originalCreateQueryRunner = this.dataSource.createQueryRunner.bind(
			this.dataSource,
		);

		this.dataSource.createQueryRunner = (mode?: ReplicationMode) => {
			const queryRunner = originalCreateQueryRunner(mode);
			const originalQuery = queryRunner.query.bind(queryRunner);

			queryRunner.query = async (...args: Parameters<QueryRunner["query"]>) => {
				const start = Date.now();

				try {
					const result = await originalQuery(...args);
					LogHelpers.recordDatabaseCall(Date.now() - start, false);

					return result;
				} catch (error) {
					LogHelpers.recordDatabaseCall(Date.now() - start, true);

					throw error;
				}
			};

			return queryRunner;
		};
	}
}
