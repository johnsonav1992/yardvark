import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { FilesController } from '../../../modules/files/controllers/files.controller';
import { S3Service } from 'src/modules/s3/s3.service';

describe('FilesController', () => {
  let controller: FilesController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let s3Service: S3Service;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let httpService: HttpService;

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
    getPresignedUploadUrl: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    s3Service = module.get<S3Service>(S3Service);
    httpService = module.get<HttpService>(HttpService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
