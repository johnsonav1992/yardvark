import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { Request } from 'express';
import {
  PurchasableTier,
  PURCHASABLE_TIERS,
} from '../models/subscription.types';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  async getStatus(@Req() req: Request) {
    LogHelpers.addBusinessContext('controller_operation', 'get_status');
    LogHelpers.addBusinessContext('user_id', req.user.userId);

    try {
      const subscription =
        await this.subscriptionService.getOrCreateSubscription(req.user.userId);

      return subscription;
    } catch (error) {
      LogHelpers.addBusinessContext('get_status_error', error.message);

      throw new HttpException(
        `Failed to get subscription status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('checkout')
  async createCheckout(
    @Req() req: Request,
    @Body()
    body: { tier: PurchasableTier; successUrl: string; cancelUrl: string },
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'create_checkout');
    LogHelpers.addBusinessContext('user_id', req.user.userId);
    LogHelpers.addBusinessContext('requested_tier', body.tier);

    if (!PURCHASABLE_TIERS.includes(body.tier)) {
      LogHelpers.addBusinessContext('invalid_tier', body.tier);

      throw new HttpException(
        `Invalid tier: ${body.tier}. Must be one of: ${PURCHASABLE_TIERS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.subscriptionService.createCheckoutSession(
        req.user.userId,
        req.user.email,
        req.user.name,
        body.tier,
        body.successUrl,
        body.cancelUrl,
      );
    } catch (error) {
      LogHelpers.addBusinessContext('create_checkout_error', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to create checkout: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('portal')
  async createPortal(@Req() req: Request, @Body() body: { returnUrl: string }) {
    LogHelpers.addBusinessContext('controller_operation', 'create_portal');
    LogHelpers.addBusinessContext('user_id', req.user.userId);

    try {
      return await this.subscriptionService.createPortalSession(
        req.user.userId,
        body.returnUrl,
      );
    } catch (error) {
      LogHelpers.addBusinessContext('create_portal_error', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to create portal session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check-feature')
  async checkFeature(@Req() req: Request, @Body() body: { feature: string }) {
    LogHelpers.addBusinessContext('controller_operation', 'check_feature');
    LogHelpers.addBusinessContext('user_id', req.user.userId);
    LogHelpers.addBusinessContext('feature_name', body.feature);

    try {
      return await this.subscriptionService.checkFeatureAccess(
        req.user.userId,
        body.feature,
      );
    } catch (error) {
      LogHelpers.addBusinessContext('check_feature_error', error.message);

      throw new HttpException(
        `Failed to check feature access: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
