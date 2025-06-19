import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('settings')
@Unique(['userId'])
export class Settings {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: string;

	@Column()
	value: string;
}
