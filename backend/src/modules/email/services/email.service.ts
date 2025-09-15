import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

export interface FeedbackEmailData {
  name: string;
  email: string;
  message: string;
  feedbackType: 'general' | 'bug' | 'enhancement';
  userAgent?: string;
  url?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private mailerSend: MailerSend;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeMailerSend();
  }

  private initializeMailerSend() {
    const apiKey = this.configService.get<string>('MAILERSEND_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'MAILERSEND_API_KEY not found. Email service will not function.',
      );
      this.logger.warn(
        'Get your API key from https://app.mailersend.com/api-tokens',
      );
      return;
    }

    this.mailerSend = new MailerSend({ apiKey });

    this.isInitialized = true;
    this.logger.log('MailerSend initialized successfully');
  }

  /**
   * Send feedback email to admin
   */
  async sendFeedbackEmail(feedbackData: FeedbackEmailData): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.error('MailerSend not initialized. Check API key.');
      return false;
    }

    const adminEmail = 'yardvarkapp@gmail.com';
    const bccEmail = 'johnsonav1992@gmail.com';
    const fromEmail = 'feedback@test-q3enl6kv55742vwr.mlsender.net';

    try {
      const sentFrom = new Sender(fromEmail, 'Yardvark Feedback');
      const recipients = [new Recipient(adminEmail, 'Admin')];

      const html = this.generateFeedbackEmailHtml(feedbackData);

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setBcc([new Recipient(bccEmail, 'Alex Johnson')])
        .setSubject(`Yardvark Feedback from ${feedbackData.name}`)
        .setHtml(html)
        .setReplyTo(new Sender(feedbackData.email, feedbackData.name));

      const response = await this.mailerSend.email.send(emailParams);

      if (response.statusCode === 202) {
        this.logger.log('Feedback email sent successfully');
        return true;
      } else {
        this.logger.error('Failed to send email:', response);
        return false;
      }
    } catch (error) {
      this.logger.error('Error sending feedback email:', error);
      return false;
    }
  }

  private generateFeedbackEmailHtml(data: FeedbackEmailData): string {
    const feedbackTypeConfig = {
      general: { icon: '💬', label: 'General Feedback', color: '#3b82f6' },
      bug: { icon: '🐛', label: 'Bug Report', color: '#ef4444' },
      enhancement: { icon: '💡', label: 'Feature Request', color: '#8b5cf6' },
    };

    const typeInfo = feedbackTypeConfig[data.feedbackType];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Yardvark Feedback from ${data.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #1f2937;
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            }
            .container {
              max-width: 650px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 10px solid transparent;
              border-right: 10px solid transparent;
              border-top: 10px solid #16a34a;
            }
            .header h1 {
              margin: 0 0 8px 0;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.025em;
            }
            .header p {
              margin: 0;
              font-size: 14px;
              opacity: 0.9;
              font-weight: 500;
            }
            .content {
              padding: 32px 24px;
            }
            .feedback-type {
              display: inline-flex;
              align-items: center;
              background: ${typeInfo.color}15;
              color: ${typeInfo.color};
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 24px;
              border: 2px solid ${typeInfo.color}25;
            }
            .feedback-type-icon {
              margin-right: 6px;
              font-size: 16px;
            }
            .field {
              margin-bottom: 24px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
              overflow: hidden;
              transition: all 0.2s ease;
            }
            .field:hover {
              border-color: #d1d5db;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .field-header {
              background: #f9fafb;
              padding: 12px 20px;
              border-bottom: 1px solid #e5e7eb;
              display: flex;
              align-items: center;
            }
            .field-icon {
              font-size: 18px;
              margin-right: 10px;
            }
            .field-label {
              font-weight: 600;
              color: #374151;
              font-size: 15px;
            }
            .field-value {
              padding: 16px 20px;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.6;
            }
            .message-content {
              white-space: pre-wrap;
              word-wrap: break-word;
              background: #f8fafc;
              padding: 16px;
              border-radius: 8px;
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
              font-size: 14px;
              border-left: 4px solid #22c55e;
            }
            .metadata {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 12px;
              font-size: 13px;
              color: #6b7280;
              font-family: 'SF Mono', 'Monaco', monospace;
            }
            .url-link {
              color: #3b82f6;
              text-decoration: none;
              padding: 4px 8px;
              background: #dbeafe;
              border-radius: 6px;
              font-weight: 500;
              transition: all 0.2s ease;
            }
            .url-link:hover {
              background: #bfdbfe;
              transform: translateY(-1px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌱 Yardvark Feedback</h1>
              <p>New user feedback received</p>
            </div>
            <div class="content">
              <div class="feedback-type">
                <span class="feedback-type-icon">${typeInfo.icon}</span>
                ${typeInfo.label}
              </div>

              <div class="field">
                <div class="field-header">
                  <span class="field-icon">👤</span>
                  <span class="field-label">Name</span>
                </div>
                <div class="field-value">${data.name}</div>
              </div>

              <div class="field">
                <div class="field-header">
                  <span class="field-icon">📧</span>
                  <span class="field-label">Email</span>
                </div>
                <div class="field-value">${data.email}</div>
              </div>

              <div class="field">
                <div class="field-header">
                  <span class="field-icon">${typeInfo.icon}</span>
                  <span class="field-label">${typeInfo.label}</span>
                </div>
                <div class="field-value">
                  <div class="message-content">${data.message}</div>
                </div>
              </div>

              ${
                data.url
                  ? `
                <div class="field">
                  <div class="field-header">
                    <span class="field-icon">🔗</span>
                    <span class="field-label">Page URL</span>
                  </div>
                  <div class="field-value">
                    <a href="${data.url}" class="url-link">${data.url}</a>
                  </div>
                </div>
              `
                  : ''
              }

              ${
                data.userAgent
                  ? `
                <div class="field">
                  <div class="field-header">
                    <span class="field-icon">🔧</span>
                    <span class="field-label">Browser Info</span>
                  </div>
                  <div class="field-value">
                    <div class="metadata">${data.userAgent}</div>
                  </div>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
