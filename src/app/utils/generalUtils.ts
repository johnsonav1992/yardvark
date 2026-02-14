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
 * Uses industry-average densities for liquid fertilizers.
 *
 * @param quantity - The quantity to convert
 * @param unit - The unit to convert from
 * @returns The quantity converted to pounds
 */
export const convertToPounds = (
  quantity: number,
  unit:
    | 'lbs'
    | 'oz'
    | 'fl oz'
    | 'kg'
    | 'g'
    | 'gal'
    | 'qt'
    | 'pt'
    | 'tsp'
    | 'mL'
    | 'L'
    | (string & {})
): number => {
  const conversionRates: Record<string, number> = {
    // Solid weights
    lbs: 1,
    oz: 0.0625, // 1 oz = 0.0625 lbs
    kg: 2.20462, // 1 kg = 2.20462 lbs
    g: 0.00220462, // 1 g = 0.00220462 lbs

    // Liquid volumes (using average liquid fertilizer density of 9.5 lbs/gallon)
    gal: 9.5, // Average liquid fertilizer density
    qt: 2.375, // 9.5 / 4
    pt: 1.1875, // 9.5 / 8
    'fl oz': 0.0742, // 9.5 / 128
    tsp: 0.0154, // 9.5 / 616 (128 fl oz × 4.8 tsp/fl oz)
    mL: 0.0021, // ~1 g/mL converted to lbs
    L: 2.1 // ~1 kg/L converted to lbs
  };

  return quantity * (conversionRates[unit] || 1);
};
