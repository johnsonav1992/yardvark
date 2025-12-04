import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from '../controllers/entries.controller';
import { EntriesService } from '../services/entries.service';

describe('EntriesController', () => {
  let controller: EntriesController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: EntriesService;

  const mockEntriesService = {
    getEntries: jest.fn(),
    getEntry: jest.fn(),
    createEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    searchEntries: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
    service = module.get<EntriesService>(EntriesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
