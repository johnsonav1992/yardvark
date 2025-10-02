import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const flagName = this.reflector.getAllAndOverride<string>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!flagName) return true;

    const isEnabled = this.configService.get<string>(flagName) === 'true';

    if (!isEnabled) {
      throw new HttpException(
        'This feature is currently unavailable',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    return true;
  }
}
