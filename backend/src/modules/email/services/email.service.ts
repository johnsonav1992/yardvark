import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { tryCatch } from '../../../utils/tryCatch';
import { generateFeedbackEmailHtml } from '../helpers/email.helpers';
import { LogHelpers } from '../../../logger/logger.helpers';

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
  }

  async sendFeedbackEmail(
    feedbackData: FeedbackEmailData,
    request?: Request,
  ): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.error('MailerSend not initialized. Check API key.');

      return false;
    }

    const adminEmail = 'johnsonav1992@gmail.com';
    const fromEmail = 'feedback@test-q3enl6kv55742vwr.mlsender.net';

    const start = Date.now();
    const result = await tryCatch(async () => {
      const sentFrom = new Sender(fromEmail, 'Yardvark Feedback');
      const recipients = [new Recipient(adminEmail, 'Admin')];

      const html = generateFeedbackEmailHtml(feedbackData);

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(`Yardvark Feedback from ${feedbackData.name}`)
        .setHtml(html)
        .setReplyTo(new Sender(feedbackData.email, feedbackData.name));

      return await this.mailerSend.email.send(emailParams);
    });

    if (request) {
      LogHelpers.recordExternalCall(
        request,
        'mailersend',
        Date.now() - start,
        result.success,
      );
    }

    if (result.success) {
      this.logger.log('Feedback email sent successfully');
      return true;
    } else {
      this.logger.error('Error sending feedback email:', result.error);
      return false;
    }
  }
}
