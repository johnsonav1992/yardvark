import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService, FeedbackEmailData } from '../services/email.service';
import { FeedbackRequest } from '../models/email.types';
import { success, error } from '../../../types/either';
import {
  EmailSendError,
  EmailNotConfigured,
} from '../models/email.errors';

describe('EmailController', () => {
  let controller: EmailController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let emailService: EmailService;

  const mockEmailService = {
    sendFeedbackEmail: jest.fn(),
  };

  const mockFeedbackRequest: FeedbackRequest = {
    name: 'Test User',
    email: 'testuser@example.com',
    message: 'This is a test feedback message',
    feedbackType: 'general',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendFeedback', () => {
    it('should return success message when email is sent successfully', async () => {
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(mockFeedbackRequest);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        mockFeedbackRequest,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should throw HttpException when email fails to send', async () => {
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        error(new EmailSendError()),
      );

      await expect(
        controller.sendFeedback(mockFeedbackRequest),
      ).rejects.toThrow(HttpException);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        mockFeedbackRequest,
      );
    });

    it('should handle general feedback type', async () => {
      const generalFeedback: FeedbackRequest = {
        ...mockFeedbackRequest,
        feedbackType: 'general',
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(generalFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        generalFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should handle bug feedback type', async () => {
      const bugFeedback: FeedbackRequest = {
        ...mockFeedbackRequest,
        feedbackType: 'bug',
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(bugFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        bugFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should handle enhancement feedback type', async () => {
      const enhancementFeedback: FeedbackRequest = {
        ...mockFeedbackRequest,
        feedbackType: 'enhancement',
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(enhancementFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        enhancementFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should pass correct email data structure to service', async () => {
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      await controller.sendFeedback(mockFeedbackRequest);

      const expectedEmailData: FeedbackEmailData = {
        name: mockFeedbackRequest.name,
        email: mockFeedbackRequest.email,
        message: mockFeedbackRequest.message,
        feedbackType: mockFeedbackRequest.feedbackType,
      };

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        expectedEmailData,
      );
    });

    it('should handle feedback with special characters', async () => {
      const specialCharsFeedback: FeedbackRequest = {
        name: 'Test <User>',
        email: 'test+special@example.com',
        message: 'Message with special chars: <>&"\'',
        feedbackType: 'general',
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(specialCharsFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        specialCharsFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should handle feedback with long message', async () => {
      const longMessageFeedback: FeedbackRequest = {
        ...mockFeedbackRequest,
        message: 'A'.repeat(5000),
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(longMessageFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        longMessageFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service unavailable');
      mockEmailService.sendFeedbackEmail.mockRejectedValue(serviceError);

      await expect(
        controller.sendFeedback(mockFeedbackRequest),
      ).rejects.toThrow('Service unavailable');
    });

    it('should handle feedback with unicode characters', async () => {
      const unicodeFeedback: FeedbackRequest = {
        name: 'Test User 日本語',
        email: 'testuser@example.com',
        message: 'Message with emojis 🌱🏡 and accents: é, ñ, ü',
        feedbackType: 'general',
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(unicodeFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        unicodeFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });

    it('should handle minimal feedback data', async () => {
      const minimalFeedback: FeedbackRequest = {
        name: 'A',
        email: 'a@b.c',
        message: 'X',
        feedbackType: 'general',
      };
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        success(true),
      );

      const result = await controller.sendFeedback(minimalFeedback);

      expect(mockEmailService.sendFeedbackEmail).toHaveBeenCalledWith(
        minimalFeedback,
      );
      expect(result).toEqual({ message: 'Feedback sent successfully' });
    });
  });

  describe('error handling and edge cases', () => {
    it('should throw HttpException when email is not configured', async () => {
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        error(new EmailNotConfigured()),
      );

      await expect(
        controller.sendFeedback(mockFeedbackRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when email send fails', async () => {
      mockEmailService.sendFeedbackEmail.mockResolvedValue(
        error(new EmailSendError()),
      );

      await expect(
        controller.sendFeedback(mockFeedbackRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockEmailService.sendFeedbackEmail.mockRejectedValue(timeoutError);

      await expect(
        controller.sendFeedback(mockFeedbackRequest),
      ).rejects.toThrow('Request timeout');
    });
  });
});
