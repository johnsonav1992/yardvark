import { Test, TestingModule } from '@nestjs/testing';
import { SoilDataService } from './soil-data.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SettingsService } from '../../settings/services/settings.service';
import { of, throwError } from 'rxjs';
import { Cache } from 'cache-manager';
import { format, subDays, addDays } from 'date-fns';

describe('SoilDataService', () => {
  let service: SoilDataService;

  const mockCache: Partial<Cache> = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockSettingsService = {
    getUserSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoilDataService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<SoilDataService>(SoilDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSoilDataForDate', () => {
    it('should return InvalidDateFormatError for invalid date', async () => {
      const result = await service.fetchSoilDataForDate(
        'user-123',
        'invalid-date',
      );

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.value.code).toBe('INVALID_DATE_FORMAT');
      }
    });

    it('should return UserSettingsNotFoundError when settings not found', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue([]);

      const result = await service.fetchSoilDataForDate(
        'user-123',
        '2024-01-01',
      );

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.value.code).toBe('USER_SETTINGS_NOT_FOUND');
      }
    });

    it('should return UserLocationNotConfiguredError when location missing', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        value: {
          temperatureUnit: 'fahrenheit',
          location: null,
        },
      });

      const result = await service.fetchSoilDataForDate(
        'user-123',
        '2024-01-01',
      );

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.value.code).toBe('USER_LOCATION_NOT_CONFIGURED');
      }
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        date: '2024-01-01',
        shallowTemp: 50,
        deepTemp: 48,
        moisturePct: 25,
        temperatureUnit: 'fahrenheit' as const,
      };

      mockSettingsService.getUserSettings.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        value: {
          temperatureUnit: 'fahrenheit',
          location: { lat: 40, long: -75 },
        },
      });

      mockCache.get = jest.fn().mockResolvedValue(cachedData);

      const result = await service.fetchSoilDataForDate(
        'user-123',
        '2024-01-01',
      );

      expect(result.isError()).toBe(false);
      if (!result.isError()) {
        expect(result.value).toEqual(cachedData);
      }
      expect(mockCache.get).toHaveBeenCalled();
    });

    it('should fetch from Open-Meteo and cache when not in cache', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        value: {
          temperatureUnit: 'fahrenheit',
          location: { lat: 40, long: -75, address: 'Test' },
        },
      });

      mockCache.get = jest.fn().mockResolvedValue(null);

      const openMeteoResponse = {
        data: {
          hourly: {
            time: Array(24).fill('2024-01-01T00:00'),
            soil_temperature_6cm: Array(24).fill(50),
            soil_temperature_18cm: Array(24).fill(48),
            soil_moisture_3_to_9cm: Array(24).fill(0.25),
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(openMeteoResponse));

      const result = await service.fetchSoilDataForDate(
        'user-123',
        '2024-01-01',
      );

      expect(result.isError()).toBe(false);
      if (!result.isError()) {
        expect(result.value.date).toBe('2024-01-01');
        expect(result.value.shallowTemp).toBe(50);
        expect(result.value.deepTemp).toBe(48);
        expect(result.value.moisturePct).toBe(25);
      }
      expect(mockHttpService.get).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return OpenMeteoFetchError on API failure', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        value: {
          temperatureUnit: 'fahrenheit',
          location: { lat: 40, long: -75, address: 'Test' },
        },
      });

      mockCache.get = jest.fn().mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error')),
      );

      const result = await service.fetchSoilDataForDate(
        'user-123',
        '2024-01-01',
      );

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.value.code).toBe('OPEN_METEO_FETCH_ERROR');
      }
    });
  });

  describe('fetchRollingWeekSoilData', () => {
    it('should return UserSettingsNotFoundError when settings not found', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue([]);

      const result = await service.fetchRollingWeekSoilData('user-123');

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.value.code).toBe('USER_SETTINGS_NOT_FOUND');
      }
    });

    it('should return UserLocationNotConfiguredError when location missing', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        value: {
          temperatureUnit: 'fahrenheit',
          location: null,
        },
      });

      const result = await service.fetchRollingWeekSoilData('user-123');

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.value.code).toBe('USER_LOCATION_NOT_CONFIGURED');
      }
    });

    it('should fetch 15 dates of soil data', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        value: {
          temperatureUnit: 'fahrenheit',
          location: { lat: 40, long: -75, address: 'Test' },
        },
      });

      const today = new Date();
      const dates: string[] = [];

      for (let i = 7; i >= 0; i--) {
        dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
      }

      for (let i = 1; i <= 7; i++) {
        dates.push(format(addDays(today, i), 'yyyy-MM-dd'));
      }

      mockCache.get = jest.fn().mockResolvedValue(null);

      const hourlyTimes: string[] = [];
      const hourlyShallowTemps: number[] = [];
      const hourlyDeepTemps: number[] = [];
      const hourlyMoistures: number[] = [];

      for (const dateStr of dates) {
        for (let hour = 0; hour < 24; hour++) {
          hourlyTimes.push(`${dateStr}T${hour.toString().padStart(2, '0')}:00`);
          hourlyShallowTemps.push(50);
          hourlyDeepTemps.push(48);
          hourlyMoistures.push(0.25);
        }
      }

      const openMeteoResponse = {
        data: {
          hourly: {
            time: hourlyTimes,
            soil_temperature_6cm: hourlyShallowTemps,
            soil_temperature_18cm: hourlyDeepTemps,
            soil_moisture_3_to_9cm: hourlyMoistures,
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(openMeteoResponse));

      const result = await service.fetchRollingWeekSoilData('user-123');

      expect(result.isError()).toBe(false);
      if (!result.isError()) {
        expect(result.value.dates).toHaveLength(15);
        expect(result.value.shallowTemps).toHaveLength(15);
        expect(result.value.deepTemps).toHaveLength(15);
        // cSpell:ignore Pcts
        expect(result.value.moisturePcts).toHaveLength(15);
        expect(result.value.temperatureUnit).toBe('fahrenheit');
      }
    });
  });
});
