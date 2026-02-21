import { Test, TestingModule } from "@nestjs/testing";
import { HttpException } from "@nestjs/common";
import { WeatherController } from "./weather.controller";
import { WeatherService } from "../services/weather.service";
import { success, error } from "../../../types/either";
import { WeatherFetchError } from "../models/weather.errors";

describe("WeatherController", () => {
	let controller: WeatherController;

	const mockWeatherData = {
		current: {
			temperature: 72,
			humidity: 65,
			conditions: "Partly Cloudy",
		},
		forecast: [
			{ day: "Monday", high: 75, low: 60 },
			{ day: "Tuesday", high: 78, low: 62 },
		],
	};

	const mockWeatherService = {
		getWeatherData: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WeatherController],
			providers: [
				{
					provide: WeatherService,
					useValue: mockWeatherService,
				},
			],
		}).compile();

		controller = module.get<WeatherController>(WeatherController);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("getForecast", () => {
		it("should return weather data for valid coordinates", async () => {
			mockWeatherService.getWeatherData.mockResolvedValue(
				success(mockWeatherData),
			);

			const result = await controller.getForecast("40.7128", "-74.0060");

			expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith(
				"40.7128",
				"-74.0060",
			);
			expect(result).toEqual(mockWeatherData);
		});

		it("should throw HttpException when weather service returns an error", async () => {
			mockWeatherService.getWeatherData.mockResolvedValue(
				error(new WeatherFetchError(new Error("API error"))),
			);

			await expect(
				controller.getForecast("40.7128", "-74.0060"),
			).rejects.toThrow(HttpException);
		});

		it("should throw HttpException with status 502 when weather service fails", async () => {
			mockWeatherService.getWeatherData.mockResolvedValue(
				error(new WeatherFetchError(new Error("API error"))),
			);

			try {
				await controller.getForecast("40.7128", "-74.0060");
				fail("Expected HttpException to be thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(HttpException);
				expect((e as HttpException).getStatus()).toBe(502);
				expect((e as HttpException).getResponse()).toEqual({
					message: "Failed to fetch weather data",
					code: "WEATHER_FETCH_ERROR",
				});
			}
		});

		it("should handle different coordinate formats", async () => {
			mockWeatherService.getWeatherData.mockResolvedValue(
				success(mockWeatherData),
			);

			await controller.getForecast("51.5074", "0.1278");

			expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith(
				"51.5074",
				"0.1278",
			);
		});
	});
});
