import type { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";
import type { GqlContext } from "src/types/gql-context";

export const getRequest = (context: ExecutionContext): Request => {
	if (context.getType() === "http") {
		return context.switchToHttp().getRequest<Request>();
	}

	const ctx = GqlExecutionContext.create(context);

	return ctx.getContext<GqlContext>().req;
};

/**
 * Allows GraphQL requests in dev to be unauthenticated for ease of testing
 */
export const passthroughDevGqlRequests = (
	context: ExecutionContext,
): boolean => {
	if (
		process.env.NODE_ENV !== "production" &&
		context.getType<string>() === "graphql"
	) {
		const devUserId = process.env.DEV_GQL_USER_ID;
		const req = getRequest(context);

		if (devUserId && !req.headers?.authorization) {
			req.user = { userId: devUserId, isMaster: true, email: "", name: "" };

			return true;
		}
	}

	return false;
};
