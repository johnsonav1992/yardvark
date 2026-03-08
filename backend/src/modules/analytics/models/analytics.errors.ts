import { ResourceError } from "../../../errors/resource-error";

export class AnalyticsFetchError extends ResourceError {
	constructor(originalError?: Error | unknown) {
		super({
			message: "Failed to fetch analytics data",
			code: "ANALYTICS_FETCH_ERROR",
			statusCode: 500,
			error: originalError,
		});
	}
}
