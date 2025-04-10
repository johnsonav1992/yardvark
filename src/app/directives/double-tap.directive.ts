import { Directive, ElementRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { buffer, fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

/**
 * A directive that detects double taps on an element.
 *
 * Usage:
 * ```html
 * <div doubleTap (onDoubleTap)="handleDoubleTap()"></div>
 * ```
 */
@Directive({
  selector: '[doubleTap]'
})
export class DoubleTapDirective {
  private _el = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);

  public click$ = fromEvent(this._el.nativeElement, 'touchstart');

  /**
   * A custom event that is emitted when a double tap is detected.
   */
  public onDoubleTap = output();

  constructor() {
    this.click$
      .pipe(
        takeUntilDestroyed(),
        buffer(this.click$.pipe(debounceTime(250))),
        map((taps) => taps.length),
        filter((numberOfTaps) => numberOfTaps === 2)
      )
      .subscribe({ next: () => this.onDoubleTap.emit() });
  }
}
