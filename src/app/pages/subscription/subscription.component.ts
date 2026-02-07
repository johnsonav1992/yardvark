import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SubscriptionService } from '../../services/subscription.service';
import { PricingPlan, PurchasableTier } from '../../types/subscription.types';
import { injectSuccessToast, injectErrorToast, injectInfoToast } from '../../utils/toastUtils';
import { GlobalUiService } from '../../services/global-ui.service';
import { FREE_TIER_ENTRY_LIMIT } from '../../constants/subscription.constants';

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
export class SubscriptionComponent {
  private subscriptionService = inject(SubscriptionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private globalUiService = inject(GlobalUiService);
  private throwSuccessToast = injectSuccessToast();
  private throwErrorToast = injectErrorToast();
  private throwInfoToast = injectInfoToast();
  private queryParams = toSignal(this.route.queryParams);

  public subscription = this.subscriptionService.currentSubscription;
  public isPro = this.subscriptionService.isPro;
  public isMobile = this.globalUiService.isMobile;
  public loadingTier = signal<PurchasableTier | null>(null);
  public isManaging = signal(false);

  private readonly commonFeatures = [
    'Unlimited lawn entries',
    'All AI features',
    'Advanced analytics',
    'GDD tracking',
    'Priority support',
  ];

  public plans: PricingPlan[] = [
    {
      tier: 'monthly',
      name: 'Monthly',
      price: 7,
      period: 'month',
      features: this.commonFeatures,
    },
    {
      tier: 'yearly',
      name: 'Yearly',
      price: 60,
      period: 'year',
      popular: true,
      features: [...this.commonFeatures, 'Save $24/year'],
    },
  ];

  public freeLimits = [
    `${FREE_TIER_ENTRY_LIMIT} lawn entries per month`,
    'Basic analytics',
    'AI features unavailable',
  ];

  constructor() {
    effect(() => {
      const params = this.queryParams();

      if (!params) {
        return;
      }

      if (params['success'] === 'true') {
        this.throwSuccessToast('Subscription activated successfully!');
        this.subscriptionService.refreshSubscription();
      } else if (params['canceled'] === 'true') {
        this.throwInfoToast('Subscription checkout was canceled');
      }

      if (params['success'] || params['canceled']) {
        this.router.navigate([], { queryParams: {} });
      }
    });
  }

  public subscribe(tier: PurchasableTier) {
    this.loadingTier.set(tier);

    this.subscriptionService.createCheckout(tier).subscribe({
      next: (response) => {
        if (response?.url) {
          window.location.href = response.url;
        } else {
          this.throwErrorToast('Failed to start checkout');
          this.loadingTier.set(null);
        }
      },
      error: () => {
        this.throwErrorToast('Failed to start checkout');
        this.loadingTier.set(null);
      }
    });
  }

  public manageSubscription() {
    this.isManaging.set(true);

    this.subscriptionService.openPortal().subscribe({
      next: (response) => {
        if (response?.url) {
          window.location.href = response.url;
        } else {
          this.throwErrorToast('Failed to open billing portal');
          this.isManaging.set(false);
        }
      },
      error: () => {
        this.throwErrorToast('Failed to open billing portal');
        this.isManaging.set(false);
      }
    });
  }

  public get subscriptionEndDate(): string | null {
    const sub = this.subscription();

    if (!sub?.currentPeriodEnd) {
      return null;
    }

    return new Date(sub.currentPeriodEnd).toLocaleDateString();
  }

  public get willCancelAtPeriodEnd(): boolean {
    return this.subscription()?.cancelAtPeriodEnd || false;
  }

  public get tierDisplayName(): string {
    const tier = this.subscription()?.tier;

    if (!tier || tier === 'free') {
      return 'Free';
    }

    const tierNames: Record<string, string> = {
      lifetime: 'Lifetime',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };

    return `Pro (${tierNames[tier] || tier})`;
  }
}
