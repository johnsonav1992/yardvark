import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { generateFeedbackEmailHtml } from '../helpers/email.helpers';
import { LogHelpers } from '../../../logger/logger.helpers';
import { Either, error, success } from '../../../types/either';
import { EmailSendError, EmailNotConfigured } from '../models/email.errors';

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
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly gmailUser: string;
  private readonly adminEmail = 'johnsonav1992@gmail.com';

  constructor(private readonly configService: ConfigService) {
    this.gmailUser = this.configService.get<string>('GMAIL_USER') || '';
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD') || '';

    if (!this.gmailUser || !gmailAppPassword) {
      this.logger.warn(
        'GMAIL_USER or GMAIL_APP_PASSWORD not configured. Email service will not function.',
      );

      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  public async sendFeedbackEmail(
    feedbackData: FeedbackEmailData,
  ): Promise<Either<EmailSendError | EmailNotConfigured, true>> {
    LogHelpers.addBusinessContext('email_operation', 'send_feedback');
    LogHelpers.addBusinessContext('feedback_type', feedbackData.feedbackType);
    LogHelpers.addBusinessContext('from_email', this.gmailUser);
    LogHelpers.addBusinessContext('sender_email', feedbackData.email);

    if (!this.transporter) {
      LogHelpers.addBusinessContext('email_error', 'not_initialized');
      this.logger.error(
        'Email transporter not initialized. Check GMAIL_USER and GMAIL_APP_PASSWORD.',
      );

      return error(new EmailNotConfigured());
    }

    const html = generateFeedbackEmailHtml(feedbackData);
    const start = Date.now();

    try {
      const result = await this.transporter.sendMail({
        from: `"Yardvark Feedback" <${this.gmailUser}>`,
        to: this.adminEmail,
        replyTo: `"${feedbackData.name}" <${feedbackData.email}>`,
        subject: `Yardvark Feedback from ${feedbackData.name}`,
        html,
      });

      LogHelpers.recordExternalCall('gmail_smtp', Date.now() - start, true);
      LogHelpers.addBusinessContext('email_sent', true);
      LogHelpers.addBusinessContext('email_message_id', result?.messageId);
      this.logger.log('Feedback email sent successfully');

      return success(true as const);
    } catch (err) {
      LogHelpers.recordExternalCall('gmail_smtp', Date.now() - start, false);
      LogHelpers.addBusinessContext('email_sent', false);
      LogHelpers.addBusinessContext(
        'email_error_message',
        (err as Error)?.message,
      );
      LogHelpers.addBusinessContext('email_error_code', (err as any)?.code);
      LogHelpers.addBusinessContext(
        'email_error_command',
        (err as any)?.command,
      );
      this.logger.error(
        `Failed to send feedback email: ${(err as Error)?.message}`,
      );

      return error(new EmailSendError(err));
    }
  }
}
