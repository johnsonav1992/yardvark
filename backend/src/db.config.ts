import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSource = new DataSource({
	type: 'postgres',
	host: process.env.PRODPGHOST,
	port: 5432,
	username: process.env.PRODPGUSER,
	password: process.env.PRODPGPASSWORD,
	database: process.env.PRODPGDATABASE,
	ssl: true,
	synchronize: false,
	migrationsRun: false,
	migrations: [__dirname + '/migrations/*.{ts,js}'],
	entities: [__dirname + '/**/models/*.model.{ts,js}'],
	namingStrategy: new SnakeNamingStrategy(),
});
