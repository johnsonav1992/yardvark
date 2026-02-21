import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "../services/subscription.service";
import { success, error } from "../../../types/either";
import {
	SUBSCRIPTION_TIERS,
	SUBSCRIPTION_STATUSES,
} from "../models/subscription.types";
import { SubscriptionFetchError } from "../models/subscription.errors";

describe("SubscriptionController", () => {
	let controller: SubscriptionController;
	let subscriptionService: SubscriptionService;

	beforeEach(async () => {
		const mockSubscriptionService = {
			getOrCreateSubscription: jest.fn(),
			createCheckoutSession: jest.fn(),
			createPortalSession: jest.fn(),
			checkFeatureAccess: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [SubscriptionController],
			providers: [
				{
					provide: SubscriptionService,
					useValue: mockSubscriptionService,
				},
			],
		}).compile();

		controller = module.get<SubscriptionController>(SubscriptionController);
		subscriptionService = module.get<SubscriptionService>(SubscriptionService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getStatus", () => {
		it("should return subscription status", async () => {
			const mockSubscription = {
				id: 1,
				userId: "user1",
				tier: SUBSCRIPTION_TIERS.MONTHLY,
				status: SUBSCRIPTION_STATUSES.ACTIVE,
			};

			jest
				.spyOn(subscriptionService, "getOrCreateSubscription")
				.mockResolvedValue(success(mockSubscription as any));

			const result = await controller.getStatus("user1");

			expect(result).toEqual(mockSubscription);
			expect(subscriptionService.getOrCreateSubscription).toHaveBeenCalledWith(
				"user1",
			);
		});

		it("should throw error when subscription fetch fails", async () => {
			jest
				.spyOn(subscriptionService, "getOrCreateSubscription")
				.mockResolvedValue(
					error(new SubscriptionFetchError(new Error("Database error"))),
				);

			await expect(controller.getStatus("user1")).rejects.toThrow();
		});
	});

	describe("createCheckout", () => {
		it("should create checkout session", async () => {
			const mockUser = {
				userId: "user1",
				email: "test@example.com",
				name: "Test User",
			};

			const mockBody = {
				tier: "monthly" as const,
				successUrl: "https://example.com/success",
				cancelUrl: "https://example.com/cancel",
			};

			const mockResult = {
				url: "https://checkout.stripe.com/session",
			};

			jest
				.spyOn(subscriptionService, "createCheckoutSession")
				.mockResolvedValue(success(mockResult));

			const result = await controller.createCheckout(mockUser, mockBody);

			expect(result).toEqual(mockResult);
			expect(subscriptionService.createCheckoutSession).toHaveBeenCalledWith(
				"user1",
				"test@example.com",
				"Test User",
				"monthly",
				"https://example.com/success",
				"https://example.com/cancel",
			);
		});

		it("should throw error for invalid tier", async () => {
			const mockUser = {
				userId: "user1",
				email: "test@example.com",
				name: "Test User",
			};

			const mockBody = {
				tier: "invalid" as any,
				successUrl: "https://example.com/success",
				cancelUrl: "https://example.com/cancel",
			};

			await expect(
				controller.createCheckout(mockUser, mockBody),
			).rejects.toThrow(HttpException);
		});
	});

	describe("createPortal", () => {
		it("should create portal session", async () => {
			const mockResult = {
				url: "https://billing.stripe.com/session",
			};

			jest
				.spyOn(subscriptionService, "createPortalSession")
				.mockResolvedValue(success(mockResult));

			const result = await controller.createPortal("user1", {
				returnUrl: "https://example.com/return",
			});

			expect(result).toEqual(mockResult);
			expect(subscriptionService.createPortalSession).toHaveBeenCalledWith(
				"user1",
				"https://example.com/return",
			);
		});
	});

	describe("checkFeature", () => {
		it("should check feature access", async () => {
			const mockResult = {
				allowed: true,
			};

			jest
				.spyOn(subscriptionService, "checkFeatureAccess")
				.mockResolvedValue(success(mockResult));

			const result = await controller.checkFeature("user1", {
				feature: "ai_chat",
			});

			expect(result).toEqual(mockResult);
			expect(subscriptionService.checkFeatureAccess).toHaveBeenCalledWith(
				"user1",
				"ai_chat",
			);
		});
	});
});
