import { HttpStatus } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { success } from "../../../types/either";
import { WebhookEvent } from "../models/webhook-event.model";
import { StripeService } from "../services/stripe.service";
import { SubscriptionService } from "../services/subscription.service";
import { WebhookController } from "./webhook.controller";

describe("WebhookController", () => {
	let controller: WebhookController;
	let stripeService: StripeService;
	let subscriptionService: SubscriptionService;
	let webhookEventRepo: Repository<WebhookEvent>;

	beforeEach(async () => {
		const mockStripeService = {
			constructWebhookEvent: jest.fn(),
			getSubscription: jest.fn(),
		};

		const mockSubscriptionService = {
			handleSubscriptionUpdate: jest.fn(),
			handleSubscriptionDeleted: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [WebhookController],
			providers: [
				{
					provide: StripeService,
					useValue: mockStripeService,
				},
				{
					provide: SubscriptionService,
					useValue: mockSubscriptionService,
				},
				{
					provide: getRepositoryToken(WebhookEvent),
					useClass: Repository,
				},
			],
		}).compile();

		controller = module.get<WebhookController>(WebhookController);
		stripeService = module.get<StripeService>(StripeService);
		subscriptionService = module.get<SubscriptionService>(SubscriptionService);
		webhookEventRepo = module.get<Repository<WebhookEvent>>(
			getRepositoryToken(WebhookEvent),
		);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("handleWebhook", () => {
		it("should return error when signature is missing", async () => {
			const mockReq = {
				headers: {},
				rawBody: Buffer.from("test"),
			};

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				json: jest.fn(),
			};

			await controller.handleWebhook(mockReq as any, mockRes as any);

			expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
			expect(mockRes.send).toHaveBeenCalledWith(
				"Missing Stripe signature header",
			);
		});

		it("should return error when raw body is missing", async () => {
			const mockReq = {
				headers: {
					"stripe-signature": "test-signature",
				},
				rawBody: null,
			};

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				json: jest.fn(),
			};

			await controller.handleWebhook(mockReq as any, mockRes as any);

			expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
			expect(mockRes.send).toHaveBeenCalledWith(
				"Missing raw body for webhook verification",
			);
		});

		it("should return error when webhook verification fails", async () => {
			const mockReq = {
				headers: {
					"stripe-signature": "test-signature",
				},
				rawBody: Buffer.from("test"),
			};

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				json: jest.fn(),
			};

			jest
				.spyOn(stripeService, "constructWebhookEvent")
				.mockImplementation(() => {
					throw new Error("Invalid signature");
				});

			await controller.handleWebhook(mockReq as any, mockRes as any);

			expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
			expect(mockRes.send).toHaveBeenCalledWith(
				"Webhook verification failed: Invalid signature",
			);
		});

		it("should handle duplicate webhook events", async () => {
			const mockEvent = {
				id: "evt_123",
				type: "customer.subscription.updated",
				created: 1234567890,
				data: {
					object: {},
				},
			};

			const mockReq = {
				headers: {
					"stripe-signature": "test-signature",
				},
				rawBody: Buffer.from("test"),
			};

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				json: jest.fn(),
			};

			jest
				.spyOn(stripeService, "constructWebhookEvent")
				.mockReturnValue(mockEvent as any);

			jest.spyOn(webhookEventRepo, "create").mockReturnValue({
				stripeEventId: mockEvent.id,
				eventType: mockEvent.type,
				processed: false,
			} as any);

			const duplicateError: any = new Error("Duplicate");
			duplicateError.code = "23505";

			jest.spyOn(webhookEventRepo, "save").mockRejectedValue(duplicateError);

			await controller.handleWebhook(mockReq as any, mockRes as any);

			expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
			expect(mockRes.json).toHaveBeenCalledWith({
				received: true,
				duplicate: true,
			});
		});

		it("should process checkout.session.completed event", async () => {
			const mockEvent = {
				id: "evt_123",
				type: "checkout.session.completed",
				created: 1234567890,
				data: {
					object: {
						id: "cs_123",
						mode: "subscription",
						subscription: "sub_123",
					},
				},
			};

			const mockReq = {
				headers: {
					"stripe-signature": "test-signature",
				},
				rawBody: Buffer.from("test"),
			};

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				json: jest.fn(),
			};

			jest
				.spyOn(stripeService, "constructWebhookEvent")
				.mockReturnValue(mockEvent as any);

			jest.spyOn(webhookEventRepo, "create").mockReturnValue({
				id: 1,
				stripeEventId: mockEvent.id,
				eventType: mockEvent.type,
				processed: false,
			} as any);

			jest.spyOn(webhookEventRepo, "save").mockResolvedValue({
				id: 1,
				stripeEventId: mockEvent.id,
				eventType: mockEvent.type,
				processed: false,
			} as any);

			jest.spyOn(stripeService, "getSubscription").mockResolvedValue({
				id: "sub_123",
				status: "active",
				metadata: { userId: "user1" },
				items: { data: [{ price: { id: "price_123" } }] },
			} as any);

			jest
				.spyOn(subscriptionService, "handleSubscriptionUpdate")
				.mockResolvedValue(success(undefined));

			jest.spyOn(webhookEventRepo, "update").mockResolvedValue({} as any);

			await controller.handleWebhook(mockReq as any, mockRes as any);

			expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
			expect(mockRes.json).toHaveBeenCalledWith({ received: true });
		});

		it("should process customer.subscription.updated event", async () => {
			const mockEvent = {
				id: "evt_123",
				type: "customer.subscription.updated",
				created: 1234567890,
				data: {
					object: {
						id: "sub_123",
						status: "active",
						metadata: { userId: "user1" },
					},
				},
			};

			const mockReq = {
				headers: {
					"stripe-signature": "test-signature",
				},
				rawBody: Buffer.from("test"),
			};

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				json: jest.fn(),
			};

			jest
				.spyOn(stripeService, "constructWebhookEvent")
				.mockReturnValue(mockEvent as any);

			jest.spyOn(webhookEventRepo, "create").mockReturnValue({
				id: 1,
				stripeEventId: mockEvent.id,
				eventType: mockEvent.type,
				processed: false,
			} as any);

			jest.spyOn(webhookEventRepo, "save").mockResolvedValue({
				id: 1,
				stripeEventId: mockEvent.id,
				eventType: mockEvent.type,
				processed: false,
			} as any);

			jest
				.spyOn(subscriptionService, "handleSubscriptionUpdate")
				.mockResolvedValue(success(undefined));

			jest.spyOn(webhookEventRepo, "update").mockResolvedValue({} as any);

			await controller.handleWebhook(mockReq as any, mockRes as any);

			expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
			expect(mockRes.json).toHaveBeenCalledWith({ received: true });
		});
	});
});
