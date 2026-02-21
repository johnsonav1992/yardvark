import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Service } from "src/modules/s3/s3.service";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";

@Module({
	imports: [HttpModule],
	controllers: [UsersController],
	providers: [UsersService, S3Service, ConfigService],
})
export class UsersModule {}
