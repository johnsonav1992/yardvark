import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from '../services/weather.service';

describe('WeatherController', () => {
  let controller: WeatherController;

  const mockWeatherData = {
    current: {
      temperature: 72,
      humidity: 65,
      conditions: 'Partly Cloudy',
    },
    forecast: [
      { day: 'Monday', high: 75, low: 60 },
      { day: 'Tuesday', high: 78, low: 62 },
    ],
  };

  const mockWeatherService = {
    getWeatherData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    weatherService = module.get<WeatherService>(WeatherService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getForecast', () => {
    it('should return weather data for valid coordinates', async () => {
      mockWeatherService.getWeatherData.mockResolvedValue(mockWeatherData);

      const result = await controller.getForecast('40.7128', '-74.0060');

      expect(weatherService.getWeatherData).toHaveBeenCalledWith(
        '40.7128',
        '-74.0060',
      );
      expect(result).toEqual(mockWeatherData);
    });

    it('should return HttpException when weather service fails', async () => {
      mockWeatherService.getWeatherData.mockRejectedValue(
        new Error('API error'),
      );

      const result = await controller.getForecast('40.7128', '-74.0060');

      expect(result).toBeInstanceOf(HttpException);
      expect((result as HttpException).message).toBe(
        'Failed to fetch weather data',
      );
    });

    it('should handle different coordinate formats', async () => {
      mockWeatherService.getWeatherData.mockResolvedValue(mockWeatherData);

      await controller.getForecast('51.5074', '0.1278');

      expect(weatherService.getWeatherData).toHaveBeenCalledWith(
        '51.5074',
        '0.1278',
      );
    });
  });
});
