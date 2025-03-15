import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';

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
