import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn().mockImplementation((params) => params),
  };
});

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('abcd-1234-5678-efgh'),
}));

jest.mock('heic-convert', () =>
  jest.fn().mockResolvedValue(Buffer.from('converted-jpeg-data')),
);

describe('S3Service', () => {
  let service: S3Service;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const originalEnv = process.env;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-file-content'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      AWS_REGION_YARDVARK: 'us-east-1',
      AWS_ACCESS_KEY_ID_YARDVARK: 'test-access-key',
      AWS_SECRET_ACCESS_KEY_YARDVARK: 'test-secret-key',
      AWS_S3_BUCKET_YARDVARK: 'test-bucket',
    };

    mockSend.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully and return URL', async () => {
      const result = await service.uploadFile(mockFile, 'user-123');

      expect(result).toContain(
        'https://test-bucket.s3.us-east-1.amazonaws.com/',
      );
      expect(result).toContain('user-123');
      expect(result).toContain('test-image.jpg');
    });

    it('should call S3 send with correct parameters', async () => {
      await service.uploadFile(mockFile, 'user-123');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: expect.stringContaining('user-123'),
          Body: mockFile.buffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
        }),
      );
    });

    it('should generate unique key with userId prefix', async () => {
      const result = await service.uploadFile(mockFile, 'user-456');

      expect(result).toContain('user-456');
    });

    it('should handle different file types', async () => {
      const pngFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'image.png',
        mimetype: 'image/png',
      };

      await service.uploadFile(pngFile, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/png',
        }),
      );
    });

    it('should URL encode the file key', async () => {
      const fileWithSpaces: Express.Multer.File = {
        ...mockFile,
        originalname: 'test image with spaces.jpg',
      };

      const result = await service.uploadFile(fileWithSpaces, 'user-123');

      expect(result).toContain(
        encodeURIComponent('test image with spaces.jpg'),
      );
    });

    it('should handle special characters in filename', async () => {
      const fileWithSpecialChars: Express.Multer.File = {
        ...mockFile,
        originalname: 'image@#$%.jpg',
      };

      const result = await service.uploadFile(fileWithSpecialChars, 'user-123');

      expect(result).toBeDefined();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when S3 upload fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('S3 upload failed'));

      await expect(service.uploadFile(mockFile, 'user-123')).rejects.toThrow(
        'S3 upload failed',
      );
    });
  });

  describe('uploadFiles', () => {
    const mockFiles: Express.Multer.File[] = [
      { ...mockFile, originalname: 'image1.jpg' },
      { ...mockFile, originalname: 'image2.jpg' },
      { ...mockFile, originalname: 'image3.jpg' },
    ];

    it('should upload multiple files and return array of URLs', async () => {
      const results = await service.uploadFiles(mockFiles, 'user-123');

      expect(results).toHaveLength(3);
      expect(results[0]).toContain('image1.jpg');
      expect(results[1]).toContain('image2.jpg');
      expect(results[2]).toContain('image3.jpg');
    });

    it('should call S3 send for each file', async () => {
      await service.uploadFiles(mockFiles, 'user-123');

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should handle empty file array', async () => {
      const results = await service.uploadFiles([], 'user-123');

      expect(results).toEqual([]);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle single file in array', async () => {
      const singleFile = [mockFile];

      const results = await service.uploadFiles(singleFile, 'user-123');

      expect(results).toHaveLength(1);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should respect concurrency limit', async () => {
      const manyFiles: Express.Multer.File[] = Array(12)
        .fill(null)
        .map((_, i) => ({
          ...mockFile,
          originalname: `image${i}.jpg`,
        }));

      const results = await service.uploadFiles(manyFiles, 'user-123', 5);

      expect(results).toHaveLength(12);
      expect(mockSend).toHaveBeenCalledTimes(12);
    });

    it('should use default concurrency of 5', async () => {
      const sixFiles: Express.Multer.File[] = Array(6)
        .fill(null)
        .map((_, i) => ({
          ...mockFile,
          originalname: `image${i}.jpg`,
        }));

      const results = await service.uploadFiles(sixFiles, 'user-123');

      expect(results).toHaveLength(6);
    });

    it('should propagate error if one upload fails', async () => {
      mockSend
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({});

      await expect(service.uploadFiles(mockFiles, 'user-123')).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('HEIC conversion', () => {
    const heicFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'photo.heic',
      mimetype: 'image/heic',
    };

    it('should convert HEIC file to JPEG', async () => {
      const result = await service.uploadFile(heicFile, 'user-123');

      expect(result).toContain('.jpg');
      expect(result).not.toContain('.heic');
    });

    it('should detect HEIC by mimetype image/heic', async () => {
      const heicByMimetype: Express.Multer.File = {
        ...mockFile,
        originalname: 'photo.unknown',
        mimetype: 'image/heic',
      };

      await service.uploadFile(heicByMimetype, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should detect HEIC by mimetype image/heif', async () => {
      const heifFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'photo.heif',
        mimetype: 'image/heif',
      };

      await service.uploadFile(heifFile, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should detect HEIC by file extension', async () => {
      const heicByExtension: Express.Multer.File = {
        ...mockFile,
        originalname: 'photo.HEIC',
        mimetype: 'application/octet-stream',
      };

      await service.uploadFile(heicByExtension, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should upload converted JPEG buffer', async () => {
      await service.uploadFile(heicFile, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Body: Buffer.from('converted-jpeg-data'),
        }),
      );
    });

    it('should not convert non-HEIC files', async () => {
      const jpegFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
      };

      await service.uploadFile(jpegFile, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/jpeg',
          Body: jpegFile.buffer,
        }),
      );
    });

    it('should throw error when HEIC conversion fails', async () => {
      const heicConvert = jest.requireMock('heic-convert');
      heicConvert.mockRejectedValueOnce(new Error('Conversion failed'));

      await expect(service.uploadFile(heicFile, 'user-123')).rejects.toThrow(
        'Failed to convert HEIC file: Conversion failed',
      );
    });
  });

  describe('file key generation', () => {
    it('should include userId in the key', async () => {
      await service.uploadFile(mockFile, 'user-xyz');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringContaining('user-xyz/'),
        }),
      );
    });

    it('should include original filename in the key', async () => {
      await service.uploadFile(mockFile, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringContaining('test-image.jpg'),
        }),
      );
    });

    it('should include UUID prefix for uniqueness', async () => {
      await service.uploadFile(mockFile, 'user-123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/user-123\/abcd-test-image\.jpg/),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.uploadFile(mockFile, 'user-123')).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle permission errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access Denied'));

      await expect(service.uploadFile(mockFile, 'user-123')).rejects.toThrow(
        'Access Denied',
      );
    });

    it('should handle bucket not found errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('NoSuchBucket'));

      await expect(service.uploadFile(mockFile, 'user-123')).rejects.toThrow(
        'NoSuchBucket',
      );
    });
  });
});
