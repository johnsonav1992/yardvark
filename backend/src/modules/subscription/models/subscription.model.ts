import { Field, ID, ObjectType } from "@nestjs/graphql";
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

@ObjectType()
@Entity("subscriptions")
export class Subscription {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	public id!: number;

	@Field()
	@Column({ name: "user_id", unique: true })
	public userId!: string;

	@Column({ name: "stripe_customer_id", nullable: true, type: "varchar" })
	public stripeCustomerId!: string | null;

	@Column({
		name: "stripe_subscription_id",
		nullable: true,
		unique: true,
		type: "varchar",
	})
	public stripeSubscriptionId!: string | null;

	@Field()
	@Column({ default: "free" })
	public tier!: SubscriptionTier;

	@Field()
	@Column({ default: "active" })
	public status!: SubscriptionStatus;

	@Field(() => Date, { nullable: true })
	@Column({ name: "current_period_start", type: "timestamptz", nullable: true })
	public currentPeriodStart!: Date | null;

	@Field(() => Date, { nullable: true })
	@Column({ name: "current_period_end", type: "timestamptz", nullable: true })
	public currentPeriodEnd!: Date | null;

	@Field()
	@Column({ name: "cancel_at_period_end", default: false })
	public cancelAtPeriodEnd!: boolean;

	@Field(() => Date, { nullable: true })
	@Column({ name: "canceled_at", type: "timestamptz", nullable: true })
	public canceledAt!: Date | null;

	@Field()
	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	public createdAt!: Date;

	@Field()
	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	public updatedAt!: Date;
}
