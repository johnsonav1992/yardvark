import { Directive, ElementRef, inject, input, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { buffer, fromEvent } from "rxjs";
import { debounceTime, filter, map } from "rxjs/operators";

/**
 * A directive that detects double taps on an element.
 *
 * Usage:
 * ```html
 * <div doubleTap (onDoubleTap)="handleDoubleTap()"></div>
 * ```
 *
 * Can also use a custom interval for double tap detection:
 * ```html
 * <div doubleTap [interval]="500" (onDoubleTap)="handleDoubleTap()"></div>
 * ```
 */
@Directive({
	selector: "[doubleTap]",
})
export class DoubleTapDirective {
	private _el = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);

	public tap$ = fromEvent(this._el.nativeElement, "touchstart");

	/**
	 * The interval in milliseconds to consider a double tap.
	 * Default is 250ms.
	 */
	public interval = input(250);

	/**
	 * A custom event that is emitted when a double tap is detected.
	 */
	public onDoubleTap = output();

	public constructor() {
		this.tap$
			.pipe(
				takeUntilDestroyed(),
				buffer(this.tap$.pipe(debounceTime(this.interval()))),
				map((taps) => taps.length),
				filter((numberOfTaps) => numberOfTaps === 2),
			)
			.subscribe({ next: () => this.onDoubleTap.emit() });
	}
}
