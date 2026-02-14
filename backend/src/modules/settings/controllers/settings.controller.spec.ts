import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from '../services/settings.service';
import { SettingsData, SettingsResponse } from '../models/settings.types';

describe('SettingsController', () => {
  let controller: SettingsController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let settingsService: SettingsService;

  const mockUserId = 'user-123';

  const mockSettingsService = {
    getUserSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  const mockSettingsData: SettingsData = {
    temperatureUnit: 'fahrenheit',
    grassType: 'warm',
    lawnSize: 5000,
    location: {
      address: '123 Main St, Dallas, TX',
      lat: 32.7767,
      long: -96.797,
    },
    entryView: 'calendar',
    hideSystemProducts: false,
    hiddenWidgets: [],
    widgetOrder: [],
    mobileNavbarItems: [],
  };

  const mockSettingsResponse: SettingsResponse = {
    id: 1,
    userId: 'user-123',
    value: mockSettingsData,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    settingsService = module.get<SettingsService>(SettingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return user settings when they exist', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue(
        mockSettingsResponse,
      );

      const result = await controller.getSettings(mockUserId);

      expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual(mockSettingsResponse);
    });

    it('should return empty array when user has no settings', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue([]);

      const result = await controller.getSettings(mockUserId);

      expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual([]);
    });

    it('should call service with correct userId', async () => {
      const differentUserId = 'different-user-456';
      mockSettingsService.getUserSettings.mockResolvedValue([]);

      await controller.getSettings(differentUserId);

      expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith(
        differentUserId,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockSettingsService.getUserSettings.mockRejectedValue(error);

      await expect(controller.getSettings(mockUserId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockSettingsService.getUserSettings).toHaveBeenCalledWith(
        mockUserId,
      );
    });
  });

  describe('updateSettings', () => {
    it('should update user settings successfully', async () => {
      mockSettingsService.updateSettings.mockResolvedValue(mockSettingsData);

      const result = await controller.updateSettings(
        mockUserId,
        mockSettingsData,
      );

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        mockUserId,
        JSON.stringify(mockSettingsData),
      );
      expect(result).toEqual(mockSettingsData);
    });

    it('should handle different settings data correctly', async () => {
      const newSettingsData: SettingsData = {
        temperatureUnit: 'celsius',
        grassType: 'cool',
        lawnSize: 8000,
        location: {
          address: '456 Oak Ave, Seattle, WA',
          lat: 47.6062,
          long: -122.3321,
        },
        entryView: 'list',
        hideSystemProducts: true,
        hiddenWidgets: [],
        widgetOrder: [],
        mobileNavbarItems: [],
      };

      mockSettingsService.updateSettings.mockResolvedValue(newSettingsData);

      const result = await controller.updateSettings(
        mockUserId,
        newSettingsData,
      );

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        mockUserId,
        JSON.stringify(newSettingsData),
      );
      expect(result).toEqual(newSettingsData);
    });

    it('should call service with correct userId', async () => {
      const differentUserId = 'different-user-789';
      mockSettingsService.updateSettings.mockResolvedValue(mockSettingsData);

      await controller.updateSettings(differentUserId, mockSettingsData);

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        differentUserId,
        JSON.stringify(mockSettingsData),
      );
    });

    it('should properly stringify settings data before passing to service', async () => {
      const complexSettingsData: SettingsData = {
        temperatureUnit: 'fahrenheit',
        grassType: 'warm',
        lawnSize: 12000,
        location: {
          address: 'Complex Address with Special Characters !@#$%',
          lat: 40.7128,
          long: -74.006,
        },
        entryView: 'calendar',
        hideSystemProducts: false,
        hiddenWidgets: [],
        widgetOrder: [],
        mobileNavbarItems: [],
      };

      mockSettingsService.updateSettings.mockResolvedValue(complexSettingsData);

      await controller.updateSettings(mockUserId, complexSettingsData);

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        mockUserId,
        JSON.stringify(complexSettingsData),
      );
    });

    it('should handle minimal settings data', async () => {
      const minimalSettingsData: SettingsData = {
        temperatureUnit: 'celsius',
        grassType: 'cool',
        lawnSize: 1000,
        location: {
          address: 'Minimal Address',
          lat: 0,
          long: 0,
        },
        entryView: 'list',
        hideSystemProducts: true,
        hiddenWidgets: [],
        widgetOrder: [],
        mobileNavbarItems: [],
      };

      mockSettingsService.updateSettings.mockResolvedValue(minimalSettingsData);

      const result = await controller.updateSettings(
        mockUserId,
        minimalSettingsData,
      );

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        mockUserId,
        JSON.stringify(minimalSettingsData),
      );
      expect(result).toEqual(minimalSettingsData);
    });

    it('should handle service errors during update', async () => {
      const error = new Error('Update operation failed');
      mockSettingsService.updateSettings.mockRejectedValue(error);

      await expect(
        controller.updateSettings(mockUserId, mockSettingsData),
      ).rejects.toThrow('Update operation failed');

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        mockUserId,
        JSON.stringify(mockSettingsData),
      );
    });

    it('should handle settings with special location coordinates', async () => {
      const specialLocationSettings: SettingsData = {
        temperatureUnit: 'fahrenheit',
        grassType: 'warm',
        lawnSize: 7500,
        location: {
          address: 'Greenwich Observatory, London, UK',
          lat: 51.4769,
          long: -0.0005,
        },
        entryView: 'calendar',
        hideSystemProducts: false,
        hiddenWidgets: [],
        widgetOrder: [],
        mobileNavbarItems: [],
      };

      mockSettingsService.updateSettings.mockResolvedValue(
        specialLocationSettings,
      );

      const result = await controller.updateSettings(
        mockUserId,
        specialLocationSettings,
      );

      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(
        mockUserId,
        JSON.stringify(specialLocationSettings),
      );
      expect(result).toEqual(specialLocationSettings);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle service returning null/undefined', async () => {
      mockSettingsService.getUserSettings.mockResolvedValue(null);

      const result = await controller.getSettings(mockUserId);

      expect(result).toBeNull();
    });

    it('should verify JSON.stringify is called correctly in updateSettings', async () => {
      const jsonStringifySpy = jest.spyOn(JSON, 'stringify');
      mockSettingsService.updateSettings.mockResolvedValue(mockSettingsData);

      await controller.updateSettings(mockUserId, mockSettingsData);

      expect(jsonStringifySpy).toHaveBeenCalledWith(mockSettingsData);

      jsonStringifySpy.mockRestore();
    });
  });
});
