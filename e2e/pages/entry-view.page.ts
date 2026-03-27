import { expect, type Page } from "@playwright/test";

export class EntryViewPage {
	constructor(private readonly page: Page) {}

	async goto(id: number, date: string) {
		await this.page.goto(`/entry-log/${id}?date=${date}`);
		await this.page.waitForURL(`**/entry-log/${id}**`, { timeout: 15000 });
	}

	async expectLoaded() {
		await expect(
			this.page.locator(".entry-detail-container"),
		).toBeVisible({ timeout: 15000 });
	}

	async expectTitle(title: string) {
		await expect(this.page.locator(".title-display")).toHaveText(title, {
			timeout: 15000,
		});
	}

	async expectNotes(notes: string) {
		await expect(this.page.locator(".notes-text")).toHaveText(notes, {
			timeout: 15000,
		});
	}

	async expectInEditMode() {
		await expect(
			this.page.getByRole("button", { name: "Save" }),
		).toBeVisible({ timeout: 15000 });
	}

	async expectInViewMode() {
		await expect(
			this.page.getByRole("button", { name: "Edit" }),
		).toBeVisible({ timeout: 15000 });
	}

	async clickEdit() {
		await this.page.getByRole("button", { name: "Edit" }).click();
	}

	async clickSave() {
		await this.page.getByRole("button", { name: "Save" }).click();
	}

	async clickCancel() {
		await this.page.getByRole("button", { name: "Cancel" }).click();
	}

	async clickDelete() {
		await this.page.getByRole("button", { name: "Delete" }).click();
	}

	async confirmDelete() {
		await this.page.getByRole("button", { name: "Yes" }).click();
	}

	async fillTitle(title: string) {
		const input = this.page.locator(".title-field input");

		await input.clear();
		await input.fill(title);
	}

	async fillNotes(notes: string) {
		await this.page.locator("textarea.notes-textarea").fill(notes);
	}
}
