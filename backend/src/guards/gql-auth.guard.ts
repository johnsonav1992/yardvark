import { ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "src/decorators/public.decorator";

@Injectable()
export class GqlAuthGuard extends AuthGuard("jwt") {
	constructor(private reflector: Reflector) {
		super();
	}

	getRequest(context: ExecutionContext) {
		const ctx = GqlExecutionContext.create(context);

		return ctx.getContext<{ req: Request }>().req;
	}

	canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) return true;

		return super.canActivate(context);
	}

	getAuthenticateOptions() {
		return { session: false };
	}
}
