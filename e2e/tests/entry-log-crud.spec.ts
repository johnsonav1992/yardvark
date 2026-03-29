import { expect, test } from "../fixtures";
import { AddEntryPage } from "../pages/add-entry.page";
import { EntryLogPage } from "../pages/entry-log.page";
import { EntryViewPage } from "../pages/entry-view.page";

const E2E_ENTRY_TITLE = "E2E Test Entry";
const E2E_ENTRY_NOTES = "These are e2e test notes for creation.";
const E2E_BATCH_TITLES = ["E2E Batch Entry 1", "E2E Batch Entry 2"] as const;
const E2E_LIMIT_TITLE = "E2E Limit Test Entry";
const ALL_E2E_TITLES = [E2E_ENTRY_TITLE, ...E2E_BATCH_TITLES, E2E_LIMIT_TITLE];

type EntryResponse = { id: number; title?: string; notes?: string | null };

test.describe("Entry Log CRUD", () => {
	test.describe.configure({ mode: "serial" });
	test.beforeEach(async ({ api, resetEntryUsage }) => {
		const startDate = new Date(0).toISOString();
		const endDate = new Date().toISOString();
		const res = await api.get(
			`/entries?startDate=${startDate}&endDate=${endDate}`,
		);
		const entries = (await res.json()) as EntryResponse[];
		const stale = entries.filter((e) =>
			ALL_E2E_TITLES.includes(e.title ?? ""),
		);

		for (const entry of stale) {
			await api.delete(`/entries/${entry.id}`);
		}

		await resetEntryUsage();
	});

	test("can create an entry via the UI", async ({ page, api, entryCleanup }) => {
		const addEntry = new AddEntryPage(page);

		await addEntry.goto();
		await addEntry.fillTitle(E2E_ENTRY_TITLE);
		await addEntry.submit();

		await expect(page).toHaveURL(/entry-log\?/);

		const startDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
		const endDate = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
		const res = await api.get(
			`/entries?startDate=${startDate}&endDate=${endDate}`,
		);
		const entries = (await res.json()) as EntryResponse[];
		const created = entries.find((e) => e.title === E2E_ENTRY_TITLE);

		if (created) {
			entryCleanup(created.id);
		}

		expect(created).toBeDefined();
	});

	test("can create multiple entries via batch UI", async ({
		page,
		api,
		entryCleanup,
	}) => {
		const addEntry = new AddEntryPage(page);

		await addEntry.goto();
		await addEntry.fillTitle(E2E_BATCH_TITLES[0]);
		await addEntry.addAnotherEntry();
		await addEntry.fillTitle(E2E_BATCH_TITLES[1], 1);
		await addEntry.submit();

		await expect(page).toHaveURL(/entry-log\?/);

		const startDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
		const endDate = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
		const res = await api.get(
			`/entries?startDate=${startDate}&endDate=${endDate}`,
		);
		const entries = (await res.json()) as EntryResponse[];
		const created = entries.filter((e) =>
			(E2E_BATCH_TITLES as readonly string[]).includes(e.title ?? ""),
		);

		for (const entry of created) {
			entryCleanup(entry.id);
		}

		expect(created).toHaveLength(2);
	});

	test("can view entry details", async ({ page, api, entryCleanup }) => {
		const entryDate = new Date();

		entryDate.setHours(12, 0, 0, 0);

		const res = await api.post("/entries", {
			data: {
				date: entryDate.toISOString(),
				time: null,
				notes: null,
				title: E2E_ENTRY_TITLE,
				soilTemperature: null,
				activityIds: [],
				lawnSegmentIds: [],
				products: [],
				soilTemperatureUnit: "fahrenheit",
				mowingHeight: null,
				mowingHeightUnit: "inches",
			},
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		await page.goto(
			`/entry-log/${entry.id}?date=${entryDate.toISOString()}`,
		);
		await page.waitForURL(`**/entry-log/${entry.id}**`, { timeout: 15000 });

		await expect(page.locator(".title-display")).toHaveText(E2E_ENTRY_TITLE, {
			timeout: 15000,
		});
	});

	test("can create an entry with notes via UI", async ({
		page,
		api,
		entryCleanup,
	}) => {
		const addEntry = new AddEntryPage(page);

		await addEntry.goto();
		await addEntry.fillTitle(E2E_ENTRY_TITLE);
		await addEntry.fillNotes(E2E_ENTRY_NOTES);
		await addEntry.submit();

		await expect(page).toHaveURL(/entry-log\?/);

		const startDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
		const endDate = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
		const res = await api.get(
			`/entries?startDate=${startDate}&endDate=${endDate}`,
		);
		const entries = (await res.json()) as EntryResponse[];
		const created = entries.find((e) => e.title === E2E_ENTRY_TITLE);

		if (created) {
			entryCleanup(created.id);
		}

		expect(created?.notes).toBe(E2E_ENTRY_NOTES);
	});

	test("entry view displays notes", async ({ page, api, entryCleanup }) => {
		const entryDate = new Date();

		entryDate.setHours(12, 0, 0, 0);

		const res = await api.post("/entries", {
			data: {
				date: entryDate.toISOString(),
				time: null,
				notes: E2E_ENTRY_NOTES,
				title: E2E_ENTRY_TITLE,
				soilTemperature: null,
				activityIds: [],
				lawnSegmentIds: [],
				products: [],
				soilTemperatureUnit: "fahrenheit",
				mowingHeight: null,
				mowingHeightUnit: "inches",
			},
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryView = new EntryViewPage(page);

		await entryView.goto(entry.id, entryDate.toISOString());
		await entryView.expectTitle(E2E_ENTRY_TITLE);
		await entryView.expectNotes(E2E_ENTRY_NOTES);
	});

	test("clicking an entry marker on the calendar navigates to the entry view", async ({
		page,
		api,
		entryCleanup,
	}) => {
		const entryDate = new Date();

		entryDate.setHours(12, 0, 0, 0);

		const res = await api.post("/entries", {
			data: {
				date: entryDate.toISOString(),
				time: null,
				notes: null,
				title: E2E_ENTRY_TITLE,
				soilTemperature: null,
				activityIds: [],
				lawnSegmentIds: [],
				products: [],
				soilTemperatureUnit: "fahrenheit",
				mowingHeight: null,
				mowingHeightUnit: "inches",
			},
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryLog = new EntryLogPage(page);

		await entryLog.goto();
		await entryLog.clickFirstEntryMarker();

		await page.waitForURL(/\/entry-log\/\d+/, { timeout: 15000 });
	});

	test("free tier entry creation is blocked after the monthly limit is reached", async ({
		api,
		setEntryUsage,
		resetEntryUsage,
	}) => {
		const entryDate = new Date();

		entryDate.setHours(12, 0, 0, 0);

		const payload = {
			date: entryDate.toISOString(),
			time: null,
			notes: null,
			title: E2E_LIMIT_TITLE,
			soilTemperature: null,
			activityIds: [],
			lawnSegmentIds: [],
			products: [],
			soilTemperatureUnit: "fahrenheit",
			mowingHeight: null,
			mowingHeightUnit: "inches",
		};

		await setEntryUsage(6);

		const blockedRes = await api.post("/entries", { data: payload });

		await resetEntryUsage();

		expect(blockedRes.status()).toBe(402);
	});

	test("entry view does not show title element when entry has no title", async ({
		page,
		api,
		entryCleanup,
	}) => {
		const entryDate = new Date();

		entryDate.setHours(12, 0, 0, 0);

		const res = await api.post("/entries", {
			data: {
				date: entryDate.toISOString(),
				time: null,
				notes: null,
				title: null,
				soilTemperature: null,
				activityIds: [],
				lawnSegmentIds: [],
				products: [],
				soilTemperatureUnit: "fahrenheit",
				mowingHeight: null,
				mowingHeightUnit: "inches",
			},
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryView = new EntryViewPage(page);

		await entryView.goto(entry.id, entryDate.toISOString());
		await expect(page.locator(".info-items").first()).toBeVisible({ timeout: 15000 });

		await expect(page.locator(".title-display")).not.toBeVisible();
	});
});
