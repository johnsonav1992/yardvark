import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from "typeorm";

@ObjectType()
@Entity("feature_usage")
@Index(["userId", "featureName", "periodStart"], { unique: true })
@Index(["userId"])
@Index(["periodStart", "periodEnd"])
export class FeatureUsage {
	@Field(() => ID)
	@PrimaryGeneratedColumn()
	id: number;

	@Field()
	@Column({ name: "user_id" })
	userId: string;

	@Field()
	@Column({ name: "feature_name" })
	featureName: string;

	@Field(() => Int)
	@Column({ name: "usage_count", default: 0 })
	usageCount: number;

	@Field()
	@Column({ name: "period_start", type: "timestamptz" })
	periodStart: Date;

	@Field()
	@Column({ name: "period_end", type: "timestamptz" })
	periodEnd: Date;

	@Field()
	@CreateDateColumn({ name: "last_updated", type: "timestamptz" })
	lastUpdated: Date;
}
