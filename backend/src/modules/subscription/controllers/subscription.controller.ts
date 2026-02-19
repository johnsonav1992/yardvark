import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import {
  PurchasableTier,
  PURCHASABLE_TIERS,
} from '../models/subscription.types';
import { LogHelpers } from '../../../logger/logger.helpers';
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { User } from '../../../decorators/user.decorator';
import { ExtractedUserRequestData } from '../../../types/request';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  public async getStatus(@User('userId') userId: string) {
    LogHelpers.addBusinessContext('controller_operation', 'get_status');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(
      await this.subscriptionService.getOrCreateSubscription(userId),
    );
  }

  @Get('pricing')
  public async getPricing() {
    LogHelpers.addBusinessContext('controller_operation', 'get_pricing');

    return resultOrThrow(await this.subscriptionService.getPricing());
  }

  @Post('checkout')
  public async createCheckout(
    @User() user: ExtractedUserRequestData,
    @Body()
    body: { tier: PurchasableTier; successUrl: string; cancelUrl: string },
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'create_checkout');
    LogHelpers.addBusinessContext('user_id', user.userId);
    LogHelpers.addBusinessContext('requested_tier', body.tier);

    if (!PURCHASABLE_TIERS.includes(body.tier)) {
      LogHelpers.addBusinessContext('invalid_tier', body.tier);

      throw new HttpException(
        `Invalid tier: ${body.tier}. Must be one of: ${PURCHASABLE_TIERS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return resultOrThrow(
      await this.subscriptionService.createCheckoutSession(
        user.userId,
        user.email,
        user.name,
        body.tier,
        body.successUrl,
        body.cancelUrl,
      ),
    );
  }

  @Post('portal')
  public async createPortal(
    @User('userId') userId: string,
    @Body() body: { returnUrl: string },
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'create_portal');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(
      await this.subscriptionService.createPortalSession(
        userId,
        body.returnUrl,
      ),
    );
  }

  @Post('check-feature')
  public async checkFeature(
    @User('userId') userId: string,
    @Body() body: { feature: string },
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'check_feature');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('feature_name', body.feature);

    return resultOrThrow(
      await this.subscriptionService.checkFeatureAccess(userId, body.feature),
    );
  }
}
