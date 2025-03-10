import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @OneToOne(() => Settings, (settings) => settings.userId)
  userId: string;

  @Column()
  value: string;
}
