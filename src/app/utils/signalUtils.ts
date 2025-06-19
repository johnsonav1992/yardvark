import { Injector, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

/**
 * Debounces a signal by a given debounce time.
 * @param signal The signal to debounce.
 * @param debounceMs The debounce time in milliseconds.
 * @param opts can pass a specific injector if running outside of an injection context.
 * @returns The debounced signal.
 *
 * @example
 * ```ts
 * public searchText = signal<string>('');
 * public searchDebounced = debouncedSignal(searchText, 1000);
 *
 * // You can then use the debounced version of the signal for the actual http call
 * // While the original signal gets used for the user entry or other UI interaction
 * // This is a lot cleaner and simpler than having to use a Subject to emit values and do
 * // standard rxjs operations on them.
 *
 * ```
 */
export const debouncedSignal = <TSignalValue>(
  signal: Signal<TSignalValue>,
  debounceMs: number,
  opts?: { injector?: Injector }
) => {
  const debouncedObservable$ = toObservable(signal, {
    injector: opts?.injector
  }).pipe(debounceTime(debounceMs));

  return toSignal(debouncedObservable$);
};
