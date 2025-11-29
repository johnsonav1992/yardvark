# Pre-Production Deployment Checklist

Use this checklist before deploying Yardvark to production with public user registration enabled.

## Security Configuration

### Backend Security

- [x] Rate limiting enabled (@nestjs/throttler)
- [x] Helmet security headers configured
- [x] Input validation with class-validator
- [x] Global JWT authentication guard
- [x] CORS properly configured
- [x] All environment variables set in production
- [x] Database connection uses SSL in production
- [x] Error messages don't expose sensitive information

### Auth0 Configuration

- [ ] Email whitelist removed or modified (see `auth0-actions/ENABLE_PUBLIC_ACCESS.md`)
- [x] Brute force protection enabled
- [ ] Email verification required for new users
- [ ] Allowed Callback URLs configured:
  - [ ] `https://yardvark.netlify.app/callback`
  - [ ] Any other production URLs
- [ ] Allowed Logout URLs configured:
  - [ ] `https://yardvark.netlify.app`
  - [ ] Any other production URLs
- [ ] Allowed Web Origins configured
- [x] Social connections configured (if using)
- [ ] Custom domain configured (optional but recommended)

### API Keys & Third-Party Services

- [ ] MapBox API key restricted to production domain
- [ ] AWS S3 bucket has proper IAM permissions (least privilege)
- [ ] AWS S3 bucket CORS configured correctly
- [ ] AWS S3 bucket has versioning enabled (recommended)
- [ ] Gemini API key has usage limits configured
- [ ] Groq API key has usage limits configured
- [ ] MailerSend API key is valid and has correct permissions
- [ ] All API keys are stored as environment variables (never in code)

### Database

- [ ] Database backups configured and tested
- [ ] Database connection pooling configured
- [ ] Database has appropriate indexes
- [ ] Database credentials rotated from defaults
- [ ] Database accessible only from backend (firewall rules)
- [ ] Database monitoring enabled

## Environment Variables

### Backend Required Variables

Verify these are set in production (Railway):

- [ ] `DATABASE_HOST`
- [ ] `DATABASE_PORT`
- [ ] `DATABASE_USERNAME`
- [ ] `DATABASE_PASSWORD`
- [ ] `DATABASE_NAME`
- [ ] `AUTH0_DOMAIN`
- [ ] `AUTH0_BACKEND_CLIENT_ID`
- [ ] `AUTH0_BACKEND_CLIENT_SECRET`
- [ ] `AWS_ACCESS_KEY_ID_YARDVARK`
- [ ] `AWS_SECRET_ACCESS_KEY_YARDVARK`
- [ ] `AWS_REGION_YARDVARK`
- [ ] `AWS_S3_BUCKET_YARDVARK`
- [ ] `GEMINI_API_KEY`
- [ ] `GROQ_API_KEY`
- [ ] `MAILERSEND_API_KEY`
- [ ] `PORT` (optional, default: 8080)
- [ ] `NODE_ENV=production`

### Frontend Configuration

Verify these are correct in `src/environments/environment.ts`:

- [ ] `production: true`
- [ ] `apiUrl` points to production backend
- [ ] `feAppUrl` points to production frontend
- [ ] `auth0Domain` is correct
- [ ] `auth0ClientId` is correct
- [ ] `mapBoxPublicKey` is restricted by domain

## Testing

### Pre-Deployment Testing

- [ ] All unit tests passing
- [ ] All e2e tests passing (if available)
- [ ] Manual testing of critical paths:
  - [ ] User registration (new email)
  - [ ] User login (existing email)
  - [ ] User logout
  - [ ] Password reset flow
  - [ ] Create entry
  - [ ] Update entry
  - [ ] Delete entry
  - [ ] File upload (if applicable)
  - [ ] Image handling
  - [ ] Weather API integration
  - [ ] AI features (if enabled)
  - [ ] Email notifications (if enabled)
- [ ] Cross-browser testing:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Mobile responsiveness testing:
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] Rate limiting tested and working
- [ ] CORS tested from production domain
- [ ] Error handling tested (network errors, API errors, etc.)

### Security Testing

- [ ] Authentication flows tested thoroughly
- [ ] Authorization tested (users can only access their own data)
- [ ] Rate limiting triggers correctly
- [ ] SQL injection attempts blocked (TypeORM handles this)
- [ ] XSS attempts blocked (Angular sanitizes by default)
- [ ] CSRF protection verified
- [ ] Security headers present (check with securityheaders.com)
- [ ] SSL/TLS certificate valid
- [ ] No sensitive data in client-side code
- [ ] No console.log statements with sensitive data

