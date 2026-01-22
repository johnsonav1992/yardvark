import { GrassType } from '../types/gdd.types';

/**
 * Default target GDD intervals between PGR applications
 * Based on university research for trinexapac-ethyl (Primo Maxx, T-Nex)
 */
export const GDD_TARGET_INTERVALS: Record<GrassType, number> = {
  cool: 200, // Cool-season: 200-250 GDD typical
  warm: 220, // Warm-season: 220 GDD typical
} as const;
