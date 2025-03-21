import { effect, Signal } from '@angular/core';

/**
 * Logs the given signal(s) to the console reactively.
 *
 * @param loggedSignalContent - The content to log to the console. Only pass a signal (or array of signals) without calling them.
 * @param opts - Options for the logger.
 * @param opts.logType - The type of log to use. Defaults to 'log'.
 */
export const effectSignalLogger = (
  loggedSignalContent: Signal<unknown> | Signal<unknown>[],
  opts?: {
    logType?: 'log' | 'warn' | 'error';
  }
) => {
  return effect(() => {
    console[opts?.logType || 'log'](
      Array.isArray(loggedSignalContent)
        ? loggedSignalContent.map((signal) => signal())
        : loggedSignalContent()
    );
  });
};
