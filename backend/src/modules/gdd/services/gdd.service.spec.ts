/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { success, error } from '../../../types/either';
import {
  UserSettingsNotFound,
  UserLocationNotConfigured,
} from '../models/gdd.errors';
import { HistoricalWeatherFetchError } from '../../weather/models/weather.errors';
import { GddService } from './gdd.service';
import { EntriesService } from '../../entries/services/entries.service';
import { SettingsService } from '../../settings/services/settings.service';
import { WeatherService } from '../../weather/services/weather.service';
import {
  GDD_BASE_TEMPERATURES,
  GDD_TARGET_INTERVALS,
  GDD_CACHE_TTL,
} from '../models/gdd.constants';
import { CurrentGddResponse, GddForecastResponse } from '../models/gdd.types';

describe('GddService', () => {
  let service: GddService;
  let cacheManager: jest.Mocked<Cache>;
  let entriesService: jest.Mocked<EntriesService>;
  let settingsService: jest.Mocked<SettingsService>;
  let weatherService: jest.Mocked<WeatherService>;

  const mockUserId = 'test-user-123';

  const baseSettingsValue = {
    lawnSize: 5000,
    entryView: 'calendar' as const,
    hideSystemProducts: false,
    hiddenWidgets: [],
    widgetOrder: [],
    mobileNavbarItems: [],
  };

  const mockSettings = {
    id: 1,
    userId: mockUserId,
    value: {
      ...baseSettingsValue,
      location: { address: 'New York, NY', lat: 40.7128, long: -74.006 },
      grassType: 'cool' as const,
      temperatureUnit: 'fahrenheit' as const,
      customGddTarget: undefined,
    },
  };

  const mockSettingsWithCustomTarget = {
    id: 1,
    userId: mockUserId,
    value: {
      ...mockSettings.value,
      customGddTarget: 250,
    },
  };

  const mockSettingsWarmGrass = {
    id: 1,
    userId: mockUserId,
    value: {
      ...baseSettingsValue,
      location: { address: 'Atlanta, GA', lat: 33.749, long: -84.388 },
      grassType: 'warm' as const,
      temperatureUnit: 'fahrenheit' as const,
      customGddTarget: undefined,
    },
  };

  const mockSettingsCelsius = {
    id: 1,
    userId: mockUserId,
    value: {
      ...baseSettingsValue,
      location: { address: 'London, UK', lat: 51.5074, long: -0.1278 },
      grassType: 'cool' as const,
      temperatureUnit: 'celsius' as const,
      customGddTarget: undefined,
    },
  };

  const mockHistoricalTemps = [
    { date: '2024-06-01', maxTemp: 75, minTemp: 55 },
    { date: '2024-06-02', maxTemp: 78, minTemp: 58 },
    { date: '2024-06-03', maxTemp: 72, minTemp: 52 },
    { date: '2024-06-04', maxTemp: 80, minTemp: 60 },
    { date: '2024-06-05', maxTemp: 76, minTemp: 56 },
  ];

  const mockForecastPeriods: any[] = [
    {
      name: 'Monday',
      startTime: '2024-06-10T06:00:00-04:00',
      isDaytime: true,
      temperature: 78,
      temperatureUnit: 'F',
    },
    {
      name: 'Monday Night',
      startTime: '2024-06-10T18:00:00-04:00',
      isDaytime: false,
      temperature: 58,
      temperatureUnit: 'F',
    },
    {
      name: 'Tuesday',
      startTime: '2024-06-11T06:00:00-04:00',
      isDaytime: true,
      temperature: 82,
      temperatureUnit: 'F',
    },
    {
      name: 'Tuesday Night',
      startTime: '2024-06-11T18:00:00-04:00',
      isDaytime: false,
      temperature: 62,
      temperatureUnit: 'F',
    },
    {
      name: 'Wednesday',
      startTime: '2024-06-12T06:00:00-04:00',
      isDaytime: true,
      temperature: 85,
      temperatureUnit: 'F',
    },
    {
      name: 'Wednesday Night',
      startTime: '2024-06-12T18:00:00-04:00',
      isDaytime: false,
      temperature: 65,
      temperatureUnit: 'F',
    },
  ];

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockEntriesService = {
      getLastPgrApplicationDate: jest.fn(),
    };

    const mockSettingsService = {
      getUserSettings: jest.fn(),
    };

    const mockWeatherService = {
      getHistoricalAirTemperatures: jest.fn(),
      getWeatherData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GddService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
      ],
    }).compile();

    service = module.get<GddService>(GddService);
    cacheManager = module.get(CACHE_MANAGER);
    entriesService = module.get(EntriesService);
    settingsService = module.get(SettingsService);
    weatherService = module.get(WeatherService);

    jest.clearAllMocks();
  });

  describe('getCurrentGdd', () => {
    describe('cache behavior', () => {
      it('should return cached result if available', async () => {
        const cachedResult: CurrentGddResponse = {
          accumulatedGdd: 150,
          lastPgrAppDate: '2024-06-01',
          daysSinceLastApp: 5,
          baseTemperature: 32,
          baseTemperatureUnit: 'fahrenheit',
          targetGdd: 200,
          percentageToTarget: 75,
          grassType: 'cool',
          cycleStatus: 'active',
        };

        cacheManager.get.mockResolvedValue(cachedResult);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);
        expect(result.value).toEqual(cachedResult);
        expect(cacheManager.get).toHaveBeenCalledWith(
          `gdd:${mockUserId}:current`,
        );
        expect(settingsService.getUserSettings).not.toHaveBeenCalled();
      });

      it('should cache result after fresh calculation', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(mockHistoricalTemps),
        );

        await service.getCurrentGdd(mockUserId);

        expect(cacheManager.set).toHaveBeenCalledWith(
          `gdd:${mockUserId}:current`,
          expect.any(Object),
          GDD_CACHE_TTL,
        );
      });
    });

    describe('error handling', () => {
      it('should return error when user settings not found', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(null as any);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isError()).toBe(true);
        expect(result.value).toBeInstanceOf(UserSettingsNotFound);
      });

      it('should return error when settings is an array', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue([]);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isError()).toBe(true);
        expect(result.value).toBeInstanceOf(UserSettingsNotFound);
      });

      it('should return error when location is not configured', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue({
          ...mockSettings,
          value: { ...mockSettings.value, location: null },
        } as any);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isError()).toBe(true);
        expect(result.value).toBeInstanceOf(UserLocationNotConfigured);
      });

      it('should return error when location has no lat', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue({
          ...mockSettings,
          value: { ...mockSettings.value, location: { long: -74.006 } },
        } as any);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isError()).toBe(true);
        expect(result.value).toBeInstanceOf(UserLocationNotConfigured);
      });

      it('should propagate weather service errors', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          error(new HistoricalWeatherFetchError()),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isError()).toBe(true);
        expect(result.value).toBeInstanceOf(HistoricalWeatherFetchError);
      });
    });

    describe('no PGR application', () => {
      it('should return zero GDD when no PGR application recorded', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);
        expect(result.value).toEqual({
          accumulatedGdd: 0,
          lastPgrAppDate: null,
          daysSinceLastApp: null,
          baseTemperature: GDD_BASE_TEMPERATURES.cool,
          baseTemperatureUnit: 'fahrenheit',
          targetGdd: GDD_TARGET_INTERVALS.cool,
          percentageToTarget: 0,
          grassType: 'cool',
          cycleStatus: 'active',
        });
      });

      it('should use custom target when set and no PGR app', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(
          mockSettingsWithCustomTarget,
        );
        entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.targetGdd).toBe(250);
        }
      });
    });

    describe('GDD accumulation calculations', () => {
      it('should calculate accumulated GDD correctly for cool-season grass', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(mockHistoricalTemps),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.accumulatedGdd).toBe(171);
          expect(result.value.grassType).toBe('cool');
          expect(result.value.baseTemperature).toBe(32);
        }
      });

      it('should calculate accumulated GDD correctly for warm-season grass', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(
          mockSettingsWarmGrass,
        );
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(mockHistoricalTemps),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.accumulatedGdd).toBe(81);
          expect(result.value.grassType).toBe('warm');
          expect(result.value.baseTemperature).toBe(50);
          expect(result.value.targetGdd).toBe(GDD_TARGET_INTERVALS.warm);
        }
      });

      it('should use custom GDD target when set', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(
          mockSettingsWithCustomTarget,
        );
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(mockHistoricalTemps),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.targetGdd).toBe(250);
          expect(result.value.percentageToTarget).toBe(68);
        }
      });
    });

    describe('percentage and cycle status', () => {
      it('should calculate percentage to target correctly', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(mockHistoricalTemps),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.percentageToTarget).toBe(86);
        }
      });

      it('should cap percentage at 100', async () => {
        const highTempData = [
          { date: '2024-06-01', maxTemp: 90, minTemp: 70 },
          { date: '2024-06-02', maxTemp: 92, minTemp: 72 },
          { date: '2024-06-03', maxTemp: 88, minTemp: 68 },
          { date: '2024-06-04', maxTemp: 95, minTemp: 75 },
          { date: '2024-06-05', maxTemp: 90, minTemp: 70 },
          { date: '2024-06-06', maxTemp: 85, minTemp: 65 },
          { date: '2024-06-07', maxTemp: 88, minTemp: 68 },
        ];

        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(
          new Date('2024-06-01'),
        );
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(highTempData),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.percentageToTarget).toBe(100);
        }
      });

      it('should set cycle status to active when below target', async () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 5);
        const recentTemps = [
          { date: '2025-12-03', maxTemp: 75, minTemp: 55 },
          { date: '2025-12-04', maxTemp: 78, minTemp: 58 },
          { date: '2025-12-05', maxTemp: 72, minTemp: 52 },
        ];

        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(recentTemps),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.cycleStatus).toBe('active');
        }
      });

      it('should set cycle status to complete when target reached', async () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 6);
        const highTempData = Array(6).fill({
          date: '2025-12-05',
          maxTemp: 85,
          minTemp: 65,
        });

        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettings);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
        weatherService.getHistoricalAirTemperatures.mockResolvedValue(
          success(highTempData),
        );

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.cycleStatus).toBe('complete');
          expect(result.value.percentageToTarget).toBe(100);
        }
      });
    });

    describe('temperature unit conversion', () => {
      it('should convert base temperature to Celsius when using Celsius', async () => {
        cacheManager.get.mockResolvedValue(null);
        settingsService.getUserSettings.mockResolvedValue(mockSettingsCelsius);
        entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

        const result = await service.getCurrentGdd(mockUserId);

        expect(result.isSuccess()).toBe(true);

        if (result.isSuccess()) {
          expect(result.value.baseTemperature).toBe(0);
          expect(result.value.baseTemperatureUnit).toBe('celsius');
        }
      });
    });
  });

  describe('getHistoricalGdd', () => {
    const startDate = '2024-06-01';
    const endDate = '2024-06-05';

    it('should return cached result if available', async () => {
      const cachedResult = {
        dailyGdd: [],
        totalGdd: 100,
        startDate,
        endDate,
        baseTemperature: 32,
        baseTemperatureUnit: 'fahrenheit',
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getHistoricalGdd(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toEqual(cachedResult);
      expect(cacheManager.get).toHaveBeenCalledWith(
        `gdd:${mockUserId}:historical:start=${startDate}:end=${endDate}`,
      );
    });

    it('should calculate daily GDD for each day', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(mockHistoricalTemps),
      );

      const result = await service.getHistoricalGdd(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.dailyGdd).toHaveLength(5);
        expect(result.value.dailyGdd[0]).toEqual({
          date: '2024-06-01',
          gdd: 33,
          highTemp: 75,
          lowTemp: 55,
          temperatureUnit: 'fahrenheit',
        });
      }
    });

    it('should calculate correct total GDD', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(mockHistoricalTemps),
      );

      const result = await service.getHistoricalGdd(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.totalGdd).toBe(171);
      }
    });

    it('should return error when settings not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(null as any);

      const result = await service.getHistoricalGdd(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(UserSettingsNotFound);
    });

    it('should return error when location not configured', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue({
        ...mockSettings,
        value: { ...mockSettings.value, location: null },
      } as any);

      const result = await service.getHistoricalGdd(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(UserLocationNotConfigured);
    });

    it('should propagate weather service errors', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        error(new HistoricalWeatherFetchError()),
      );

      const result = await service.getHistoricalGdd(
        mockUserId,
        startDate,
        endDate,
      );

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(HistoricalWeatherFetchError);
    });
  });

  describe('getGddForecast', () => {
    beforeEach(() => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(
        new Date('2024-06-01'),
      );
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(mockHistoricalTemps),
      );
      weatherService.getWeatherData.mockResolvedValue(
        success({
          properties: { periods: mockForecastPeriods },
        } as any),
      );
    });

    it('should return cached result if available', async () => {
      const cachedResult: GddForecastResponse = {
        forecastedGdd: [],
        projectedTotalGdd: 250,
        currentAccumulatedGdd: 150,
        targetGdd: 200,
        projectedNextAppDate: '2024-06-12',
        daysUntilTarget: 2,
      };

      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);
      expect(result.value).toEqual(cachedResult);
    });

    it('should calculate forecasted GDD for each day', async () => {
      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.forecastedGdd).toHaveLength(3);
        expect(result.value.forecastedGdd[0].date).toBe('2024-06-10');
        expect(result.value.forecastedGdd[0].highTemp).toBe(78);
        expect(result.value.forecastedGdd[0].lowTemp).toBe(58);
      }
    });

    it('should include current accumulated GDD in response', async () => {
      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.currentAccumulatedGdd).toBe(171);
      }
    });

    it('should calculate projected total including current and forecast', async () => {
      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.projectedTotalGdd).toBe(290);
      }
    });

    it('should determine projected next app date when target will be reached', async () => {
      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.projectedNextAppDate).toBe('2024-06-10');
        expect(result.value.daysUntilTarget).toBe(1);
      }
    });

    it('should return null projected date when target not reached in forecast', async () => {
      settingsService.getUserSettings.mockResolvedValue({
        ...mockSettings,
        value: { ...mockSettings.value, customGddTarget: 500 },
      });

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.projectedNextAppDate).toBeNull();
        expect(result.value.daysUntilTarget).toBeNull();
      }
    });

    it('should return error when settings not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(null as any);

      const result = await service.getGddForecast(mockUserId);

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(UserSettingsNotFound);
    });

    it('should use custom GDD target when set', async () => {
      settingsService.getUserSettings.mockResolvedValue(
        mockSettingsWithCustomTarget,
      );

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.targetGdd).toBe(250);
      }
    });
  });

  describe('invalidateCache', () => {
    it('should delete both current and forecast cache entries', async () => {
      await service.invalidateCache(mockUserId);

      expect(cacheManager.del).toHaveBeenCalledWith(
        `gdd:${mockUserId}:current`,
      );
      expect(cacheManager.del).toHaveBeenCalledWith(
        `gdd:${mockUserId}:forecast`,
      );
      expect(cacheManager.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('getBaseTemperature (private method via getCurrentGdd)', () => {
    it('should return 32 for cool-season grass in Fahrenheit', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.baseTemperature).toBe(32);
      }
    });

    it('should return 50 for warm-season grass in Fahrenheit', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettingsWarmGrass);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.baseTemperature).toBe(50);
      }
    });

    it('should return 0 for cool-season grass in Celsius', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettingsCelsius);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.baseTemperature).toBe(0);
      }
    });

    it('should return 10 for warm-season grass in Celsius', async () => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue({
        ...mockSettingsWarmGrass,
        value: {
          ...mockSettingsWarmGrass.value,
          temperatureUnit: 'celsius' as const,
        },
      });
      entriesService.getLastPgrApplicationDate.mockResolvedValue(null);

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.baseTemperature).toBe(10);
      }
    });
  });

  describe('extractDailyTempsFromForecast (via getGddForecast)', () => {
    beforeEach(() => {
      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(
        new Date('2024-06-01'),
      );
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(mockHistoricalTemps),
      );
    });

    it('should pair daytime and nighttime temperatures for same date', async () => {
      weatherService.getWeatherData.mockResolvedValue(
        success({
          properties: { periods: mockForecastPeriods },
        } as any),
      );

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.forecastedGdd[0].highTemp).toBe(78);
        expect(result.value.forecastedGdd[0].lowTemp).toBe(58);
      }
    });

    it('should filter out incomplete days (missing high or low)', async () => {
      const incompleteForecasts = [
        {
          name: 'Monday',
          startTime: '2024-06-10T06:00:00-04:00',
          isDaytime: true,
          temperature: 78,
          temperatureUnit: 'F',
        },
        {
          name: 'Tuesday',
          startTime: '2024-06-11T06:00:00-04:00',
          isDaytime: true,
          temperature: 82,
          temperatureUnit: 'F',
        },
        {
          name: 'Tuesday Night',
          startTime: '2024-06-11T18:00:00-04:00',
          isDaytime: false,
          temperature: 62,
          temperatureUnit: 'F',
        },
      ];

      weatherService.getWeatherData.mockResolvedValue(
        success({
          properties: { periods: incompleteForecasts },
        } as any),
      );

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.forecastedGdd).toHaveLength(1);
        expect(result.value.forecastedGdd[0].date).toBe('2024-06-11');
      }
    });

    it('should limit to 7 days of forecast', async () => {
      const manyPeriods = [];

      for (let i = 10; i <= 25; i++) {
        manyPeriods.push({
          name: `Day ${i}`,
          startTime: `2024-06-${i}T06:00:00-04:00`,
          isDaytime: true,
          temperature: 75 + (i % 5),
          temperatureUnit: 'F',
        });
        manyPeriods.push({
          name: `Night ${i}`,
          startTime: `2024-06-${i}T18:00:00-04:00`,
          isDaytime: false,
          temperature: 55 + (i % 5),
          temperatureUnit: 'F',
        });
      }

      weatherService.getWeatherData.mockResolvedValue(
        success({
          properties: { periods: manyPeriods },
        } as any),
      );

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.forecastedGdd.length).toBeLessThanOrEqual(7);
      }
    });

    it('should convert Celsius forecast to Fahrenheit when user wants Fahrenheit', async () => {
      const celsiusForecast = [
        {
          name: 'Monday',
          startTime: '2024-06-10T06:00:00-04:00',
          isDaytime: true,
          temperature: 26,
          temperatureUnit: 'C',
        },
        {
          name: 'Monday Night',
          startTime: '2024-06-10T18:00:00-04:00',
          isDaytime: false,
          temperature: 15,
          temperatureUnit: 'C',
        },
      ];

      weatherService.getWeatherData.mockResolvedValue(
        success({
          properties: { periods: celsiusForecast },
        } as any),
      );

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.forecastedGdd[0].highTemp).toBe(79);
        expect(result.value.forecastedGdd[0].lowTemp).toBe(59);
      }
    });

    it('should convert Fahrenheit forecast to Celsius when user wants Celsius', async () => {
      settingsService.getUserSettings.mockResolvedValue(mockSettingsCelsius);

      weatherService.getWeatherData.mockResolvedValue(
        success({
          properties: { periods: mockForecastPeriods },
        } as any),
      );

      const result = await service.getGddForecast(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.forecastedGdd[0].highTemp).toBe(26);
        expect(result.value.forecastedGdd[0].lowTemp).toBe(14);
      }
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical spring PGR cycle for cool-season grass', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 4);

      const springTemps = [
        { date: '2025-12-03', maxTemp: 60, minTemp: 40 },
        { date: '2025-12-04', maxTemp: 65, minTemp: 45 },
        { date: '2025-12-05', maxTemp: 68, minTemp: 48 },
        { date: '2025-12-06', maxTemp: 70, minTemp: 50 },
      ];

      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(springTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.accumulatedGdd).toBeGreaterThan(0);
        expect(result.value.accumulatedGdd).toBeLessThan(200);
        expect(result.value.percentageToTarget).toBeLessThan(100);
        expect(result.value.cycleStatus).toBe('active');
      }
    });

    it('should handle summer heat wave with temperature capping', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const heatWaveTemps = [
        { date: '2025-12-03', maxTemp: 95, minTemp: 75 },
        { date: '2025-12-04', maxTemp: 98, minTemp: 78 },
        { date: '2025-12-05', maxTemp: 100, minTemp: 80 },
        { date: '2025-12-06', maxTemp: 102, minTemp: 82 },
        { date: '2025-12-07', maxTemp: 97, minTemp: 77 },
      ];

      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(heatWaveTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.accumulatedGdd).toBeGreaterThan(200);
        expect(result.value.cycleStatus).toBe('complete');
      }
    });

    it('should handle cold snap with zero GDD accumulation', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);

      const coldSnapTemps = [
        { date: '2025-12-05', maxTemp: 40, minTemp: 25 },
        { date: '2025-12-06', maxTemp: 35, minTemp: 20 },
        { date: '2025-12-07', maxTemp: 28, minTemp: 15 },
      ];

      cacheManager.get.mockResolvedValue(null);
      settingsService.getUserSettings.mockResolvedValue(mockSettingsWarmGrass);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(coldSnapTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.accumulatedGdd).toBe(0);
        expect(result.value.cycleStatus).toBe('dormant');
      }
    });
  });

  describe('cycle status determination', () => {
    beforeEach(() => {
      cacheManager.get.mockResolvedValue(null);
    });

    it('should return dormant when recent temps are below dormancy threshold', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const winterTemps = [
        { date: '2025-12-01', maxTemp: 45, minTemp: 30 },
        { date: '2025-12-02', maxTemp: 42, minTemp: 28 },
        { date: '2025-12-03', maxTemp: 48, minTemp: 32 },
        { date: '2025-12-04', maxTemp: 40, minTemp: 25 },
        { date: '2025-12-05', maxTemp: 44, minTemp: 29 },
        { date: '2025-12-06', maxTemp: 46, minTemp: 31 },
        { date: '2025-12-07', maxTemp: 43, minTemp: 27 },
      ];

      settingsService.getUserSettings.mockResolvedValue(mockSettingsWarmGrass);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(winterTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.cycleStatus).toBe('dormant');
      }
    });

    it('should return overdue when accumulated GDD exceeds 2x target', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);

      const manyWarmDays = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-11-${String(i + 7).padStart(2, '0')}`,
        maxTemp: 80,
        minTemp: 60,
      }));

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(manyWarmDays),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.accumulatedGdd).toBeGreaterThan(400);
        expect(result.value.cycleStatus).toBe('overdue');
      }
    });

    it('should return overdue when days since app exceeds threshold (45 days)', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 50);

      const moderateTemps = Array.from({ length: 50 }, (_, i) => ({
        date: `2025-10-${String((i % 30) + 1).padStart(2, '0')}`,
        maxTemp: 55,
        minTemp: 45,
      }));

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(oldDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(moderateTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.daysSinceLastApp).toBeGreaterThanOrEqual(45);
        expect(result.value.cycleStatus).toBe('overdue');
      }
    });

    it('should return complete when target reached but not overdue', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 6);

      const warmDays = [
        { date: '2025-12-02', maxTemp: 85, minTemp: 65 },
        { date: '2025-12-03', maxTemp: 85, minTemp: 65 },
        { date: '2025-12-04', maxTemp: 85, minTemp: 65 },
        { date: '2025-12-05', maxTemp: 85, minTemp: 65 },
        { date: '2025-12-06', maxTemp: 85, minTemp: 65 },
        { date: '2025-12-07', maxTemp: 85, minTemp: 65 },
      ];

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(warmDays),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.accumulatedGdd).toBeGreaterThanOrEqual(200);
        expect(result.value.accumulatedGdd).toBeLessThan(400);
        expect(result.value.daysSinceLastApp).toBeLessThan(45);
        expect(result.value.cycleStatus).toBe('complete');
      }
    });

    it('should return active when below target', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);

      const fewWarmDays = [
        { date: '2025-12-05', maxTemp: 75, minTemp: 55 },
        { date: '2025-12-06', maxTemp: 75, minTemp: 55 },
        { date: '2025-12-07', maxTemp: 75, minTemp: 55 },
      ];

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(fewWarmDays),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.accumulatedGdd).toBeLessThan(200);
        expect(result.value.cycleStatus).toBe('active');
      }
    });

    it('should prioritize dormant over overdue', async () => {
      const longColdPeriod = Array.from({ length: 60 }, (_, i) => ({
        date: `2025-12-${String((i % 7) + 1).padStart(2, '0')}`,
        maxTemp: 45,
        minTemp: 30,
      }));

      settingsService.getUserSettings.mockResolvedValue(mockSettingsWarmGrass);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(
        new Date('2025-10-01'),
      );
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(longColdPeriod),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.cycleStatus).toBe('dormant');
      }
    });

    it('should not be dormant for cool-season grass when highs are above dormancy threshold', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const mildSpringTemps = [
        { date: '2025-12-01', maxTemp: 55, minTemp: 38 },
        { date: '2025-12-02', maxTemp: 58, minTemp: 40 },
        { date: '2025-12-03', maxTemp: 52, minTemp: 35 },
        { date: '2025-12-04', maxTemp: 56, minTemp: 39 },
        { date: '2025-12-05', maxTemp: 54, minTemp: 37 },
        { date: '2025-12-06', maxTemp: 57, minTemp: 41 },
        { date: '2025-12-07', maxTemp: 53, minTemp: 36 },
      ];

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(mildSpringTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.cycleStatus).not.toBe('dormant');
      }
    });

    it('should reset GDD cycle when coming out of dormancy into a new season', async () => {
      const fallPgrDate = new Date();
      fallPgrDate.setDate(fallPgrDate.getDate() - 120);

      const tempHistory = [
        ...Array.from({ length: 20 }, (_, i) => ({
          date: `2025-09-${String(i + 10).padStart(2, '0')}`,
          maxTemp: 68 + (i % 5),
          minTemp: 48 + (i % 5),
        })),
        ...Array.from({ length: 80 }, (_, i) => ({
          date: `2025-${String(10 + Math.floor(i / 30)).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          maxTemp: 38 + (i % 5),
          minTemp: 22 + (i % 5),
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          date: `2026-02-${String(i + 1).padStart(2, '0')}`,
          maxTemp: 58 + (i % 5),
          minTemp: 40 + (i % 5),
        })),
      ];

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(fallPgrDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(tempHistory),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.lastPgrAppDate).toBeNull();
        expect(result.value.accumulatedGdd).toBe(0);
        expect(result.value.cycleStatus).toBe('active');
        expect(result.value.percentageToTarget).toBe(0);
      }
    });

    it('should not reset GDD cycle when no dormancy occurred since last PGR', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const warmTemps = [
        { date: '2025-12-03', maxTemp: 75, minTemp: 55 },
        { date: '2025-12-04', maxTemp: 78, minTemp: 58 },
        { date: '2025-12-05', maxTemp: 72, minTemp: 52 },
        { date: '2025-12-06', maxTemp: 80, minTemp: 60 },
        { date: '2025-12-07', maxTemp: 76, minTemp: 56 },
      ];

      settingsService.getUserSettings.mockResolvedValue(mockSettings);
      entriesService.getLastPgrApplicationDate.mockResolvedValue(recentDate);
      weatherService.getHistoricalAirTemperatures.mockResolvedValue(
        success(warmTemps),
      );

      const result = await service.getCurrentGdd(mockUserId);

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.lastPgrAppDate).not.toBeNull();
        expect(result.value.accumulatedGdd).toBeGreaterThan(0);
      }
    });
  });
});
