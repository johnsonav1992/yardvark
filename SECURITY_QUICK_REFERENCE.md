# Security Quick Reference Guide

Quick reference for the security measures implemented in Yardvark.

## 🛡️ Security Features Implemented

### 1. Rate Limiting
**Location**: `backend/src/app.module.ts`

```typescript
// Configuration
ThrottlerModule.forRoot([{
  ttl: 60000,  // 60 seconds
  limit: 100,  // 100 requests per minute per IP
}])
```

**To skip rate limiting on a route**:
```typescript
import { SkipThrottle } from '../decorators/skip-throttle.decorator';

@SkipThrottle()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

**To customize rate limiting on a route**:
```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
@Post('sensitive-operation')
sensitiveOperation() {
  // ...
}
```

### 2. Security Headers (Helmet)
**Location**: `backend/src/main.ts`

```typescript
import helmet from 'helmet';
app.use(helmet());
```

**Headers added**:
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security`
- And more...

### 3. Input Validation
**Location**: `backend/src/main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

**How to use in DTOs**:
```typescript
import { IsString, IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
```

### 4. JWT Authentication
**Location**: `backend/src/guards/auth.guard.ts`

**Applied globally** via `APP_GUARD` in `app.module.ts`

**To make a route public**:
```typescript
import { Public } from '../decorators/public.decorator';

@Public()
@Get('public-data')
getPublicData() {
  return { data: 'Available to everyone' };
}
```

**To access user info in a protected route**:
```typescript
@Get('my-data')
getMyData(@Req() req: Request) {
  const userId = req.user.userId;
  const email = req.user.email;
  // ...
}
```

### 5. CORS Configuration
**Location**: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: [
    'https://yardvark.netlify.app',
    'http://localhost:4200',
    /^https:\/\/deploy-preview-\d+--yardvark\.netlify\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+--yardvark\.netlify\.app$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

### 6. Feature Flags
**Location**: `backend/src/guards/feature-flag.guard.ts`

**Usage**:
```typescript
import { FeatureFlag } from '../decorators/feature-flag.decorator';

@FeatureFlag('ENABLE_AI_FEATURES')
@Post('ai/generate')
generateAIContent() {
  // Only accessible if ENABLE_AI_FEATURES=true in .env
}
```

## 🔐 Environment Variables

### Backend Required
```bash
# Auth
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_BACKEND_CLIENT_ID=your_client_id
AUTH0_BACKEND_CLIENT_SECRET=your_secret

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=yardvark

# AWS S3
AWS_ACCESS_KEY_ID_YARDVARK=your_key
AWS_SECRET_ACCESS_KEY_YARDVARK=your_secret
AWS_REGION_YARDVARK=us-east-1
AWS_S3_BUCKET_YARDVARK=your_bucket

# AI Services
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key

# Email
MAILERSEND_API_KEY=your_key

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_FEATURES=true
```

## 📊 Monitoring

### Key Metrics to Watch
1. **Authentication failures** - Potential brute force attacks
2. **Rate limit hits** - May need adjustment
3. **4xx/5xx errors** - Application issues
4. **API response times** - Performance degradation
5. **Database connection pool** - Resource exhaustion
6. **Registration rate** - Unusual spikes

### Log Locations
- **Backend logs**: Check Railway logs or your log aggregation service
- **Auth0 logs**: Auth0 Dashboard → Monitoring → Logs
- **Database logs**: Your database provider's console

## 🚨 Common Issues & Solutions

### Rate Limiting Too Strict
**Problem**: Legitimate users hitting rate limits

**Solution**: Adjust in `app.module.ts`:
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 200, // Increase from 100 to 200
}])
```

### CORS Issues
**Problem**: Frontend can't reach backend

**Solution**: Verify origin in `main.ts` CORS config includes your domain

### Validation Errors
**Problem**: API rejecting valid requests

**Solution**: Check DTO validation decorators, ensure types match

### Auth0 Email Whitelist Blocking Users
**Problem**: New users can't register

**Solution**: See `auth0-actions/ENABLE_PUBLIC_ACCESS.md`

## 🔧 Development Tips

### Testing Locally
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd ../
npm install
npm start
```

### Testing Authentication
1. Get JWT token from browser DevTools (Application → Local Storage)
2. Use in API requests: `Authorization: Bearer <token>`

### Testing Rate Limiting
```bash
# Send 101 requests to trigger rate limit
for i in {1..101}; do
  curl http://localhost:8080/api/endpoint
done
```

### Bypassing Guards in Tests
```typescript
const mockGuard = { canActivate: jest.fn(() => true) };

TestingModule.overrideGuard(JwtAuthGuard)
  .useValue(mockGuard)
  .compile();
```

## 📚 Additional Resources

- **Full Security Guide**: See `SECURITY.md`
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Auth0 Public Access**: See `auth0-actions/ENABLE_PUBLIC_ACCESS.md`
- **Environment Setup**: See `.env.example` files

## 🆘 Emergency Procedures

### If Under Attack
1. Enable Auth0 email whitelist immediately
2. Lower rate limits: `limit: 10`
3. Check Auth0 logs for suspicious IPs
4. Block IPs at infrastructure level if possible
5. Enable Auth0 brute force protection

### If Database Compromised
1. Rotate database credentials immediately
2. Audit database access logs
3. Notify affected users if data exposed
4. Review and patch vulnerability
5. Restore from backup if necessary

### If API Keys Exposed
1. Revoke compromised keys immediately
2. Generate new keys
3. Update environment variables
4. Monitor for unauthorized usage
5. Review commit history to prevent future exposure

---

**Last Updated**: Date of security implementation
**Maintained By**: Development team
**Review Schedule**: Quarterly or after major changes
