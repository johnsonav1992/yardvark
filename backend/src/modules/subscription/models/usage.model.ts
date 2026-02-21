import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	Index,
} from "typeorm";

@Entity("feature_usage")
@Index(["userId", "featureName", "periodStart"], { unique: true })
@Index(["userId"])
@Index(["periodStart", "periodEnd"])
export class FeatureUsage {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: "user_id" })
	userId: string;

	@Column({ name: "feature_name" })
	featureName: string;

	@Column({ name: "usage_count", default: 0 })
	usageCount: number;

	@Column({ name: "period_start", type: "timestamptz" })
	periodStart: Date;

	@Column({ name: "period_end", type: "timestamptz" })
	periodEnd: Date;

	@CreateDateColumn({ name: "last_updated", type: "timestamptz" })
	lastUpdated: Date;
}
