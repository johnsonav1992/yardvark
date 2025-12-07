import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WeatherService } from './weather.service';
import {
  WeatherDotGovPointsResponse,
  WeatherDotGovForecastResponse,
  Period,
  ProbabilityOfPrecipitation,
} from '../models/weather.types';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as tryCatchModule from '../../../utils/tryCatch';

describe('WeatherService', () => {
  let service: WeatherService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockProbabilityOfPrecipitation: ProbabilityOfPrecipitation = {
    unitCode: 'wmoUnit:percent',
    value: 30,
  };

  const mockPeriod: Period = {
    number: 1,
    name: 'Today',
    startTime: '2025-06-19T12:00:00-05:00',
    endTime: '2025-06-19T18:00:00-05:00',
    isDaytime: true,
    temperature: 85,
    temperatureUnit: 'F',
    temperatureTrend: '',
    probabilityOfPrecipitation: mockProbabilityOfPrecipitation,
    windSpeed: '10 mph',
    windDirection: 'SW',
    icon: 'https://api.weather.gov/icons/land/day/sct?size=medium',
    shortForecast: 'Partly Cloudy',
    detailedForecast:
      'Partly cloudy skies with temperatures reaching 85 degrees.',
  };

  const mockPointsResponse: WeatherDotGovPointsResponse = {
    '@context': [
      'https://geojson.org/geojson-ld/geojson-context.jsonld',
      {
        '@version': '1.1',
        wx: 'https://api.weather.gov/ontology#',
        geo: 'http://www.opengis.net/ont/geosparql#',
        unit: 'http://codes.wmo.int/common/unit/',
        '@vocab': 'https://api.weather.gov/ontology#',
      },
    ],
    id: 'https://api.weather.gov/points/32.7767,-96.7970',
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-96.797, 32.7767],
    },
    properties: {
      '@id': 'https://api.weather.gov/points/32.7767,-96.7970',
      '@type': 'wx:Point',
      cwa: 'FWD',
      forecastOffice: 'https://api.weather.gov/offices/FWD',
      gridId: 'FWD',
      gridX: 80,
      gridY: 110,
      forecast: 'https://api.weather.gov/gridpoints/FWD/80,110/forecast',
      forecastHourly:
        'https://api.weather.gov/gridpoints/FWD/80,110/forecast/hourly',
      forecastGridData: 'https://api.weather.gov/gridpoints/FWD/80,110',
      observationStations:
        'https://api.weather.gov/gridpoints/FWD/80,110/stations',
      relativeLocation: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-96.8089, 32.7673],
        },
        properties: {
          city: 'Dallas',
          state: 'TX',
          distance: {
            unitCode: 'wmoUnit:m',
            value: 1234.5,
          },
          bearing: {
            unitCode: 'wmoUnit:degree_(angle)',
            value: 90,
          },
        },
      },
      forecastZone: 'https://api.weather.gov/zones/forecast/TXZ119',
      county: 'https://api.weather.gov/zones/county/TXC113',
      fireWeatherZone: 'https://api.weather.gov/zones/fire/TXZ119',
      timeZone: 'America/Chicago',
      radarStation: 'KFWS',
    },
  };

  const mockForecastResponse: WeatherDotGovForecastResponse = {
    '@context': [
      'https://geojson.org/geojson-ld/geojson-context.jsonld',
      {
        '@version': '1.1',
        wx: 'https://api.weather.gov/ontology#',
        geo: 'http://www.opengis.net/ont/geosparql#',
        unit: 'http://codes.wmo.int/common/unit/',
        '@vocab': 'https://api.weather.gov/ontology#',
      },
    ],
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-96.8, 32.8],
          [-96.7, 32.8],
          [-96.7, 32.7],
          [-96.8, 32.7],
          [-96.8, 32.8],
        ],
      ],
    },
    properties: {
      units: 'us',
      forecastGenerator: 'BaselineForecastGenerator',
      generatedAt: '2025-06-19T17:00:00+00:00',
      updateTime: '2025-06-19T16:30:00+00:00',
      validTimes: '2025-06-19T16:00:00+00:00/P7DT18H',
      elevation: {
        unitCode: 'wmoUnit:m',
        value: 137.16,
      },
      periods: [mockPeriod],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: 'FORECAST_CACHE_TTL',
          useValue: 3600000,
        },
        {
          provide: 'HISTORICAL_CACHE_TTL',
          useValue: 86400000,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
    mockCacheManager.get.mockResolvedValue(null); // Default to cache miss
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWeatherData', () => {
    it('should successfully fetch weather data with valid coordinates', async () => {
      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
        {
          data: mockForecastResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(of(forecastAxiosResponse));

      const result = await service.getWeatherData('32.7767', '-96.7970');

      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
      expect(mockHttpService.get).toHaveBeenNthCalledWith(
        1,
        'https://api.weather.gov/points/32.7767,-96.7970',
      );
      expect(mockHttpService.get).toHaveBeenNthCalledWith(
        2,
        'https://api.weather.gov/gridpoints/FWD/80,110/forecast',
      );
      expect(result).toEqual(mockForecastResponse);
    });

    it('should handle different coordinate formats', async () => {
      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
        {
          data: mockForecastResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(of(forecastAxiosResponse));

      await service.getWeatherData('40.7128', '-74.0060');

      expect(mockHttpService.get).toHaveBeenNthCalledWith(
        1,
        'https://api.weather.gov/points/40.7128,-74.0060',
      );
    });

    it('should handle multiple weather periods in response', async () => {
      const multiPeriodForecast: WeatherDotGovForecastResponse = {
        ...mockForecastResponse,
        properties: {
          ...mockForecastResponse.properties,
          periods: [
            mockPeriod,
            {
              ...mockPeriod,
              number: 2,
              name: 'Tonight',
              isDaytime: false,
              temperature: 72,
              shortForecast: 'Clear',
            },
            {
              ...mockPeriod,
              number: 3,
              name: 'Tomorrow',
              temperature: 88,
              shortForecast: 'Sunny',
            },
          ],
        },
      };

      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
        {
          data: multiPeriodForecast,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(of(forecastAxiosResponse));

      const result = await service.getWeatherData('32.7767', '-96.7970');

      expect(result.properties.periods).toHaveLength(3);
      expect(result.properties.periods[0].name).toBe('Today');
      expect(result.properties.periods[1].name).toBe('Tonight');
      expect(result.properties.periods[2].name).toBe('Tomorrow');
    });

    it('should throw error when forecast URL is missing from points response', async () => {
      const pointsResponseWithoutForecast: WeatherDotGovPointsResponse = {
        ...mockPointsResponse,
        properties: {
          ...mockPointsResponse.properties,
          forecast: '',
        },
      };

      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: pointsResponseWithoutForecast,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      mockHttpService.get.mockReturnValueOnce(of(pointsAxiosResponse));

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow(
        'Failed to fetch weather data: Forecast URL not found in response',
      );
    });

    it('should throw error when points API call fails', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => new Error('Points API error')),
      );

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow('Failed to fetch weather data: Points API error');
    });

    it('should throw error when forecast API call fails', async () => {
      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(throwError(() => new Error('Forecast API error')));

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow('Failed to fetch weather data: Forecast API error');
    });

    it('should handle network timeout errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => new Error('timeout of 5000ms exceeded')),
      );

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow(
        'Failed to fetch weather data: timeout of 5000ms exceeded',
      );
    });

    it('should handle invalid coordinates gracefully', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => new Error('Invalid point coordinates')),
      );

      await expect(
        service.getWeatherData('invalid', 'coordinates'),
      ).rejects.toThrow(
        'Failed to fetch weather data: Invalid point coordinates',
      );
    });

    it('should handle non-Error objects in tryCatch', async () => {
      jest.spyOn(tryCatchModule, 'tryCatch').mockResolvedValueOnce({
        success: false,
        data: null,
        error: { message: undefined } as unknown as Error,
      });

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow('Failed to fetch weather data: undefined');
    });

    it('should handle empty forecast data', async () => {
      jest.spyOn(tryCatchModule, 'tryCatch').mockResolvedValueOnce({
        success: false,
        data: null,
        error: new Error('Empty forecast data'),
      });

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow('Failed to fetch weather data: Empty forecast data');
    });

    it('should handle malformed points response', async () => {
      const malformedPointsResponse = {
        ...mockPointsResponse,
        properties: null,
      };

      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: malformedPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      mockHttpService.get.mockReturnValueOnce(of(pointsAxiosResponse));

      await expect(
        service.getWeatherData('32.7767', '-96.7970'),
      ).rejects.toThrow('Failed to fetch weather data:');
    });

    it('should handle edge case coordinates', async () => {
      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
        {
          data: mockForecastResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(of(forecastAxiosResponse));

      await service.getWeatherData('71.0', '-156.0'); // Prudhoe Bay, Alaska

      expect(mockHttpService.get).toHaveBeenNthCalledWith(
        1,
        'https://api.weather.gov/points/71.0,-156.0',
      );
    });

    it('should handle weather data with null precipitation values', async () => {
      const periodWithNullPrecipitation: Period = {
        ...mockPeriod,
        probabilityOfPrecipitation: {
          unitCode: 'wmoUnit:percent',
          value: null as never,
        },
      };

      const forecastWithNullPrecipitation: WeatherDotGovForecastResponse = {
        ...mockForecastResponse,
        properties: {
          ...mockForecastResponse.properties,
          periods: [periodWithNullPrecipitation],
        },
      };

      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
        {
          data: forecastWithNullPrecipitation,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(of(forecastAxiosResponse));

      const result = await service.getWeatherData('32.7767', '-96.7970');

      expect(
        result.properties.periods[0].probabilityOfPrecipitation.value,
      ).toBeNull();
    });

    it('should return cached data on cache hit', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockForecastResponse);

      const result = await service.getWeatherData('32.7767', '-96.7970');

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'weather:forecast:32.7767:-96.7970',
      );
      expect(mockHttpService.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockForecastResponse);
    });

    it('should cache data after fetching from API', async () => {
      const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
        data: mockPointsResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as never;

      const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
        {
          data: mockForecastResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as never;

      mockHttpService.get
        .mockReturnValueOnce(of(pointsAxiosResponse))
        .mockReturnValueOnce(of(forecastAxiosResponse));

      await service.getWeatherData('32.7767', '-96.7970');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'weather:forecast:32.7767:-96.7970',
        mockForecastResponse,
        3600000,
      );
    });
  });
});
