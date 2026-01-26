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

@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('status')
  async getStatus(@Req() req: Request) {
    const subscription =
      await this.subscriptionService.getOrCreateSubscription(req.user.userId);

    return subscription;
  }

  @Post('checkout')
  async createCheckout(
    @Req() req: Request,
    @Body()
    body: { tier: 'monthly' | 'yearly'; successUrl: string; cancelUrl: string },
  ) {
    if (!['monthly', 'yearly'].includes(body.tier)) {
      throw new HttpException('Invalid tier', HttpStatus.BAD_REQUEST);
    }

    return this.subscriptionService.createCheckoutSession(
      req.user.userId,
      req.user.email,
      req.user.name,
      body.tier,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('portal')
  async createPortal(
    @Req() req: Request,
    @Body() body: { returnUrl: string },
  ) {
    return this.subscriptionService.createPortalSession(
      req.user.userId,
      body.returnUrl,
    );
  }

  @Post('check-feature')
  async checkFeature(@Req() req: Request, @Body() body: { feature: string }) {
    return this.subscriptionService.checkFeatureAccess(
      req.user.userId,
      body.feature,
    );
  }
}
