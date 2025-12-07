import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { Request } from 'express';
import { GqlContext } from 'src/types/gql-context';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<Request>();
    }

    const ctx = GqlExecutionContext.create(context);

    return ctx.getContext<GqlContext>().req;
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
