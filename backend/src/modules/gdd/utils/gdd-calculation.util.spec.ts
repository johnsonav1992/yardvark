import {
  getDailyGDDCalculation,
  calculateAccumulatedGDD,
} from './gdd-calculation.util';
import { GDD_MAX_TEMPERATURE } from '../models/gdd.constants';

describe('GDD Calculation Utilities', () => {
  describe('getDailyGDDCalculation', () => {
    describe('standard calculations', () => {
      it('should calculate GDD correctly for a normal temperature range', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 70,
          minTemperature: 50,
        });

        // Average: (70 + 50) / 2 = 60
        // GDD: 60 - 32 = 28
        expect(result).toBe(28);
      });

      it('should calculate GDD correctly for cool-season grass (base 32°F)', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 80,
          minTemperature: 60,
        });

        // Average: (80 + 60) / 2 = 70
        // GDD: 70 - 32 = 38
        expect(result).toBe(38);
      });

      it('should calculate GDD correctly for warm-season grass (base 50°F)', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 85,
          minTemperature: 65,
        });

        // Average: (85 + 65) / 2 = 75
        // GDD: 75 - 50 = 25
        expect(result).toBe(25);
      });

      it('should calculate GDD correctly in Celsius for cool-season (base 0°C)', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 0,
          maxTemperature: 25,
          minTemperature: 10,
        });

        // Average: (25 + 10) / 2 = 17.5
        // GDD: 17.5 - 0 = 17.5
        expect(result).toBe(17.5);
      });
    });

    describe('temperature capping at maximum (86°F)', () => {
      it('should cap max temperature at 86°F when above', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 100, // Should be capped to 86
          minTemperature: 60,
        });

        // Capped max: 86, Min: 60
        // Average: (86 + 60) / 2 = 73
        // GDD: 73 - 32 = 41
        expect(result).toBe(41);
      });

      it('should not cap max temperature when at exactly 86°F', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: GDD_MAX_TEMPERATURE, // 86
          minTemperature: 50,
        });

        // Average: (86 + 50) / 2 = 68
        // GDD: 68 - 32 = 36
        expect(result).toBe(36);
      });

      it('should not cap max temperature when below 86°F', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 75,
          minTemperature: 55,
        });

        // Average: (75 + 55) / 2 = 65
        // GDD: 65 - 32 = 33
        expect(result).toBe(33);
      });

      it('should handle extreme heat wave temperatures correctly', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 110, // Extreme heat, capped to 86
          minTemperature: 75,
        });

        // Capped max: 86, Min: 75
        // Average: (86 + 75) / 2 = 80.5
        // GDD: 80.5 - 50 = 30.5
        expect(result).toBe(30.5);
      });
    });

    describe('temperature flooring at base temperature', () => {
      it('should floor min temperature at base when below', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 70,
          minTemperature: 40, // Should be floored to 50
        });

        // Max: 70, Floored min: 50
        // Average: (70 + 50) / 2 = 60
        // GDD: 60 - 50 = 10
        expect(result).toBe(10);
      });

      it('should floor max temperature at base when below', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 45, // Should be floored to 50
          minTemperature: 30, // Should be floored to 50
        });

        // Both floored to 50
        // Average: (50 + 50) / 2 = 50
        // GDD: 50 - 50 = 0
        expect(result).toBe(0);
      });

      it('should return 0 GDD when both temps are below base (cold day)', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 40,
          minTemperature: 25,
        });

        // Both floored to 50
        // Average: (50 + 50) / 2 = 50
        // GDD: 50 - 50 = 0
        expect(result).toBe(0);
      });

      it('should handle winter day with temps well below base', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32, // Cool season base
          maxTemperature: 20,
          minTemperature: 5,
        });

        // Both floored to 32
        // Average: (32 + 32) / 2 = 32
        // GDD: 32 - 32 = 0
        expect(result).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle equal max and min temperatures', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 60,
          minTemperature: 60,
        });

        // Average: (60 + 60) / 2 = 60
        // GDD: 60 - 32 = 28
        expect(result).toBe(28);
      });

      it('should handle max and min both at base temperature', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 50,
          minTemperature: 50,
        });

        expect(result).toBe(0);
      });

      it('should handle negative temperatures (Fahrenheit)', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 20,
          minTemperature: -10,
        });

        // Both floored to 32
        expect(result).toBe(0);
      });

      it('should handle negative temperatures (Celsius)', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 0,
          maxTemperature: -5,
          minTemperature: -15,
        });

        // Both floored to 0
        expect(result).toBe(0);
      });

      it('should handle min temp above base but max below cap', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 75,
          minTemperature: 55,
        });

        // No capping/flooring needed
        // Average: (75 + 55) / 2 = 65
        // GDD: 65 - 32 = 33
        expect(result).toBe(33);
      });

      it('should handle max at cap and min below base', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 95, // Capped to 86
          minTemperature: 45, // Floored to 50
        });

        // Average: (86 + 50) / 2 = 68
        // GDD: 68 - 50 = 18
        expect(result).toBe(18);
      });

      it('should produce decimal GDD values when appropriate', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 65,
          minTemperature: 48,
        });

        // Average: (65 + 48) / 2 = 56.5
        // GDD: 56.5 - 32 = 24.5
        expect(result).toBe(24.5);
      });
    });

    describe('real-world scenarios', () => {
      it('should calculate typical spring day for cool-season grass', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 32,
          maxTemperature: 65,
          minTemperature: 45,
        });

        // Average: (65 + 45) / 2 = 55
        // GDD: 55 - 32 = 23
        expect(result).toBe(23);
      });

      it('should calculate typical summer day for warm-season grass', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 92, // Capped to 86
          minTemperature: 72,
        });

        // Average: (86 + 72) / 2 = 79
        // GDD: 79 - 50 = 29
        expect(result).toBe(29);
      });

      it('should calculate fall transition day', () => {
        const result = getDailyGDDCalculation({
          baseTemperature: 50,
          maxTemperature: 58,
          minTemperature: 42, // Floored to 50
        });

        // Average: (58 + 50) / 2 = 54
        // GDD: 54 - 50 = 4
        expect(result).toBe(4);
      });
    });
  });

  describe('calculateAccumulatedGDD', () => {
    const baseTemperatureCool = 32;
    const baseTemperatureWarm = 50;

    it('should accumulate GDD over multiple days', () => {
      const dailyTemps = [
        { high: 70, low: 50 }, // GDD: (70+50)/2 - 32 = 28
        { high: 75, low: 55 }, // GDD: (75+55)/2 - 32 = 33
        { high: 80, low: 60 }, // GDD: (80+60)/2 - 32 = 38
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      // Total: 28 + 33 + 38 = 99
      expect(result).toBe(99);
    });

    it('should return 0 for empty array', () => {
      const result = calculateAccumulatedGDD([], baseTemperatureCool);
      expect(result).toBe(0);
    });

    it('should handle single day', () => {
      const dailyTemps = [{ high: 70, low: 50 }];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      // GDD: (70+50)/2 - 32 = 28
      expect(result).toBe(28);
    });

    it('should accumulate correctly with some zero-GDD days', () => {
      const dailyTemps = [
        { high: 70, low: 50 }, // GDD: 28
        { high: 30, low: 20 }, // GDD: 0 (both below base 32, floored to base)
        { high: 65, low: 45 }, // GDD: (65+45)/2 - 32 = 23
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      // Total: 28 + 0 + 23 = 51
      expect(result).toBe(51);
    });

    it('should handle week of data for warm-season grass', () => {
      const dailyTemps = [
        { high: 85, low: 65 }, // GDD: (85+65)/2 - 50 = 25
        { high: 88, low: 68 }, // GDD: (86+68)/2 - 50 = 27 (capped)
        { high: 82, low: 62 }, // GDD: (82+62)/2 - 50 = 22
        { high: 78, low: 58 }, // GDD: (78+58)/2 - 50 = 18
        { high: 92, low: 70 }, // GDD: (86+70)/2 - 50 = 28 (capped)
        { high: 80, low: 60 }, // GDD: (80+60)/2 - 50 = 20
        { high: 84, low: 64 }, // GDD: (84+64)/2 - 50 = 24
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureWarm);

      // Total: 25 + 27 + 22 + 18 + 28 + 20 + 24 = 164
      expect(result).toBe(164);
    });

    it('should accumulate correctly over typical PGR cycle', () => {
      // Simulate ~8-10 days to reach 200 GDD target for cool-season
      const dailyTemps = [
        { high: 72, low: 52 }, // ~30 GDD
        { high: 75, low: 55 }, // ~33 GDD
        { high: 70, low: 50 }, // ~28 GDD
        { high: 68, low: 48 }, // ~26 GDD
        { high: 74, low: 54 }, // ~32 GDD
        { high: 78, low: 58 }, // ~36 GDD
        { high: 65, low: 45 }, // ~23 GDD
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      // Should be around 200+ GDD
      expect(result).toBeGreaterThan(180);
      expect(result).toBeLessThan(250);
    });

    it('should handle mixed weather conditions', () => {
      const dailyTemps = [
        { high: 80, low: 60 }, // Normal warm day
        { high: 95, low: 75 }, // Heat wave (capped)
        { high: 55, low: 40 }, // Cool day
        { high: 30, low: 20 }, // Cold snap (zero GDD for cool-season)
        { high: 70, low: 50 }, // Normal spring day
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      // Day 1: (80+60)/2 - 32 = 38
      // Day 2: (86+75)/2 - 32 = 48.5
      // Day 3: (55+40)/2 - 32 = 15.5
      // Day 4: (32+32)/2 - 32 = 0 (floored)
      // Day 5: (70+50)/2 - 32 = 28
      // Total: 38 + 48.5 + 15.5 + 0 + 28 = 130
      expect(result).toBe(130);
    });

    it('should handle all cold days resulting in zero accumulated GDD', () => {
      const dailyTemps = [
        { high: 28, low: 15 },
        { high: 30, low: 20 },
        { high: 25, low: 10 },
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      expect(result).toBe(0);
    });

    it('should preserve decimal precision in accumulation', () => {
      const dailyTemps = [
        { high: 65, low: 47 }, // (65+47)/2 - 32 = 24
        { high: 67, low: 49 }, // (67+49)/2 - 32 = 26
      ];

      const result = calculateAccumulatedGDD(dailyTemps, baseTemperatureCool);

      expect(result).toBe(50);
    });
  });
});
