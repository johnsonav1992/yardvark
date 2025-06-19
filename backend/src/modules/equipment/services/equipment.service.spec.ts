import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipmentService } from './equipment.service';
import { Equipment } from '../models/equipment.model';
import { EquipmentMaintenance } from '../models/equipmentMaintenance.model';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let equipmentRepository: Repository<Equipment>;
  let maintenanceRepository: Repository<EquipmentMaintenance>;

  const mockEquipmentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockMaintenanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
    equipmentRepository = module.get<Repository<Equipment>>(
      getRepositoryToken(Equipment),
    );
    maintenanceRepository = module.get<Repository<EquipmentMaintenance>>(
      getRepositoryToken(EquipmentMaintenance),
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
