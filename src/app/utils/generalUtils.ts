import { effect } from '@angular/core';

/**
 * Logs the given content to the console reactively for signal reads.
 *
 * @param loggedContent - The content to log to the console. Usually includes signal reads.
 * @param opts - Options for the logger.
 * @param opts.logType - The type of log to use. Defaults to 'log'.
 */
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
