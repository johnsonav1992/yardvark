import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseTelemetryService } from "./db/database-telemetry.service";
import { dataSource } from "./db/db.config";
import { AppGraphQLModule } from "./graphql/graphql.module";
import { JwtAuthGuard } from "./guards/auth.guard";
import { FeatureFlagGuard } from "./guards/feature-flag.guard";
import { GqlThrottlerGuard } from "./guards/gql-throttler.guard";
import { JwtStrategy } from "./guards/jwt.strategy";
import { SubscriptionGuard } from "./guards/subscription.guard";
import { LoggingInterceptor } from "./logger/logger";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { AiModule } from "./modules/ai/ai.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { EmailModule } from "./modules/email/email.module";
import { EntriesModule } from "./modules/entries/entries.module";
import { EquipmentModule } from "./modules/equipment/equipment.module";
import { FilesController } from "./modules/files/controllers/files.controller";
import { FilesModule } from "./modules/files/files.module";
import { GddModule } from "./modules/gdd/gdd.module";
import { LawnSegmentsModule } from "./modules/lawn-segments/lawn-segments.module";
import { ProductsModule } from "./modules/products/products.module";
import { S3Service } from "./modules/s3/s3.service";
import { SettingsModule } from "./modules/settings/settings.module";
import { SoilDataModule } from "./modules/soil-data/soil-data.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { UsersController } from "./modules/users/controllers/users.controller";
import { UsersService } from "./modules/users/services/users.service";
import { UsersModule } from "./modules/users/users.module";
import { WeatherModule } from "./modules/weather/weather.module";

@Module({
	imports: [
		ConfigModule.forRoot({ envFilePath: ".env" }),
		TypeOrmModule.forRoot(dataSource.options),
		EventEmitterModule.forRoot(),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 100,
			},
		]),
		SettingsModule,
		ActivitiesModule,
		LawnSegmentsModule,
		EntriesModule,
		ProductsModule,
		UsersModule,
		HttpModule,
		EquipmentModule,
		AnalyticsModule,
		FilesModule,
		WeatherModule,
		HttpModule,
		AiModule,
		EmailModule,
		GddModule,
		AppGraphQLModule,
		SubscriptionModule,
		SoilDataModule,
	],
	controllers: [UsersController, FilesController],
	providers: [
		DatabaseTelemetryService,
		JwtStrategy,
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: FeatureFlagGuard,
		},
		{
			provide: APP_GUARD,
			useClass: GqlThrottlerGuard,
		},
		{
			provide: APP_GUARD,
			useClass: SubscriptionGuard,
		},
		UsersService,
		S3Service,
	],
})
export class AppModule {}
