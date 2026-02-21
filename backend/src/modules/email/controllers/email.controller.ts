import { Body, Controller, Post } from "@nestjs/common";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import type { FeedbackRequest } from "../models/email.types";
import {
	EmailService,
	type FeedbackEmailData,
} from "../services/email.service";

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
