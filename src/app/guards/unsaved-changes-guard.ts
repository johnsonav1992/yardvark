import { inject, Signal } from "@angular/core";
import { CanDeactivateFn } from "@angular/router";
import { ConfirmationService } from "primeng/api";

export type UnsavedChanges = {
	hasUnsavedChanges: Signal<boolean>;
};

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChanges> = (
	component,
) => {
	const confirmationService = inject(ConfirmationService);
	const hasUnsavedChanges = component.hasUnsavedChanges();

	if (hasUnsavedChanges) {
		return new Promise<boolean>((resolve) => {
			confirmationService.confirm({
				header: "Unsaved Changes",
				message: "You have unsaved changes. Do you really want to leave?",
				accept: () => resolve(true),
				reject: () => resolve(false),
			});
		});
	}

	return true;
};
