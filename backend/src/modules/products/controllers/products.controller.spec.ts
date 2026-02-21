import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller";
import { ProductsService } from "../services/products.service";
import { S3Service } from "src/modules/s3/s3.service";

describe("ProductsController", () => {
	let controller: ProductsController;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let productsService: ProductsService;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let s3Service: S3Service;

	const mockProductsService = {
		getProducts: jest.fn(),
		getProductById: jest.fn(),
		createProduct: jest.fn(),
		updateProduct: jest.fn(),
		deleteProduct: jest.fn(),
	};

	const mockS3Service = {
		uploadFile: jest.fn(),
		deleteFile: jest.fn(),
		getFileUrl: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProductsController],
			providers: [
				{
					provide: ProductsService,
					useValue: mockProductsService,
				},
				{
					provide: S3Service,
					useValue: mockS3Service,
				},
			],
		}).compile();

		controller = module.get<ProductsController>(ProductsController);
		productsService = module.get<ProductsService>(ProductsService);
		s3Service = module.get<S3Service>(S3Service);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
