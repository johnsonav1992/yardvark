import { type ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "src/decorators/public.decorator";
import type { GqlContext } from "src/types/gql-context";

@Injectable()
export class GqlAuthGuard extends AuthGuard("jwt") {
	constructor(private reflector: Reflector) {
		super();
	}

	public override getRequest(context: ExecutionContext): Request {
		const ctx = GqlExecutionContext.create(context);

		return ctx.getContext<GqlContext>().req;
	}

	public override canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) return true;

		if (this.passthroughDevGqlRequests(context)) return true;

		return super.canActivate(context);
	}

	public override getAuthenticateOptions() {
		return { session: false };
	}

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
