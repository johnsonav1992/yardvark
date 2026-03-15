import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = "purple-dust-05313916";
const NEON_DEV_BRANCH_ID = "br-falling-base-a5e6f838";
const NEON_API_BASE = "https://console.neon.tech/api/v2";

interface NeonOperation {
	id: string;
	status: "running" | "finished" | "failed" | "scheduling";
}

interface ResetResponse {
	operations: NeonOperation[];
}

interface OperationResponse {
	operation: NeonOperation;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForOperation = async (operationId: string): Promise<void> => {
	const maxAttempts = 30;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const res = await fetch(
			`${NEON_API_BASE}/projects/${NEON_PROJECT_ID}/operations/${operationId}`,
			{ headers: { Authorization: `Bearer ${NEON_API_KEY}` } },
		);

		const { operation } = (await res.json()) as OperationResponse;

		if (operation.status === "finished") return;

		if (operation.status === "failed") {
			throw new Error(`Neon operation ${operationId} failed`);
		}

		await sleep(1000);
	}

	throw new Error("Timed out waiting for Neon branch reset");
};

const syncDevDb = async (): Promise<void> => {
	if (!NEON_API_KEY) {
		console.warn("[sync-dev-db] NEON_API_KEY not set — skipping dev DB sync");

		return;
	}

	console.log("[sync-dev-db] Resetting dev branch to prod...");

	const res = await fetch(
		`${NEON_API_BASE}/projects/${NEON_PROJECT_ID}/branches/${NEON_DEV_BRANCH_ID}/reset_to_parent`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${NEON_API_KEY}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		console.error(
			`[sync-dev-db] Reset request failed: ${res.status} ${res.statusText}`,
		);

		return;
	}

	const { operations } = (await res.json()) as ResetResponse;
	const operation = operations[0];

	if (operation) {
		await waitForOperation(operation.id);
	}

	console.log("[sync-dev-db] Dev DB synced with prod successfully");
};

syncDevDb().catch((err) => {
	console.error("[sync-dev-db] Failed to sync dev DB:", err);
});
