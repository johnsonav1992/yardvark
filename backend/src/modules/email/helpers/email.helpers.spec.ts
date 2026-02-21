import { generateFeedbackEmailHtml } from './email.helpers';
import { FeedbackEmailData } from '../services/email.service';

describe('Email Helpers', () => {
  describe('generateFeedbackEmailHtml', () => {
    const baseFeedbackData: FeedbackEmailData = {
      name: 'Test User',
      email: 'testuser@example.com',
      message: 'This is a test feedback message',
      feedbackType: 'general',
    };

    it('should generate HTML string', () => {
      const result = generateFeedbackEmailHtml(baseFeedbackData);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include DOCTYPE declaration', () => {
      const result = generateFeedbackEmailHtml(baseFeedbackData);

      expect(result).toContain('<!DOCTYPE html>');
    });

    it('should include user name in the output', () => {
      const result = generateFeedbackEmailHtml(baseFeedbackData);

      expect(result).toContain(baseFeedbackData.name);
    });

    it('should include user email in the output', () => {
      const result = generateFeedbackEmailHtml(baseFeedbackData);

      expect(result).toContain(baseFeedbackData.email);
    });

    it('should include feedback message in the output', () => {
      const result = generateFeedbackEmailHtml(baseFeedbackData);

      expect(result).toContain(baseFeedbackData.message);
    });

    describe('feedback type styling', () => {
      it('should display general feedback with correct icon and label', () => {
        const generalFeedback: FeedbackEmailData = {
          ...baseFeedbackData,
          feedbackType: 'general',
        };

        const result = generateFeedbackEmailHtml(generalFeedback);

        expect(result).toContain('General Feedback');
        expect(result).toContain('#3b82f6'); // blue color
      });

      it('should display bug feedback with correct icon and label', () => {
        const bugFeedback: FeedbackEmailData = {
          ...baseFeedbackData,
          feedbackType: 'bug',
        };

        const result = generateFeedbackEmailHtml(bugFeedback);

        expect(result).toContain('Bug Report');
        expect(result).toContain('#ef4444'); // red color
      });

      it('should display enhancement feedback with correct icon and label', () => {
        const enhancementFeedback: FeedbackEmailData = {
          ...baseFeedbackData,
          feedbackType: 'enhancement',
        };

        const result = generateFeedbackEmailHtml(enhancementFeedback);

        expect(result).toContain('Feature Request');
        expect(result).toContain('#8b5cf6'); // purple color
      });
    });

    describe('optional fields', () => {
      it('should include URL when provided', () => {
        const feedbackWithUrl: FeedbackEmailData = {
          ...baseFeedbackData,
          url: 'https://yardvark.app/dashboard',
        };

        const result = generateFeedbackEmailHtml(feedbackWithUrl);

        expect(result).toContain('https://yardvark.app/dashboard');
        expect(result).toContain('Page URL');
      });

      it('should not include URL section when not provided', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).not.toContain('Page URL');
      });

      it('should include userAgent when provided', () => {
        const feedbackWithUserAgent: FeedbackEmailData = {
          ...baseFeedbackData,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        };

        const result = generateFeedbackEmailHtml(feedbackWithUserAgent);

        expect(result).toContain(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        );
        expect(result).toContain('Browser Info');
      });

      it('should not include userAgent section when not provided', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).not.toContain('Browser Info');
      });

      it('should include both URL and userAgent when provided', () => {
        const feedbackWithBoth: FeedbackEmailData = {
          ...baseFeedbackData,
          url: 'https://yardvark.app/settings',
          userAgent: 'Chrome/120.0.0.0',
        };

        const result = generateFeedbackEmailHtml(feedbackWithBoth);

        expect(result).toContain('https://yardvark.app/settings');
        expect(result).toContain('Page URL');
        expect(result).toContain('Chrome/120.0.0.0');
        expect(result).toContain('Browser Info');
      });
    });

    describe('HTML structure', () => {
      it('should include proper HTML tags', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain('<html>');
        expect(result).toContain('</html>');
        expect(result).toContain('<head>');
        expect(result).toContain('</head>');
        expect(result).toContain('<body>');
        expect(result).toContain('</body>');
      });

      it('should include Yardvark Feedback header', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain('Yardvark Feedback');
      });

      it('should include styling', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain('<style>');
        expect(result).toContain('</style>');
      });

      it('should include container class', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain('class="container"');
      });

      it('should include header section with green background', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain('class="header"');
        expect(result).toContain('#22c55e'); // green color
      });
    });

    describe('special characters handling', () => {
      it('should handle special characters in name', () => {
        const feedbackWithSpecialName: FeedbackEmailData = {
          ...baseFeedbackData,
          name: 'Test <User> & "Tester"',
        };

        const result = generateFeedbackEmailHtml(feedbackWithSpecialName);

        expect(result).toContain('Test <User> & "Tester"');
      });

      it('should handle special characters in message', () => {
        const feedbackWithSpecialMessage: FeedbackEmailData = {
          ...baseFeedbackData,
          message: 'Message with <script>alert("xss")</script>',
        };

        const result = generateFeedbackEmailHtml(feedbackWithSpecialMessage);

        expect(result).toContain('<script>alert("xss")</script>');
      });

      it('should handle unicode characters', () => {
        const feedbackWithUnicode: FeedbackEmailData = {
          name: 'Test User 日本語',
          email: 'testuser@example.com',
          message: 'Feedback with emojis 🌱🏡 and special characters: é, ñ, ü',
          feedbackType: 'general',
        };

        const result = generateFeedbackEmailHtml(feedbackWithUnicode);

        expect(result).toContain('Test User 日本語');
        expect(result).toContain('🌱🏡');
        expect(result).toContain('é, ñ, ü');
      });

      it('should handle newlines in message', () => {
        const feedbackWithNewlines: FeedbackEmailData = {
          ...baseFeedbackData,
          message: 'Line 1\nLine 2\nLine 3',
        };

        const result = generateFeedbackEmailHtml(feedbackWithNewlines);

        expect(result).toContain('Line 1\nLine 2\nLine 3');
      });
    });

    describe('email field formatting', () => {
      it('should format sender information correctly', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain(
          `${baseFeedbackData.name} (${baseFeedbackData.email})`,
        );
      });

      it('should include title in HTML', () => {
        const result = generateFeedbackEmailHtml(baseFeedbackData);

        expect(result).toContain(
          `<title>Yardvark Feedback from ${baseFeedbackData.name}</title>`,
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty message', () => {
        const feedbackWithEmptyMessage: FeedbackEmailData = {
          ...baseFeedbackData,
          message: '',
        };

        const result = generateFeedbackEmailHtml(feedbackWithEmptyMessage);

        expect(typeof result).toBe('string');
        expect(result).toContain('class="message-content"');
      });

      it('should handle very long URL', () => {
        const longUrl = 'https://yardvark.app/' + 'a'.repeat(500);
        const feedbackWithLongUrl: FeedbackEmailData = {
          ...baseFeedbackData,
          url: longUrl,
        };

        const result = generateFeedbackEmailHtml(feedbackWithLongUrl);

        expect(result).toContain(longUrl);
      });

      it('should handle very long userAgent', () => {
        const longUserAgent = 'Mozilla/' + 'x'.repeat(500);
        const feedbackWithLongUserAgent: FeedbackEmailData = {
          ...baseFeedbackData,
          userAgent: longUserAgent,
        };

        const result = generateFeedbackEmailHtml(feedbackWithLongUserAgent);

        expect(result).toContain(longUserAgent);
      });

      it('should handle empty string for optional URL', () => {
        const feedbackWithEmptyUrl: FeedbackEmailData = {
          ...baseFeedbackData,
          url: '',
        };

        const result = generateFeedbackEmailHtml(feedbackWithEmptyUrl);

        // Empty string is falsy, so URL section should not appear
        expect(result).not.toContain('Page URL');
      });

      it('should handle empty string for optional userAgent', () => {
        const feedbackWithEmptyUserAgent: FeedbackEmailData = {
          ...baseFeedbackData,
          userAgent: '',
        };

        const result = generateFeedbackEmailHtml(feedbackWithEmptyUserAgent);

        // Empty string is falsy, so Browser Info section should not appear
        expect(result).not.toContain('Browser Info');
      });
    });
  });
});
