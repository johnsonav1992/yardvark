export const SM_BREAKPOINT = '600px';
export const MD_BREAKPOINT = '900px';

/**
 * Mobile bottom navbar configuration
 * All height values in pixels
 */
export const MOBILE_NAVBAR = {
  /** Height of the navbar content (items area) */
  HEIGHT: 60,
  /** Total height including safe area padding (for content offset calculations) */
  TOTAL_HEIGHT: 80,
  /** Minimum safe area inset for standalone PWA mode */
  SAFE_AREA_MIN: 10,
} as const;

export const NO_IMAGE_URL =
  'https://yardvark-images-store.s3.us-east-2.amazonaws.com/system/no-image.jpg';

export const PREVIEW_UNAVAILABLE_URL =
  'https://yardvark-images-store.s3.us-east-2.amazonaws.com/system/preview-unavailable.png';

export const YV_DARK_MODE_SELECTOR = 'yv-dark-mode';
