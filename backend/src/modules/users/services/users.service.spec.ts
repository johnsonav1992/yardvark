import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
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
        AUTH0_DOMAIN: 'test.auth0.com',
        AUTH0_BACKEND_CLIENT_ID: 'test-client-id',
        AUTH0_BACKEND_CLIENT_SECRET: 'test-client-secret',
      };
      return config[key];
    }),
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getManagementToken', () => {
    it('should fetch and return management token from Auth0', async () => {
      const mockToken = 'mock-access-token-123';
      mockHttpService.post.mockReturnValue(
        of({ data: { access_token: mockToken } }),
      );

      const result = await service.getManagementToken();

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://test.auth0.com/oauth/token',
        {
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          audience: 'https://dev-w4uj6ulyqeacwtfi.us.auth0.com/api/v2/',
          grant_type: 'client_credentials',
        },
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('updateUser', () => {
    it('should update user with Auth0 management API', async () => {
      const mockToken = 'mock-access-token';
      const userId = 'auth0|user123';
      const userData = { name: 'John Doe', nickname: 'johnd' };
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
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch management token before updating user', async () => {
      const mockToken = 'mock-access-token';
      mockHttpService.post.mockReturnValue(
        of({ data: { access_token: mockToken } }),
      );
      mockHttpService.patch.mockReturnValue(of({ data: {} }));

      await service.updateUser('user123', { name: 'Test' });

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      expect(mockHttpService.patch).toHaveBeenCalledTimes(1);
    });
  });
});
