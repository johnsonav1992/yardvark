import { type Page } from "@playwright/test";

export class AddEntryPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto("/entry-log/add");
		await this.page.waitForURL("**/entry-log/add", { timeout: 15000 });
	}

	async fillTitle(title: string, panelIndex = 0) {
		await this.page
			.locator("p-accordionpanel")
			.nth(panelIndex)
			.locator("span.input-wrapper")
			.filter({ hasText: "Title (optional)" })
			.locator("input")
			.fill(title);
	}

	async fillNotes(notes: string, panelIndex = 0) {
		await this.page
			.locator("p-accordionpanel")
			.nth(panelIndex)
			.locator(".col-input-wrapper")
			.filter({ hasText: "Notes:" })
			.locator("textarea")
			.fill(notes);
	}

	async addAnotherEntry() {
		await this.page
			.getByRole("button", { name: "Add Another Entry" })
			.click();
	}

	async submit() {
		await this.page.getByRole("button", { name: /^Create/ }).click();
		await this.page.waitForURL(/entry-log\?/, { timeout: 15000 });
	}
}
