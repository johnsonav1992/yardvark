# Security Policy

## Overview

Yardvark is a lawn care management application that prioritizes user data security and privacy. This document outlines our security practices, known considerations, and guidelines for secure deployment.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Considerations for Public Rollout

### Authentication & Authorization

#### Current Implementation
- **Auth0 Integration**: The application uses Auth0 for authentication with JWT tokens
- **Global JWT Guard**: All API endpoints are protected by default with `JwtAuthGuard`
- **Public Routes**: Routes can be marked as public using the `@Public()` decorator
- **User Registration Restriction**: Currently using an email whitelist in Auth0 actions

#### For Public Access
To enable public user registration, the Auth0 action must be modified:

1. Navigate to Auth0 Dashboard → Actions → Flows → Pre User Registration
2. Either remove the `allowed-signup-filters` action OR
3. Update the `allowedEmails` secret to include all domains you want to allow OR
4. Modify the action logic to remove email restrictions entirely

**Warning**: Removing email restrictions will allow anyone to sign up. Ensure you have proper rate limiting and abuse prevention measures in place.

### API Security

#### Rate Limiting
**Status**: ⚠️ Not Currently Implemented

Rate limiting should be added to prevent API abuse:

```bash
npm install @nestjs/throttler
```

Add to `app.module.ts`:
```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    // ... other imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
```

#### Security Headers
**Status**: ⚠️ Not Currently Implemented

Helmet middleware should be added for security headers:

```bash
npm install helmet
```

Add to `main.ts`:
```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // ... rest of configuration
}
```

#### Input Validation
**Status**: ⚠️ Not Currently Implemented

Input validation and sanitization should be added:

```bash
npm install class-validator class-transformer
```

Add global validation pipe in `main.ts`:
```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO types
  }));
  // ... rest of configuration
}
```

### CORS Configuration

**Status**: ✅ Properly Configured

CORS is configured to allow:
- Production domain: `https://yardvark.netlify.app`
- Local development: `http://localhost:4200`
- Netlify previews: All deploy preview and branch preview domains

### Environment Variables

#### Sensitive Variables

The following environment variables contain sensitive information and must NEVER be committed to source control:

**Backend (.env)**:
- `AUTH0_DOMAIN` - Auth0 tenant domain
- `AUTH0_BACKEND_CLIENT_SECRET` - Auth0 machine-to-machine credentials
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key
- `MAILERSEND_API_KEY` - MailerSend API key
- `AWS_ACCESS_KEY_ID_YARDVARK` - AWS S3 access key
- `AWS_SECRET_ACCESS_KEY_YARDVARK` - AWS S3 secret key
- `AWS_REGION_YARDVARK` - AWS region
- `AWS_S3_BUCKET_YARDVARK` - AWS S3 bucket name
- Database credentials (if not using connection string)

**Frontend (environment.ts)**:
- `auth0ClientId` - While this is a public client ID, rotating it regularly is recommended
- `mapBoxPublicKey` - MapBox public API key (should be restricted by domain)

#### Environment File Management

**Status**: ✅ Backend properly configured, ⚠️ Frontend needs attention

- Backend `.env` files are properly ignored via `.gitignore`
- Frontend environment files are currently committed (by design for Angular)
- Use `.env.example` files (without actual secrets) as templates

**Note**: Frontend environment files in Angular are typically committed because they are compiled into the build. Sensitive secrets should NEVER be in frontend code. Only public configuration and API keys that are restricted by domain/origin should be in frontend environment files.

### API Keys & Third-Party Services

#### MapBox API Key
- **Exposure Level**: Public (committed in frontend code)
- **Risk**: LOW (public keys are designed for client-side use)
- **Mitigation**: 
  - Restrict the key to specific domains in MapBox dashboard
  - Monitor usage for anomalies
  - Rotate key if abuse is detected

#### Auth0 Client ID
- **Exposure Level**: Public (committed in frontend code)
- **Risk**: LOW (client IDs are designed to be public)
- **Mitigation**:
  - Ensure Auth0 application has proper CORS settings
  - Configure allowed callback/logout URLs
  - Enable brute force protection in Auth0

#### Backend API Keys
- **Exposure Level**: Private (environment variables)
- **Risk**: HIGH if exposed
- **Mitigation**:
  - Never commit to source control
  - Use environment variables
  - Rotate regularly
  - Use key restrictions where available (IP, domain)

### Database Security

**Status**: ✅ Using TypeORM with parameterized queries

- TypeORM is used for all database operations
- Parameterized queries prevent SQL injection
- No raw SQL queries detected in codebase

### Data Privacy

- User data is isolated per user via `userId` checks in all queries
- JWT tokens contain user identity extracted via `JwtStrategy`
- No cross-user data access vulnerabilities detected

### File Upload Security

**Status**: ✅ Using AWS S3 with controlled uploads

- Files are uploaded to AWS S3
- File type validation should be implemented
- File size limits should be enforced

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to the repository owner. Please do not open a public issue for security vulnerabilities.

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

We will respond to security reports within 48 hours.

## Security Checklist for Deployment

Before deploying to production with public access:

- [ ] Enable rate limiting
- [ ] Add helmet security headers
- [ ] Implement input validation
- [ ] Remove or modify Auth0 email whitelist
- [ ] Verify all environment variables are set correctly
- [ ] Ensure `.env` files are not committed
- [ ] Restrict MapBox API key to production domains
- [ ] Configure Auth0 allowed callback URLs
- [ ] Enable Auth0 brute force protection
- [ ] Set up monitoring and alerting
- [ ] Review and test CORS configuration
- [ ] Implement file upload validation and limits
- [ ] Set up database backups
- [ ] Configure logging for security events
- [ ] Test authentication flows
- [ ] Verify authorization on all endpoints

## Best Practices

1. **Keep Dependencies Updated**: Regularly update npm packages to patch security vulnerabilities
2. **Use Strong Secrets**: Generate strong, random secrets for all API keys and tokens
3. **Principle of Least Privilege**: Grant minimal necessary permissions to services
4. **Regular Security Audits**: Review code and configurations regularly
5. **Monitor Logs**: Watch for suspicious activity patterns
6. **Backup Regularly**: Maintain regular database and configuration backups
7. **Test Security**: Include security testing in your CI/CD pipeline

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [Auth0 Security Best Practices](https://auth0.com/docs/secure)
- [Angular Security Guide](https://angular.dev/best-practices/security)
