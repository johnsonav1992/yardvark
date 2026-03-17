import { type Page } from "@playwright/test";

export class AddEntryPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto("/entry-log/add");
		await this.page.waitForURL("**/entry-log/add", { timeout: 15000 });
	}

	async fillTitle(title: string) {
		await this.page
			.locator("span.input-wrapper")
			.filter({ hasText: "Title (optional)" })
			.locator("input")
			.fill(title);
	}

	async submit() {
		await this.page.getByRole("button", { name: "Create Entry" }).click();
		await this.page.waitForURL(/entry-log\?/, { timeout: 15000 });
	}
}
