import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { EmbeddingService } from './embedding.service';
import { EntriesService } from '../../entries/services/entries.service';

describe('AiService', () => {
  let service: AiService;
  let geminiService: GeminiService;
  let embeddingService: EmbeddingService;
  let entriesService: EntriesService;

  beforeEach(async () => {
    const mockGeminiService = {
      simpleChat: jest.fn(),
      chatWithSystem: jest.fn(),
      streamChatWithSystem: jest.fn(),
    };

    const mockEmbeddingService = {
      generateEmbedding: jest.fn(),
      embedEntry: jest.fn(),
    };

    const mockEntriesService = {
      searchEntriesByVector: jest.fn(),
      getEntriesWithoutEmbeddings: jest.fn(),
      updateEntryEmbedding: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
        {
          provide: EmbeddingService,
          useValue: mockEmbeddingService,
        },
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    geminiService = module.get<GeminiService>(GeminiService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
    entriesService = module.get<EntriesService>(EntriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should return success with chat response', async () => {
      const mockResponse = {
        content: 'Test response',
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      };

      jest.spyOn(geminiService, 'simpleChat').mockResolvedValue(mockResponse);

      const result = await service.chat('test prompt');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value).toEqual(mockResponse);
      }

      expect(geminiService.simpleChat).toHaveBeenCalledWith('test prompt');
    });

    it('should return error when chat fails', async () => {
      jest
        .spyOn(geminiService, 'simpleChat')
        .mockRejectedValue(new Error('API error'));

      const result = await service.chat('test prompt');

      expect(result.isError()).toBe(true);
    });
  });

  describe('chatWithSystem', () => {
    it('should return success with chat response', async () => {
      const mockResponse = {
        content: 'System response',
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      };

      jest
        .spyOn(geminiService, 'chatWithSystem')
        .mockResolvedValue(mockResponse);

      const result = await service.chatWithSystem(
        'system prompt',
        'user prompt',
      );

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value).toEqual(mockResponse);
      }

      expect(geminiService.chatWithSystem).toHaveBeenCalledWith(
        'system prompt',
        'user prompt',
      );
    });

    it('should return error when chat fails', async () => {
      jest
        .spyOn(geminiService, 'chatWithSystem')
        .mockRejectedValue(new Error('API error'));

      const result = await service.chatWithSystem(
        'system prompt',
        'user prompt',
      );

      expect(result.isError()).toBe(true);
    });
  });

  describe('queryEntries', () => {
    it('should query entries successfully', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockEntries = [
        {
          id: 1,
          userId: 'user1',
          date: new Date('2024-01-01'),
          notes: 'Test entry',
        },
      ];
      const mockResponse = {
        content: 'Query response',
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      };

      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue(mockEmbedding);

      jest
        .spyOn(entriesService, 'searchEntriesByVector')
        .mockResolvedValue(mockEntries);

      jest
        .spyOn(geminiService, 'chatWithSystem')
        .mockResolvedValue(mockResponse);

      const result = await service.queryEntries('user1', 'what did I do?');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value).toEqual(mockResponse);
      }

      expect(embeddingService.generateEmbedding).toHaveBeenCalled();
      expect(entriesService.searchEntriesByVector).toHaveBeenCalledWith({
        userId: 'user1',
        queryEmbedding: mockEmbedding,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should return error when query fails', async () => {
      jest
        .spyOn(embeddingService, 'generateEmbedding')
        .mockRejectedValue(new Error('Embedding error'));

      const result = await service.queryEntries('user1', 'what did I do?');

      expect(result.isError()).toBe(true);
    });
  });

  describe('initializeEmbeddings', () => {
    it('should initialize embeddings successfully', async () => {
      const mockEntries = [
        {
          id: 1,
          userId: 'user1',
          date: new Date('2024-01-01'),
          notes: 'Test entry 1',
        },
        {
          id: 2,
          userId: 'user1',
          date: new Date('2024-01-02'),
          notes: 'Test entry 2',
        },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      jest
        .spyOn(entriesService, 'getEntriesWithoutEmbeddings')
        .mockResolvedValue(mockEntries);

      jest
        .spyOn(embeddingService, 'embedEntry')
        .mockResolvedValue(mockEmbedding);

      jest.spyOn(entriesService, 'updateEntryEmbedding').mockResolvedValue();

      const result = await service.initializeEmbeddings('user1');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.processed).toBe(2);
        expect(result.value.errors).toBe(0);
      }

      expect(entriesService.getEntriesWithoutEmbeddings).toHaveBeenCalledWith(
        'user1',
      );
      expect(embeddingService.embedEntry).toHaveBeenCalledTimes(2);
      expect(entriesService.updateEntryEmbedding).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during embedding processing', async () => {
      const mockEntries = [
        {
          id: 1,
          userId: 'user1',
          date: new Date('2024-01-01'),
          notes: 'Test entry 1',
        },
        {
          id: 2,
          userId: 'user1',
          date: new Date('2024-01-02'),
          notes: 'Test entry 2',
        },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      jest
        .spyOn(entriesService, 'getEntriesWithoutEmbeddings')
        .mockResolvedValue(mockEntries);

      jest
        .spyOn(embeddingService, 'embedEntry')
        .mockResolvedValueOnce(mockEmbedding)
        .mockRejectedValueOnce(new Error('Embedding error'));

      jest.spyOn(entriesService, 'updateEntryEmbedding').mockResolvedValue();

      const result = await service.initializeEmbeddings('user1');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.processed).toBe(1);
        expect(result.value.errors).toBe(1);
      }
    });

    it('should return error when initialization fails', async () => {
      jest
        .spyOn(entriesService, 'getEntriesWithoutEmbeddings')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.initializeEmbeddings('user1');

      expect(result.isError()).toBe(true);
    });
  });
});
