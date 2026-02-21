import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { S3Service } from "src/modules/s3/s3.service";
import { error, success } from "../../../types/either";
import { S3UploadError } from "../../s3/s3.errors";
import { UsersService } from "../services/users.service";

describe("UsersService", () => {
	let service: UsersService;

	const mockHttpService = {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		put: jest.fn(),
		delete: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn((key: string) => {
			const config: Record<string, string> = {
				AUTH0_DOMAIN: "test.auth0.com",
				AUTH0_BACKEND_CLIENT_ID: "test-client-id",
				AUTH0_BACKEND_CLIENT_SECRET: "test-client-secret",
			};

			return config[key];
		}),
	};

	const mockS3Service = {
		uploadFile: jest.fn(),
		uploadFiles: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: HttpService,
					useValue: mockHttpService,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
				{
					provide: S3Service,
					useValue: mockS3Service,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getManagementToken", () => {
		it("should fetch and return management token from Auth0", async () => {
			const mockToken = "mock-access-token-123";
			mockHttpService.post.mockReturnValue(
				of({ data: { access_token: mockToken } }),
			);

			const result = await service.getManagementToken();

			expect(mockHttpService.post).toHaveBeenCalledWith(
				"https://test.auth0.com/oauth/token",
				{
					client_id: "test-client-id",
					client_secret: "test-client-secret",
					audience: "https://dev-w4uj6ulyqeacwtfi.us.auth0.com/api/v2/",
					grant_type: "client_credentials",
				},
			);
			expect(result.isSuccess()).toBe(true);
			expect(result.value).toBe(mockToken);
		});

		it("should return error when Auth0 token request fails", async () => {
			mockHttpService.post.mockReturnValue(
				throwError(() => new Error("Auth0 error")),
			);

			const result = await service.getManagementToken();

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to get Auth0 management token",
			);
		});
	});

	describe("updateUser", () => {
		it("should update user with Auth0 management API", async () => {
			const mockToken = "mock-access-token";
			const userId = "auth0|user123";
			const userData = { name: "John Doe", nickname: "johnd" };
			const mockResponse = { data: { ...userData, user_id: userId } };

			mockHttpService.post.mockReturnValue(
				of({ data: { access_token: mockToken } }),
			);
			mockHttpService.patch.mockReturnValue(of(mockResponse));

			const result = await service.updateUser(userId, userData);

			expect(mockHttpService.patch).toHaveBeenCalledWith(
				`https://test.auth0.com/api/v2/users/${userId}`,
				userData,
				{
					headers: {
						Authorization: `Bearer ${mockToken}`,
					},
				},
			);
			expect(result.isSuccess()).toBe(true);
			expect(result.value).toEqual(mockResponse.data);
		});

		it("should fetch management token before updating user", async () => {
			const mockToken = "mock-access-token";
			mockHttpService.post.mockReturnValue(
				of({ data: { access_token: mockToken } }),
			);
			mockHttpService.patch.mockReturnValue(of({ data: {} }));

			await service.updateUser("user123", { name: "Test" });

			expect(mockHttpService.post).toHaveBeenCalledTimes(1);
			expect(mockHttpService.patch).toHaveBeenCalledTimes(1);
		});

		it("should return error when token fetch fails", async () => {
			mockHttpService.post.mockReturnValue(
				throwError(() => new Error("Token error")),
			);

			const result = await service.updateUser("user123", { name: "Test" });

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty("message", "Failed to update user");
		});

		it("should return error when patch request fails", async () => {
			const mockToken = "mock-access-token";
			mockHttpService.post.mockReturnValue(
				of({ data: { access_token: mockToken } }),
			);
			mockHttpService.patch.mockReturnValue(
				throwError(() => new Error("Patch error")),
			);

			const result = await service.updateUser("user123", { name: "Test" });

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty("message", "Failed to update user");
		});
	});

	describe("updateProfilePicture", () => {
		const mockFile = {
			buffer: Buffer.from("test-image"),
			originalname: "test-image.jpg",
			mimetype: "image/jpeg",
			size: 1024,
		} as Express.Multer.File;

		it("should upload image to S3 and update Auth0 user picture", async () => {
			const userId = "auth0|user123";
			const mockS3Url = "https://bucket.s3.amazonaws.com/profile/test.jpg";
			const mockToken = "mock-access-token";

			mockS3Service.uploadFile.mockResolvedValue(success(mockS3Url));
			mockHttpService.post.mockReturnValue(
				of({ data: { access_token: mockToken } }),
			);
			mockHttpService.patch.mockReturnValue(
				of({ data: { picture: mockS3Url } }),
			);

			const result = await service.updateProfilePicture(userId, mockFile);

			expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
				expect.objectContaining({
					buffer: mockFile.buffer,
					mimetype: mockFile.mimetype,
				}),
				`${userId}/profile`,
			);
			expect(mockHttpService.patch).toHaveBeenCalledWith(
				`https://test.auth0.com/api/v2/users/${userId}`,
				{ picture: mockS3Url },
				expect.objectContaining({
					headers: { Authorization: `Bearer ${mockToken}` },
				}),
			);
			expect(result.isSuccess()).toBe(true);
			expect(result.value).toEqual({ picture: mockS3Url });
		});

		it("should generate unique filename with timestamp", async () => {
			const userId = "auth0|user123";
			const mockS3Url = "https://bucket.s3.amazonaws.com/profile/test.jpg";
			const mockToken = "mock-access-token";

			mockS3Service.uploadFile.mockResolvedValue(success(mockS3Url));
			mockHttpService.post.mockReturnValue(
				of({ data: { access_token: mockToken } }),
			);
			mockHttpService.patch.mockReturnValue(
				of({ data: { picture: mockS3Url } }),
			);

			await service.updateProfilePicture(userId, mockFile);

			const uploadedFile = mockS3Service.uploadFile.mock.calls[0][0];
			expect(uploadedFile.originalname).toMatch(/^profile-picture-\d+\.jpg$/);
		});

		it("should return error when S3 upload fails", async () => {
			const userId = "auth0|user123";

			mockS3Service.uploadFile.mockResolvedValue(
				error(new S3UploadError(new Error("S3 failure"))),
			);

			const result = await service.updateProfilePicture(userId, mockFile);

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to upload profile picture",
			);
		});

		it("should return error when user update fails after S3 upload", async () => {
			const userId = "auth0|user123";
			const mockS3Url = "https://bucket.s3.amazonaws.com/profile/test.jpg";

			mockS3Service.uploadFile.mockResolvedValue(success(mockS3Url));
			mockHttpService.post.mockReturnValue(
				throwError(() => new Error("Token error")),
			);

			const result = await service.updateProfilePicture(userId, mockFile);

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to upload profile picture",
			);
		});
	});
});
