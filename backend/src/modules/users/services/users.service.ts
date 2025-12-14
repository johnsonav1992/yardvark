import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { User } from '../Models/user.model';
import { S3Service } from 'src/modules/s3/s3.service';

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

  async getManagementToken(): Promise<string> {
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

    return response.data.access_token;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<any> {
    const token = await this.getManagementToken();

    const response = await firstValueFrom(
      this.httpService.patch(`${this.usersUrl}/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );

    return response.data;
  }

  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ picture: string }> {
    const profilePictureFile = {
      ...file,
      originalname: `profile-picture-${Date.now()}.${file.originalname.split('.').pop()}`,
    };

    const pictureUrl = await this.s3Service.uploadFile(
      profilePictureFile,
      `${userId}/profile`,
    );

    await this.updateUser(userId, { picture: pictureUrl } as Partial<User>);

    return { picture: pictureUrl };
  }
}
