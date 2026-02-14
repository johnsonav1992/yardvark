import { Body, Controller, Post } from '@nestjs/common';
import { EmailService, FeedbackEmailData } from '../services/email.service';
import { FeedbackRequest } from '../models/email.types';
import { LogHelpers } from '../../../logger/logger.helpers';
import { unwrapResult } from '../../../utils/unwrapResult';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('feedback')
  public async sendFeedback(@Body() feedbackData: FeedbackRequest) {
    LogHelpers.addBusinessContext('controller_operation', 'send_feedback');
    LogHelpers.addBusinessContext('feedback_type', feedbackData.feedbackType);

    const emailData: FeedbackEmailData = feedbackData;

    unwrapResult(await this.emailService.sendFeedbackEmail(emailData));

    return { message: 'Feedback sent successfully' };
  }
}
