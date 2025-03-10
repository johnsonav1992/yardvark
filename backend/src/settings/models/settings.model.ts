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

export type SettingsData = {
  temperatureUnit: 'celsius' | 'fahrenheit';
};

export type SettingsResponse = Omit<InstanceType<typeof Settings>, 'value'> & {
  value: SettingsData;
};
