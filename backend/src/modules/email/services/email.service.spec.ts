import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService, FeedbackEmailData } from './email.service';

jest.mock('mailersend', () => {
  return {
    MailerSend: jest.fn().mockImplementation(() => ({
      email: {
        send: jest.fn(),
      },
    })),
    EmailParams: jest.fn().mockImplementation(() => ({
      setFrom: jest.fn().mockReturnThis(),
      setTo: jest.fn().mockReturnThis(),
      setSubject: jest.fn().mockReturnThis(),
      setHtml: jest.fn().mockReturnThis(),
      setReplyTo: jest.fn().mockReturnThis(),
    })),
    Sender: jest.fn().mockImplementation((email, name) => ({ email, name })),
    Recipient: jest.fn().mockImplementation((email, name) => ({ email, name })),
  };
});

describe('EmailService', () => {
  let service: EmailService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockFeedbackData: FeedbackEmailData = {
    name: 'Test User',
    email: 'testuser@example.com',
    message: 'This is a test feedback message',
    feedbackType: 'general',
  };

  const mockFeedbackDataWithOptionalFields: FeedbackEmailData = {
    name: 'Test User',
    email: 'testuser@example.com',
    message: 'This is a test feedback message with optional fields',
    feedbackType: 'bug',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    url: 'https://yardvark.app/dashboard',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockReturnValue('test-api-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize with valid API key', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('MAILERSEND_API_KEY');
      expect(service).toBeDefined();
    });

    it('should not initialize when API key is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const uninitializedService = module.get<EmailService>(EmailService);

      const result =
        await uninitializedService.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });

    it('should not initialize when API key is empty string', async () => {
      mockConfigService.get.mockReturnValue('');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const uninitializedService = module.get<EmailService>(EmailService);

      const result =
        await uninitializedService.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });
  });

  describe('sendFeedbackEmail', () => {
    it('should send feedback email successfully with basic data', async () => {
      const result = await service.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(true);
    });

    it('should send feedback email successfully with all optional fields', async () => {
      const result = await service.sendFeedbackEmail(
        mockFeedbackDataWithOptionalFields,
      );

      expect(result).toBe(true);
    });

    it('should handle general feedback type', async () => {
      const generalFeedback: FeedbackEmailData = {
        ...mockFeedbackData,
        feedbackType: 'general',
      };

      const result = await service.sendFeedbackEmail(generalFeedback);

      expect(result).toBe(true);
    });

    it('should handle bug feedback type', async () => {
      const bugFeedback: FeedbackEmailData = {
        ...mockFeedbackData,
        feedbackType: 'bug',
      };

      const result = await service.sendFeedbackEmail(bugFeedback);

      expect(result).toBe(true);
    });

    it('should handle enhancement feedback type', async () => {
      const enhancementFeedback: FeedbackEmailData = {
        ...mockFeedbackData,
        feedbackType: 'enhancement',
      };

      const result = await service.sendFeedbackEmail(enhancementFeedback);

      expect(result).toBe(true);
    });

    it('should return false when service is not initialized', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const uninitializedService = module.get<EmailService>(EmailService);

      const result =
        await uninitializedService.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });

    it('should handle feedback with special characters in message', async () => {
      const specialCharsFeedback: FeedbackEmailData = {
        ...mockFeedbackData,
        message: 'Test message with special chars: <script>alert("xss")</script>',
      };

      const result = await service.sendFeedbackEmail(specialCharsFeedback);

      expect(result).toBe(true);
    });

    it('should handle feedback with long message', async () => {
      const longMessage = 'A'.repeat(5000);
      const longMessageFeedback: FeedbackEmailData = {
        ...mockFeedbackData,
        message: longMessage,
      };

      const result = await service.sendFeedbackEmail(longMessageFeedback);

      expect(result).toBe(true);
    });

    it('should handle feedback with unicode characters', async () => {
      const unicodeFeedback: FeedbackEmailData = {
        name: 'Test User 日本語',
        email: 'testuser@example.com',
        message: 'Feedback with emojis 🌱🏡 and special characters: é, ñ, ü',
        feedbackType: 'general',
      };

      const result = await service.sendFeedbackEmail(unicodeFeedback);

      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return false when MailerSend throws an error', async () => {
      const { MailerSend } = jest.requireMock('mailersend');
      MailerSend.mockImplementationOnce(() => ({
        email: {
          send: jest.fn().mockRejectedValue(new Error('MailerSend API error')),
        },
      }));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue('test-api-key') },
          },
        ],
      }).compile();

      const serviceWithError = module.get<EmailService>(EmailService);

      const result = await serviceWithError.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      const { MailerSend } = jest.requireMock('mailersend');
      MailerSend.mockImplementationOnce(() => ({
        email: {
          send: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      }));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue('test-api-key') },
          },
        ],
      }).compile();

      const serviceWithError = module.get<EmailService>(EmailService);

      const result = await serviceWithError.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });
  });
});
