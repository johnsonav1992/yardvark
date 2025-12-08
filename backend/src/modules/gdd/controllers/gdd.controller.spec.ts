/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { GddController } from './gdd.controller';
import { GddService } from '../services/gdd.service';
import {
  CurrentGddResponse,
  HistoricalGddResponse,
  GddForecastResponse,
} from '../models/gdd.types';

describe('GddController', () => {
  let controller: GddController;
  let gddService: jest.Mocked<GddService>;

  const mockUserId = 'test-user-123';

  const createMockRequest = (userId: string): Request =>
    ({
      user: { userId },
    }) as unknown as Request;

  const mockCurrentGddResponse: CurrentGddResponse = {
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

  const mockHistoricalGddResponse: HistoricalGddResponse = {
    dailyGdd: [
      {
        date: '2024-06-01',
        gdd: 30,
        highTemp: 75,
        lowTemp: 55,
        temperatureUnit: 'fahrenheit',
      },
      {
        date: '2024-06-02',
        gdd: 35,
        highTemp: 80,
        lowTemp: 60,
        temperatureUnit: 'fahrenheit',
      },
    ],
    totalGdd: 65,
    startDate: '2024-06-01',
    endDate: '2024-06-02',
    baseTemperature: 32,
    baseTemperatureUnit: 'fahrenheit',
  };

  const mockGddForecastResponse: GddForecastResponse = {
    forecastedGdd: [
      {
        date: '2024-06-10',
        estimatedGdd: 36,
        highTemp: 78,
        lowTemp: 58,
        temperatureUnit: 'fahrenheit',
      },
      {
        date: '2024-06-11',
        estimatedGdd: 40,
        highTemp: 82,
        lowTemp: 62,
        temperatureUnit: 'fahrenheit',
      },
    ],
    projectedTotalGdd: 226,
    currentAccumulatedGdd: 150,
    targetGdd: 200,
    projectedNextAppDate: '2024-06-10',
    daysUntilTarget: 1,
  };

  beforeEach(async () => {
    const mockGddService = {
      getCurrentGdd: jest.fn(),
      getHistoricalGdd: jest.fn(),
      getGddForecast: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GddController],
      providers: [
        {
          provide: GddService,
          useValue: mockGddService,
        },
      ],
    }).compile();

    controller = module.get<GddController>(GddController);
    gddService = module.get(GddService);

    jest.clearAllMocks();
  });

  describe('getCurrentGdd', () => {
    it('should call gddService.getCurrentGdd with user ID from request', async () => {
      const req = createMockRequest(mockUserId);
      gddService.getCurrentGdd.mockResolvedValue(mockCurrentGddResponse);

      await controller.getCurrentGdd(req);

      expect(gddService.getCurrentGdd).toHaveBeenCalledWith(mockUserId);
      expect(gddService.getCurrentGdd).toHaveBeenCalledTimes(1);
    });

    it('should return the response from gddService', async () => {
      const req = createMockRequest(mockUserId);
      gddService.getCurrentGdd.mockResolvedValue(mockCurrentGddResponse);

      const result = await controller.getCurrentGdd(req);

      expect(result).toEqual(mockCurrentGddResponse);
    });

    it('should propagate errors from gddService', async () => {
      const req = createMockRequest(mockUserId);
      const error = new Error('Service error');
      gddService.getCurrentGdd.mockRejectedValue(error);

      await expect(controller.getCurrentGdd(req)).rejects.toThrow(error);
    });
  });

  describe('getHistoricalGdd', () => {
    const startDate = '2024-06-01';
    const endDate = '2024-06-02';

    it('should call gddService.getHistoricalGdd with correct parameters', async () => {
      const req = createMockRequest(mockUserId);
      gddService.getHistoricalGdd.mockResolvedValue(mockHistoricalGddResponse);

      await controller.getHistoricalGdd(req, startDate, endDate);

      expect(gddService.getHistoricalGdd).toHaveBeenCalledWith(
        mockUserId,
        startDate,
        endDate,
      );
      expect(gddService.getHistoricalGdd).toHaveBeenCalledTimes(1);
    });

    it('should return the response from gddService', async () => {
      const req = createMockRequest(mockUserId);
      gddService.getHistoricalGdd.mockResolvedValue(mockHistoricalGddResponse);

      const result = await controller.getHistoricalGdd(req, startDate, endDate);

      expect(result).toEqual(mockHistoricalGddResponse);
    });

    it('should propagate errors from gddService', async () => {
      const req = createMockRequest(mockUserId);
      const error = new Error('Service error');
      gddService.getHistoricalGdd.mockRejectedValue(error);

      await expect(
        controller.getHistoricalGdd(req, startDate, endDate),
      ).rejects.toThrow(error);
    });

    it('should pass through different date ranges', async () => {
      const req = createMockRequest(mockUserId);
      const customStart = '2024-01-01';
      const customEnd = '2024-12-31';
      gddService.getHistoricalGdd.mockResolvedValue(mockHistoricalGddResponse);

      await controller.getHistoricalGdd(req, customStart, customEnd);

      expect(gddService.getHistoricalGdd).toHaveBeenCalledWith(
        mockUserId,
        customStart,
        customEnd,
      );
    });
  });

  describe('getGddForecast', () => {
    it('should call gddService.getGddForecast with user ID from request', async () => {
      const req = createMockRequest(mockUserId);
      gddService.getGddForecast.mockResolvedValue(mockGddForecastResponse);

      await controller.getGddForecast(req);

      expect(gddService.getGddForecast).toHaveBeenCalledWith(mockUserId);
      expect(gddService.getGddForecast).toHaveBeenCalledTimes(1);
    });

    it('should return the response from gddService', async () => {
      const req = createMockRequest(mockUserId);
      gddService.getGddForecast.mockResolvedValue(mockGddForecastResponse);

      const result = await controller.getGddForecast(req);

      expect(result).toEqual(mockGddForecastResponse);
    });

    it('should propagate errors from gddService', async () => {
      const req = createMockRequest(mockUserId);
      const error = new Error('Service error');
      gddService.getGddForecast.mockRejectedValue(error);

      await expect(controller.getGddForecast(req)).rejects.toThrow(error);
    });
  });

  describe('user context extraction', () => {
    it('should extract userId from request.user for all endpoints', async () => {
      const differentUserId = 'different-user-456';
      const req = createMockRequest(differentUserId);

      gddService.getCurrentGdd.mockResolvedValue(mockCurrentGddResponse);
      gddService.getHistoricalGdd.mockResolvedValue(mockHistoricalGddResponse);
      gddService.getGddForecast.mockResolvedValue(mockGddForecastResponse);

      await controller.getCurrentGdd(req);
      await controller.getHistoricalGdd(req, '2024-06-01', '2024-06-02');
      await controller.getGddForecast(req);

      expect(gddService.getCurrentGdd).toHaveBeenCalledWith(differentUserId);
      expect(gddService.getHistoricalGdd).toHaveBeenCalledWith(
        differentUserId,
        expect.any(String),
        expect.any(String),
      );
      expect(gddService.getGddForecast).toHaveBeenCalledWith(differentUserId);
    });
  });
});
