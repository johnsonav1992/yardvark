import { Body, Controller, Post } from '@nestjs/common';
import { EmailService, FeedbackEmailData } from '../services/email.service';
import { FeedbackRequest } from '../models/email.types';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('feedback')
  async sendFeedback(@Body() feedbackData: FeedbackRequest) {
    const emailData: FeedbackEmailData = feedbackData;

    const success = await this.emailService.sendFeedbackEmail(emailData);

    if (success) {
      return { message: 'Feedback sent successfully' };
    } else {
      throw new Error('Failed to send feedback email');
    }
  }
}
