import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUBSCRIPTION_FEATURE_KEY } from '../decorators/subscription-feature.decorator';
import { SubscriptionService } from '../modules/subscription/services/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureName = this.reflector.getAllAndOverride<string>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!featureName) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const access = await this.subscriptionService.checkFeatureAccess(
      userId,
      featureName,
    );

    if (!access.allowed) {
      throw new HttpException(
        {
          message: 'Subscription required',
          feature: featureName,
          limit: access.limit,
          usage: access.usage,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
