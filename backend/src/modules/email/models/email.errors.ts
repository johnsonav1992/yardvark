import { ResourceError } from "../../../errors/resource-error";

export class EmailSendError extends ResourceError {
	constructor(originalError?: Error | unknown) {
		super({
			message: "Failed to send feedback email",
			code: "EMAIL_SEND_ERROR",
			statusCode: 500,
			error: originalError,
		});
	}
}

export class EmailNotConfigured extends ResourceError {
	constructor() {
		super({
			message:
				"Email transporter not initialized. Check GMAIL_USER and GMAIL_APP_PASSWORD.",
			code: "EMAIL_NOT_CONFIGURED",
			statusCode: 500,
		});
	}
}
