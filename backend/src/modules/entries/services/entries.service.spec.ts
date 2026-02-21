import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { EntriesService } from "../services/entries.service";
import { Entry, EntryProduct, EntryImage } from "../models/entries.model";
import { ACTIVITY_IDS } from "src/constants/activities.constants";
import { EntriesNotFound, EntryNotFound } from "../models/entries.errors";

describe("EntriesService", () => {
	let service: EntriesService;

	const mockUserId = "user-123";

	const mockEntry = {
		id: 1,
		userId: mockUserId,
		date: new Date("2024-06-15"),
		time: "10:00",
		title: "Morning mow",
		notes: "Cut at 3 inches",
		mowingHeight: 3,
		soilTemperature: null,
		soilTemperatureUnit: "F",
		activities: [{ id: ACTIVITY_IDS.MOW, name: "Mow" }],
		lawnSegments: [
			{
				id: 1,
				userId: mockUserId,
				name: "Front Yard",
				size: 2500,
				coordinates: null,
				color: "#4CAF50",
				entries: [],
			},
		],
		entryProducts: [],
		entryImages: [],
	} as unknown as Entry;

	const mockEntryWithProducts = {
		...mockEntry,
		id: 2,
		activities: [
			{ id: ACTIVITY_IDS.PRODUCT_APPLICATION, name: "Product Application" },
		],
		entryProducts: [
			{
				entryId: 2,
				productId: 1,
				product: { id: 1, name: "Fertilizer", category: "fertilizer" },
				productQuantity: 2,
				productQuantityUnit: "lbs",
			},
		],
	} as unknown as Entry;

	const mockEntryRepository = {
		find: jest.fn(),
		findOne: jest.fn(),
		save: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		softDelete: jest.fn(),
		restore: jest.fn(),
		merge: jest.fn(),
		createQueryBuilder: jest.fn(),
	};

	const mockEntryProductRepository = {
		find: jest.fn(),
		save: jest.fn(),
		delete: jest.fn(),
		remove: jest.fn(),
	};

	const mockEntryImageRepository = {
		find: jest.fn(),
		save: jest.fn(),
		delete: jest.fn(),
		softDelete: jest.fn(),
		restore: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EntriesService,
				{
					provide: getRepositoryToken(Entry),
					useValue: mockEntryRepository,
				},
				{
					provide: getRepositoryToken(EntryProduct),
					useValue: mockEntryProductRepository,
				},
				{
					provide: getRepositoryToken(EntryImage),
					useValue: mockEntryImageRepository,
				},
			],
		}).compile();

		service = module.get<EntriesService>(EntriesService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("getEntries", () => {
		it("should return all entries for a user", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.getEntries(mockUserId);

			expect(mockEntryRepository.find).toHaveBeenCalledWith({
				where: {
					userId: mockUserId,
					date: undefined,
				},
				relations: {
					activities: true,
					lawnSegments: true,
					entryProducts: { product: true },
					entryImages: true,
				},
			});
			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].id).toBe(mockEntry.id);
			}
		});

		it("should return entries within date range", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.getEntries(
				mockUserId,
				"2024-06-01",
				"2024-06-30",
			);

			expect(mockEntryRepository.find).toHaveBeenCalled();
			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value).toHaveLength(1);
			}
		});

		it("should return error when no entries exist", async () => {
			mockEntryRepository.find.mockResolvedValue(null);

			const result = await service.getEntries(mockUserId);

			expect(result.isError()).toBe(true);
			expect(result.value).toBeInstanceOf(EntriesNotFound);
		});
	});

	describe("getEntry", () => {
		it("should return a single entry by ID", async () => {
			mockEntryRepository.findOne.mockResolvedValue(mockEntry);

			const result = await service.getEntry(1);

			expect(mockEntryRepository.findOne).toHaveBeenCalledWith({
				where: { id: 1 },
				relations: {
					activities: true,
					lawnSegments: true,
					entryProducts: { product: true },
					entryImages: true,
				},
			});
			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value.id).toBe(1);
			}
		});

		it("should return error when entry does not exist", async () => {
			mockEntryRepository.findOne.mockResolvedValue(null);

			const result = await service.getEntry(999);

			expect(result.isError()).toBe(true);
			expect(result.value).toBeInstanceOf(EntryNotFound);
		});
	});

	describe("getEntryByDate", () => {
		it("should return entry for specific date", async () => {
			mockEntryRepository.findOne.mockResolvedValue(mockEntry);

			const result = await service.getEntryByDate(mockUserId, "2024-06-15");

			expect(mockEntryRepository.findOne).toHaveBeenCalled();
			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value.id).toBe(mockEntry.id);
			}
		});

		it("should return error when no entry exists for date", async () => {
			mockEntryRepository.findOne.mockResolvedValue(null);

			const result = await service.getEntryByDate(mockUserId, "2024-01-01");

			expect(result.isError()).toBe(true);
			expect(result.value).toBeInstanceOf(EntryNotFound);
		});
	});

	describe("getMostRecentEntry", () => {
		it("should return the most recent entry", async () => {
			mockEntryRepository.findOne.mockResolvedValue(mockEntry);

			const result = await service.getMostRecentEntry(mockUserId);

			expect(mockEntryRepository.findOne).toHaveBeenCalled();
			expect(result?.id).toBe(mockEntry.id);
		});

		it("should return null when no entries exist", async () => {
			mockEntryRepository.findOne.mockResolvedValue(null);

			const result = await service.getMostRecentEntry(mockUserId);

			expect(result).toBeNull();
		});
	});

	describe("getLastMowDate", () => {
		it("should return the last mow date", async () => {
			mockEntryRepository.findOne.mockResolvedValue(mockEntry);

			const result = await service.getLastMowDate(mockUserId);

			expect(mockEntryRepository.findOne).toHaveBeenCalledWith({
				where: {
					userId: mockUserId,
					date: expect.anything(),
					activities: { id: ACTIVITY_IDS.MOW },
				},
				order: {
					date: "DESC",
					time: "DESC",
				},
			});
			expect(result).toEqual(mockEntry.date);
		});

		it("should return null when no mow entries exist", async () => {
			mockEntryRepository.findOne.mockResolvedValue(null);

			const result = await service.getLastMowDate(mockUserId);

			expect(result).toBeNull();
		});
	});

	describe("getLastProductApplicationDate", () => {
		it("should return the last product application date", async () => {
			const mockQueryBuilder = {
				leftJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				getOne: jest.fn().mockResolvedValue(mockEntryWithProducts),
			};
			mockEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await service.getLastProductApplicationDate(mockUserId);

			expect(result).toEqual(mockEntryWithProducts.date);
		});

		it("should return null when no product application entries exist", async () => {
			const mockQueryBuilder = {
				leftJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				getOne: jest.fn().mockResolvedValue(null),
			};
			mockEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await service.getLastProductApplicationDate(mockUserId);

			expect(result).toBeNull();
		});
	});

	describe("getLastPgrApplicationDate", () => {
		it("should return the last PGR application date", async () => {
			const pgrEntry = {
				...mockEntry,
				entryProducts: [
					{
						product: { category: "pgr" },
					},
				],
			};
			const mockQueryBuilder = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				getOne: jest.fn().mockResolvedValue(pgrEntry),
			};
			mockEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await service.getLastPgrApplicationDate(mockUserId);

			expect(result).toEqual(pgrEntry.date);
		});

		it("should return null when no PGR entries exist", async () => {
			const mockQueryBuilder = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				getOne: jest.fn().mockResolvedValue(null),
			};
			mockEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await service.getLastPgrApplicationDate(mockUserId);

			expect(result).toBeNull();
		});
	});

	describe("createEntry", () => {
		it("should create a new entry", async () => {
			const entryRequest = {
				date: new Date("2024-06-15"),
				time: "10:00",
				title: "Morning mow",
				notes: "Cut at 3 inches",
				mowingHeight: 3,
				soilTemperature: null,
				soilTemperatureUnit: "F",
				entryProducts: [],
				entryImages: [],
				activityIds: [ACTIVITY_IDS.MOW],
				lawnSegmentIds: [1],
				products: [],
				imageUrls: [],
			};

			mockEntryRepository.create.mockReturnValue(mockEntry);
			mockEntryRepository.save.mockResolvedValue(mockEntry);

			const result = await service.createEntry(mockUserId, entryRequest as any);

			expect(mockEntryRepository.create).toHaveBeenCalled();
			expect(mockEntryRepository.save).toHaveBeenCalled();
			expect(result).toEqual(mockEntry);
		});

		it("should create entry with products", async () => {
			const entryRequest = {
				date: new Date("2024-06-15"),
				time: "10:00",
				title: "Fertilizer application",
				notes: "",
				soilTemperature: null,
				soilTemperatureUnit: "F",
				entryProducts: [],
				entryImages: [],
				activityIds: [ACTIVITY_IDS.PRODUCT_APPLICATION],
				lawnSegmentIds: [1],
				products: [
					{ productId: 1, productQuantity: 2, productQuantityUnit: "lbs" },
				],
				imageUrls: [],
			};

			mockEntryRepository.create.mockReturnValue(mockEntryWithProducts);
			mockEntryRepository.save.mockResolvedValue(mockEntryWithProducts);

			const result = await service.createEntry(mockUserId, entryRequest as any);

			expect(mockEntryRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: mockUserId,
					entryProducts: expect.arrayContaining([
						expect.objectContaining({
							product: { id: 1 },
							productQuantity: 2,
							productQuantityUnit: "lbs",
						}),
					]),
				}),
			);
			expect(result).toEqual(mockEntryWithProducts);
		});

		it("should create entry with image URLs", async () => {
			const entryRequest = {
				date: new Date("2024-06-15"),
				time: "10:00",
				title: "Photo entry",
				notes: "",
				soilTemperature: null,
				soilTemperatureUnit: "F",
				entryProducts: [],
				entryImages: [],
				activityIds: [],
				lawnSegmentIds: [],
				products: [],
				imageUrls: ["https://example.com/image1.jpg"],
			};

			const entryWithImages = {
				...mockEntry,
				entryImages: [{ imageUrl: "https://example.com/image1.jpg" }],
			};

			mockEntryRepository.create.mockReturnValue(entryWithImages);
			mockEntryRepository.save.mockResolvedValue(entryWithImages);

			await service.createEntry(mockUserId, entryRequest as any);

			expect(mockEntryRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					entryImages: [{ imageUrl: "https://example.com/image1.jpg" }],
				}),
			);
		});
	});

	describe("createEntriesBatch", () => {
		const createMockEntryRequest = (overrides = {}) => ({
			date: new Date("2024-06-15"),
			time: "10:00",
			title: "Entry",
			notes: "",
			soilTemperature: null,
			soilTemperatureUnit: "F",
			entryProducts: [],
			entryImages: [],
			activityIds: [],
			lawnSegmentIds: [],
			products: [],
			imageUrls: [],
			...overrides,
		});

		it("should create multiple entries successfully", async () => {
			const batchRequest = {
				entries: [
					createMockEntryRequest({ title: "Entry 1" }),
					createMockEntryRequest({
						title: "Entry 2",
						date: new Date("2024-06-16"),
					}),
				],
			};

			mockEntryRepository.create.mockReturnValue(mockEntry);
			mockEntryRepository.save.mockResolvedValue(mockEntry);

			const result = await service.createEntriesBatch(
				mockUserId,
				batchRequest as any,
			);

			expect(result.created).toBe(2);
			expect(result.failed).toBe(0);
			expect(result.entries).toHaveLength(2);
			expect(result.errors).toBeUndefined();
		});

		it("should handle partial failures in batch creation", async () => {
			const batchRequest = {
				entries: [
					createMockEntryRequest({ title: "Entry 1" }),
					createMockEntryRequest({ title: "Entry 2" }),
				],
			};

			mockEntryRepository.create
				.mockReturnValueOnce(mockEntry)
				.mockImplementationOnce(() => {
					throw new Error("Database error");
				});
			mockEntryRepository.save.mockResolvedValue(mockEntry);

			const result = await service.createEntriesBatch(
				mockUserId,
				batchRequest as any,
			);

			expect(result.created).toBe(1);
			expect(result.failed).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors?.[0].index).toBe(1);
		});
	});

	describe("updateEntry", () => {
		it("should update an existing entry", async () => {
			const updateData = {
				title: "Updated title",
				notes: "Updated notes",
				activityIds: [ACTIVITY_IDS.MOW],
				lawnSegmentIds: [1],
				products: [],
			};

			const existingEntry = {
				...mockEntry,
				entryProducts: [],
				entryImages: [],
			};
			mockEntryRepository.findOne.mockResolvedValue(existingEntry);
			mockEntryRepository.merge.mockReturnValue({
				...existingEntry,
				...updateData,
			});
			mockEntryRepository.save.mockResolvedValue({
				...existingEntry,
				...updateData,
			});

			const result = await service.updateEntry(1, updateData);

			expect(mockEntryRepository.findOne).toHaveBeenCalledWith({
				where: { id: 1 },
				relations: {
					lawnSegments: true,
					activities: true,
					entryProducts: true,
					entryImages: true,
				},
			});
			expect(mockEntryRepository.save).toHaveBeenCalled();
			expect(result.isSuccess()).toBe(true);

			if (result.isSuccess()) {
				expect(result.value.title).toBe("Updated title");
			}
		});

		it("should return error when entry does not exist", async () => {
			mockEntryRepository.findOne.mockResolvedValue(null);

			const result = await service.updateEntry(999, { title: "Test" });

			expect(result.isError()).toBe(true);
			expect(result.value).toBeInstanceOf(EntryNotFound);
		});

		it("should remove existing products before updating", async () => {
			const existingProducts = [{ entryId: 1, productId: 1 }];
			const existingEntry = {
				...mockEntry,
				entryProducts: existingProducts,
				entryImages: [],
			};
			mockEntryRepository.findOne.mockResolvedValue(existingEntry);
			mockEntryRepository.merge.mockReturnValue(existingEntry);
			mockEntryRepository.save.mockResolvedValue(existingEntry);

			await service.updateEntry(1, { products: [] });

			expect(mockEntryProductRepository.remove).toHaveBeenCalledWith(
				existingProducts,
			);
		});
	});

	describe("softDeleteEntry", () => {
		it("should soft delete an entry", async () => {
			mockEntryRepository.findOne.mockResolvedValue(mockEntry);
			mockEntryRepository.softDelete.mockResolvedValue({ affected: 1 });

			await service.softDeleteEntry(1);

			expect(mockEntryRepository.softDelete).toHaveBeenCalledWith(1);
		});

		it("should return error when entry does not exist", async () => {
			mockEntryRepository.findOne.mockResolvedValue(null);

			const result = await service.softDeleteEntry(999);

			expect(result.isError()).toBe(true);
			expect(result.value).toBeInstanceOf(EntryNotFound);
		});
	});

	describe("recoverEntry", () => {
		it("should recover a soft-deleted entry", async () => {
			mockEntryRepository.restore.mockResolvedValue({ affected: 1 });

			await service.recoverEntry(1);

			expect(mockEntryRepository.restore).toHaveBeenCalledWith(1);
		});
	});

	describe("searchEntries", () => {
		const createSearchRequest = (overrides = {}) => ({
			dateRange: [],
			titleOrNotes: "",
			activities: [],
			lawnSegments: [],
			products: [],
			...overrides,
		});

		it("should search entries with default date range", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.searchEntries(
				mockUserId,
				createSearchRequest(),
			);

			expect(mockEntryRepository.find).toHaveBeenCalled();
			expect(result).toHaveLength(1);
		});

		it("should search entries with custom date range", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.searchEntries(
				mockUserId,
				createSearchRequest({
					dateRange: ["2024-06-01", "2024-06-30"],
				}),
			);

			expect(mockEntryRepository.find).toHaveBeenCalled();
			expect(result).toHaveLength(1);
		});

		it("should search entries by activities", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.searchEntries(
				mockUserId,
				createSearchRequest({
					activities: [ACTIVITY_IDS.MOW],
				}),
			);

			expect(mockEntryRepository.find).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						activities: { id: expect.anything() },
					}),
				}),
			);
			expect(result).toHaveLength(1);
		});

		it("should search entries by lawn segments", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.searchEntries(
				mockUserId,
				createSearchRequest({
					lawnSegments: [1],
				}),
			);

			expect(mockEntryRepository.find).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						lawnSegments: { id: expect.anything() },
					}),
				}),
			);
			expect(result).toHaveLength(1);
		});

		it("should search entries by products", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntryWithProducts]);

			const result = await service.searchEntries(
				mockUserId,
				createSearchRequest({
					products: [1],
				}),
			);

			expect(mockEntryRepository.find).toHaveBeenCalled();
			expect(result).toHaveLength(1);
		});

		it("should search entries by title or notes", async () => {
			mockEntryRepository.find.mockResolvedValue([mockEntry]);

			const result = await service.searchEntries(
				mockUserId,
				createSearchRequest({
					titleOrNotes: "mow",
				}),
			);

			expect(mockEntryRepository.find).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.arrayContaining([
						expect.objectContaining({ title: expect.anything() }),
						expect.objectContaining({ notes: expect.anything() }),
					]),
				}),
			);
			expect(result).toHaveLength(1);
		});
	});

	describe("softDeleteEntryImage", () => {
		it("should soft delete an entry image", async () => {
			mockEntryImageRepository.softDelete.mockResolvedValue({ affected: 1 });

			await service.softDeleteEntryImage(1);

			expect(mockEntryImageRepository.softDelete).toHaveBeenCalledWith(1);
		});
	});

	describe("recoverEntryImage", () => {
		it("should recover a soft-deleted entry image", async () => {
			mockEntryImageRepository.restore.mockResolvedValue({ affected: 1 });

			await service.recoverEntryImage(1);

			expect(mockEntryImageRepository.restore).toHaveBeenCalledWith(1);
		});
	});
});
