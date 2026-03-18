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
	public id!: number;

	@Field()
	@Column({ name: "user_id" })
	public userId!: string;

	@Field()
	@Column({ name: "feature_name" })
	public featureName!: string;

	@Field(() => Int)
	@Column({ name: "usage_count", default: 0 })
	public usageCount!: number;

	@Field()
	@Column({ name: "period_start", type: "timestamptz" })
	public periodStart!: Date;

	@Field()
	@Column({ name: "period_end", type: "timestamptz" })
	public periodEnd!: Date;

	@Field()
	@CreateDateColumn({ name: "last_updated", type: "timestamptz" })
	public lastUpdated!: Date;
}
