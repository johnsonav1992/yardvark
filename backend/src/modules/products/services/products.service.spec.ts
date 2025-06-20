import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from '../models/products.model';
import { UserHiddenProduct } from '../models/userHiddenProducts.model';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let userHiddenProductRepository: Repository<UserHiddenProduct>;

  const mockProductRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserHiddenProductRepository = {
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(UserHiddenProduct),
          useValue: mockUserHiddenProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    userHiddenProductRepository = module.get<Repository<UserHiddenProduct>>(
      getRepositoryToken(UserHiddenProduct),
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    const mockUserId = 'user123';
    const mockProducts = [
      {
        id: 1,
        name: 'Product 1',
        userId: 'user123',
        brand: 'Brand A',
        category: 'fertilizer',
        description: 'Test product 1',
        createdAt: new Date(),
        entryProducts: [],
      },
      {
        id: 2,
        name: 'Product 2',
        userId: 'system',
        brand: 'Brand B',
        category: 'herbicide',
        description: 'Test product 2',
        createdAt: new Date(),
        entryProducts: [],
      },
      {
        id: 3,
        name: 'Product 3',
        userId: 'user123',
        brand: 'Brand C',
        category: 'pesticide',
        description: 'Test product 3',
        createdAt: new Date(),
        entryProducts: [],
      },
    ] as Product[];

    const mockHiddenProducts = [{ userId: 'user123', productId: 2 }];

    beforeEach(() => {
      mockProductRepository.find.mockResolvedValue(mockProducts);
      mockUserHiddenProductRepository.find.mockResolvedValue(
        mockHiddenProducts,
      );
    });

    it('should return all products (user and system) with hidden status', async () => {
      const result = await service.getProducts(mockUserId);

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: [{ userId: mockUserId }, { userId: 'system' }],
      });
      expect(mockUserHiddenProductRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      expect(result).toEqual([
        { ...mockProducts[0], isHidden: false },
        { ...mockProducts[1], isHidden: true },
        { ...mockProducts[2], isHidden: false },
      ]);
    });

    it('should return only user products when userOnly option is true', async () => {
      await service.getProducts(mockUserId, { userOnly: true });

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: [{ userId: mockUserId }],
      });
    });

    it('should return only system products when systemOnly option is true', async () => {
      await service.getProducts(mockUserId, { systemOnly: true });

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        where: [{ userId: 'system' }],
      });
    });

    it('should handle empty products array', async () => {
      mockProductRepository.find.mockResolvedValue([]);
      mockUserHiddenProductRepository.find.mockResolvedValue([]);

      const result = await service.getProducts(mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle no hidden products', async () => {
      mockUserHiddenProductRepository.find.mockResolvedValue([]);

      const result = await service.getProducts(mockUserId);

      expect(result).toEqual([
        { ...mockProducts[0], isHidden: false },
        { ...mockProducts[1], isHidden: false },
        { ...mockProducts[2], isHidden: false },
      ]);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockProductRepository.find.mockRejectedValue(error);

      await expect(service.getProducts(mockUserId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('addProduct', () => {
    const mockProduct: Partial<Product> = {
      name: 'New Product',
      userId: 'user123',
      brand: 'Test Brand',
      category: 'fertilizer',
      description: 'A new product',
      price: 29.99,
      quantityUnit: 'kg',
      applicationRate: '1 kg per 100 sq ft',
      applicationMethod: 'spray',
      coverage: 1000,
      coverageUnit: 'sq ft',
      guaranteedAnalysis: 'N-P-K 10-10-10',
      containerType: 'bag',
      imageUrl: 'https://example.com/image.jpg',
      labelUrl: 'https://example.com/label.pdf',
    };

    const mockCreatedProduct = { ...mockProduct, id: 1 } as Product;
    const mockSavedProduct = { ...mockProduct, id: 1 } as Product;

    beforeEach(() => {
      mockProductRepository.create.mockReturnValue(mockCreatedProduct);
      mockProductRepository.save.mockResolvedValue(mockSavedProduct);
    });

    it('should create and save a new product', async () => {
      const result = await service.addProduct(mockProduct as Product);

      expect(mockProductRepository.create).toHaveBeenCalledWith(mockProduct);
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        mockCreatedProduct,
      );
      expect(result).toEqual(mockSavedProduct);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      mockProductRepository.create.mockImplementation(() => {
        throw error;
      });

      await expect(service.addProduct(mockProduct as Product)).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockProductRepository.save.mockRejectedValue(error);

      await expect(service.addProduct(mockProduct as Product)).rejects.toThrow(
        'Save failed',
      );
    });
  });

  describe('hideProduct', () => {
    const mockUserId = 'user123';
    const mockProductId = 1;

    beforeEach(() => {
      mockUserHiddenProductRepository.save.mockResolvedValue({
        userId: mockUserId,
        productId: mockProductId,
      });
    });

    it('should save a hidden product record', async () => {
      await service.hideProduct(mockUserId, mockProductId);

      expect(mockUserHiddenProductRepository.save).toHaveBeenCalledWith({
        userId: mockUserId,
        productId: mockProductId,
      });
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockUserHiddenProductRepository.save.mockRejectedValue(error);

      await expect(
        service.hideProduct(mockUserId, mockProductId),
      ).rejects.toThrow('Save failed');
    });

    it('should work with different user IDs', async () => {
      const differentUserId = 'user456';

      await service.hideProduct(differentUserId, mockProductId);

      expect(mockUserHiddenProductRepository.save).toHaveBeenCalledWith({
        userId: differentUserId,
        productId: mockProductId,
      });
    });

    it('should work with different product IDs', async () => {
      const differentProductId = 999;

      await service.hideProduct(mockUserId, differentProductId);

      expect(mockUserHiddenProductRepository.save).toHaveBeenCalledWith({
        userId: mockUserId,
        productId: differentProductId,
      });
    });
  });

  describe('unhideProduct', () => {
    const mockUserId = 'user123';
    const mockProductId = 1;

    beforeEach(() => {
      mockUserHiddenProductRepository.delete.mockResolvedValue({ affected: 1 });
    });

    it('should delete a hidden product record', async () => {
      await service.unhideProduct(mockUserId, mockProductId);

      expect(mockUserHiddenProductRepository.delete).toHaveBeenCalledWith({
        userId: mockUserId,
        productId: mockProductId,
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockUserHiddenProductRepository.delete.mockRejectedValue(error);

      await expect(
        service.unhideProduct(mockUserId, mockProductId),
      ).rejects.toThrow('Delete failed');
    });

    it('should work with different user IDs', async () => {
      const differentUserId = 'user456';

      await service.unhideProduct(differentUserId, mockProductId);

      expect(mockUserHiddenProductRepository.delete).toHaveBeenCalledWith({
        userId: differentUserId,
        productId: mockProductId,
      });
    });

    it('should work with different product IDs', async () => {
      const differentProductId = 999;

      await service.unhideProduct(mockUserId, differentProductId);

      expect(mockUserHiddenProductRepository.delete).toHaveBeenCalledWith({
        userId: mockUserId,
        productId: differentProductId,
      });
    });

    it('should handle case where no record is found to delete', async () => {
      mockUserHiddenProductRepository.delete.mockResolvedValue({ affected: 0 });

      await service.unhideProduct(mockUserId, mockProductId);

      expect(mockUserHiddenProductRepository.delete).toHaveBeenCalledWith({
        userId: mockUserId,
        productId: mockProductId,
      });
    });
  });
});
