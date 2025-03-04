import { effect } from '@angular/core';

export const effectLogger = (
  loggedContent: unknown,
  opts?: {
    logType?: 'log' | 'warn' | 'error';
  },
) => {
  return effect(() => {
    console[opts?.logType || 'log'](loggedContent);
  });
};
