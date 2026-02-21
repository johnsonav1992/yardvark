import { Test, type TestingModule } from "@nestjs/testing";
import { UsersService } from "../services/users.service";
import { UsersController } from "./users.controller";

describe("UsersController", () => {
	let controller: UsersController;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let _service: UsersService;

	const mockUsersService = {
		getUserProfile: jest.fn(),
		updateUserProfile: jest.fn(),
		deleteUser: jest.fn(),
		getUserStats: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
			],
		}).compile();

		controller = module.get<UsersController>(UsersController);
		_service = module.get<UsersService>(UsersService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
