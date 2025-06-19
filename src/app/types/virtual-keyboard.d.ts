interface VirtualKeyboardBoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VirtualKeyboard {
  overlaysContent: boolean;
  boundingRect: VirtualKeyboardBoundingRect;

  show(): void;
  hide(): void;

  addEventListener(
    type: 'geometrychange',
    listener: (this: VirtualKeyboard, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener(
    type: 'geometrychange',
    listener: (this: VirtualKeyboard, ev: Event) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

interface Navigator {
  virtualKeyboard?: VirtualKeyboard;
}
