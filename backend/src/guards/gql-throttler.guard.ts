import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from 'src/types/gql-context';

type ThrottlerRequestResponse = {
  req: Record<string, unknown>;
  res: Record<string, unknown>;
};

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext): ThrottlerRequestResponse {
    if (context.getType() === 'http') {
      return {
        req: context.switchToHttp().getRequest(),
        res: context.switchToHttp().getResponse(),
      };
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<GqlContext>();

    return {
      req: ctx.req as unknown,
      res: (ctx.req.res ?? {}) as unknown,
    } as ThrottlerRequestResponse;
  }
}
