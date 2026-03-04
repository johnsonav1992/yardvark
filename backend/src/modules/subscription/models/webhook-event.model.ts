import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity("webhook_events")
export class WebhookEvent {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	@Index()
	stripeEventId: string;

	@Column()
	eventType: string;

	@Column({ default: false })
	processed: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@Column({ type: "timestamptz", nullable: true })
	processedAt: Date;
}
