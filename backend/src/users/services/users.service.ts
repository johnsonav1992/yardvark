import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  private readonly auth0Domain: string = '';
  private readonly clientId: string = '';
  private readonly clientSecret: string = '';
  private readonly audience: string = '';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.auth0Domain = this.configService.get<string>('AUTH0_DOMAIN')!;
    this.clientId = this.configService.get<string>('AUTH0_BACKEND_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>(
      'AUTH0_BACKEND_CLIENT_SECRET',
    )!;
    this.audience = this.configService.get<string>(
      'AUTH0_BACKEND_AUDIENCE_URL',
    )!;
  }

  async getManagementToken(): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post<{ access_token: string }>(
        `https://${this.auth0Domain}/oauth/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: this.audience,
          grant_type: 'client_credentials',
        },
      ),
    );

    return response.data.access_token;
  }
}
