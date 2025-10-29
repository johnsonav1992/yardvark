import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { LawnSegmentsService } from '../services/lawn-segments.service';
import { LawnSegment } from '../models/lawn-segments.model';
import { LawnSegmentCreationRequest } from '../models/lawn-segments.types';

describe('LawnSegmentsService', () => {
  let service: LawnSegmentsService;
  let repository: Repository<LawnSegment>;

  const mockRepository = {
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockLawnSegmentCreationRequest: LawnSegmentCreationRequest = {
    name: 'Front Yard',
    size: 2500.5,
    coordinates: null,
    color: '#3388ff',
  };

  const mockLawnSegment: LawnSegment = {
    id: 1,
    userId: 'user-123',
    name: 'Front Yard',
    size: 2500.5,
    coordinates: null,
    color: '#3388ff',
    entries: [],
  };

  const mockLawnSegments: LawnSegment[] = [
    mockLawnSegment,
    {
      id: 2,
      userId: 'user-123',
      name: 'Back Yard',
      size: 3200.75,
      coordinates: null,
      color: '#3388ff',
      entries: [],
    },
    {
      id: 3,
      userId: 'user-123',
      name: 'Side Yard',
      size: 800.25,
      coordinates: null,
      color: '#3388ff',
      entries: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LawnSegmentsService,
        {
          provide: getRepositoryToken(LawnSegment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LawnSegmentsService>(LawnSegmentsService);
    repository = module.get<Repository<LawnSegment>>(
      getRepositoryToken(LawnSegment),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLawnSegments', () => {
    it('should return lawn segments for a user', async () => {
      mockRepository.findBy.mockResolvedValue(mockLawnSegments);

      const result = await service.getLawnSegments('user-123');

      expect(mockRepository.findBy).toHaveBeenCalledWith({
        userId: 'user-123',
      });
      expect(result).toEqual(mockLawnSegments);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when user has no lawn segments', async () => {
      mockRepository.findBy.mockResolvedValue([]);

      const result = await service.getLawnSegments('user-456');

      expect(mockRepository.findBy).toHaveBeenCalledWith({
        userId: 'user-456',
      });
      expect(result).toEqual([]);
    });

    it('should handle different user IDs correctly', async () => {
      const user2Segments = [
        {
          id: 4,
          userId: 'user-456',
          name: 'Garden',
          size: 1500.0,
          entries: [],
        },
      ];

      mockRepository.findBy.mockResolvedValue(user2Segments);

      const result = await service.getLawnSegments('user-456');

      expect(mockRepository.findBy).toHaveBeenCalledWith({
        userId: 'user-456',
      });
      expect(result).toEqual(user2Segments);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findBy.mockRejectedValue(error);

      await expect(service.getLawnSegments('user-123')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('createLawnSegment', () => {
    it('should create a new lawn segment successfully', async () => {
      const createdSegment = {
        ...mockLawnSegmentCreationRequest,
        userId: 'user-123',
      };
      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockResolvedValue(mockLawnSegment);

      const result = await service.createLawnSegment(
        'user-123',
        mockLawnSegmentCreationRequest,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...mockLawnSegmentCreationRequest,
        userId: 'user-123',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdSegment);
      expect(result).toEqual(mockLawnSegment);
    });

    it('should handle different lawn segment data', async () => {
      const differentSegmentRequest: LawnSegmentCreationRequest = {
        name: 'Pool Area',
        size: 750.25,
        coordinates: null,
        color: '#3388ff',
      };

      const expectedCreated = {
        ...differentSegmentRequest,
        userId: 'user-456',
      };
      const expectedSaved = {
        id: 5,
        userId: 'user-456',
        name: 'Pool Area',
        size: 750.25,
        coordinates: null,
        color: '#3388ff',
        entries: [],
      };

      mockRepository.create.mockReturnValue(expectedCreated);
      mockRepository.save.mockResolvedValue(expectedSaved);

      const result = await service.createLawnSegment(
        'user-456',
        differentSegmentRequest,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(expectedCreated);
      expect(result).toEqual(expectedSaved);
    });

    it('should handle large lawn segment sizes', async () => {
      const largeSegmentRequest: LawnSegmentCreationRequest = {
        name: 'Main Lawn',
        size: 50000.99,
        coordinates: null,
        color: '#3388ff',
      };

      const createdSegment = { ...largeSegmentRequest, userId: 'user-123' };
      const savedSegment = {
        id: 6,
        userId: 'user-123',
        name: 'Main Lawn',
        size: 50000.99,
        coordinates: null,
        color: '#3388ff',
        entries: [],
      };

      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockResolvedValue(savedSegment);

      const result = await service.createLawnSegment(
        'user-123',
        largeSegmentRequest,
      );

      expect(result.size).toBe(50000.99);
    });

    it('should handle small lawn segment sizes with decimals', async () => {
      const smallSegmentRequest: LawnSegmentCreationRequest = {
        name: 'Flower Bed',
        size: 25.75,
        coordinates: null,
        color: '#3388ff',
      };

      const createdSegment = { ...smallSegmentRequest, userId: 'user-123' };
      const savedSegment = {
        id: 7,
        userId: 'user-123',
        name: 'Flower Bed',
        size: 25.75,
        coordinates: null,
        color: '#3388ff',
        entries: [],
      };

      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockResolvedValue(savedSegment);

      const result = await service.createLawnSegment(
        'user-123',
        smallSegmentRequest,
      );

      expect(result.size).toBe(25.75);
    });

    it('should handle special characters in lawn segment names', async () => {
      const specialNameRequest: LawnSegmentCreationRequest = {
        name: "Bob's Corner Lot #1",
        size: 1200.5,
        coordinates: null,
        color: '#3388ff',
      };

      const createdSegment = { ...specialNameRequest, userId: 'user-123' };
      const savedSegment = {
        id: 8,
        userId: 'user-123',
        name: "Bob's Corner Lot #1",
        size: 1200.5,
        coordinates: null,
        color: '#3388ff',
        entries: [],
      };

      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockResolvedValue(savedSegment);

      const result = await service.createLawnSegment(
        'user-123',
        specialNameRequest,
      );

      expect(result.name).toBe("Bob's Corner Lot #1");
    });

    it('should handle repository create errors', async () => {
      const error = new Error('Create operation failed');
      mockRepository.create.mockImplementation(() => {
        throw error;
      });

      await expect(
        service.createLawnSegment('user-123', mockLawnSegmentCreationRequest),
      ).rejects.toThrow('Create operation failed');
    });

    it('should handle repository save errors', async () => {
      const createdSegment = {
        ...mockLawnSegmentCreationRequest,
        userId: 'user-123',
      };
      const error = new Error('Save operation failed');

      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockRejectedValue(error);

      await expect(
        service.createLawnSegment('user-123', mockLawnSegmentCreationRequest),
      ).rejects.toThrow('Save operation failed');
    });
  });

  describe('updateLawnSegment', () => {
    it('should update an existing lawn segment successfully', async () => {
      const updatedSegment = {
        ...mockLawnSegment,
        name: 'Updated Front Yard',
        size: 2800.75,
      };

      mockRepository.save.mockResolvedValue(updatedSegment);

      const result = await service.updateLawnSegment(updatedSegment);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedSegment);
      expect(result).toEqual(updatedSegment);
    });

    it('should handle updating different properties', async () => {
      const sizeOnlyUpdate = {
        ...mockLawnSegment,
        size: 3000.0,
      };

      mockRepository.save.mockResolvedValue(sizeOnlyUpdate);

      const result = await service.updateLawnSegment(sizeOnlyUpdate);

      expect(result.size).toBe(3000.0);
      expect(result.name).toBe(mockLawnSegment.name);
    });

    it('should handle name-only updates', async () => {
      const nameOnlyUpdate = {
        ...mockLawnSegment,
        name: 'Renamed Segment',
      };

      mockRepository.save.mockResolvedValue(nameOnlyUpdate);

      const result = await service.updateLawnSegment(nameOnlyUpdate);

      expect(result.name).toBe('Renamed Segment');
      expect(result.size).toBe(mockLawnSegment.size);
    });

    it('should preserve userId and id during updates', async () => {
      const updatedSegment = {
        ...mockLawnSegment,
        name: 'New Name',
        size: 4000.5,
      };

      mockRepository.save.mockResolvedValue(updatedSegment);

      const result = await service.updateLawnSegment(updatedSegment);

      expect(result.id).toBe(mockLawnSegment.id);
      expect(result.userId).toBe(mockLawnSegment.userId);
    });

    it('should handle repository save errors during update', async () => {
      const error = new Error('Update operation failed');
      mockRepository.save.mockRejectedValue(error);

      await expect(service.updateLawnSegment(mockLawnSegment)).rejects.toThrow(
        'Update operation failed',
      );
    });

    it('should handle updating with zero size', async () => {
      const zeroSizeSegment = {
        ...mockLawnSegment,
        size: 0,
      };

      mockRepository.save.mockResolvedValue(zeroSizeSegment);

      const result = await service.updateLawnSegment(zeroSizeSegment);

      expect(result.size).toBe(0);
    });
  });

  describe('deleteLawnSegment', () => {
    it('should delete a lawn segment successfully', async () => {
      const deleteResult: DeleteResult = {
        affected: 1,
        raw: {},
      };

      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteLawnSegment(1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(deleteResult);
      expect(result.affected).toBe(1);
    });

    it('should handle deleting different segment IDs', async () => {
      const deleteResult: DeleteResult = {
        affected: 1,
        raw: {},
      };

      mockRepository.delete.mockResolvedValue(deleteResult);

      await service.deleteLawnSegment(42);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 42 });
    });

    it('should handle deleting non-existent segments', async () => {
      const deleteResult: DeleteResult = {
        affected: 0,
        raw: {},
      };

      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteLawnSegment(999);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 999 });
      expect(result.affected).toBe(0);
    });

    it('should handle repository delete errors', async () => {
      const error = new Error('Delete operation failed');
      mockRepository.delete.mockRejectedValue(error);

      await expect(service.deleteLawnSegment(1)).rejects.toThrow(
        'Delete operation failed',
      );
    });

    it('should handle deleting with negative IDs', async () => {
      const deleteResult: DeleteResult = {
        affected: 0,
        raw: {},
      };

      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.deleteLawnSegment(-1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: -1 });
      expect(result.affected).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined user IDs in getLawnSegments', async () => {
      mockRepository.findBy.mockResolvedValue([]);

      const result = await service.getLawnSegments(null as never);

      expect(mockRepository.findBy).toHaveBeenCalledWith({ userId: null });
      expect(result).toEqual([]);
    });

    it('should handle empty string user IDs', async () => {
      mockRepository.findBy.mockResolvedValue([]);

      const result = await service.getLawnSegments('');

      expect(mockRepository.findBy).toHaveBeenCalledWith({ userId: '' });
      expect(result).toEqual([]);
    });

    it('should handle creating segments with empty names', async () => {
      const emptyNameRequest: LawnSegmentCreationRequest = {
        name: '',
        size: 100.0,
        coordinates: null,
        color: '#3388ff',
      };

      const createdSegment = { ...emptyNameRequest, userId: 'user-123' };
      const savedSegment = {
        id: 9,
        userId: 'user-123',
        name: '',
        size: 100.0,
        coordinates: null,
        color: '#3388ff',
        entries: [],
      };

      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockResolvedValue(savedSegment);

      const result = await service.createLawnSegment(
        'user-123',
        emptyNameRequest,
      );

      expect(result.name).toBe('');
    });

    it('should handle very long lawn segment names', async () => {
      const longName = 'A'.repeat(1000);
      const longNameRequest: LawnSegmentCreationRequest = {
        name: longName,
        size: 500.0,
        coordinates: null,
        color: '#3388ff',
      };

      const createdSegment = { ...longNameRequest, userId: 'user-123' };
      const savedSegment = {
        id: 10,
        userId: 'user-123',
        name: longName,
        size: 500.0,
        coordinates: null,
        color: '#3388ff',
        entries: [],
      };

      mockRepository.create.mockReturnValue(createdSegment);
      mockRepository.save.mockResolvedValue(savedSegment);

      const result = await service.createLawnSegment(
        'user-123',
        longNameRequest,
      );

      expect(result.name).toBe(longName);
      expect(result.name.length).toBe(1000);
    });
  });
});
