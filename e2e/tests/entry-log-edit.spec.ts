import { expect, test } from "../fixtures";
import { EntryViewPage } from "../pages/entry-view.page";

const E2E_ENTRY_TITLE = "E2E Edit Test Entry";
const E2E_UPDATED_TITLE = "E2E Edit Test Entry (Updated)";
const E2E_ENTRY_NOTES = "These are e2e test notes.";
const E2E_UPDATED_NOTES = "These notes were updated via e2e.";

type EntryResponse = { id: number; title?: string };

function buildEntryDate() {
	const date = new Date();

	date.setHours(12, 0, 0, 0);

	return date;
}

function buildEntryPayload(title: string, notes: string | null = null) {
	return {
		date: buildEntryDate().toISOString(),
		time: null,
		notes,
		title,
		soilTemperature: null,
		activityIds: [],
		lawnSegmentIds: [],
		products: [],
		soilTemperatureUnit: "fahrenheit",
		mowingHeight: null,
		mowingHeightUnit: "inches",
	};
}

test.describe("Entry Log Edit/Delete", () => {
	test.beforeEach(async ({ api, resetEntryUsage }) => {
		const startDate = new Date(0).toISOString();
		const endDate = new Date().toISOString();
		const res = await api.get(
			`/entries?startDate=${startDate}&endDate=${endDate}`,
		);
		const entries = (await res.json()) as EntryResponse[];
		const stale = entries.filter(
			(e) =>
				e.title === E2E_ENTRY_TITLE || e.title === E2E_UPDATED_TITLE,
		);

		for (const entry of stale) {
			await api.delete(`/entries/${entry.id}`);
		}

		await resetEntryUsage();
	});

	test("can edit an entry title", async ({ page, api, entryCleanup }) => {
		const entryDate = buildEntryDate();
		const res = await api.post("/entries", {
			data: buildEntryPayload(E2E_ENTRY_TITLE),
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryView = new EntryViewPage(page);

		await entryView.goto(entry.id, entryDate.toISOString());
		await entryView.expectTitle(E2E_ENTRY_TITLE);
		await entryView.clickEdit();
		await entryView.expectInEditMode();
		await entryView.fillTitle(E2E_UPDATED_TITLE);
		await entryView.clickSave();
		await entryView.expectInViewMode();
		await entryView.expectTitle(E2E_UPDATED_TITLE);
	});

	test("can edit entry notes", async ({ page, api, entryCleanup }) => {
		const entryDate = buildEntryDate();
		const res = await api.post("/entries", {
			data: buildEntryPayload(E2E_ENTRY_TITLE, E2E_ENTRY_NOTES),
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryView = new EntryViewPage(page);

		await entryView.goto(entry.id, entryDate.toISOString());
		await entryView.expectNotes(E2E_ENTRY_NOTES);
		await entryView.clickEdit();
		await entryView.fillNotes(E2E_UPDATED_NOTES);
		await entryView.clickSave();
		await entryView.expectInViewMode();
		await entryView.expectNotes(E2E_UPDATED_NOTES);
	});

	test("cancelling edit mode restores original values", async ({
		page,
		api,
		entryCleanup,
	}) => {
		const entryDate = buildEntryDate();
		const res = await api.post("/entries", {
			data: buildEntryPayload(E2E_ENTRY_TITLE),
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryView = new EntryViewPage(page);

		await entryView.goto(entry.id, entryDate.toISOString());
		await entryView.clickEdit();
		await entryView.fillTitle(E2E_UPDATED_TITLE);
		await entryView.clickCancel();
		await entryView.expectInViewMode();
		await entryView.expectTitle(E2E_ENTRY_TITLE);
	});

	test("can delete an entry", async ({ page, api, entryCleanup }) => {
		const entryDate = buildEntryDate();
		const res = await api.post("/entries", {
			data: buildEntryPayload(E2E_ENTRY_TITLE),
		});
		const entry = (await res.json()) as EntryResponse;

		entryCleanup(entry.id);

		const entryView = new EntryViewPage(page);

		await entryView.goto(entry.id, entryDate.toISOString());
		await entryView.clickDelete();
		await entryView.confirmDelete();
		await page.waitForURL(/entry-log\?/, { timeout: 15000 });

		const startDate = new Date(entryDate);

		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date(entryDate);

		endDate.setHours(23, 59, 59, 999);

		const listRes = await api.get(
			`/entries?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
		);
		const entries = (await listRes.json()) as EntryResponse[];
		const deleted = entries.find((e) => e.id === entry.id);

		expect(deleted).toBeUndefined();
	});
});
