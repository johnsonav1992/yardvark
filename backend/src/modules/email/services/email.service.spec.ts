import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService, FeedbackEmailData } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail,
});

describe('EmailService', () => {
  let service: EmailService;

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

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'GMAIL_USER') return 'test@gmail.com';
      if (key === 'GMAIL_APP_PASSWORD') return 'test-app-password';
      return undefined;
    });

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize with valid Gmail credentials', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('GMAIL_USER');
      expect(mockConfigService.get).toHaveBeenCalledWith('GMAIL_APP_PASSWORD');
      expect(service).toBeDefined();
    });

    it('should not initialize when Gmail user is missing', async () => {
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

    it('should not initialize when Gmail credentials are empty', async () => {
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
        message:
          'Test message with special chars: <script>alert("xss")</script>',
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
        message: 'Feedback with emojis and special characters',
        feedbackType: 'general',
      };

      const result = await service.sendFeedbackEmail(unicodeFeedback);

      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return false when sendMail throws an error', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await service.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.sendFeedbackEmail(mockFeedbackData);

      expect(result).toBe(false);
    });
  });
});
