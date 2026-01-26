In general, follow all of the ways things have been done in this repo so far. A couple specific notes, though:

1. No comments unless they are jsdoc comments or they are VERY NEEDED inline comments.
2. Make sure there is an empty line before and after all if blocks or if/else, etc.
3. Follow modern angular principles - don't use old stuff like angular decorators, non-signal properties, etc.
4. Avoid rxjs if possible and use signals and resources. only use rxjs if it's very specifically needed.
5. Always ask questions before you implement something you are unsure of.
6. Allows use the tools in this repo, like primeng, date-fns, etc. Don't do made-up stuff unless there isn't already a tool or util already there for you to use.

---

## Subscription Feature Architecture

### Overview
Yardvark uses Stripe for subscription management with a freemium model. Full implementation guide available at: `/Users/Alex/.claude/plans/zippy-tumbling-storm.md`

### Pricing Model
- **Free Tier**: 6 entries/month, no AI features
- **Monthly**: $7/month - unlimited entries + all AI features
- **Yearly**: $60/year - unlimited entries + all AI features (save $24/year)
- **Lifetime**: Grandfathered tier for existing users (unlimited forever)

### Database Schema
Two new tables:
- `subscriptions`: User subscription status (tier, Stripe IDs, period dates)
- `feature_usage`: Monthly usage tracking per feature (entries, AI queries)

### Backend Architecture

**Module**: `/backend/src/modules/subscription/`
- Models: `subscription.model.ts`, `usage.model.ts`
- Services: `stripe.service.ts` (Stripe SDK wrapper), `subscription.service.ts` (business logic)
- Controllers: `subscription.controller.ts` (status/checkout/portal), `webhook.controller.ts` (Stripe events)
- Guards: `subscription.guard.ts` (checks `@SubscriptionFeature` decorator on endpoints)
- Decorators: `@SubscriptionFeature('feature_name')` to gate endpoints

**Feature Gating**:
- AI endpoints: Add `@SubscriptionFeature('ai_chat')`, `@SubscriptionFeature('ai_query')`, etc.
- Entry creation: Add `@SubscriptionFeature('entry_creation')` + call `incrementUsage()` after success
- Free users: Blocked at 402 Payment Required with usage info

**Environment Variables** (in `.env`):
```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

### Frontend Architecture

**Location**: `/src/app/pages/subscription/`
- Service: `subscription.service.ts` (uses rxResource for subscription data, computed signals for isPro)
- Component: `subscription.component.ts/html/scss` (pricing cards, checkout, billing portal)
- Types: `subscription.types.ts` (SubscriptionTier, SubscriptionStatus, Subscription, FeatureAccess)
- Reusable: `upgrade-prompt.component.ts` (warning banner for blocked features)

**Usage Pattern**:
```typescript
private subscriptionService = inject(SubscriptionService);
public isPro = this.subscriptionService.isPro;

// Check feature access before action
const access = await this.subscriptionService.checkFeatureAccess('entry_creation');

if (!access.allowed) {
  this.throwErrorToast(`Entry limit reached (${access.usage}/${access.limit}). Upgrade for unlimited.`);
  this.router.navigate(['/subscription']);
}
```

**Environment Variables** (in `environment.ts`):
```typescript
stripePublishableKey: 'pk_...'
```

### Stripe Integration
- **Checkout**: Stripe Checkout (hosted) - redirects to Stripe payment page
- **Billing Portal**: Stripe Customer Portal - users manage subscription, payment methods, invoices
- **Webhooks**: `/stripe/webhook` endpoint handles subscription events (created, updated, deleted)

### Grandfathering Strategy
Migration script identifies all users with existing entries and grants them `tier='lifetime'` automatically. These users never see payment prompts and have unlimited access forever.

### Key Implementation Notes
1. SubscriptionGuard runs globally on all endpoints - checks for `@SubscriptionFeature` decorator
2. Usage tracking happens AFTER successful operations (e.g., after entry created)
3. Feature checks happen BEFORE operations (e.g., before showing add entry form)
4. Lifetime users are treated same as paid users (isPro = true)
5. Free tier blocks are enforced server-side (guard returns 402), frontend shows upgrade prompts
6. Use signals and computed for all subscription state (no rxjs subscriptions)
7. Follow existing patterns for PrimeNG components, routing, and services
