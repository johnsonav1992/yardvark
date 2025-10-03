# Enabling Public Access - Auth0 Configuration

## Current State

The application currently uses an email whitelist to restrict user registration. This is implemented via the Auth0 Pre-User Registration action `allowed-signup-filters`.

## Options for Public Access

### Option 1: Remove the Action (Recommended for Full Public Access)

1. Log in to your Auth0 Dashboard
2. Navigate to **Actions** → **Flows** → **Pre User Registration**
3. Find the `allowed-signup-filters` action in the flow
4. Click on it and select **Remove from Flow**
5. Click **Apply** to save changes

**Result**: Anyone can register with any email address.

### Option 2: Modify the Action to Allow All Emails

1. Log in to your Auth0 Dashboard
2. Navigate to **Actions** → **Library**
3. Find and click on `allowed-signup-filters`
4. Modify the code to remove the restriction:

```javascript
/**
 * Handler that will be called during the execution of a PreUserRegistration flow.
 * Modified to allow all user registrations.
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  // Optional: Add custom validation logic here
  // For example, email format validation, domain restrictions, etc.
  
  const email = event.user.email?.toLowerCase();
  
  // Log registration attempt for monitoring
  console.log({ email, message: 'User registration attempt' });
  
  // Allow all registrations
  // Note: You can add custom logic here to block specific patterns if needed
};
```

5. Click **Deploy** to save and deploy the changes

**Result**: All registrations are allowed, but you can add custom validation logic.

### Option 3: Allow Specific Email Domains

If you want to allow all users from specific domains (e.g., all Gmail users):

```javascript
exports.onExecutePreUserRegistration = async (event, api) => {
  const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];
  
  const email = event.user.email?.toLowerCase();
  
  if (!email) {
    api.access.deny(
      'No email provided',
      'Please provide a valid email address to sign up.'
    );
    return;
  }
  
  const domain = email.split('@')[1];
  
  if (!allowedDomains.includes(domain)) {
    api.access.deny(
      `Unauthorized signup: domain not allowed -> ${domain}`,
      'Currently, we only support registration with Gmail, Yahoo, or Outlook email addresses.'
    );
  }
  
  console.log({ email, domain, message: 'User registration approved' });
};
```

### Option 4: Gradual Rollout with Updated Whitelist

If you want to gradually expand access while maintaining some control:

1. Navigate to **Actions** → **Library** → `allowed-signup-filters`
2. Go to the **Secrets** tab
3. Update the `allowedEmails` secret with a larger list or domain patterns
4. Format as JSON array: `["email1@example.com", "email2@example.com"]`

## Important Security Considerations

Before enabling public access, ensure you have:

- ✅ Rate limiting enabled (implemented in backend)
- ✅ Helmet security headers (implemented in backend)
- ✅ Input validation (implemented in backend)
- ✅ CORS properly configured (already configured)
- ✅ Monitoring and alerting set up
- ✅ Auth0 brute force protection enabled (configure in Auth0)

## Auth0 Additional Security Settings

After enabling public access, configure these Auth0 settings:

### 1. Enable Brute Force Protection

1. Go to **Security** → **Attack Protection** → **Brute Force Protection**
2. Enable the feature
3. Configure thresholds (recommended: 10 failed attempts)
4. Set up notification emails

### 2. Configure Allowed Callback URLs

1. Go to **Applications** → Your Application
2. Set **Allowed Callback URLs**:
   - `http://localhost:4200/callback` (development)
   - `https://yardvark.netlify.app/callback` (production)
   - Add Netlify preview URLs if needed

### 3. Configure Allowed Logout URLs

1. In the same Application settings
2. Set **Allowed Logout URLs**:
   - `http://localhost:4200` (development)
   - `https://yardvark.netlify.app` (production)

### 4. Configure Allowed Web Origins

1. Set **Allowed Web Origins**:
   - `http://localhost:4200` (development)
   - `https://yardvark.netlify.app` (production)

### 5. Enable Email Verification

1. Go to **Authentication** → **Database** → Your Database Connection
2. Enable **Requires Email Verification**
3. This prevents fake email registrations

## Monitoring After Public Launch

Set up monitoring for:

1. **Registration Rate**: Unusual spikes in new registrations
2. **Failed Authentication Attempts**: Pattern detection for attacks
3. **API Usage**: Monitor for abuse or unexpected traffic patterns
4. **Database Growth**: Ensure storage capacity
5. **Error Rates**: Watch for increased errors indicating issues

## Rollback Plan

If you need to quickly restrict access again:

1. Go to **Actions** → **Flows** → **Pre User Registration**
2. Re-add the `allowed-signup-filters` action
3. Update the `allowedEmails` secret to include only trusted emails
4. Click **Apply**

Changes take effect immediately for new registration attempts.

## Testing

Before making changes in production:

1. Test in a development Auth0 tenant first
2. Verify registration flow with multiple email addresses
3. Test authentication and authorization
4. Verify rate limiting is working
5. Check security headers are present
6. Test with various browser/device combinations

## Support

If you encounter issues:
- Check Auth0 logs in **Monitoring** → **Logs**
- Review backend application logs
- Verify environment variables are set correctly
- Test with different email providers (Gmail, Outlook, etc.)
