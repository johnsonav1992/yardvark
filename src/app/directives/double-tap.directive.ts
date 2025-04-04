import { Directive, ElementRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { buffer, fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

@Directive({
  selector: '[doubleTap]'
})
export class DoubleTapDirective {
  private _el = inject(ElementRef);

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
        map((list) => list.length),
        filter((x) => x === 2)
      )
      .subscribe(() => {
        this.onDoubleTap.emit();
      });
  }
}
