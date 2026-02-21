import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { User } from '../Models/user.model';
import { S3Service } from 'src/modules/s3/s3.service';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';
import { Either, error, success } from '../../../types/either';
import {
  Auth0TokenError,
  UserUpdateError,
  ProfilePictureUploadError,
} from '../Models/user.errors';

@Injectable()
export class UsersService {
  private readonly auth0Domain: string = '';
  private readonly clientId: string = '';
  private readonly clientSecret: string = '';
  private readonly usersUrl: string = '';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    this.auth0Domain = this.configService.get<string>('AUTH0_DOMAIN')!;
    this.clientId = this.configService.get<string>('AUTH0_BACKEND_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>(
      'AUTH0_BACKEND_CLIENT_SECRET',
    )!;
    this.usersUrl = `https://${this.auth0Domain}/api/v2/users`;
  }

  public async getManagementToken(): Promise<Either<Auth0TokenError, string>> {
    const start = Date.now();
    let isSuccess = true;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ access_token: string }>(
          `https://${this.auth0Domain}/oauth/token`,
          {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            audience: 'https://dev-w4uj6ulyqeacwtfi.us.auth0.com/api/v2/',
            grant_type: 'client_credentials',
          },
        ),
      );

      return success(response.data.access_token);
    } catch (err) {
      isSuccess = false;

      return error(new Auth0TokenError(err));
    } finally {
      LogHelpers.recordExternalCall(
        'auth0-token',
        Date.now() - start,
        isSuccess,
      );
    }
  }

  public async updateUser(
    userId: string,
    userData: Partial<User>,
  ): Promise<Either<UserUpdateError, any>> {
    const tokenResult = await this.getManagementToken();

    if (tokenResult.isError()) {
      return error(new UserUpdateError(tokenResult.value.error));
    }

    const token = tokenResult.value;
    const start = Date.now();
    let isSuccess = true;

    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.usersUrl}/${userId}`, userData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return success(response.data);
    } catch (err) {
      isSuccess = false;

      return error(new UserUpdateError(err));
    } finally {
      LogHelpers.recordExternalCall(
        'auth0-update',
        Date.now() - start,
        isSuccess,
      );
    }
  }

  public async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Either<ProfilePictureUploadError, { picture: string }>> {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.profilePictureUpdate,
      true,
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.fileSize, file.size);

    try {
      const profilePictureFile = {
        ...file,
        originalname: `profile-picture-${Date.now()}.${file.originalname.split('.').pop()}`,
      };

      const uploadResult = await this.s3Service.uploadFile(
        profilePictureFile,
        `${userId}/profile`,
      );

      if (uploadResult.isError()) {
        return error(new ProfilePictureUploadError(uploadResult.value.error));
      }

      const pictureUrl = uploadResult.value;

      const updateResult = await this.updateUser(userId, {
        picture: pictureUrl,
      } as Partial<User>);

      if (updateResult.isError()) {
        return error(new ProfilePictureUploadError(updateResult.value.error));
      }

      return success({ picture: pictureUrl });
    } catch (err) {
      return error(new ProfilePictureUploadError(err));
    }
  }
}
