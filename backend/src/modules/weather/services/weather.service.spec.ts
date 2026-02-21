import { HttpService } from "@nestjs/axios";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Test, type TestingModule } from "@nestjs/testing";
import type { AxiosResponse } from "axios";
import { of, throwError } from "rxjs";
import type {
	Period,
	ProbabilityOfPrecipitation,
	WeatherDotGovForecastResponse,
	WeatherDotGovPointsResponse,
} from "../models/weather.types";
import { WeatherService } from "./weather.service";

describe("WeatherService", () => {
	let service: WeatherService;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let _httpService: HttpService;

	const mockHttpService = {
		get: jest.fn(),
	};

	const mockCacheManager = {
		get: jest.fn(),
		set: jest.fn(),
	};

	const mockProbabilityOfPrecipitation: ProbabilityOfPrecipitation = {
		unitCode: "wmoUnit:percent",
		value: 30,
	};

	const mockPeriod: Period = {
		number: 1,
		name: "Today",
		startTime: "2025-06-19T12:00:00-05:00",
		endTime: "2025-06-19T18:00:00-05:00",
		isDaytime: true,
		temperature: 85,
		temperatureUnit: "F",
		temperatureTrend: "",
		probabilityOfPrecipitation: mockProbabilityOfPrecipitation,
		windSpeed: "10 mph",
		windDirection: "SW",
		icon: "https://api.weather.gov/icons/land/day/sct?size=medium",
		shortForecast: "Partly Cloudy",
		detailedForecast:
			"Partly cloudy skies with temperatures reaching 85 degrees.",
	};

	const mockPointsResponse: WeatherDotGovPointsResponse = {
		"@context": [
			"https://geojson.org/geojson-ld/geojson-context.jsonld",
			{
				"@version": "1.1",
				wx: "https://api.weather.gov/ontology#",
				geo: "http://www.opengis.net/ont/geosparql#",
				unit: "http://codes.wmo.int/common/unit/",
				"@vocab": "https://api.weather.gov/ontology#",
			},
		],
		id: "https://api.weather.gov/points/32.7767,-96.7970",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [-96.797, 32.7767],
		},
		properties: {
			"@id": "https://api.weather.gov/points/32.7767,-96.7970",
			"@type": "wx:Point",
			cwa: "FWD",
			forecastOffice: "https://api.weather.gov/offices/FWD",
			gridId: "FWD",
			gridX: 80,
			gridY: 110,
			forecast: "https://api.weather.gov/gridpoints/FWD/80,110/forecast",
			forecastHourly:
				"https://api.weather.gov/gridpoints/FWD/80,110/forecast/hourly",
			forecastGridData: "https://api.weather.gov/gridpoints/FWD/80,110",
			observationStations:
				"https://api.weather.gov/gridpoints/FWD/80,110/stations",
			relativeLocation: {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [-96.8089, 32.7673],
				},
				properties: {
					city: "Dallas",
					state: "TX",
					distance: {
						unitCode: "wmoUnit:m",
						value: 1234.5,
					},
					bearing: {
						unitCode: "wmoUnit:degree_(angle)",
						value: 90,
					},
				},
			},
			forecastZone: "https://api.weather.gov/zones/forecast/TXZ119",
			county: "https://api.weather.gov/zones/county/TXC113",
			fireWeatherZone: "https://api.weather.gov/zones/fire/TXZ119",
			timeZone: "America/Chicago",
			radarStation: "KFWS",
		},
	};

	const mockForecastResponse: WeatherDotGovForecastResponse = {
		"@context": [
			"https://geojson.org/geojson-ld/geojson-context.jsonld",
			{
				"@version": "1.1",
				wx: "https://api.weather.gov/ontology#",
				geo: "http://www.opengis.net/ont/geosparql#",
				unit: "http://codes.wmo.int/common/unit/",
				"@vocab": "https://api.weather.gov/ontology#",
			},
		],
		type: "Feature",
		geometry: {
			type: "Polygon",
			coordinates: [
				[
					[-96.8, 32.8],
					[-96.7, 32.8],
					[-96.7, 32.7],
					[-96.8, 32.7],
					[-96.8, 32.8],
				],
			],
		},
		properties: {
			units: "us",
			forecastGenerator: "BaselineForecastGenerator",
			generatedAt: "2025-06-19T17:00:00+00:00",
			updateTime: "2025-06-19T16:30:00+00:00",
			validTimes: "2025-06-19T16:00:00+00:00/P7DT18H",
			elevation: {
				unitCode: "wmoUnit:m",
				value: 137.16,
			},
			periods: [mockPeriod],
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				WeatherService,
				{
					provide: HttpService,
					useValue: mockHttpService,
				},
				{
					provide: CACHE_MANAGER,
					useValue: mockCacheManager,
				},
				{
					provide: "FORECAST_CACHE_TTL",
					useValue: 3600000,
				},
				{
					provide: "HISTORICAL_CACHE_TTL",
					useValue: 86400000,
				},
			],
		}).compile();

		service = module.get<WeatherService>(WeatherService);
		_httpService = module.get<HttpService>(HttpService);

		jest.clearAllMocks();
		mockCacheManager.get.mockResolvedValue(null); // Default to cache miss
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getWeatherData", () => {
		it("should successfully fetch weather data with valid coordinates", async () => {
			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
				{
					data: mockForecastResponse,
					status: 200,
					statusText: "OK",
					headers: {},
					config: {},
				} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(of(forecastAxiosResponse));

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isSuccess()).toBe(true);
			expect(mockHttpService.get).toHaveBeenCalledTimes(2);
			expect(mockHttpService.get).toHaveBeenNthCalledWith(
				1,
				"https://api.weather.gov/points/32.7767,-96.7970",
			);
			expect(mockHttpService.get).toHaveBeenNthCalledWith(
				2,
				"https://api.weather.gov/gridpoints/FWD/80,110/forecast",
			);
			expect(result.value).toEqual(mockForecastResponse);
		});

		it("should handle different coordinate formats", async () => {
			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
				{
					data: mockForecastResponse,
					status: 200,
					statusText: "OK",
					headers: {},
					config: {},
				} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(of(forecastAxiosResponse));

			await service.getWeatherData("40.7128", "-74.0060");

			expect(mockHttpService.get).toHaveBeenNthCalledWith(
				1,
				"https://api.weather.gov/points/40.7128,-74.0060",
			);
		});

		it("should handle multiple weather periods in response", async () => {
			const multiPeriodForecast: WeatherDotGovForecastResponse = {
				...mockForecastResponse,
				properties: {
					...mockForecastResponse.properties,
					periods: [
						mockPeriod,
						{
							...mockPeriod,
							number: 2,
							name: "Tonight",
							isDaytime: false,
							temperature: 72,
							shortForecast: "Clear",
						},
						{
							...mockPeriod,
							number: 3,
							name: "Tomorrow",
							temperature: 88,
							shortForecast: "Sunny",
						},
					],
				},
			};

			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
				{
					data: multiPeriodForecast,
					status: 200,
					statusText: "OK",
					headers: {},
					config: {},
				} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(of(forecastAxiosResponse));

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value.properties.periods).toHaveLength(3);
				expect(result.value.properties.periods[0].name).toBe("Today");
				expect(result.value.properties.periods[1].name).toBe("Tonight");
				expect(result.value.properties.periods[2].name).toBe("Tomorrow");
			}
		});

		it("should return error when forecast URL is missing from points response", async () => {
			const pointsResponseWithoutForecast: WeatherDotGovPointsResponse = {
				...mockPointsResponse,
				properties: {
					...mockPointsResponse.properties,
					forecast: "",
				},
			};

			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: pointsResponseWithoutForecast,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(pointsAxiosResponse));

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch weather data",
			);
		});

		it("should return error when points API call fails", async () => {
			mockHttpService.get.mockReturnValueOnce(
				throwError(() => new Error("Points API error")),
			);

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch weather data",
			);
		});

		it("should return error when forecast API call fails", async () => {
			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(throwError(() => new Error("Forecast API error")));

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch weather data",
			);
		});

		it("should handle network timeout errors", async () => {
			mockHttpService.get.mockReturnValueOnce(
				throwError(() => new Error("timeout of 5000ms exceeded")),
			);

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch weather data",
			);
		});

		it("should handle invalid coordinates gracefully", async () => {
			mockHttpService.get.mockReturnValueOnce(
				throwError(() => new Error("Invalid point coordinates")),
			);

			const result = await service.getWeatherData("invalid", "coordinates");

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch weather data",
			);
		});

		it("should handle malformed points response", async () => {
			const malformedPointsResponse = {
				...mockPointsResponse,
				properties: null,
			};

			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: malformedPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(pointsAxiosResponse));

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch weather data",
			);
		});

		it("should handle edge case coordinates", async () => {
			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
				{
					data: mockForecastResponse,
					status: 200,
					statusText: "OK",
					headers: {},
					config: {},
				} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(of(forecastAxiosResponse));

			await service.getWeatherData("71.0", "-156.0"); // Prudhoe Bay, Alaska

			expect(mockHttpService.get).toHaveBeenNthCalledWith(
				1,
				"https://api.weather.gov/points/71.0,-156.0",
			);
		});

		it("should handle weather data with null precipitation values", async () => {
			const periodWithNullPrecipitation: Period = {
				...mockPeriod,
				probabilityOfPrecipitation: {
					unitCode: "wmoUnit:percent",
					value: null as never,
				},
			};

			const forecastWithNullPrecipitation: WeatherDotGovForecastResponse = {
				...mockForecastResponse,
				properties: {
					...mockForecastResponse.properties,
					periods: [periodWithNullPrecipitation],
				},
			};

			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
				{
					data: forecastWithNullPrecipitation,
					status: 200,
					statusText: "OK",
					headers: {},
					config: {},
				} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(of(forecastAxiosResponse));

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(
					result.value.properties.periods[0].probabilityOfPrecipitation.value,
				).toBeNull();
			}
		});

		it("should return cached data on cache hit", async () => {
			mockCacheManager.get.mockResolvedValueOnce(mockForecastResponse);

			const result = await service.getWeatherData("32.7767", "-96.7970");

			expect(result.isSuccess()).toBe(true);
			expect(mockCacheManager.get).toHaveBeenCalledWith(
				"weather:forecast:32.7767:-96.7970",
			);
			expect(mockHttpService.get).not.toHaveBeenCalled();
			expect(result.value).toEqual(mockForecastResponse);
		});

		it("should cache data after fetching from API", async () => {
			const pointsAxiosResponse: AxiosResponse<WeatherDotGovPointsResponse> = {
				data: mockPointsResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			const forecastAxiosResponse: AxiosResponse<WeatherDotGovForecastResponse> =
				{
					data: mockForecastResponse,
					status: 200,
					statusText: "OK",
					headers: {},
					config: {},
				} as never;

			mockHttpService.get
				.mockReturnValueOnce(of(pointsAxiosResponse))
				.mockReturnValueOnce(of(forecastAxiosResponse));

			await service.getWeatherData("32.7767", "-96.7970");

			expect(mockCacheManager.set).toHaveBeenCalledWith(
				"weather:forecast:32.7767:-96.7970",
				mockForecastResponse,
				3600000,
			);
		});
	});

	describe("getHistoricalAirTemperatures", () => {
		const mockHistoricalResponse = {
			latitude: 32.7767,
			longitude: -96.797,
			generationtime_ms: 0.5,
			utc_offset_seconds: -21600,
			timezone: "America/Chicago",
			timezone_abbreviation: "CST",
			elevation: 137.0,
			daily_units: {
				time: "iso8601",
				temperature_2m_max: "°F",
				temperature_2m_min: "°F",
			},
			daily: {
				time: ["2024-06-01", "2024-06-02", "2024-06-03"],
				temperature_2m_max: [95.2, 92.8, 89.6],
				temperature_2m_min: [72.5, 74.1, 71.3],
			},
		};

		const historicalParams = {
			lat: 32.7767,
			long: -96.797,
			startDate: "2024-06-01",
			endDate: "2024-06-03",
			temperatureUnit: "fahrenheit" as const,
		};

		it("should successfully fetch historical temperature data", async () => {
			const axiosResponse = {
				data: mockHistoricalResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(axiosResponse));

			const result =
				await service.getHistoricalAirTemperatures(historicalParams);

			expect(result.isSuccess()).toBe(true);
			expect(result.value).toEqual([
				{ date: "2024-06-01", maxTemp: 95.2, minTemp: 72.5 },
				{ date: "2024-06-02", maxTemp: 92.8, minTemp: 74.1 },
				{ date: "2024-06-03", maxTemp: 89.6, minTemp: 71.3 },
			]);
		});

		it("should call Open-Meteo API with correct parameters", async () => {
			const axiosResponse = {
				data: mockHistoricalResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(axiosResponse));

			await service.getHistoricalAirTemperatures(historicalParams);

			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining(
					"https://historical-forecast-api.open-meteo.com/v1/forecast",
				),
			);
			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("latitude=32.7767"),
			);
			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("longitude=-96.797"),
			);
			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("start_date=2024-06-01"),
			);
			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("end_date=2024-06-03"),
			);
			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("temperature_unit=fahrenheit"),
			);
		});

		it("should return cached data on cache hit", async () => {
			const cachedData = [
				{ date: "2024-06-01", maxTemp: 95.2, minTemp: 72.5 },
				{ date: "2024-06-02", maxTemp: 92.8, minTemp: 74.1 },
			];

			mockCacheManager.get.mockResolvedValueOnce(cachedData);

			const result =
				await service.getHistoricalAirTemperatures(historicalParams);

			expect(result.isSuccess()).toBe(true);
			expect(mockCacheManager.get).toHaveBeenCalledWith(
				"weather:historical:32.7767:-96.797:2024-06-01:2024-06-03:fahrenheit",
			);
			expect(mockHttpService.get).not.toHaveBeenCalled();
			expect(result.value).toEqual(cachedData);
		});

		it("should cache data after fetching from API", async () => {
			const axiosResponse = {
				data: mockHistoricalResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(axiosResponse));

			await service.getHistoricalAirTemperatures(historicalParams);

			expect(mockCacheManager.set).toHaveBeenCalledWith(
				"weather:historical:32.7767:-96.797:2024-06-01:2024-06-03:fahrenheit",
				[
					{ date: "2024-06-01", maxTemp: 95.2, minTemp: 72.5 },
					{ date: "2024-06-02", maxTemp: 92.8, minTemp: 74.1 },
					{ date: "2024-06-03", maxTemp: 89.6, minTemp: 71.3 },
				],
				86400000,
			);
		});

		it("should return error when API call fails", async () => {
			mockHttpService.get.mockReturnValueOnce(
				throwError(() => new Error("Open-Meteo API error")),
			);

			const result =
				await service.getHistoricalAirTemperatures(historicalParams);

			expect(result.isError()).toBe(true);
			expect(result.value).toHaveProperty(
				"message",
				"Failed to fetch historical temperatures",
			);
		});

		it("should handle celsius temperature unit", async () => {
			const celsiusResponse = {
				...mockHistoricalResponse,
				daily_units: {
					time: "iso8601",
					temperature_2m_max: "°C",
					temperature_2m_min: "°C",
				},
				daily: {
					time: ["2024-06-01"],
					temperature_2m_max: [35.1],
					temperature_2m_min: [22.5],
				},
			};

			const axiosResponse = {
				data: celsiusResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(axiosResponse));

			const result = await service.getHistoricalAirTemperatures({
				...historicalParams,
				temperatureUnit: "celsius",
			});

			expect(result.isSuccess()).toBe(true);
			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("temperature_unit=celsius"),
			);
			expect(result.value).toEqual([
				{ date: "2024-06-01", maxTemp: 35.1, minTemp: 22.5 },
			]);
		});

		it("should use default fahrenheit when temperatureUnit is not provided", async () => {
			const axiosResponse = {
				data: mockHistoricalResponse,
				status: 200,
				statusText: "OK",
				headers: {},
				config: {},
			} as never;

			mockHttpService.get.mockReturnValueOnce(of(axiosResponse));

			await service.getHistoricalAirTemperatures({
				lat: 32.7767,
				long: -96.797,
				startDate: "2024-06-01",
				endDate: "2024-06-03",
			});

			expect(mockHttpService.get).toHaveBeenCalledWith(
				expect.stringContaining("temperature_unit=fahrenheit"),
			);
		});
	});
});
