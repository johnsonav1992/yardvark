import { inject } from "@angular/core";
import { MessageService } from "primeng/api";

/**
 * Creates and returns a function to display error toast messages.
 *
 *
 * @returns A function that accepts a message string and displays an error toast
 * @example
 * // In a component:
 * public showError = injectErrorToast();
 * // Later when an error occurs:
 * showError('Failed to save data');
 */
export const injectErrorToast = (): ((message: string) => void) => {
	const toastService = inject(MessageService);

	return (message: string) => {
		toastService.add({
			severity: "error",
			summary: "Error",
			detail: message,
			sticky: true,
		});
	};
};

/**
 * Creates and returns a function for displaying warning toast messages.
 *
 * This utility injects the MessageService and returns a function that can be used
 * to display warning toast notifications. The returned function accepts a message
 * string and displays it as a sticky warning toast.
 *
 * @returns A function that takes a message string and displays it as a warning toast
 * @example
 * // In a component
 * const showWarning = injectWarningToast();
 * showWarning('This action cannot be undone');
 */
export const injectWarningToast = (): ((message: string) => void) => {
	const toastService = inject(MessageService);

	return (message: string) => {
		toastService.add({
			severity: "warn",
			summary: "Warning",
			detail: message,
			sticky: true,
		});
	};
};

export const injectSuccessToast = (): ((message: string) => void) => {
	const toastService = inject(MessageService);

	return (message: string) => {
		toastService.add({
			severity: "success",
			summary: "Success",
			detail: message,
		});
	};
};

export const injectInfoToast = (): ((message: string) => void) => {
	const toastService = inject(MessageService);

	return (message: string) => {
		toastService.add({
			severity: "info",
			detail: message,
		});
	};
};
