import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type {
	SubscriptionStatus,
	SubscriptionTier,
} from "./subscription.types";

@Entity("subscriptions")
export class Subscription {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: "user_id", unique: true })
	userId: string;

	@Column({ name: "stripe_customer_id", nullable: true, type: "varchar" })
	stripeCustomerId: string | null;

	@Column({
		name: "stripe_subscription_id",
		nullable: true,
		unique: true,
		type: "varchar",
	})
	stripeSubscriptionId: string | null;

	@Column({ default: "free" })
	tier: SubscriptionTier;

	@Column({ default: "active" })
	status: SubscriptionStatus;

	@Column({ name: "current_period_start", type: "timestamptz", nullable: true })
	currentPeriodStart: Date | null;

	@Column({ name: "current_period_end", type: "timestamptz", nullable: true })
	currentPeriodEnd: Date | null;

	@Column({ name: "cancel_at_period_end", default: false })
	cancelAtPeriodEnd: boolean;

	@Column({ name: "canceled_at", type: "timestamptz", nullable: true })
	canceledAt: Date | null;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt: Date;
}
