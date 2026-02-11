import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EmailService, FeedbackEmailData } from '../services/email.service';
import { FeedbackRequest } from '../models/email.types';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('feedback')
  public async sendFeedback(@Body() feedbackData: FeedbackRequest) {
    LogHelpers.addBusinessContext('controller_operation', 'send_feedback');
    LogHelpers.addBusinessContext('feedback_type', feedbackData.feedbackType);

    const emailData: FeedbackEmailData = feedbackData;

    const success = await this.emailService.sendFeedbackEmail(emailData);

    if (success) {
      return { message: 'Feedback sent successfully' };
    }

    LogHelpers.addBusinessContext('feedback_send_failed', true);

    throw new HttpException(
      'Failed to send feedback email',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
