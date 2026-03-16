import type { Page } from "@playwright/test";

export async function waitForAngularStability(page: Page): Promise<void> {
	await page.evaluate(() => {
		const ng = (window as { ng?: { getComponent: (el: Element) => unknown; applyChanges: (comp: unknown) => void } }).ng;
		const rootEls = (window as { getAllAngularRootElements?: () => Element[] }).getAllAngularRootElements?.() ?? [];

		if (!ng || rootEls.length === 0) {
			return;
		}

		const rootComp = ng.getComponent(rootEls[0]);

		if (rootComp) {
			ng.applyChanges(rootComp);
		}
	});
}
