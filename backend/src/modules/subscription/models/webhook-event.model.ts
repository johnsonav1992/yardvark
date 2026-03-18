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
	public id!: number;

	@Column({ unique: true })
	@Index()
	public stripeEventId!: string;

	@Column()
	public eventType!: string;

	@Column({ default: false })
	public processed!: boolean;

	@CreateDateColumn()
	public createdAt!: Date;

	@Column({ type: "timestamptz", nullable: true })
	public processedAt!: Date;
}
