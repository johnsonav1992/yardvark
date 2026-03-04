import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

dotenv.config();

const getRequiredEnvVar = (key: string): string => {
	const value = process.env[key];

	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}

	return value;
};

const isProduction = process.env.NODE_ENV === "production";

const hasDevDatabaseConfig = Boolean(
	process.env.DEVPGHOST &&
		process.env.DEVPGUSER &&
		process.env.DEVPGPASSWORD &&
		process.env.DEVPGDATABASE,
);

const dbPrefix = !isProduction && hasDevDatabaseConfig ? "DEV" : "PROD";

export const dataSource = new DataSource({
	type: "postgres",
	host: getRequiredEnvVar(`${dbPrefix}PGHOST`),
	port: 5432,
	username: getRequiredEnvVar(`${dbPrefix}PGUSER`),
	password: getRequiredEnvVar(`${dbPrefix}PGPASSWORD`),
	database: getRequiredEnvVar(`${dbPrefix}PGDATABASE`),
	ssl: true,
	synchronize: false,
	migrationsRun: false,
	migrations: [`${__dirname}/../migrations/*.{ts,js}`],
	entities: [`${__dirname}/../modules/**/models/*.model.{ts,js}`],
	namingStrategy: new SnakeNamingStrategy(),
});
