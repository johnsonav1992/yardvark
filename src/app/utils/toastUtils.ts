import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';

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
      severity: 'error',
      summary: 'Error',
      detail: message,
      sticky: true
    });
  };
};