## Monitoring & Observability

### Application Monitoring

- [ ] Application performance monitoring (APM) configured
- [ ] Error tracking configured (e.g., Sentry, Rollbar)
- [ ] Log aggregation configured
- [ ] Uptime monitoring configured
- [ ] Database monitoring configured
- [ ] API endpoint monitoring configured

### Alerts

- [ ] High error rate alerts
- [ ] API latency alerts
- [ ] Database connection alerts
- [ ] Disk space alerts
- [ ] Memory usage alerts
- [ ] Unusual traffic pattern alerts
- [ ] Failed authentication attempt alerts

### Dashboards

- [ ] User registration dashboard
- [ ] API usage dashboard
- [ ] Error rate dashboard
- [ ] Performance metrics dashboard
- [ ] Database health dashboard

## Infrastructure

### Backend (Railway)

- [ ] Auto-scaling configured (if available)
- [ ] Health check endpoint configured
- [ ] Graceful shutdown handling
- [ ] Resource limits set appropriately
- [ ] Deployment rollback plan documented

### Frontend (Netlify)

- [ ] CDN caching configured
- [ ] Build settings correct
- [ ] Environment variables set (if any)
- [ ] Redirect rules configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Database

- [ ] Sufficient storage allocated
- [ ] Backup retention policy defined
- [ ] Point-in-time recovery enabled (if available)
- [ ] Read replicas configured (if needed)
- [ ] Connection limits appropriate for load

## Documentation

- [x] SECURITY.md created and up-to-date
- [x] .env.example files created
- [ ] README.md updated with production setup instructions
- [ ] API documentation generated (if applicable)
- [ ] User guide/help documentation ready
- [ ] Admin documentation ready
- [ ] Incident response plan documented
- [ ] Disaster recovery plan documented

## Legal & Compliance

- [ ] Privacy policy published and linked
- [ ] Terms of service published and linked
- [ ] Cookie policy (if applicable)
- [ ] GDPR compliance verified (if serving EU users)
- [ ] Data retention policy defined
- [ ] User data export capability (GDPR requirement)
- [ ] User data deletion capability (GDPR requirement)

## Communication

### Internal

- [ ] Team notified of deployment schedule
- [ ] On-call rotation defined
- [ ] Escalation path documented
- [ ] Post-deployment plan communicated

### External

- [ ] Users notified of any downtime (if applicable)
- [ ] Status page available
- [ ] Support channels ready (email, chat, etc.)
- [ ] Social media accounts ready for announcements

## Post-Deployment

### Immediate (First 24 hours)

- [ ] Monitor error rates closely
- [ ] Monitor registration flow
- [ ] Monitor API performance
- [ ] Monitor database performance
- [ ] Check for any unusual traffic patterns
- [ ] Verify all critical paths working
- [ ] Test user registration from production
- [ ] Verify emails are being sent

### Short-term (First week)

- [ ] Review logs for errors or warnings
- [ ] Analyze user registration trends
- [ ] Monitor API usage patterns
- [ ] Check for any security incidents
- [ ] Gather user feedback
- [ ] Review performance metrics
- [ ] Optimize slow queries (if any)

### Medium-term (First month)

- [ ] Review and optimize rate limits based on actual usage
- [ ] Analyze user behavior patterns
- [ ] Identify and fix any pain points
- [ ] Review security logs
- [ ] Plan for scaling if needed
- [ ] Review and update documentation based on learnings
- [ ] Conduct post-launch retrospective

## Rollback Plan

If critical issues arise:

1. **Immediate actions**:

   - [ ] Re-enable Auth0 email whitelist (temporary measure)
   - [ ] Scale down infrastructure if overwhelmed
   - [ ] Enable maintenance mode if necessary

2. **Investigation**:

   - [ ] Review error logs
   - [ ] Check monitoring dashboards
   - [ ] Identify root cause

3. **Communication**:

   - [ ] Notify users via status page
   - [ ] Update team on status
   - [ ] Provide regular updates

4. **Resolution**:
   - [ ] Deploy hotfix if needed
   - [ ] Test thoroughly in staging
   - [ ] Deploy to production
   - [ ] Monitor closely
   - [ ] Conduct incident post-mortem

## Sign-off

- [ ] Technical lead approval
- [ ] Security review approval
- [ ] Product owner approval
- [ ] Final go/no-go decision documented

---

**Note**: This checklist should be reviewed and updated regularly based on your specific requirements and lessons learned from deployments.

**Date Prepared**: ******\_******

**Prepared By**: ******\_******

**Deployment Date**: ******\_******

**Sign-off**: ******\_******
