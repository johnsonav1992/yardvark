import {
	Directive,
	ElementRef,
	HostListener,
	inject,
	OnDestroy,
	signal,
} from "@angular/core";

/**
 * Adds pinch-to-zoom and pan gesture support to an element.
 * While zoomed in, single-finger pan is handled and swipe propagation is blocked.
 * Zoom resets when the user pinches back to 1x.
 *
 * Usage:
 * ```html
 * <img pinchZoom />
 * ```
 */
@Directive({
	selector: "[pinchZoom]",
})
export class PinchZoomDirective implements OnDestroy {
	private _host = inject(ElementRef<HTMLElement>);

	private _scale = signal(1);
	private _panX = signal(0);
	private _panY = signal(0);
	private _startDistance = signal(0);
	private _startScale = signal(1);
	private _lastX = signal(0);
	private _lastY = signal(0);
	private _pinching = signal(false);

	private _boundTouchMove = this._onTouchMove.bind(this);

	constructor() {
		this._host.nativeElement.addEventListener(
			"touchmove",
			this._boundTouchMove,
			{ passive: false },
		);
	}

	public ngOnDestroy(): void {
		this._host.nativeElement.removeEventListener(
			"touchmove",
			this._boundTouchMove,
		);
	}

	@HostListener("touchstart", ["$event"])
	public onTouchStart(e: TouchEvent): void {
		if (e.touches.length === 2) {
			this._pinching.set(true);
			this._startDistance.set(this._dist(e.touches[0], e.touches[1]));
			this._startScale.set(this._scale());
		} else if (e.touches.length === 1 && this._scale() > 1) {
			this._lastX.set(e.touches[0].clientX);
			this._lastY.set(e.touches[0].clientY);
		}
	}

	@HostListener("touchend", ["$event"])
	public onTouchEnd(e: TouchEvent): void {
		if (e.touches.length < 2) {
			this._pinching.set(false);
		}

		if (this._scale() <= 1.05) {
			this._reset();
		}
	}

	private _onTouchMove(e: TouchEvent): void {
		if (e.touches.length === 2 && this._pinching()) {
			e.preventDefault();
			const d = this._dist(e.touches[0], e.touches[1]);
			this._scale.set(
				Math.min(
					5,
					Math.max(1, this._startScale() * (d / this._startDistance())),
				),
			);
			this._apply();
		} else if (e.touches.length === 1 && this._scale() > 1) {
			e.preventDefault();
			this._panX.update((x) => x + e.touches[0].clientX - this._lastX());
			this._panY.update((y) => y + e.touches[0].clientY - this._lastY());
			this._lastX.set(e.touches[0].clientX);
			this._lastY.set(e.touches[0].clientY);
			this._apply();
		}
	}

	private _dist(t1: Touch, t2: Touch): number {
		return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
	}

	private _apply(): void {
		const el = this._host.nativeElement;
		el.style.transform = `scale(${this._scale()}) translate(${this._panX() / this._scale()}px, ${this._panY() / this._scale()}px)`;
		el.style.transformOrigin = "center center";
	}

	private _reset(): void {
		this._scale.set(1);
		this._panX.set(0);
		this._panY.set(0);
		this._host.nativeElement.style.transform = "";
	}
}
