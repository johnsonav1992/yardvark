import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { Subscription } from '../models/subscription.model';
import { FeatureUsage } from '../models/usage.model';
import { StripeService } from './stripe.service';
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
} from '../models/subscription.types';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptionRepo: Repository<Subscription>;
  let usageRepo: Repository<FeatureUsage>;
  let stripeService: StripeService;
  let configService: ConfigService;
  let cacheManager: any;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockStripeService = {
      createCustomer: jest.fn(),
      getCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      getSubscription: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'STRIPE_MONTHLY_PRICE_ID') return 'price_monthly';

        if (key === 'STRIPE_YEARLY_PRICE_ID') return 'price_yearly';

        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(FeatureUsage),
          useClass: Repository,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    subscriptionRepo = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    usageRepo = module.get<Repository<FeatureUsage>>(
      getRepositoryToken(FeatureUsage),
    );
    stripeService = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateSubscription', () => {
    it('should return cached subscription if available', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockSubscription);

      const result = await service.getOrCreateSubscription('user1');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value).toEqual(mockSubscription);
      }

      expect(cacheManager.get).toHaveBeenCalledWith('subscription:user1');
    });

    it('should create new subscription if not found', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      jest.spyOn(subscriptionRepo, 'findOne').mockResolvedValue(null);

      jest
        .spyOn(subscriptionRepo, 'create')
        .mockReturnValue(mockSubscription as any);

      jest
        .spyOn(subscriptionRepo, 'save')
        .mockResolvedValue(mockSubscription as any);

      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getOrCreateSubscription('user1');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value).toEqual(mockSubscription);
      }

      expect(subscriptionRepo.create).toHaveBeenCalledWith({
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      });
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should return existing subscription', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.MONTHLY,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      jest
        .spyOn(subscriptionRepo, 'findOne')
        .mockResolvedValue(mockSubscription as any);

      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getOrCreateSubscription('user1');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value).toEqual(mockSubscription);
      }
    });
  });

  describe('checkFeatureAccess', () => {
    it('should allow ai features for pro users', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.MONTHLY,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockSubscription);

      const result = await service.checkFeatureAccess('user1', 'ai_chat');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.allowed).toBe(true);
      }
    });

    it('should deny ai features for free users', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockSubscription);

      const result = await service.checkFeatureAccess('user1', 'ai_chat');

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.allowed).toBe(false);
      }
    });

    it('should check entry creation limit for free users', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.FREE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      const mockUsage = {
        userId: 'user1',
        featureName: 'entry_creation',
        usageCount: 3,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockSubscription);

      jest.spyOn(usageRepo, 'findOne').mockResolvedValue(mockUsage as any);

      const result = await service.checkFeatureAccess(
        'user1',
        'entry_creation',
      );

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.allowed).toBe(true);
        expect(result.value.limit).toBe(6);
        expect(result.value.usage).toBe(3);
      }
    });

    it('should allow unlimited entry creation for pro users', async () => {
      const mockSubscription = {
        id: 1,
        userId: 'user1',
        tier: SUBSCRIPTION_TIERS.MONTHLY,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockSubscription);

      const result = await service.checkFeatureAccess(
        'user1',
        'entry_creation',
      );

      expect(result.isSuccess()).toBe(true);

      if (result.isSuccess()) {
        expect(result.value.allowed).toBe(true);
      }
    });
  });

  describe('incrementUsage', () => {
    it('should increment existing usage', async () => {
      const mockUsage = {
        id: 1,
        userId: 'user1',
        featureName: 'entry_creation',
        usageCount: 3,
      };

      jest.spyOn(usageRepo, 'findOne').mockResolvedValue(mockUsage as any);

      jest.spyOn(usageRepo, 'save').mockResolvedValue({
        ...mockUsage,
        usageCount: 4,
      } as any);

      const result = await service.incrementUsage('user1', 'entry_creation');

      expect(result.isSuccess()).toBe(true);
      expect(usageRepo.findOne).toHaveBeenCalled();
      expect(usageRepo.save).toHaveBeenCalled();
    });

    it('should create new usage if not exists', async () => {
      const newUsage = {
        userId: 'user1',
        featureName: 'entry_creation',
        usageCount: 1,
      };

      jest.spyOn(usageRepo, 'findOne').mockResolvedValue(null);

      jest.spyOn(usageRepo, 'create').mockReturnValue(newUsage as any);

      jest.spyOn(usageRepo, 'save').mockResolvedValue(newUsage as any);

      const result = await service.incrementUsage('user1', 'entry_creation');

      expect(result.isSuccess()).toBe(true);
      expect(usageRepo.create).toHaveBeenCalled();
      expect(usageRepo.save).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache entry', async () => {
      jest.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.invalidateCache('user1');

      expect(cacheManager.del).toHaveBeenCalledWith('subscription:user1');
    });
  });
});
