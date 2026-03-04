import { HttpException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { error, success } from "../../../types/either";
import {
	InvalidDateFormatError,
	OpenMeteoFetchError,
	UserLocationNotConfiguredError,
	UserSettingsNotFoundError,
} from "../models/soil-data.errors";
import { SoilDataService } from "../services/soil-data.service";
import { SoilDataController } from "./soil-data.controller";

describe("SoilDataController", () => {
	let controller: SoilDataController;

	const mockSoilDataService = {
		fetchSoilDataForDate: jest.fn(),
		fetchRollingWeekSoilData: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [SoilDataController],
			providers: [
				{
					provide: SoilDataService,
					useValue: mockSoilDataService,
				},
			],
		}).compile();

		controller = module.get<SoilDataController>(SoilDataController);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("getSoilDataForDate", () => {
		it("should return soil data for a valid date", async () => {
			const mockData = {
				date: "2024-01-01",
				shallowTemp: 50,
				deepTemp: 48,
				moisturePct: 25,
				temperatureUnit: "fahrenheit" as const,
			};

			mockSoilDataService.fetchSoilDataForDate.mockResolvedValue(
				success(mockData),
			);

			const result = await controller.getSoilDataForDate(
				"user-123",
				"2024-01-01",
			);

			expect(result).toEqual(mockData);
			expect(mockSoilDataService.fetchSoilDataForDate).toHaveBeenCalledWith(
				"user-123",
				"2024-01-01",
			);
		});

		it("should throw HttpException for invalid date format", async () => {
			mockSoilDataService.fetchSoilDataForDate.mockResolvedValue(
				error(new InvalidDateFormatError()),
			);

			await expect(
				controller.getSoilDataForDate("user-123", "invalid"),
			).rejects.toThrow(HttpException);
		});

		it("should throw HttpException when user settings not found", async () => {
			mockSoilDataService.fetchSoilDataForDate.mockResolvedValue(
				error(new UserSettingsNotFoundError()),
			);

			await expect(
				controller.getSoilDataForDate("user-123", "2024-01-01"),
			).rejects.toThrow(HttpException);
		});

		it("should throw HttpException when user location not configured", async () => {
			mockSoilDataService.fetchSoilDataForDate.mockResolvedValue(
				error(new UserLocationNotConfiguredError()),
			);

			await expect(
				controller.getSoilDataForDate("user-123", "2024-01-01"),
			).rejects.toThrow(HttpException);
		});

		it("should throw HttpException on Open-Meteo fetch error", async () => {
			mockSoilDataService.fetchSoilDataForDate.mockResolvedValue(
				error(new OpenMeteoFetchError()),
			);

			await expect(
				controller.getSoilDataForDate("user-123", "2024-01-01"),
			).rejects.toThrow(HttpException);
		});
	});

	describe("getRollingWeekSoilData", () => {
		it("should return rolling week soil data", async () => {
			const mockData = {
				dates: Array(15).fill("2024-01-01"),
				shallowTemps: Array(15).fill(50),
				deepTemps: Array(15).fill(48),
				// cSpell:ignore Pcts
				moisturePcts: Array(15).fill(25),
				temperatureUnit: "fahrenheit" as const,
			};

			mockSoilDataService.fetchRollingWeekSoilData.mockResolvedValue(
				success(mockData),
			);

			const result = await controller.getRollingWeekSoilData("user-123");

			expect(result).toEqual(mockData);
			expect(mockSoilDataService.fetchRollingWeekSoilData).toHaveBeenCalledWith(
				"user-123",
			);
		});

		it("should throw HttpException when user settings not found", async () => {
			mockSoilDataService.fetchRollingWeekSoilData.mockResolvedValue(
				error(new UserSettingsNotFoundError()),
			);

			await expect(
				controller.getRollingWeekSoilData("user-123"),
			).rejects.toThrow(HttpException);
		});

		it("should throw HttpException when user location not configured", async () => {
			mockSoilDataService.fetchRollingWeekSoilData.mockResolvedValue(
				error(new UserLocationNotConfiguredError()),
			);

			await expect(
				controller.getRollingWeekSoilData("user-123"),
			).rejects.toThrow(HttpException);
		});

		it("should throw HttpException on Open-Meteo fetch error", async () => {
			mockSoilDataService.fetchRollingWeekSoilData.mockResolvedValue(
				error(new OpenMeteoFetchError()),
			);

			await expect(
				controller.getRollingWeekSoilData("user-123"),
			).rejects.toThrow(HttpException);
		});
	});
});
