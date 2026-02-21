import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";

@Injectable()
export class StripeService {
	private readonly stripe: Stripe;

	constructor(private readonly configService: ConfigService) {
		const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

		if (!secretKey) {
			throw new Error("STRIPE_SECRET_KEY is not configured");
		}

		this.stripe = new Stripe(secretKey, {
			apiVersion: "2023-10-16",
			typescript: true,
		});
	}

	public async createCustomer(
		userId: string,
		email: string,
		name: string,
	): Promise<Stripe.Customer> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.stripeOperation,
			"create_customer",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.customerEmail, email);
		LogHelpers.addBusinessContext(BusinessContextKeys.customerName, name);

		try {
			return await LogHelpers.withExternalCallTelemetry("stripe", () =>
				this.stripe.customers.create({
					email,
					name,
					metadata: { userId },
				}),
			);
		} catch (error) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorType,
				error.type,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorCode,
				error.code,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorMessage,
				error.message,
			);

			throw error;
		}
	}

	public async createCheckoutSession(
		customerId: string,
		priceId: string,
		userId: string,
		successUrl: string,
		cancelUrl: string,
	): Promise<Stripe.Checkout.Session> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.stripeOperation,
			"create_checkout",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);
		LogHelpers.addBusinessContext(BusinessContextKeys.priceId, priceId);
		LogHelpers.addBusinessContext(BusinessContextKeys.customerId, customerId);

		try {
			return await LogHelpers.withExternalCallTelemetry("stripe", () =>
				this.stripe.checkout.sessions.create({
					customer: customerId,
					mode: "subscription",
					payment_method_types: ["card"],
					line_items: [{ price: priceId, quantity: 1 }],
					success_url: successUrl,
					cancel_url: cancelUrl,
					metadata: { userId },
					subscription_data: { metadata: { userId } },
				}),
			);
		} catch (error) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorType,
				error.type,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorCode,
				error.code,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorMessage,
				error.message,
			);

			throw error;
		}
	}

	public async createPortalSession(
		customerId: string,
		returnUrl: string,
	): Promise<Stripe.BillingPortal.Session> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.stripeOperation,
			"create_portal",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.customerId, customerId);

		try {
			return await LogHelpers.withExternalCallTelemetry("stripe", () =>
				this.stripe.billingPortal.sessions.create({
					customer: customerId,
					return_url: returnUrl,
				}),
			);
		} catch (error) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorType,
				error.type,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorCode,
				error.code,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorMessage,
				error.message,
			);

			throw error;
		}
	}

	public async getSubscription(
		subscriptionId: string,
	): Promise<Stripe.Subscription> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.stripeOperation,
			"get_subscription",
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.subscriptionId,
			subscriptionId,
		);

		try {
			return await LogHelpers.withExternalCallTelemetry("stripe", () =>
				this.stripe.subscriptions.retrieve(subscriptionId),
			);
		} catch (error) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorType,
				error.type,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorCode,
				error.code,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorMessage,
				error.message,
			);

			throw error;
		}
	}

	public async getCustomer(
		customerId: string,
	): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.stripeOperation,
			"get_customer",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.customerId, customerId);

		try {
			return await LogHelpers.withExternalCallTelemetry("stripe", () =>
				this.stripe.customers.retrieve(customerId),
			);
		} catch (error) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorType,
				error.type,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorCode,
				error.code,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorMessage,
				error.message,
			);

			throw error;
		}
	}

	public async cancelSubscription(
		subscriptionId: string,
	): Promise<Stripe.Subscription> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.stripeOperation,
			"cancel_subscription",
		);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.subscriptionId,
			subscriptionId,
		);

		try {
			return await LogHelpers.withExternalCallTelemetry("stripe", () =>
				this.stripe.subscriptions.update(subscriptionId, {
					cancel_at_period_end: true,
				}),
			);
		} catch (error) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorType,
				error.type,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorCode,
				error.code,
			);
			LogHelpers.addBusinessContext(
				BusinessContextKeys.stripeErrorMessage,
				error.message,
			);

			throw error;
		}
	}

	public constructWebhookEvent(
		payload: Buffer,
		signature: string,
	): Stripe.Event {
		const webhookSecret = this.configService.get<string>(
			"STRIPE_WEBHOOK_SECRET",
		);

		if (!webhookSecret) {
			throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
		}

		try {
			return this.stripe.webhooks.constructEvent(
				payload,
				signature,
				webhookSecret,
			);
		} catch (err) {
			LogHelpers.addBusinessContext(
				BusinessContextKeys.webhookVerificationFailed,
				true,
			);

			throw err;
		}
	}

	public getStripe(): Stripe {
		return this.stripe;
	}
}
