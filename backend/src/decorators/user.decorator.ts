import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { ExtractedUserRequestData } from "../types/request";

/**
 * Custom decorator to extract user information from the request object.
 * Usage:
 * ```ts
 *   @Get('some-endpoint')
 *   someMethod(@User('userId') userId: string) {
 *     // use userId here
 *   }
 *
 *   @Get('another-endpoint')
 *   anotherMethod(@User() user: ExtractedUserRequestData) {
 *     // use user.userId, user.email, user.name here
 *   }
 * ```
 */
export const User = createParamDecorator(
	(data: keyof ExtractedUserRequestData | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user as ExtractedUserRequestData;

		if (data) return user[data];

		return user;
	},
);
