import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { format, differenceInDays } from 'date-fns';

import { EntriesService } from '../../entries/services/entries.service';
import { SettingsService } from '../../settings/services/settings.service';
import { WeatherService } from '../../weather/services/weather.service';
import { LogHelpers } from '../../../logger/logger.helpers';
import {
  getDailyGDDCalculation,
  calculateAccumulatedGDD,
} from '../utils/gdd-calculation.util';
import {
  GDD_BASE_TEMPERATURES,
  GDD_TARGET_INTERVALS,
  GDD_CACHE_TTL,
  GDD_OVERDUE_MULTIPLIER,
  GDD_OVERDUE_DAYS_THRESHOLD,
  GDD_DORMANCY_CHECK_DAYS,
  GDD_DORMANCY_TEMPERATURES,
} from '../models/gdd.constants';
import {
  CurrentGddResponse,
  HistoricalGddResponse,
  GddForecastResponse,
  DailyGddDataPoint,
  ForecastGddDataPoint,
  GddCycleStatus,
} from '../models/gdd.types';

@Injectable()
export class GddService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly _cacheManager: Cache,
    private readonly _entriesService: EntriesService,
    private readonly _settingsService: SettingsService,
    private readonly _weatherService: WeatherService,
  ) {}

  public async getCurrentGdd(userId: string): Promise<CurrentGddResponse> {
    const cacheKey = this.getCacheKey(userId, 'current');

    const cached = await this._cacheManager.get<CurrentGddResponse>(cacheKey);

    if (cached) {
      LogHelpers.recordCacheHit();
      return cached;
    }

    LogHelpers.recordCacheMiss();

    const settings = await this._settingsService.getUserSettings(userId);

    if (!settings || Array.isArray(settings)) {
      throw new HttpException(
        'User settings not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { location, grassType, temperatureUnit, customGddTarget } =
      settings.value;

    if (!location?.lat || !location?.long) {
      throw new HttpException(
        'User location not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const lastPgrAppDate =
      await this._entriesService.getLastPgrApplicationDate(userId);

    const baseTemperature = this.getBaseTemperature(grassType, temperatureUnit);
    const targetGdd = customGddTarget ?? GDD_TARGET_INTERVALS[grassType];

    if (!lastPgrAppDate) {
      const result: CurrentGddResponse = {
        accumulatedGdd: 0,
        lastPgrAppDate: null,
        daysSinceLastApp: null,
        baseTemperature,
        baseTemperatureUnit: temperatureUnit,
        targetGdd,
        percentageToTarget: 0,
        grassType,
        cycleStatus: 'active',
      };

      await this._cacheManager.set(cacheKey, result, GDD_CACHE_TTL);

      return result;
    }

    const startDate = format(lastPgrAppDate, 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');

    const temperatureData =
      await this._weatherService.getHistoricalAirTemperatures({
        lat: location.lat,
        long: location.long,
        startDate,
        endDate,
        temperatureUnit,
      });

    const accumulatedGdd = calculateAccumulatedGDD(
      temperatureData.map((d) => ({ high: d.maxTemp, low: d.minTemp })),
      baseTemperature,
    );

    const daysSinceLastApp = differenceInDays(new Date(), lastPgrAppDate);
    const percentageToTarget = Math.min(
      100,
      Math.round((accumulatedGdd / targetGdd) * 100),
    );

    const dormancyTemperature = this.getDormancyTemperature(
      grassType,
      temperatureUnit,
    );

    const cycleStatus = this.determineCycleStatus({
      accumulatedGdd,
      targetGdd,
      daysSinceLastApp,
      recentTemps: temperatureData.slice(-GDD_DORMANCY_CHECK_DAYS),
      dormancyTemperature,
    });

    if (
      cycleStatus !== 'dormant' &&
      this.hasDormancyOccurredInPeriod(temperatureData, dormancyTemperature)
    ) {
      LogHelpers.addBusinessContext('gddDormancyReset', true);
      LogHelpers.addBusinessContext('gddCycleStatus', 'active');

      const resetResult: CurrentGddResponse = {
        accumulatedGdd: 0,
        lastPgrAppDate: null,
        daysSinceLastApp: null,
        baseTemperature,
        baseTemperatureUnit: temperatureUnit,
        targetGdd,
        percentageToTarget: 0,
        grassType,
        cycleStatus: 'active',
      };

      await this._cacheManager.set(cacheKey, resetResult, GDD_CACHE_TTL);

      return resetResult;
    }

    LogHelpers.addBusinessContext(
      'gddAccumulated',
      Math.round(accumulatedGdd * 10) / 10,
    );
    LogHelpers.addBusinessContext('gddTarget', targetGdd);
    LogHelpers.addBusinessContext('gddCycleStatus', cycleStatus);
    LogHelpers.addBusinessContext('gddDaysSinceLastApp', daysSinceLastApp);

    const result: CurrentGddResponse = {
      accumulatedGdd: Math.round(accumulatedGdd * 10) / 10,
      lastPgrAppDate: format(lastPgrAppDate, 'yyyy-MM-dd'),
      daysSinceLastApp,
      baseTemperature,
      baseTemperatureUnit: temperatureUnit,
      targetGdd,
      percentageToTarget,
      grassType,
      cycleStatus,
    };

    await this._cacheManager.set(cacheKey, result, GDD_CACHE_TTL);

    return result;
  }

  public async getHistoricalGdd(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalGddResponse> {
    const cacheKey = this.getCacheKey(userId, 'historical', {
      startDate,
      endDate,
    });

    const cached =
      await this._cacheManager.get<HistoricalGddResponse>(cacheKey);

    if (cached) {
      LogHelpers.recordCacheHit();
      return cached;
    }

    LogHelpers.recordCacheMiss();

    const settings = await this._settingsService.getUserSettings(userId);
    if (!settings || Array.isArray(settings)) {
      throw new HttpException(
        'User settings not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { location, grassType, temperatureUnit } = settings.value;
    if (!location?.lat || !location?.long) {
      throw new HttpException(
        'User location not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const baseTemperature = this.getBaseTemperature(grassType, temperatureUnit);

    const temperatureData =
      await this._weatherService.getHistoricalAirTemperatures({
        lat: location.lat,
        long: location.long,
        startDate,
        endDate,
        temperatureUnit,
      });

    const dailyGdd: DailyGddDataPoint[] = temperatureData.map((day) => ({
      date: day.date,
      gdd:
        Math.round(
          getDailyGDDCalculation({
            baseTemperature,
            maxTemperature: day.maxTemp,
            minTemperature: day.minTemp,
          }) * 10,
        ) / 10,
      highTemp: day.maxTemp,
      lowTemp: day.minTemp,
      temperatureUnit,
    }));

    const totalGdd = dailyGdd.reduce((sum, day) => sum + day.gdd, 0);

    const result: HistoricalGddResponse = {
      dailyGdd,
      totalGdd: Math.round(totalGdd * 10) / 10,
      startDate,
      endDate,
      baseTemperature,
      baseTemperatureUnit: temperatureUnit,
    };

    await this._cacheManager.set(cacheKey, result, GDD_CACHE_TTL);

    return result;
  }

  public async getGddForecast(userId: string): Promise<GddForecastResponse> {
    const cacheKey = this.getCacheKey(userId, 'forecast');

    const cached = await this._cacheManager.get<GddForecastResponse>(cacheKey);

    if (cached) {
      LogHelpers.recordCacheHit();
      return cached;
    }

    LogHelpers.recordCacheMiss();

    const settings = await this._settingsService.getUserSettings(userId);
    if (!settings || Array.isArray(settings)) {
      throw new HttpException(
        'User settings not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { location, grassType, temperatureUnit, customGddTarget } =
      settings.value;
    if (!location?.lat || !location?.long) {
      throw new HttpException(
        'User location not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const baseTemperature = this.getBaseTemperature(grassType, temperatureUnit);
    const targetGdd = customGddTarget ?? GDD_TARGET_INTERVALS[grassType];

    const currentGddData = await this.getCurrentGdd(userId);
    const currentAccumulatedGdd = currentGddData.accumulatedGdd;

    const forecast = await this._weatherService.getWeatherData(
      String(location.lat),
      String(location.long),
    );

    const dailyForecasts = this.extractDailyTempsFromForecast(
      forecast.properties.periods,
      temperatureUnit,
    );

    let runningTotal = currentAccumulatedGdd;
    let projectedNextAppDate: string | null = null;
    let daysUntilTarget: number | null = null;

    const forecastedGdd: ForecastGddDataPoint[] = dailyForecasts.map(
      (day, index) => {
        const dailyGdd = getDailyGDDCalculation({
          baseTemperature,
          maxTemperature: day.high,
          minTemperature: day.low,
        });

        runningTotal += dailyGdd;

        if (!projectedNextAppDate && runningTotal >= targetGdd) {
          projectedNextAppDate = day.date;
          daysUntilTarget = index + 1;
        }

        return {
          date: day.date,
          estimatedGdd: Math.round(dailyGdd * 10) / 10,
          highTemp: day.high,
          lowTemp: day.low,
          temperatureUnit,
        };
      },
    );

    const result: GddForecastResponse = {
      forecastedGdd,
      projectedTotalGdd: Math.round(runningTotal * 10) / 10,
      currentAccumulatedGdd,
      targetGdd,
      projectedNextAppDate,
      daysUntilTarget,
    };

    await this._cacheManager.set(cacheKey, result, GDD_CACHE_TTL);

    return result;
  }

  public async invalidateCache(userId: string): Promise<void> {
    await this._cacheManager.del(this.getCacheKey(userId, 'current'));
    await this._cacheManager.del(this.getCacheKey(userId, 'forecast'));
  }

  private getCacheKey(userId: string, type: 'current' | 'forecast'): string;
  private getCacheKey(
    userId: string,
    type: 'historical',
    params: { startDate: string; endDate: string },
  ): string;
  private getCacheKey(
    userId: string,
    type: 'current' | 'forecast' | 'historical',
    params?: { startDate: string; endDate: string },
  ): string {
    if (type === 'historical' && params) {
      return `gdd:${userId}:historical:start=${params.startDate}:end=${params.endDate}`;
    }
    return `gdd:${userId}:${type}`;
  }

  private getBaseTemperature(
    grassType: 'warm' | 'cool',
    temperatureUnit: 'fahrenheit' | 'celsius',
  ): number {
    const baseTempF = GDD_BASE_TEMPERATURES[grassType];
    if (temperatureUnit === 'celsius') {
      return Math.round((baseTempF - 32) * (5 / 9));
    }
    return baseTempF;
  }

  private getDormancyTemperature(
    grassType: 'warm' | 'cool',
    temperatureUnit: 'fahrenheit' | 'celsius',
  ): number {
    const dormancyTempF = GDD_DORMANCY_TEMPERATURES[grassType];

    if (temperatureUnit === 'celsius') {
      return Math.round((dormancyTempF - 32) * (5 / 9));
    }

    return dormancyTempF;
  }

  /**
   * Determines the cycle status based on accumulated GDD, time elapsed, and recent temps.
   * Priority: dormant > overdue > complete > active
   */
  private determineCycleStatus({
    accumulatedGdd,
    targetGdd,
    daysSinceLastApp,
    recentTemps,
    dormancyTemperature,
  }: {
    accumulatedGdd: number;
    targetGdd: number;
    daysSinceLastApp: number;
    recentTemps: Array<{ maxTemp: number; minTemp: number }>;
    dormancyTemperature: number;
  }): GddCycleStatus {
    if (recentTemps.length > 0) {
      const avgHighTemp =
        recentTemps.reduce((sum, t) => sum + t.maxTemp, 0) / recentTemps.length;

      if (avgHighTemp < dormancyTemperature) return 'dormant';
    }

    const isOverdue =
      accumulatedGdd >= targetGdd * GDD_OVERDUE_MULTIPLIER ||
      daysSinceLastApp >= GDD_OVERDUE_DAYS_THRESHOLD;

    if (isOverdue) return 'overdue';

    if (accumulatedGdd >= targetGdd) return 'complete';

    return 'active';
  }

  /**
   * Checks if a dormancy period occurred within the given temperature data
   * by scanning for any window of GDD_DORMANCY_CHECK_DAYS consecutive days
   * where average highs fell below the dormancy threshold.
   */
  private hasDormancyOccurredInPeriod(
    temperatureData: Array<{ maxTemp: number }>,
    dormancyTemperature: number,
  ): boolean {
    if (temperatureData.length < GDD_DORMANCY_CHECK_DAYS) return false;

    for (
      let i = 0;
      i <= temperatureData.length - GDD_DORMANCY_CHECK_DAYS;
      i++
    ) {
      const window = temperatureData.slice(i, i + GDD_DORMANCY_CHECK_DAYS);
      const avgHigh =
        window.reduce((sum, t) => sum + t.maxTemp, 0) / window.length;

      if (avgHigh < dormancyTemperature) return true;
    }

    return false;
  }

  private extractDailyTempsFromForecast(
    periods: Array<{
      name: string;
      startTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
    }>,
    userTempUnit: 'fahrenheit' | 'celsius',
  ): Array<{ date: string; high: number; low: number }> {
    const dailyMap = new Map<string, { high?: number; low?: number }>();

    periods.forEach((period) => {
      const date = format(new Date(period.startTime), 'yyyy-MM-dd');
      const existing = dailyMap.get(date) || {};

      let temp = period.temperature;

      if (period.temperatureUnit === 'F' && userTempUnit === 'celsius') {
        temp = Math.round((temp - 32) * (5 / 9));
      } else if (
        period.temperatureUnit === 'C' &&
        userTempUnit === 'fahrenheit'
      ) {
        temp = Math.round(temp * (9 / 5) + 32);
      }

      if (period.isDaytime) {
        existing.high = temp;
      } else {
        existing.low = temp;
      }

      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.entries())
      .filter(
        ([, temps]) => temps.high !== undefined && temps.low !== undefined,
      )
      .map(([date, temps]) => ({
        date,
        high: temps.high!,
        low: temps.low!,
      }))
      .slice(0, 7);
  }
}
