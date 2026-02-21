import { Test, type TestingModule } from "@nestjs/testing";
import { S3Service } from "src/modules/s3/s3.service";
import { EquipmentService } from "../services/equipment.service";
import { EquipmentController } from "./equipment.controller";

describe("EquipmentController", () => {
	let controller: EquipmentController;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let _equipmentService: EquipmentService;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let _s3Service: S3Service;

	const mockEquipmentService = {
		getEquipment: jest.fn(),
		getEquipmentById: jest.fn(),
		createEquipment: jest.fn(),
		updateEquipment: jest.fn(),
		deleteEquipment: jest.fn(),
		addMaintenance: jest.fn(),
		getMaintenanceHistory: jest.fn(),
	};

	const mockS3Service = {
		uploadFile: jest.fn(),
		deleteFile: jest.fn(),
		getFileUrl: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EquipmentController],
			providers: [
				{
					provide: EquipmentService,
					useValue: mockEquipmentService,
				},
				{
					provide: S3Service,
					useValue: mockS3Service,
				},
			],
		}).compile();

		controller = module.get<EquipmentController>(EquipmentController);
		_equipmentService = module.get<EquipmentService>(EquipmentService);
		_s3Service = module.get<S3Service>(S3Service);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
