import { Body, Controller, Post } from '@nestjs/common';
import { EmailService, FeedbackEmailData } from '../services/email.service';

export interface FeedbackRequest {
  name: string;
  email: string;
  message: string;
  rating?: number;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('feedback')
  async sendFeedback(@Body() feedbackData: FeedbackRequest) {
    // Add additional context data
    const emailData: FeedbackEmailData = {
      ...feedbackData,
      // Could add request context here if needed
      // userAgent: req.headers['user-agent'],
      // url: req.headers.referer,
    };

    const success = await this.emailService.sendFeedbackEmail(emailData);

    if (success) {
      return { message: 'Feedback sent successfully' };
    } else {
      throw new Error('Failed to send feedback email');
    }
  }
}