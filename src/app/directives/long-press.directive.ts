import { Directive, HostListener, input, output, signal } from '@angular/core';

@Directive({
  selector: '[longPress]'
})
export class LongPressDirective {
  /**
   * The duration in milliseconds for which the element should be pressed
   * to trigger the long press event.
   */
  public duration = input(500);

  /**
   * Event emitted when the element is long pressed for the required duration.
   */
  public longPress = output();

  private timeoutId = signal<number | null>(null);

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  public onPressStart() {
    const timeoutId = setTimeout(() => {
      this.longPress.emit();
      console.log('pressed');
    }, this.duration());

    this.timeoutId.set(timeoutId as unknown as number);
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
  @HostListener('touchend', ['$event'])
  public onPressEnd() {
    clearTimeout(this.timeoutId() as number);
  }
}
