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

/**
 * Hides the virtual keyboard if available.
 * This is useful for mobile devices where the virtual keyboard can be dismissed programmatically.
 */
export const hideVirtualKeyboard = () => {
	if ('virtualKeyboard' in navigator) {
		const vk = navigator.virtualKeyboard;

		if (vk) {
			vk.overlaysContent = true;

			try {
				vk.hide();
			} catch (error) {
				console.error('Error hiding virtual keyboard:', error);
			}
		}
	}
};
