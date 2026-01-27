import { Injectable, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { apiUrl, postReq } from '../utils/httpUtils';
import { Subscription, FeatureAccess } from '../types/subscription.types';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  public subscription = httpResource<Subscription>(() =>
    apiUrl('subscription/status')
  );

  public currentSubscription = computed(() => this.subscription.value());

  public isPro = computed(() => {
    const sub = this.currentSubscription();

    return (
      sub?.tier === 'monthly' ||
      sub?.tier === 'yearly' ||
      sub?.tier === 'lifetime'
    );
  });

  public async createCheckout(tier: 'monthly' | 'yearly'): Promise<string> {
    const baseUrl = window.location.origin;
    const response = await postReq<{ url: string }>(
      apiUrl('subscription/checkout'),
      {
        tier,
        successUrl: `${baseUrl}/subscription?success=true`,
        cancelUrl: `${baseUrl}/subscription?canceled=true`
      }
    ).toPromise();

    if (!response?.url) {
      throw new Error('Failed to create checkout session');
    }

    return response.url;
  }

  public async openPortal(): Promise<string> {
    const baseUrl = window.location.origin;
    const response = await postReq<{ url: string }>(
      apiUrl('subscription/portal'),
      {
        returnUrl: `${baseUrl}/subscription`
      }
    ).toPromise();

    if (!response?.url) {
      throw new Error('Failed to create portal session');
    }

    return response.url;
  }

  public async checkFeatureAccess(feature: string): Promise<FeatureAccess> {
    try {
      const response = await postReq<FeatureAccess>(
        apiUrl('subscription/check-feature'),
        { feature }
      ).toPromise();

      return response || { allowed: false };
    } catch (error) {
      console.error('Failed to check feature access:', error);

      return { allowed: false };
    }
  }

  public hasAiAccess(): boolean {
    return this.isPro();
  }

  public refreshSubscription(): void {
    this.subscription.reload();
  }
}

export function injectSubscriptionService() {
  return inject(SubscriptionService);
}
