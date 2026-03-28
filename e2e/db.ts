import { config } from "dotenv";
import { Client } from "pg";

config({ path: "backend/.env", override: false });

const hasDevConfig = Boolean(
	process.env["DEVPGHOST"] &&
		process.env["DEVPGUSER"] &&
		process.env["DEVPGPASSWORD"] &&
		process.env["DEVPGDATABASE"],
);
const prefix = hasDevConfig ? "DEV" : "PROD";

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
	const client = new Client({
		host: process.env[`${prefix}PGHOST`],
		user: process.env[`${prefix}PGUSER`],
		password: process.env[`${prefix}PGPASSWORD`],
		database: process.env[`${prefix}PGDATABASE`],
		port: 5432,
		ssl: true,
	});

	await client.connect();

	try {
		return await fn(client);
	} finally {
		await client.end();
	}
}

function getPeriodStart(): Date {
	const now = new Date();

	return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function resetEntryCreationUsage(userId: string): Promise<void> {
	const periodStart = getPeriodStart();

	await withDb((client) =>
		client.query(
			"DELETE FROM feature_usage WHERE user_id = $1 AND feature_name = $2 AND period_start = $3",
			[userId, "entry_creation", periodStart],
		),
	);
}

export async function setEntryCreationUsage(
	userId: string,
	count: number,
): Promise<void> {
	const periodStart = getPeriodStart();
	const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);

	await withDb((client) =>
		client.query(
			`INSERT INTO feature_usage (user_id, feature_name, usage_count, period_start, period_end, last_updated)
			 VALUES ($1, $2, $3, $4, $5, NOW())
			 ON CONFLICT (user_id, feature_name, period_start)
			 DO UPDATE SET usage_count = $3, last_updated = NOW()`,
			[userId, "entry_creation", count, periodStart, periodEnd],
		),
	);
}
