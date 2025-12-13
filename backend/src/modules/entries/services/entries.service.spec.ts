import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntriesService } from '../services/entries.service';
import { Entry, EntryProduct, EntryImage } from '../models/entries.model';

describe('EntriesService', () => {
  let service: EntriesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let entryRepository: Repository<Entry>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let entryProductRepository: Repository<EntryProduct>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let entryImageRepository: Repository<EntryImage>;

  const mockEntryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
  };

  const mockEntryProductRepository = {
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockEntryImageRepository = {
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        {
          provide: getRepositoryToken(Entry),
          useValue: mockEntryRepository,
        },
        {
          provide: getRepositoryToken(EntryProduct),
          useValue: mockEntryProductRepository,
        },
        {
          provide: getRepositoryToken(EntryImage),
          useValue: mockEntryImageRepository,
        },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
    entryRepository = module.get<Repository<Entry>>(getRepositoryToken(Entry));
    entryProductRepository = module.get<Repository<EntryProduct>>(
      getRepositoryToken(EntryProduct),
    );
    entryImageRepository = module.get<Repository<EntryImage>>(
      getRepositoryToken(EntryImage),
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
