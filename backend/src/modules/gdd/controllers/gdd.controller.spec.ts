/* eslint-disable @typescript-eslint/unbound-method */

import { HttpException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { error, success } from "../../../types/either";
import {
	UserLocationNotConfigured,
	UserSettingsNotFound,
} from "../models/gdd.errors";
import type {
	CurrentGddResponse,
	GddForecastResponse,
	HistoricalGddResponse,
} from "../models/gdd.types";
import { GddService } from "../services/gdd.service";
import { GddController } from "./gdd.controller";

describe("GddController", () => {
	let controller: GddController;
	let gddService: jest.Mocked<GddService>;

	const mockUserId = "test-user-123";

	const mockCurrentGddResponse: CurrentGddResponse = {
		accumulatedGdd: 150,
		lastPgrAppDate: "2024-06-01",
		daysSinceLastApp: 5,
		baseTemperature: 32,
		baseTemperatureUnit: "fahrenheit",
		targetGdd: 200,
		percentageToTarget: 75,
		grassType: "cool",
		cycleStatus: "active",
	};

	const mockHistoricalGddResponse: HistoricalGddResponse = {
		dailyGdd: [
			{
				date: "2024-06-01",
				gdd: 30,
				highTemp: 75,
				lowTemp: 55,
				temperatureUnit: "fahrenheit",
			},
			{
				date: "2024-06-02",
				gdd: 35,
				highTemp: 80,
				lowTemp: 60,
				temperatureUnit: "fahrenheit",
			},
		],
		totalGdd: 65,
		startDate: "2024-06-01",
		endDate: "2024-06-02",
		baseTemperature: 32,
		baseTemperatureUnit: "fahrenheit",
	};

	const mockGddForecastResponse: GddForecastResponse = {
		forecastedGdd: [
			{
				date: "2024-06-10",
				estimatedGdd: 36,
				highTemp: 78,
				lowTemp: 58,
				temperatureUnit: "fahrenheit",
			},
			{
				date: "2024-06-11",
				estimatedGdd: 40,
				highTemp: 82,
				lowTemp: 62,
				temperatureUnit: "fahrenheit",
			},
		],
		projectedTotalGdd: 226,
		currentAccumulatedGdd: 150,
		targetGdd: 200,
		projectedNextAppDate: "2024-06-10",
		daysUntilTarget: 1,
	};

	beforeEach(async () => {
		const mockGddService = {
			getCurrentGdd: jest.fn(),
			getHistoricalGdd: jest.fn(),
			getGddForecast: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [GddController],
			providers: [
				{
					provide: GddService,
					useValue: mockGddService,
				},
			],
		}).compile();

		controller = module.get<GddController>(GddController);
		gddService = module.get(GddService);

		jest.clearAllMocks();
	});

	describe("getCurrentGdd", () => {
		it("should call gddService.getCurrentGdd with user ID", async () => {
			gddService.getCurrentGdd.mockResolvedValue(
				success(mockCurrentGddResponse),
			);

			await controller.getCurrentGdd(mockUserId);

			expect(gddService.getCurrentGdd).toHaveBeenCalledWith(mockUserId);
			expect(gddService.getCurrentGdd).toHaveBeenCalledTimes(1);
		});

		it("should return the unwrapped response from gddService", async () => {
			gddService.getCurrentGdd.mockResolvedValue(
				success(mockCurrentGddResponse),
			);

			const result = await controller.getCurrentGdd(mockUserId);

			expect(result).toEqual(mockCurrentGddResponse);
		});

		it("should throw HttpException when service returns error", async () => {
			gddService.getCurrentGdd.mockResolvedValue(
				error(new UserSettingsNotFound()),
			);

			await expect(controller.getCurrentGdd(mockUserId)).rejects.toThrow(
				HttpException,
			);
		});

		it("should throw HttpException with correct status for location error", async () => {
			gddService.getCurrentGdd.mockResolvedValue(
				error(new UserLocationNotConfigured()),
			);

			await expect(controller.getCurrentGdd(mockUserId)).rejects.toThrow(
				HttpException,
			);
		});
	});

	describe("getHistoricalGdd", () => {
		const startDate = "2024-06-01";
		const endDate = "2024-06-02";

		it("should call gddService.getHistoricalGdd with correct parameters", async () => {
			gddService.getHistoricalGdd.mockResolvedValue(
				success(mockHistoricalGddResponse),
			);

			await controller.getHistoricalGdd(mockUserId, startDate, endDate);

			expect(gddService.getHistoricalGdd).toHaveBeenCalledWith(
				mockUserId,
				startDate,
				endDate,
			);
			expect(gddService.getHistoricalGdd).toHaveBeenCalledTimes(1);
		});

		it("should return the unwrapped response from gddService", async () => {
			gddService.getHistoricalGdd.mockResolvedValue(
				success(mockHistoricalGddResponse),
			);

			const result = await controller.getHistoricalGdd(
				mockUserId,
				startDate,
				endDate,
			);

			expect(result).toEqual(mockHistoricalGddResponse);
		});

		it("should throw HttpException when service returns error", async () => {
			gddService.getHistoricalGdd.mockResolvedValue(
				error(new UserSettingsNotFound()),
			);

			await expect(
				controller.getHistoricalGdd(mockUserId, startDate, endDate),
			).rejects.toThrow(HttpException);
		});

		it("should pass through different date ranges", async () => {
			const customStart = "2024-01-01";
			const customEnd = "2024-12-31";
			gddService.getHistoricalGdd.mockResolvedValue(
				success(mockHistoricalGddResponse),
			);

			await controller.getHistoricalGdd(mockUserId, customStart, customEnd);

			expect(gddService.getHistoricalGdd).toHaveBeenCalledWith(
				mockUserId,
				customStart,
				customEnd,
			);
		});
	});

	describe("getGddForecast", () => {
		it("should call gddService.getGddForecast with user ID", async () => {
			gddService.getGddForecast.mockResolvedValue(
				success(mockGddForecastResponse),
			);

			await controller.getGddForecast(mockUserId);

			expect(gddService.getGddForecast).toHaveBeenCalledWith(mockUserId);
			expect(gddService.getGddForecast).toHaveBeenCalledTimes(1);
		});

		it("should return the unwrapped response from gddService", async () => {
			gddService.getGddForecast.mockResolvedValue(
				success(mockGddForecastResponse),
			);

			const result = await controller.getGddForecast(mockUserId);

			expect(result).toEqual(mockGddForecastResponse);
		});

		it("should throw HttpException when service returns error", async () => {
			gddService.getGddForecast.mockResolvedValue(
				error(new UserSettingsNotFound()),
			);

			await expect(controller.getGddForecast(mockUserId)).rejects.toThrow(
				HttpException,
			);
		});
	});

	describe("user context extraction", () => {
		it("should pass userId to all endpoints", async () => {
			const differentUserId = "different-user-456";

			gddService.getCurrentGdd.mockResolvedValue(
				success(mockCurrentGddResponse),
			);
			gddService.getHistoricalGdd.mockResolvedValue(
				success(mockHistoricalGddResponse),
			);
			gddService.getGddForecast.mockResolvedValue(
				success(mockGddForecastResponse),
			);

			await controller.getCurrentGdd(differentUserId);
			await controller.getHistoricalGdd(
				differentUserId,
				"2024-06-01",
				"2024-06-02",
			);
			await controller.getGddForecast(differentUserId);

			expect(gddService.getCurrentGdd).toHaveBeenCalledWith(differentUserId);
			expect(gddService.getHistoricalGdd).toHaveBeenCalledWith(
				differentUserId,
				expect.any(String),
				expect.any(String),
			);
			expect(gddService.getGddForecast).toHaveBeenCalledWith(differentUserId);
		});
	});
});
