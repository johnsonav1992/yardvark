import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { Auth0TokenPayload } from 'src/types/auth.types';
import { ExtractedUserRequestData } from 'src/types/request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const domain = configService.get<string>('AUTH0_DOMAIN');

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
      audience: `https://${domain}/api/v2/`,
      issuer: `https://${domain}/`,
    });
  }

  validate(payload: Auth0TokenPayload): ExtractedUserRequestData {
    const email = payload['https://yardvark.netlify.app/email'];
    const firstName = payload['https://yardvark.netlify.app/first-name'];
    const lastName = payload['https://yardvark.netlify.app/last-name'];
    const fullName = payload['https://yardvark.netlify.app/name'];

    const name =
      fullName ||
      (firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName || email || 'Unknown User');

    return {
      userId: payload.sub,
      email,
      name,
    };
  }
}
