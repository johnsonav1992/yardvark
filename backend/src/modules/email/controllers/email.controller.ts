import { Body, Controller, Post } from "@nestjs/common";
import { EmailService, FeedbackEmailData } from "../services/email.service";
import { FeedbackRequest } from "../models/email.types";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";

@Controller("email")
export class EmailController {
	constructor(private readonly emailService: EmailService) {}

	@Post("feedback")
	public async sendFeedback(@Body() feedbackData: FeedbackRequest) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"send_feedback",
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.feedbackType,
			feedbackData.feedbackType,
		);

		const emailData: FeedbackEmailData = feedbackData;

		resultOrThrow(await this.emailService.sendFeedbackEmail(emailData));

		return { message: "Feedback sent successfully" };
	}
}
