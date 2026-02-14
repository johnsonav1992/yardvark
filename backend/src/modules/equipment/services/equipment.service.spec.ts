import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { Equipment } from '../models/equipment.model';
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';
import {
  EquipmentNotFound,
  MaintenanceRecordNotFound,
} from '../models/equipment.errors';

describe('EquipmentService', () => {
  let service: EquipmentService;

  const mockUserId = 'user-123';

  const mockEquipment = {
    id: 1,
    userId: mockUserId,
    name: 'Honda HRX217',
    brand: 'Honda',
    model: 'HRX217',
    description: 'Self-propelled mower',
    purchaseDate: new Date('2023-01-15'),
    isActive: true,
    maintenanceRecords: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Equipment;

  const mockMaintenanceRecord = {
    id: 1,
    maintenanceDate: new Date('2024-06-01'),
    notes: 'Changed oil and filter',
    cost: 25.99,
    equipment: mockEquipment,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as EquipmentMaintenance;

  const mockEquipmentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockMaintenanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
        {
          provide: getRepositoryToken(EquipmentMaintenance),
          useValue: mockMaintenanceRepository,
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUserEquipment', () => {
    it('should return all equipment for a user', async () => {
      const equipmentList = [
        mockEquipment,
        { ...mockEquipment, id: 2, name: 'Echo Trimmer' },
      ];
      mockEquipmentRepository.find.mockResolvedValue(equipmentList);

      const result = await service.getAllUserEquipment(mockUserId);

      expect(mockEquipmentRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        relations: { maintenanceRecords: true },
        order: {
          maintenanceRecords: {
            maintenanceDate: 'DESC',
          },
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Honda HRX217');
    });

    it('should return empty array when user has no equipment', async () => {
      mockEquipmentRepository.find.mockResolvedValue([]);

      const result = await service.getAllUserEquipment(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('createEquipment', () => {
    it('should create new equipment', async () => {
      const equipmentData = {
        name: 'Honda HRX217',
        brand: 'Honda',
        model: 'HRX217',
      };

      mockEquipmentRepository.create.mockReturnValue(mockEquipment);
      mockEquipmentRepository.save.mockResolvedValue(mockEquipment);

      const result = await service.createEquipment(mockUserId, equipmentData);

      expect(mockEquipmentRepository.create).toHaveBeenCalledWith({
        ...equipmentData,
        maintenanceRecords: [],
        userId: mockUserId,
      });
      expect(mockEquipmentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockEquipment);
    });

    it('should create equipment with minimal data', async () => {
      const equipmentData = { name: 'Basic Tool' };

      mockEquipmentRepository.create.mockReturnValue({
        ...mockEquipment,
        ...equipmentData,
      });
      mockEquipmentRepository.save.mockResolvedValue({
        ...mockEquipment,
        ...equipmentData,
      });

      const result = await service.createEquipment(mockUserId, equipmentData);

      expect(result.name).toBe('Basic Tool');
    });
  });

  describe('updateEquipment', () => {
    it('should update existing equipment', async () => {
      const updateData = { name: 'Updated Name', notes: 'Updated notes' };
      const updatedEquipment = { ...mockEquipment, ...updateData };

      mockEquipmentRepository.findOne.mockResolvedValue(mockEquipment);
      mockEquipmentRepository.save.mockResolvedValue(updatedEquipment);

      const result = await service.updateEquipment(1, updateData);

      expect(mockEquipmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockEquipmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockEquipment,
          ...updateData,
          updatedAt: expect.any(Date),
        }),
      );
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toEqual(
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should return EquipmentNotFound when equipment does not exist', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue(null);

      const result = await service.updateEquipment(999, { name: 'Test' });

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(EquipmentNotFound);
    });
  });

  describe('toggleEquipmentArchiveStatus', () => {
    it('should archive equipment (set isActive to false)', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue({
        ...mockEquipment,
        isActive: true,
      });
      mockEquipmentRepository.save.mockResolvedValue({
        ...mockEquipment,
        isActive: false,
      });

      const result = await service.toggleEquipmentArchiveStatus(1, false);

      expect(mockEquipmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(result.isSuccess()).toBe(true);
    });

    it('should unarchive equipment (set isActive to true)', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue({
        ...mockEquipment,
        isActive: false,
      });
      mockEquipmentRepository.save.mockResolvedValue({
        ...mockEquipment,
        isActive: true,
      });

      const result = await service.toggleEquipmentArchiveStatus(1, true);

      expect(mockEquipmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
      expect(result.isSuccess()).toBe(true);
    });

    it('should return EquipmentNotFound when equipment does not exist', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue(null);

      const result = await service.toggleEquipmentArchiveStatus(999, false);

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(EquipmentNotFound);
    });
  });

  describe('createMaintenanceRecord', () => {
    it('should create a new maintenance record', async () => {
      const maintenanceData = {
        maintenanceDate: new Date('2024-06-01'),
        notes: 'Changed oil and filter',
        cost: 25.99,
      };

      mockEquipmentRepository.findOne.mockResolvedValue(mockEquipment);
      mockMaintenanceRepository.create.mockReturnValue(mockMaintenanceRecord);
      mockMaintenanceRepository.save.mockResolvedValue(mockMaintenanceRecord);

      const result = await service.createMaintenanceRecord(1, maintenanceData);

      expect(mockEquipmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockMaintenanceRepository.create).toHaveBeenCalledWith({
        ...maintenanceData,
        equipment: { id: 1 },
      });
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toEqual(mockMaintenanceRecord);
    });

    it('should return EquipmentNotFound when equipment does not exist', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue(null);

      const result = await service.createMaintenanceRecord(999, {
        notes: 'Test maintenance',
      });

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(EquipmentNotFound);
    });
  });

  describe('updateMaintenanceRecord', () => {
    it('should update an existing maintenance record', async () => {
      const updateData = { notes: 'Updated notes', cost: 30.0 };
      const updatedRecord = { ...mockMaintenanceRecord, ...updateData };

      mockMaintenanceRepository.findOne.mockResolvedValue(
        mockMaintenanceRecord,
      );
      mockMaintenanceRepository.save.mockResolvedValue(updatedRecord);

      const result = await service.updateMaintenanceRecord(1, updateData);

      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockMaintenanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockMaintenanceRecord,
          ...updateData,
          updatedAt: expect.any(Date),
        }),
      );
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toEqual(
        expect.objectContaining({ notes: 'Updated notes' }),
      );
    });

    it('should return MaintenanceRecordNotFound when maintenance record does not exist', async () => {
      mockMaintenanceRepository.findOne.mockResolvedValue(null);

      const result = await service.updateMaintenanceRecord(999, {
        notes: 'Test',
      });

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(MaintenanceRecordNotFound);
    });
  });

  describe('deleteEquipment', () => {
    it('should soft delete equipment', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue(mockEquipment);
      mockEquipmentRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteEquipment(1);

      expect(mockEquipmentRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result.isSuccess()).toBe(true);
    });

    it('should return EquipmentNotFound when equipment does not exist', async () => {
      mockEquipmentRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteEquipment(999);

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(EquipmentNotFound);
    });
  });

  describe('deleteMaintenanceRecord', () => {
    it('should soft delete a maintenance record', async () => {
      mockMaintenanceRepository.findOne.mockResolvedValue(
        mockMaintenanceRecord,
      );
      mockMaintenanceRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMaintenanceRecord(1);

      expect(mockMaintenanceRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result.isSuccess()).toBe(true);
    });

    it('should return MaintenanceRecordNotFound when maintenance record does not exist', async () => {
      mockMaintenanceRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteMaintenanceRecord(999);

      expect(result.isError()).toBe(true);
      expect(result.value).toBeInstanceOf(MaintenanceRecordNotFound);
    });
  });
});
