import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { S3Service } from "src/modules/s3/s3.service";
import { EquipmentController } from "./controllers/equipment.controller";
import { Equipment } from "./models/equipment.model";
import { EquipmentMaintenance } from "./models/equipmentMaintenance.model";
import { EquipmentResolver } from "./resolvers/equipment.resolver";
import { EquipmentService } from "./services/equipment.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Equipment, EquipmentMaintenance]),
		HttpModule,
	],
	controllers: [EquipmentController],
	providers: [EquipmentService, EquipmentResolver, S3Service, ConfigService],
})
export class EquipmentModule {}
