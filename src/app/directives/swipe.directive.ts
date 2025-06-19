import { Directive, HostListener, output, signal } from '@angular/core';

/**
 * A directive that detects swipe gestures on an element.
 *
 * Usage:
 * ```html
 * <div swipeDetection (onSwipeLeft)="handleSwipeLeft()" (onSwipeRight)="handleSwipeRight()"></div>
 * ```
 */
@Directive({
	selector: '[swipeDetection]'
})
export class SwipeDirective {
	public onSwipeLeft = output();
	public onSwipeRight = output();

	private touchStartX = signal(0);
	private touchEndX = signal(0);
	private readonly minSwipeDistance = 50; // minimum distance in px to count as a swipe

	@HostListener('touchstart', ['$event'])
	onTouchStart(event: TouchEvent) {
		this.touchStartX.set(event.changedTouches[0].screenX);
	}

	@HostListener('touchend', ['$event'])
	onTouchEnd(event: TouchEvent) {
		this.touchEndX.set(event.changedTouches[0].screenX);
		this.handleSwipeGesture();
	}

	private handleSwipeGesture() {
		const deltaX = this.touchEndX() - this.touchStartX();

		if (Math.abs(deltaX) > this.minSwipeDistance) {
			if (deltaX < 0) {
				this.onSwipeLeft.emit();
			} else {
				this.onSwipeRight.emit();
			}
		}
	}
}
