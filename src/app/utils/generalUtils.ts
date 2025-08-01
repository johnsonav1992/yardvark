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

/**
 * Converts a quantity from various units to pounds.
 *
 * @param quantity - The quantity to convert
 * @param unit - The unit to convert from
 * @returns The quantity converted to pounds
 */
export const convertToPounds = (
  quantity: number,
  unit: 'lbs' | 'oz' | 'fl oz' | 'kg' | 'g' | (string & {})
): number => {
  const conversionRates: Record<string, number> = {
    lbs: 1,
    oz: 0.0625, // 1 oz = 0.0625 lbs
    'fl oz': 0.0625, // Treating fluid oz similar to oz for fertilizer products
    kg: 2.20462, // 1 kg = 2.20462 lbs
    g: 0.00220462 // 1 g = 0.00220462 lbs
  };

  return quantity * (conversionRates[unit] || 1);
};
