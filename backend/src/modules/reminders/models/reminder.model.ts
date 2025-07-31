// backend/src/modules/reminders/models/reminder.model.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column()
  description?: string;

  @Column({ type: 'timestamptz' })
  scheduledDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column('text')
  endpoint: string;

  @Column('text')
  p256dhKey: string;

  @Column('text')
  authKey: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
