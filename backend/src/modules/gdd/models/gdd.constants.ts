/**
 * Base temperatures for GDD calculation based on grass type (in Fahrenheit)
 * Research-based values for PGR timing
 *
 * Cool-season grasses: Kentucky bluegrass, fescue, ryegrass, bentgrass
 * Warm-season grasses: Bermuda, zoysia, St. Augustine, centipede
 */
export const GDD_BASE_TEMPERATURES = {
  cool: 32, // 0°C
  warm: 50, // 10°C
} as const;

/**
 * Default target GDD intervals between PGR applications
 * Based on university research for trinexapac-ethyl (Primo Maxx, T-Nex)
 */
export const GDD_TARGET_INTERVALS = {
  cool: 200, // Cool-season: 200-250 GDD typical
  warm: 220, // Warm-season: 220 GDD typical
} as const;

/**
 * Maximum temperature cap for GDD calculation (in Fahrenheit)
 * Plants don't grow faster above 86°F (30°C), so temperatures are capped
 * to prevent over-accumulation during heat waves
 */
export const GDD_MAX_TEMPERATURE = 86; // 30°C

/**
 * Cache TTL for GDD data (24 hours in milliseconds)
 */
export const GDD_CACHE_TTL = 86400000;
