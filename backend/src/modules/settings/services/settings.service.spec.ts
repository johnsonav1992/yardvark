import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { Settings } from '../models/settings.model';
import { SettingsData } from '../models/settings.types';

describe('SettingsService', () => {
  let service: SettingsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<Settings>;

  const mockRepository = {
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
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

  const mockSettings: Settings = {
    id: 1,
    userId: 'user-123',
    value: JSON.stringify(mockSettingsData),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Settings),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repository = module.get<Repository<Settings>>(getRepositoryToken(Settings));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserSettings', () => {
    it('should return user settings when they exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockSettings);

      const result = await service.getUserSettings('user-123');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-123',
      });
      expect(result).toEqual({
        id: 1,
        userId: 'user-123',
        value: mockSettingsData,
      });
    });

    it('should return empty array when user settings do not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getUserSettings('user-123');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        userId: 'user-123',
      });
      expect(result).toEqual([]);
    });

    it('should handle settings with undefined value by throwing an error', async () => {
      const settingsWithoutValue = { ...mockSettings, value: undefined };
      mockRepository.findOneBy.mockResolvedValue(settingsWithoutValue);

      await expect(service.getUserSettings('user-123')).rejects.toThrow();
    });

    it('should parse JSON settings value correctly', async () => {
      const complexSettingsData = {
        ...mockSettingsData,
        location: {
          address: 'Complex Address, New York, NY',
          lat: 40.7128,
          long: -74.006,
        },
      };
      const settingsWithComplexData = {
        ...mockSettings,
        value: JSON.stringify(complexSettingsData),
      };
      mockRepository.findOneBy.mockResolvedValue(settingsWithComplexData);

      const result = await service.getUserSettings('user-123');

      expect(result).toEqual({
        id: 1,
        userId: 'user-123',
        value: complexSettingsData,
      });
    });
  });

  describe('updateSettings', () => {
    const stringifiedSettings = JSON.stringify(mockSettingsData);

    it('should update existing user settings', async () => {
      mockRepository.findBy.mockResolvedValue([mockSettings]);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateSettings(
        'user-123',
        stringifiedSettings,
      );

      expect(mockRepository.findBy).toHaveBeenCalledWith({
        userId: 'user-123',
      });
      expect(mockRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        { value: stringifiedSettings },
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockSettingsData);
    });

    it('should create new settings when user has no existing settings', async () => {
      mockRepository.findBy.mockResolvedValue([]);
      mockRepository.save.mockResolvedValue(mockSettings);

      const result = await service.updateSettings(
        'user-123',
        stringifiedSettings,
      );

      expect(mockRepository.findBy).toHaveBeenCalledWith({
        userId: 'user-123',
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        value: stringifiedSettings,
        userId: 'user-123',
      });
      expect(mockRepository.update).not.toHaveBeenCalled();
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
      const newStringifiedSettings = JSON.stringify(newSettingsData);

      mockRepository.findBy.mockResolvedValue([mockSettings]);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateSettings(
        'user-456',
        newStringifiedSettings,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        { userId: 'user-456' },
        { value: newStringifiedSettings },
      );
      expect(result).toEqual(newSettingsData);
    });

    it('should handle partial settings updates correctly', async () => {
      const partialSettingsData: SettingsData = {
        ...mockSettingsData,
        temperatureUnit: 'celsius',
        lawnSize: 3000,
      };
      const partialStringifiedSettings = JSON.stringify(partialSettingsData);

      mockRepository.findBy.mockResolvedValue([mockSettings]);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateSettings(
        'user-123',
        partialStringifiedSettings,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        { value: partialStringifiedSettings },
      );
      expect(result).toEqual(partialSettingsData);
    });

    it('should handle empty settings array when checking for existing settings', async () => {
      mockRepository.findBy.mockResolvedValue([]);
      mockRepository.save.mockResolvedValue(mockSettings);

      const result = await service.updateSettings(
        'new-user',
        stringifiedSettings,
      );

      expect(mockRepository.save).toHaveBeenCalledWith({
        value: stringifiedSettings,
        userId: 'new-user',
      });
      expect(result).toEqual(mockSettingsData);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in getUserSettings', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findOneBy.mockRejectedValue(error);

      await expect(service.getUserSettings('user-123')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in updateSettings', async () => {
      const error = new Error('Database update failed');
      mockRepository.findBy.mockRejectedValue(error);

      await expect(
        service.updateSettings('user-123', JSON.stringify(mockSettingsData)),
      ).rejects.toThrow('Database update failed');
    });

    it('should handle invalid JSON in updateSettings', async () => {
      mockRepository.findBy.mockResolvedValue([mockSettings]);

      await expect(
        service.updateSettings('user-123', 'invalid-json' as never),
      ).rejects.toThrow();
    });
  });
});
