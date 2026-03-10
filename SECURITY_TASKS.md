# Security Tasks — Pre-Launch

## CRITICAL

### 1. Missing ownership checks on mutating endpoints
Every update/delete endpoint must verify the resource belongs to the requesting user. Currently any authenticated user can modify any other user's data.

**entries.controller.ts / entries.service.ts**
- `PUT /:entryId` — `updateEntry()` service fetches entry by ID only, no userId filter
- `DELETE /:entryId` — `softDeleteEntry()` same issue
- `POST /recover/:entryId` — `recoverEntry()` same issue
- `GET /single/:entryId` — `getEntry()` same issue (data exposure)
- `DELETE /entry-image/:entryImageId` — `deleteEntryImage()` no ownership check

Fix: add `userId` to all `findOne`/`findOneBy` where clauses, e.g.:
```ts
where: { id: entryId, userId }
```

**equipment.controller.ts / equipment.service.ts**
- `PUT /:equipmentId` — `updateEquipment()` no userId check in service
- `DELETE /:equipmentId` — `deleteEquipment()` no userId check
- `PUT /maintenance/:maintenanceId` — `updateMaintenanceRecord()` no ownership check
- `DELETE /maintenance/:maintenanceId` — `deleteMaintenanceRecord()` no ownership check

Fix: join through `Equipment` table and verify `equipment.userId === userId` before any mutation.

**lawn-segments.controller.ts / lawn-segments.service.ts**
- `PUT /:id` — `updateLawnSegment()` service uses `findOneBy({ id })` only
- `DELETE /:id` — `deleteLawnSegment()` same issue

Fix: `findOneBy({ id, userId })`

---

### 2. Users can create system products
**products.controller.ts lines 28–54**

The controller passes `body.systemProduct` directly, allowing any user to create products flagged as system-wide:
```ts
userId: body.systemProduct ? "system" : userId,
```

Fix: strip `systemProduct` from the request body entirely (the DTO/whitelist should already block it via `whitelist: true` in ValidationPipe — verify that `systemProduct` is NOT decorated with `@IsOptional()` or any class-validator decorator in the DTO, otherwise remove it). Only allow Master Users to set `systemProduct: true`.

---

### 3. Batch entry creation bypasses subscription limits
**entries.controller.ts lines 158–183**

`POST /batch` has no `@SubscriptionFeature('entry_creation')` decorator, unlike `POST /` (single entry). Free-tier users can bypass entry limits by using the batch endpoint.

Fix: add `@SubscriptionFeature('entry_creation')` to `createEntriesBatch()`.

Also add a hard batch size cap (suggest 50) — throw a `BadRequestException` if `body.entries.length > 50`.

---

### 4. GraphQL introspection enabled in production
**graphql.module.ts line ~50**

```ts
introspection: true,
```

Fix:
```ts
introspection: process.env.NODE_ENV !== 'production',
```

---

## HIGH

### 5. CSP disabled in production
**backend/src/main.ts lines 28–57**

`contentSecurityPolicy` is set to `undefined` in production, removing all XSS and injection protections.

Fix: provide a production-appropriate CSP. At minimum:
```ts
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://yardvark-backend-production.up.railway.app"],
    fontSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
},
```

---

### 6. Dev tunnel URL hardcoded in CORS
**backend/src/main.ts line 79**

`"https://t8x2587c-4200.usw3.devtunnels.ms"` is a personal dev tunnel URL included in the production CORS allowlist.

Fix: remove it, or gate it behind an env var that is never set in production.

---

### 7. Webhook error leaks implementation details
**webhook.controller.ts line ~80**

```ts
.send(`Webhook verification failed: ${err.message}`);
```

Fix:
```ts
.send(process.env.NODE_ENV === 'production' ? 'Webhook verification failed' : `Webhook verification failed: ${err.message}`);
```

---

### 8. No validation on search, date, and coordinate inputs

These endpoints accept raw strings/numbers with no validation constraints, enabling potential resource exhaustion or upstream API abuse:

- **entries.controller.ts** — `searchEntries()`: `titleOrNotes` string and arrays in `EntriesSearchRequest` have no `@MaxLength`, `@ArrayMaxSize` decorators in the DTO
- **weather.controller.ts** — `lat` and `long` query params are raw strings, not validated as numeric or in valid range
- **soil-data.controller.ts** — `date` path param not validated as a valid date string
- **gdd.controller.ts** — `startDate` and `endDate` query params not validated
- **analytics.controller.ts** — `year` query param not validated for sensible range

Fix for each: add class-validator decorators to DTOs or use `ParseIntPipe`/custom pipes. For strings, add `@MaxLength(200)`. For dates, validate `isISO8601()`. For coordinates, validate numeric range.

---

## MEDIUM

### 9. File upload: MIME type only, no magic byte validation
**backend/src/utils/fileUtils.ts**

The validator checks `mimetype.includes('image')` but MIME types are set by the client and can be spoofed.

Fix: after receiving the buffer, validate the actual file magic bytes using the `file-type` npm package:
```ts
import { fileTypeFromBuffer } from 'file-type';
const type = await fileTypeFromBuffer(file.buffer);
const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!type || !allowed.includes(type.mime)) throw new BadRequestException('Invalid image type');
```

---

### 10. Settings stored without schema validation
**settings.controller.ts lines 23–37**

Settings are `JSON.stringify`'d and stored with no structural validation. A malicious or malformed payload can corrupt a user's settings.

Fix: define a `UpdateSettingsDto` with class-validator decorators that enforces the expected shape of the settings object. Apply `ValidationPipe` to the endpoint.

---

### 11. CSP `connectSrc` too permissive in dev
**backend/src/main.ts line ~52**

```ts
connectSrc: ["'self'", "https://*"]
```

Allows connecting to any HTTPS domain. Even in dev this is overly broad.

Fix: enumerate specific allowed origins (Auth0 domain, backend URL, Mapbox, etc.).

---

## LOW

### 12. Analytics year parameter not range-validated
**analytics.controller.ts**

`year?: number` has no min/max. Add `@IsInt() @Min(2000) @Max(2100)` in the DTO or use a pipe.

---

### Notes for implementation
- The backend uses NestJS `ValidationPipe` globally with `whitelist: true` and `forbidNonWhitelisted: true` — ensure all new DTOs use class-validator decorators and are applied as `@Body()` typed params so the pipe activates
- The `@User()` decorator extracts `userId` from the JWT-validated request — use this consistently for ownership checks
- All repo `findOne` calls for mutating operations should include `userId` in the `where` clause — if the record is not found (null), throw `NotFoundException` which is already the pattern in this codebase
