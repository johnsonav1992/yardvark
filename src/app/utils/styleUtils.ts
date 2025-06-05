import { $dt } from '@primeng/themes';
import { PrimeNGColorToken } from '../types/style.types';
import { inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { fromEvent, map, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

/**
 * Returns the hex color value of a PrimeNG color token.
 *
 * @param tokenName - The name of the PrimeNG color token.
 * @returns The hex color value of the PrimeNG color token.
 */
export const getPrimeNgHexColor = (tokenName: PrimeNGColorToken): string => {
  const token = $dt(tokenName);

  return token.value;
};

/**
 * Injects a BreakpointObserver and returns a signal that emits a boolean value
 * indicating whether the specified media query matches the current viewport size.
 *
 * @param query - The media query string to observe.
 * @returns A signal that emits `true` if the media query matches, and `false` otherwise.
 *
 * @example
 * const isSmallScreen = injectBreakpointObserver('(max-width: 600px)');
 */
export const injectBreakpointObserver = (query: string) => {
  const breakpointObserver = inject(BreakpointObserver);

  return toSignal(
    breakpointObserver.observe(query).pipe(map((res) => res.matches)),
    { initialValue: breakpointObserver.isMatched(query) }
  );
};

/**
 * Injects a screen width observer that emits the current window inner width
 * whenever the window is resized.
 *
 * @returns A signal of the current window inner width.
 */
export const injectScreenWidthObserver = () => {
  return toSignal(
    fromEvent(window, 'resize').pipe(
      takeUntilDestroyed(),
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    ),
    { initialValue: window.innerWidth }
  );
};
