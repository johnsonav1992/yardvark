import { type ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "src/decorators/public.decorator";
import type { GqlContext } from "src/types/gql-context";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
	constructor(private reflector: Reflector) {
		super();
	}

	public getRequest(context: ExecutionContext) {
		if (context.getType() === "http") {
			return context.switchToHttp().getRequest<Request>();
		}

		const ctx = GqlExecutionContext.create(context);

		return ctx.getContext<GqlContext>().req;
	}

	public canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) return true;

		if (this.passthroughDevGqlRequests(context)) return true;

		return super.canActivate(context);
	}

	public getAuthenticateOptions() {
		return { session: false };
	}

	/**
	 * Allows GraphQL requests in dev to be unauthenticated for ease of testing
	 */
	private passthroughDevGqlRequests(context: ExecutionContext): boolean {
		if (
			process.env.NODE_ENV !== "production" &&
			context.getType<string>() === "graphql"
		) {
			const devUserId = process.env.DEV_GQL_USER_ID;
			const req = this.getRequest(context);

			if (devUserId && !req.headers?.authorization) {
				req.user = { userId: devUserId, isMaster: true, email: "", name: "" };

				return true;
			}
		}

		return false;
	}
}
