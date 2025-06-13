import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { Auth0TokenPayload } from 'src/types/auth.types';
import { ExtractedUserRequestData } from 'src/types/request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const domain = configService.get<string>('AUTH0_DOMAIN');
    const audience = configService.get<string>('AUTH0_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
        handleSigningKeyError: (err) => console.error(err),
      }),
      algorithms: ['RS256'],
      audience,
      issuer: `https://${domain}/`,
    });
  }

  validate(payload: Auth0TokenPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      name:
        payload.given_name && payload.family_name
          ? `${payload.given_name} ${payload.family_name}`
          : payload.name || payload.nickname || payload.email || 'Unknown User',
    } satisfies ExtractedUserRequestData;
  }
}
