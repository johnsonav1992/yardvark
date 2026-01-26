import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SubscriptionService } from '../../services/subscription.service';
import { PricingPlan } from '../../types/subscription.types';
import { injectSuccessToast, injectErrorToast } from '../../utils/toastUtils';
import { GlobalUiService } from '../../services/global-ui.service';

@Component({
  selector: 'subscription',
  standalone: true,
  imports: [
    CommonModule,
    PageContainerComponent,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    MessageModule,
  ],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private globalUiService = inject(GlobalUiService);
  private throwSuccessToast = injectSuccessToast();
  private throwErrorToast = injectErrorToast();

  public subscription = this.subscriptionService.currentSubscription;
  public isPro = this.subscriptionService.isPro;
  public isMobile = this.globalUiService.isMobile;
  public isLoading = signal(false);

  public plans: PricingPlan[] = [
    {
      tier: 'monthly',
      name: 'Monthly',
      price: 7,
      period: 'month',
      features: [
        'Unlimited lawn entries',
        'All AI features',
        'Advanced analytics',
        'Priority support',
      ],
    },
    {
      tier: 'yearly',
      name: 'Yearly',
      price: 60,
      period: 'year',
      popular: true,
      features: [
        'Unlimited lawn entries',
        'All AI features',
        'Advanced analytics',
        'Priority support',
        'Save $24/year',
      ],
    },
  ];

  public freeLimits = [
    '6 lawn entries per month',
    'Basic analytics',
    'AI features unavailable',
  ];

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['success'] === 'true') {
        this.throwSuccessToast('Subscription activated successfully!');
        this.subscriptionService.refreshSubscription();
        this.router.navigate([], { queryParams: {} });
      }

      if (params['canceled'] === 'true') {
        this.throwErrorToast('Subscription checkout was canceled');
        this.router.navigate([], { queryParams: {} });
      }
    });
  }

  public async subscribe(tier: 'monthly' | 'yearly') {
    this.isLoading.set(true);

    try {
      const checkoutUrl = await this.subscriptionService.createCheckout(tier);
      window.location.href = checkoutUrl;
    } catch (error) {
      this.throwErrorToast('Failed to start checkout');
      this.isLoading.set(false);
    }
  }

  public async manageSubscription() {
    this.isLoading.set(true);

    try {
      const portalUrl = await this.subscriptionService.openPortal();
      window.location.href = portalUrl;
    } catch (error) {
      this.throwErrorToast('Failed to open billing portal');
      this.isLoading.set(false);
    }
  }

  public get subscriptionEndDate(): string | null {
    const sub = this.subscription();

    if (!sub?.currentPeriodEnd) {
      return null;
    }

    return new Date(sub.currentPeriodEnd).toLocaleDateString();
  }

  public get isSubscriptionActive(): boolean {
    const sub = this.subscription();

    return sub?.status === 'active' && this.isPro();
  }

  public get willCancelAtPeriodEnd(): boolean {
    return this.subscription()?.cancelAtPeriodEnd || false;
  }

  public get tierDisplayName(): string {
    const tier = this.subscription()?.tier;

    if (tier === 'lifetime') {
      return 'Pro (Lifetime)';
    }

    if (tier === 'monthly') {
      return 'Pro (Monthly)';
    }

    if (tier === 'yearly') {
      return 'Pro (Yearly)';
    }

    return 'Free';
  }
}
