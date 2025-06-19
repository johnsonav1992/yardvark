import type { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { User } from '../Models/user.model';

@Injectable()
export class UsersService {
	private readonly auth0Domain: string = '';
	private readonly clientId: string = '';
	private readonly clientSecret: string = '';
	private readonly usersUrl: string = '';

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService
	) {
		this.auth0Domain = this.configService.get<string>('AUTH0_DOMAIN')!;
		this.clientId = this.configService.get<string>('AUTH0_BACKEND_CLIENT_ID')!;
		this.clientSecret = this.configService.get<string>(
			'AUTH0_BACKEND_CLIENT_SECRET'
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
					grant_type: 'client_credentials'
				}
			)
		);

		return response.data.access_token;
	}

	async updateUser(userId: string, userData: Partial<User>): Promise<any> {
		const token = await this.getManagementToken();

		const response = await firstValueFrom(
			this.httpService.patch(`${this.usersUrl}/${userId}`, userData, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})
		);

		return response.data;
	}
}
