import { Injectable, signal } from '@angular/core';

/**
 * Service to track viewport changes and provide offset for fixed bottom elements
 * Handles mobile browser address bar hiding/showing and virtual keyboard appearance
 */
@Injectable({
  providedIn: 'root',
})
export class ViewportService {
  /**
   * The offset in pixels from the bottom of the viewport
   * This accounts for virtual keyboard, browser bars, etc.
   */
  private _viewportBottomOffset = signal(0);

  /**
   * Readonly signal for viewport bottom offset
   * Use this to position fixed bottom elements correctly
   */
  public readonly viewportBottomOffset = this._viewportBottomOffset.asReadonly();

  /**
   * Whether the virtual keyboard is currently visible
   */
  private _keyboardVisible = signal(false);
  public readonly keyboardVisible = this._keyboardVisible.asReadonly();

  constructor() {
    this.initializeViewportTracking();
  }

  /**
   * Initializes viewport tracking with multiple fallback methods
   * Priority order:
   * 1. Visual Viewport API (most accurate)
   * 2. Virtual Keyboard API (Android Chrome 108+)
   * 3. Window resize fallback (older browsers)
   */
  private initializeViewportTracking(): void {
    // Method 1: Visual Viewport API (Primary - Most Accurate)
    // Works on: Chrome 61+, Firefox 63+, Safari 16+, iOS Safari 15+
    if (this.supportsVisualViewport()) {
      this.setupVisualViewportTracking();
    }

    // Method 2: Virtual Keyboard API (Secondary - Android Chrome 108+)
    // Specific to keyboard detection on Android
    if (this.supportsVirtualKeyboard()) {
      this.setupVirtualKeyboardTracking();
    }

    // Method 3: Fallback - Window resize detection
    // Works on all browsers but less accurate
    this.setupResizeFallback();

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      // Reset offset on orientation change
      setTimeout(() => this.recalculateOffset(), 100);
    });
  }

  /**
   * Setup Visual Viewport API tracking (Primary method)
   * Tracks the actual visible portion of the viewport
   */
  private setupVisualViewportTracking(): void {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleViewportResize = () => {
      // Calculate how much of the viewport is obscured
      // This happens when keyboard appears or browser UI changes
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const offset = Math.max(0, windowHeight - viewportHeight);

      this._viewportBottomOffset.set(offset);

      // Update keyboard visibility state
      // If offset is significant (>150px), likely keyboard is visible
      this._keyboardVisible.set(offset > 150);

      // Update CSS custom property for use in styles
      document.documentElement.style.setProperty(
        '--viewport-bottom-offset',
        `${offset}px`
      );
    };

    visualViewport.addEventListener('resize', handleViewportResize);
    visualViewport.addEventListener('scroll', handleViewportResize);

    // Initial calculation
    handleViewportResize();
  }

  /**
   * Setup Virtual Keyboard API tracking (Secondary method)
   * More explicit keyboard detection for Android Chrome 108+
   */
  private setupVirtualKeyboardTracking(): void {
    const virtualKeyboard = (navigator as any).virtualKeyboard;
    if (!virtualKeyboard) return;

    // Allow content to be overlaid by keyboard
    // This gives us control over how elements respond
    virtualKeyboard.overlaysContent = true;

    virtualKeyboard.addEventListener('geometrychange', (event: any) => {
      const { boundingRect } = event.target;

      // Calculate how much the keyboard overlaps from the bottom
      const keyboardHeight = boundingRect.height;
      const keyboardTop = boundingRect.top;

      // Only update if this gives us more information than visualViewport
      if (keyboardHeight > 0) {
        const overlap = Math.max(0, window.innerHeight - keyboardTop);

        // Only override if visualViewport didn't catch it
        if (overlap > this._viewportBottomOffset()) {
          this._viewportBottomOffset.set(overlap);
          this._keyboardVisible.set(true);

          document.documentElement.style.setProperty(
            '--viewport-bottom-offset',
            `${overlap}px`
          );
        }
      } else {
        // Keyboard hidden
        this._keyboardVisible.set(false);
        // Let visualViewport handle the offset reset
      }
    });
  }

  /**
   * Setup window resize fallback for older browsers
   * Detects significant height changes that indicate keyboard/browser UI changes
   */
  private setupResizeFallback(): void {
    let lastHeight = window.innerHeight;
    let resizeTimeout: number | undefined;

    const handleResize = () => {
      // Debounce rapid resize events
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = window.setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDiff = lastHeight - currentHeight;

        // Significant height reduction (>50px) suggests keyboard appeared
        // or browser chrome expanded
        if (Math.abs(heightDiff) > 50) {
          const offset = Math.max(0, heightDiff);

          // Only update if visualViewport hasn't already handled it
          if (!this.supportsVisualViewport()) {
            this._viewportBottomOffset.set(offset);
            this._keyboardVisible.set(offset > 150);

            document.documentElement.style.setProperty(
              '--viewport-bottom-offset',
              `${offset}px`
            );
          }
        } else if (heightDiff < 0) {
          // Height increased - keyboard likely hidden or browser chrome collapsed
          if (!this.supportsVisualViewport()) {
            this._viewportBottomOffset.set(0);
            this._keyboardVisible.set(false);

            document.documentElement.style.setProperty(
              '--viewport-bottom-offset',
              '0px'
            );
          }
        }

        lastHeight = currentHeight;
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
  }

  /**
   * Manually recalculate the viewport offset
   * Useful after orientation changes or other major layout shifts
   */
  private recalculateOffset(): void {
    if (this.supportsVisualViewport() && window.visualViewport) {
      const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
      this._viewportBottomOffset.set(offset);

      document.documentElement.style.setProperty(
        '--viewport-bottom-offset',
        `${offset}px`
      );
    }
  }

  /**
   * Check if Visual Viewport API is supported
   */
  private supportsVisualViewport(): boolean {
    return 'visualViewport' in window && window.visualViewport !== null;
  }

  /**
   * Check if Virtual Keyboard API is supported
   */
  private supportsVirtualKeyboard(): boolean {
    return 'virtualKeyboard' in navigator;
  }

  /**
   * Public method to hide the virtual keyboard programmatically
   * Only works on browsers that support the Virtual Keyboard API
   */
  public hideKeyboard(): void {
    const virtualKeyboard = (navigator as any).virtualKeyboard;
    if (virtualKeyboard) {
      try {
        virtualKeyboard.hide();
      } catch (error) {
        console.warn('Failed to hide virtual keyboard:', error);
      }
    } else {
      // Fallback: Blur active element to dismiss keyboard
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }
  }
}
