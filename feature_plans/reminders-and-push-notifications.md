# Reminders & Push Notifications Feature Plan

## Overview

Users can create personal reminders: a text note + a scheduled time. At that time, they receive a push notification on whatever devices they have registered. One backend cron dispatches to all of a user's active subscriptions.

### Platform Matrix

| Platform | Push Method | In-App Fallback |
|---|---|---|
| Desktop web (Chrome/Firefox) | Web Push (VAPID) → OS notification | Toast polling every 60s if no permission |
| Mobile PWA | Web Push (VAPID) → OS notification | — |
| iOS Capacitor | APNs via FCM → native push notification | — |
| Android Capacitor (future) | FCM → native push notification | Already covered by FCM path |

---

## Open Decision Points (Answer Before Implementing)

**Decision 1 — iOS push provider:**
- **FCM (recommended):** Use `firebase-admin` on backend. Requires one-time Firebase project setup. Works for iOS now and Android free when you add it. Single send API for all device tokens.
- **Direct APNs:** Use `node-apn` backend package, no Firebase. iOS-only — when Android comes you'll need FCM anyway.

**Decision 2 — When to ask for notification permission:**
- Recommended: prompt on first reminder save (contextually obvious why you need it).
- Alternative: soft banner on the `/reminders` page if reminders exist but no permission.

---

## Database — Two New Tables

### `reminders`

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  note TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_scheduled_for ON reminders(scheduled_for) WHERE is_sent = false;
```

### `push_subscriptions`

One user may have multiple subscriptions (laptop browser + iOS phone). The cron fans out to all of them.

```sql
CREATE TYPE push_subscription_type AS ENUM ('web', 'ios', 'android');

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  subscription_type push_subscription_type NOT NULL,
  endpoint TEXT,        -- web push only: the push service URL
  p256dh TEXT,          -- web push only: client public key
  auth_key TEXT,        -- web push only: auth secret
  device_token TEXT,    -- capacitor only: FCM/APNs token
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
-- Prevent duplicate web subscriptions for the same endpoint
CREATE UNIQUE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint)
  WHERE endpoint IS NOT NULL;
-- Prevent duplicate device tokens
CREATE UNIQUE INDEX idx_push_subscriptions_device_token ON push_subscriptions(device_token)
  WHERE device_token IS NOT NULL;
```

---

## Migration File

Migration filename convention from existing migrations: `{timestamp}-{descriptive-name}.ts`

```ts
// backend/src/migrations/1773999999999-AddRemindersAndPushSubscriptions.ts
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemindersAndPushSubscriptions1773999999999
  implements MigrationInterface
{
  name = "AddRemindersAndPushSubscriptions1773999999999";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        note TEXT NOT NULL,
        scheduled_for TIMESTAMPTZ NOT NULL,
        is_sent BOOLEAN NOT NULL DEFAULT false,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(
      `CREATE INDEX idx_reminders_user_id ON reminders(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_reminders_scheduled_for ON reminders(scheduled_for) WHERE is_sent = false;`,
    );

    await queryRunner.query(
      `CREATE TYPE push_subscription_type AS ENUM ('web', 'ios', 'android');`,
    );

    await queryRunner.query(`
      CREATE TABLE push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        subscription_type push_subscription_type NOT NULL,
        endpoint TEXT,
        p256dh TEXT,
        auth_key TEXT,
        device_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(
      `CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint) WHERE endpoint IS NOT NULL;`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_push_subscriptions_device_token ON push_subscriptions(device_token) WHERE device_token IS NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS push_subscriptions;`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS push_subscription_type;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS reminders;`);
  }
}
```

---

## Backend

### New Packages to Install

```bash
# In backend/
npm install @nestjs/schedule web-push firebase-admin
npm install --save-dev @types/web-push  # already exists as dev dep, just confirming
```

### Environment Variables to Add

```bash
# backend/.env
VAPID_PUBLIC_KEY=       # generate once: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=      # from above
VAPID_SUBJECT=mailto:your@email.com

# If using FCM (Decision 1 = FCM):
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=   # from Firebase service account JSON (the multiline key)
```

Generate VAPID keys once with:
```bash
cd backend && npx web-push generate-vapid-keys
```

---

### Backend Module: `reminders`

#### `backend/src/modules/reminders/models/reminder.model.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("reminders")
export class Reminder {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  public userId: string;

  @Column({ type: "text" })
  public note: string;

  @Column({ type: "timestamptz" })
  public scheduledFor: Date;

  @Column({ default: false })
  public isSent: boolean;

  @Column({ type: "timestamptz", nullable: true })
  public sentAt: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  public updatedAt: Date;
}
```

#### `backend/src/modules/reminders/dto/create-reminder.dto.ts`

```ts
export class CreateReminderDto {
  public note: string;
  public scheduledFor: string; // ISO 8601 string from client
}
```

#### `backend/src/modules/reminders/dto/update-reminder.dto.ts`

```ts
export class UpdateReminderDto {
  public note?: string;
  public scheduledFor?: string;
}
```

#### `backend/src/modules/reminders/services/reminders.service.ts`

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import type { CreateReminderDto } from "../dto/create-reminder.dto";
import type { UpdateReminderDto } from "../dto/update-reminder.dto";
import { Reminder } from "../models/reminder.model";

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private readonly _remindersRepo: Repository<Reminder>,
  ) {}

  public getUserReminders(userId: string): Promise<Reminder[]> {
    return this._remindersRepo.find({
      where: { userId },
      order: { scheduledFor: "ASC" },
    });
  }

  public getDueReminders(): Promise<Reminder[]> {
    return this._remindersRepo.find({
      where: {
        isSent: false,
        scheduledFor: LessThanOrEqual(new Date()),
      },
    });
  }

  public async create(
    userId: string,
    dto: CreateReminderDto,
  ): Promise<Reminder> {
    const reminder = this._remindersRepo.create({
      userId,
      note: dto.note,
      scheduledFor: new Date(dto.scheduledFor),
    });

    return this._remindersRepo.save(reminder);
  }

  public async update(
    userId: string,
    id: string,
    dto: UpdateReminderDto,
  ): Promise<Reminder> {
    const reminder = await this._remindersRepo.findOneBy({ id, userId });

    if (!reminder) {
      throw new NotFoundException("Reminder not found");
    }

    if (dto.note !== undefined) {
      reminder.note = dto.note;
    }

    if (dto.scheduledFor !== undefined) {
      reminder.scheduledFor = new Date(dto.scheduledFor);
      reminder.isSent = false;
      reminder.sentAt = null;
    }

    return this._remindersRepo.save(reminder);
  }

  public async delete(userId: string, id: string): Promise<void> {
    const reminder = await this._remindersRepo.findOneBy({ id, userId });

    if (!reminder) {
      throw new NotFoundException("Reminder not found");
    }

    await this._remindersRepo.remove(reminder);
  }

  public async markSent(id: string): Promise<void> {
    await this._remindersRepo.update(id, {
      isSent: true,
      sentAt: new Date(),
    });
  }
}
```

#### `backend/src/modules/reminders/controllers/reminders.controller.ts`

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { User } from "../../../decorators/user.decorator";
import type { CreateReminderDto } from "../dto/create-reminder.dto";
import type { UpdateReminderDto } from "../dto/update-reminder.dto";
import { RemindersService } from "../services/reminders.service";

@Controller("reminders")
export class RemindersController {
  constructor(private readonly _remindersService: RemindersService) {}

  @Get()
  public getReminders(@User("userId") userId: string) {
    return this._remindersService.getUserReminders(userId);
  }

  @Post()
  public createReminder(
    @User("userId") userId: string,
    @Body() dto: CreateReminderDto,
  ) {
    return this._remindersService.create(userId, dto);
  }

  @Put(":id")
  public updateReminder(
    @User("userId") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this._remindersService.update(userId, id, dto);
  }

  @Delete(":id")
  public deleteReminder(
    @User("userId") userId: string,
    @Param("id") id: string,
  ) {
    return this._remindersService.delete(userId, id);
  }
}
```

#### `backend/src/modules/reminders/reminders.module.ts`

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RemindersController } from "./controllers/reminders.controller";
import { Reminder } from "./models/reminder.model";
import { RemindersService } from "./services/reminders.service";

@Module({
  imports: [TypeOrmModule.forFeature([Reminder])],
  exports: [RemindersService],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
```

---

### Backend Module: `notifications`

#### `backend/src/modules/notifications/models/push-subscription.model.ts`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type PushSubscriptionType = "web" | "ios" | "android";

@Entity("push_subscriptions")
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column()
  public userId: string;

  @Column({ type: "varchar" })
  public subscriptionType: PushSubscriptionType;

  @Column({ type: "text", nullable: true })
  public endpoint: string | null;

  @Column({ type: "text", nullable: true })
  public p256dh: string | null;

  @Column({ type: "text", nullable: true })
  public authKey: string | null;

  @Column({ type: "text", nullable: true })
  public deviceToken: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  public updatedAt: Date;
}
```

#### `backend/src/modules/notifications/dto/save-web-subscription.dto.ts`

```ts
export class SaveWebSubscriptionDto {
  public endpoint: string;
  public p256dh: string;
  public authKey: string;
}
```

#### `backend/src/modules/notifications/dto/save-device-token.dto.ts`

```ts
import type { PushSubscriptionType } from "../models/push-subscription.model";

export class SaveDeviceTokenDto {
  public token: string;
  public platform: Extract<PushSubscriptionType, "ios" | "android">;
}
```

#### `backend/src/modules/notifications/services/notifications.service.ts`

This service handles storing subscriptions and dispatching pushes. The `sendToSubscription` method is the internal API used by the cron scheduler.

```ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as admin from "firebase-admin";
import * as webpush from "web-push";
import { Repository } from "typeorm";
import type { SaveDeviceTokenDto } from "../dto/save-device-token.dto";
import type { SaveWebSubscriptionDto } from "../dto/save-web-subscription.dto";
import { PushSubscription } from "../models/push-subscription.model";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class NotificationsService {
  private _webPushInitialized = false;
  private _firebaseInitialized = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly _subscriptionsRepo: Repository<PushSubscription>,
    private readonly _configService: ConfigService,
  ) {
    this._initWebPush();
    this._initFirebase();
  }

  private _initWebPush(): void {
    const publicKey = this._configService.get<string>("VAPID_PUBLIC_KEY");
    const privateKey = this._configService.get<string>("VAPID_PRIVATE_KEY");
    const subject = this._configService.get<string>("VAPID_SUBJECT");

    if (!publicKey || !privateKey || !subject) {
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this._webPushInitialized = true;
  }

  private _initFirebase(): void {
    const projectId = this._configService.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = this._configService.get<string>("FIREBASE_CLIENT_EMAIL");
    const privateKey = this._configService
      .get<string>("FIREBASE_PRIVATE_KEY")
      ?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }

    this._firebaseInitialized = true;
  }

  public getVapidPublicKey(): string {
    return this._configService.get<string>("VAPID_PUBLIC_KEY") ?? "";
  }

  public async saveWebSubscription(
    userId: string,
    dto: SaveWebSubscriptionDto,
  ): Promise<void> {
    const existing = await this._subscriptionsRepo.findOneBy({
      endpoint: dto.endpoint,
    });

    if (existing) {
      await this._subscriptionsRepo.update(existing.id, {
        userId,
        p256dh: dto.p256dh,
        authKey: dto.authKey,
      });
      return;
    }

    await this._subscriptionsRepo.save({
      userId,
      subscriptionType: "web",
      endpoint: dto.endpoint,
      p256dh: dto.p256dh,
      authKey: dto.authKey,
    });
  }

  public async saveDeviceToken(
    userId: string,
    dto: SaveDeviceTokenDto,
  ): Promise<void> {
    const existing = await this._subscriptionsRepo.findOneBy({
      deviceToken: dto.token,
    });

    if (existing) {
      await this._subscriptionsRepo.update(existing.id, { userId });
      return;
    }

    await this._subscriptionsRepo.save({
      userId,
      subscriptionType: dto.platform,
      deviceToken: dto.token,
    });
  }

  public async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return this._subscriptionsRepo.findBy({ userId });
  }

  public async removeSubscription(
    userId: string,
    endpoint?: string,
    deviceToken?: string,
  ): Promise<void> {
    if (endpoint) {
      await this._subscriptionsRepo.delete({ userId, endpoint });
    } else if (deviceToken) {
      await this._subscriptionsRepo.delete({ userId, deviceToken });
    }
  }

  public async sendToSubscription(
    subscription: PushSubscription,
    payload: PushPayload,
  ): Promise<void> {
    if (subscription.subscriptionType === "web") {
      await this._sendWebPush(subscription, payload);
    } else {
      await this._sendFcm(subscription, payload);
    }
  }

  private async _sendWebPush(
    subscription: PushSubscription,
    payload: PushPayload,
  ): Promise<void> {
    if (!this._webPushInitialized || !subscription.endpoint) {
      return;
    }

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh!,
          auth: subscription.authKey!,
        },
      },
      JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
      }),
    );
  }

  private async _sendFcm(
    subscription: PushSubscription,
    payload: PushPayload,
  ): Promise<void> {
    if (!this._firebaseInitialized || !subscription.deviceToken) {
      return;
    }

    await admin.messaging().send({
      token: subscription.deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    });
  }
}
```

#### `backend/src/modules/notifications/controllers/notifications.controller.ts`

```ts
import { Body, Controller, Delete, Get, Post, Query } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "../../../decorators/user.decorator";
import type { SaveDeviceTokenDto } from "../dto/save-device-token.dto";
import type { SaveWebSubscriptionDto } from "../dto/save-web-subscription.dto";
import { NotificationsService } from "../services/notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly _notificationsService: NotificationsService,
    private readonly _configService: ConfigService,
  ) {}

  @Get("vapid-public-key")
  public getVapidPublicKey() {
    return { key: this._notificationsService.getVapidPublicKey() };
  }

  @Post("subscribe/web")
  public subscribeWeb(
    @User("userId") userId: string,
    @Body() dto: SaveWebSubscriptionDto,
  ) {
    return this._notificationsService.saveWebSubscription(userId, dto);
  }

  @Post("subscribe/device")
  public subscribeDevice(
    @User("userId") userId: string,
    @Body() dto: SaveDeviceTokenDto,
  ) {
    return this._notificationsService.saveDeviceToken(userId, dto);
  }

  @Delete("unsubscribe")
  public unsubscribe(
    @User("userId") userId: string,
    @Query("endpoint") endpoint?: string,
    @Query("deviceToken") deviceToken?: string,
  ) {
    return this._notificationsService.removeSubscription(
      userId,
      endpoint,
      deviceToken,
    );
  }

  // Dev-only test endpoint — guard with env check, not a decorator,
  // so it stays simple and doesn't need a custom guard module
  @Post("test")
  public async sendTestNotification(@User("userId") userId: string) {
    const isDev = !this._configService.get<string>("NODE_ENV")?.includes("production");

    if (!isDev) {
      return { skipped: true };
    }

    const subscriptions =
      await this._notificationsService.getUserSubscriptions(userId);

    await Promise.allSettled(
      subscriptions.map((sub) =>
        this._notificationsService.sendToSubscription(sub, {
          title: "Test notification",
          body: "Push notifications are working!",
        }),
      ),
    );

    return { sent: subscriptions.length };
  }
}
```

#### `backend/src/modules/notifications/notifications.module.ts`

```ts
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsController } from "./controllers/notifications.controller";
import { PushSubscription } from "./models/push-subscription.model";
import { NotificationsService } from "./services/notifications.service";

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription])],
  exports: [NotificationsService],
  controllers: [NotificationsController],
  providers: [NotificationsService, ConfigService],
})
export class NotificationsModule {}
```

---

### Cron Scheduler Service

#### `backend/src/modules/reminders/services/reminder-scheduler.service.ts`

```ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { RemindersService } from "./reminders.service";

@Injectable()
export class ReminderSchedulerService {
  private readonly _logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly _remindersService: RemindersService,
    private readonly _notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async dispatchDueReminders(): Promise<void> {
    const due = await this._remindersService.getDueReminders();

    if (!due.length) {
      return;
    }

    await Promise.allSettled(
      due.map((reminder) => this._dispatchOne(reminder.id, reminder.userId, reminder.note)),
    );
  }

  private async _dispatchOne(
    reminderId: string,
    userId: string,
    note: string,
  ): Promise<void> {
    try {
      const subscriptions =
        await this._notificationsService.getUserSubscriptions(userId);

      await Promise.allSettled(
        subscriptions.map((sub) =>
          this._notificationsService.sendToSubscription(sub, {
            title: "Reminder",
            body: note,
            data: { reminderId },
          }),
        ),
      );

      await this._remindersService.markSent(reminderId);
    } catch (err) {
      this._logger.error(`Failed to dispatch reminder ${reminderId}`, err);
    }
  }
}
```

**Update `RemindersModule` to include the scheduler and import `NotificationsModule`:**

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModule } from "../notifications/notifications.module";
import { RemindersController } from "./controllers/reminders.controller";
import { Reminder } from "./models/reminder.model";
import { ReminderSchedulerService } from "./services/reminder-scheduler.service";
import { RemindersService } from "./services/reminders.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder]),
    NotificationsModule,
  ],
  exports: [RemindersService],
  controllers: [RemindersController],
  providers: [RemindersService, ReminderSchedulerService],
})
export class RemindersModule {}
```

---

### Wire Everything Into `AppModule`

```ts
// In app.module.ts imports array, add:
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { RemindersModule } from "./modules/reminders/reminders.module";

// In @Module imports:
ScheduleModule.forRoot(),
NotificationsModule,
RemindersModule,
```

---

## Frontend

### New Packages to Install

```bash
# In root (frontend)
npm install @capacitor/push-notifications
npx cap sync
```

### Update `Environment` Type

```ts
// src/app/types/environments.types.ts
export type Environment = {
  production?: boolean;
  isStaging?: boolean;
  apiUrl: string;
  feAppUrl: string;
  auth0Domain: string;
  auth0TenantDomain: string;
  auth0ClientId: string;
  mapBoxPublicKey: string;
  enableSwInDev?: boolean; // add this
};
```

For dev SW testing, set `enableSwInDev: true` in `environment.development.ts`. Then in `app.config.ts`:

```ts
provideServiceWorker("ngsw-worker.js", {
  enabled: !isDevMode() || !!environment.enableSwInDev,
  registrationStrategy: "registerWhenStable:30000",
})
```

### Update `endpoints.types.ts`

```ts
// Add to the union and the type definitions:
export type ApiEndpointRoutes =
  | ...existing...
  | RemindersRoutes
  | NotificationsRoutes;

type RemindersRoutes =
  | "reminders"
  | `reminders/${string}`;

type NotificationsRoutes =
  | "notifications/vapid-public-key"
  | "notifications/subscribe/web"
  | "notifications/subscribe/device"
  | "notifications/unsubscribe"
  | "notifications/test";
```

### Shared Types

Create a shared types file importable by both FE and BE (or duplicate in `src/app/types/`):

```ts
// src/app/types/reminder.types.ts
export type Reminder = {
  id: string;
  userId: string;
  note: string;
  scheduledFor: string; // ISO string from API
  isSent: boolean;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReminderPayload = {
  note: string;
  scheduledFor: string; // ISO string
};

export type UpdateReminderPayload = {
  note?: string;
  scheduledFor?: string;
};
```

---

### `notifications.service.ts`

This is the platform-aware push registration service. It runs once on login.

```ts
// src/app/services/notifications.service.ts
import { Injectable, inject, isDevMode } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type Token,
} from "@capacitor/push-notifications";
import { MessageService } from "primeng/api";
import { apiUrl, getReq, postReq } from "../utils/httpUtils";

@Injectable({
  providedIn: "root",
})
export class NotificationsService {
  private _swPush = inject(SwPush);
  private _messageService = inject(MessageService);

  private readonly _isNative = Capacitor.isNativePlatform();

  public async initForUser(): Promise<void> {
    if (this._isNative) {
      await this._initCapacitor();
    } else {
      this._listenForWebPushMessages();
    }
  }

  public async requestAndSubscribe(): Promise<void> {
    if (this._isNative) {
      await this._initCapacitor();
    } else {
      await this._subscribeWebPush();
    }
  }

  public get hasWebPushSupport(): boolean {
    return this._swPush.isEnabled;
  }

  private async _subscribeWebPush(): Promise<void> {
    if (!this._swPush.isEnabled) {
      return;
    }

    const { key } = await getReq<{ key: string }>(
      apiUrl("notifications/vapid-public-key"),
    ).toPromise() ?? { key: "" };

    if (!key) {
      return;
    }

    const sub = await this._swPush.requestSubscription({ serverPublicKey: key });
    const json = sub.toJSON();

    await postReq(apiUrl("notifications/subscribe/web"), {
      endpoint: json.endpoint,
      p256dh: json.keys?.["p256dh"],
      authKey: json.keys?.["auth"],
    }).toPromise();
  }

  private async _initCapacitor(): Promise<void> {
    const permission = await PushNotifications.requestPermissions();

    if (permission.receive !== "granted") {
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token: Token) => {
      await postReq(apiUrl("notifications/subscribe/device"), {
        token: token.value,
        platform: Capacitor.getPlatform() === "ios" ? "ios" : "android",
      }).toPromise();
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      this._messageService.add({
        severity: "info",
        summary: notification.title ?? "Reminder",
        detail: notification.body ?? "",
        life: 8000,
      });
    });

    PushNotifications.addListener("pushNotificationActionPerformed", () => {
      // navigate to /reminders when tapping the notification
      // inject Router here if needed
    });
  }

  private _listenForWebPushMessages(): void {
    if (!this._swPush.isEnabled) {
      return;
    }

    this._swPush.messages.subscribe((msg: unknown) => {
      const payload = msg as { notification?: { title?: string; body?: string } };

      this._messageService.add({
        severity: "info",
        summary: payload.notification?.title ?? "Reminder",
        detail: payload.notification?.body ?? "",
        life: 8000,
      });
    });
  }

  // Dev-only helper: hit the test endpoint
  public sendTestPush(): void {
    postReq(apiUrl("notifications/test"), {}).subscribe();
  }
}
```

### `reminders.service.ts`

```ts
// src/app/services/reminders.service.ts
import { httpResource } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type {
  CreateReminderPayload,
  Reminder,
  UpdateReminderPayload,
} from "../types/reminder.types";
import { apiUrl, deleteReq, postReq, putReq } from "../utils/httpUtils";

@Injectable({
  providedIn: "root",
})
export class RemindersService {
  public reminders = httpResource<Reminder[]>(() => apiUrl("reminders"));

  public create = (payload: CreateReminderPayload) => {
    return postReq<Reminder>(apiUrl("reminders"), payload);
  };

  public update = (id: string, payload: UpdateReminderPayload) => {
    return putReq<Reminder>(apiUrl("reminders", { params: [id] }), payload);
  };

  public remove = (id: string) => {
    return deleteReq<void>(apiUrl("reminders", { params: [id] }));
  };
}

export const injectRemindersService = () => inject(RemindersService);
```

---

### Wiring Into `app.component.ts`

After Auth0 `isAuthenticated$` emits true, call `NotificationsService.initForUser()`:

```ts
// In AppComponent constructor or ngOnInit, after the existing isAuthenticated$ subscription:
this._auth.isAuthenticated$.subscribe((isAuthenticated) => {
  this.isLoggedIn.set(isAuthenticated);

  if (isAuthenticated) {
    this._notificationsService.initForUser();
  }
});
```

`NotificationsService` should be injected in `AppComponent` as `private _notificationsService = inject(NotificationsService)`.

---

### Reminder Dialog Component

Fill in the existing stub at `src/app/components/reminders/reminder-dialog/`:

**`reminder-dialog.ts`**

```ts
import {
  Component,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { Button } from "primeng/button";
import { Textarea } from "primeng/textarea";
import { MessageService } from "primeng/api";
import type { CreateReminderPayload, Reminder, UpdateReminderPayload } from "../../../types/reminder.types";
import { RemindersService } from "../../../services/reminders.service";
import { NotificationsService } from "../../../services/notifications.service";

@Component({
  selector: "reminder-dialog",
  imports: [FormsModule, Dialog, DatePicker, Button, Textarea],
  templateUrl: "./reminder-dialog.html",
  styleUrl: "./reminder-dialog.scss",
})
export class ReminderDialog {
  private _remindersService = inject(RemindersService);
  private _notificationsService = inject(NotificationsService);
  private _messageService = inject(MessageService);

  public visible = input.required<boolean>();
  public reminder = input<Reminder | null>(null);
  public closed = output<void>();
  public saved = output<void>();

  public note = signal("");
  public scheduledFor = signal<Date | null>(null);
  public isSaving = signal(false);
  public minDate = signal(new Date());

  public ngOnInit(): void {
    const existing = this.reminder();

    if (existing) {
      this.note.set(existing.note);
      this.scheduledFor.set(new Date(existing.scheduledFor));
    } else {
      this.note.set("");
      this.scheduledFor.set(null);
    }
  }

  public save(): void {
    const date = this.scheduledFor();

    if (!this.note().trim() || !date) {
      return;
    }

    this.isSaving.set(true);

    const existing = this.reminder();
    const iso = date.toISOString();

    const req = existing
      ? this._remindersService.update(existing.id, {
          note: this.note(),
          scheduledFor: iso,
        } satisfies UpdateReminderPayload)
      : this._remindersService.create({
          note: this.note(),
          scheduledFor: iso,
        } satisfies CreateReminderPayload);

    req.subscribe({
      next: () => {
        this.isSaving.set(false);
        this._remindersService.reminders.reload();
        this.saved.emit();
        this.closed.emit();

        // Request push permission on first save if not already granted
        if (!existing) {
          this._notificationsService.requestAndSubscribe();
        }
      },
      error: () => {
        this.isSaving.set(false);
        this._messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to save reminder",
        });
      },
    });
  }

  public close(): void {
    this.closed.emit();
  }
}
```

**`reminder-dialog.html`**

```html
<p-dialog
  [visible]="visible()"
  [header]="reminder() ? 'Edit Reminder' : 'New Reminder'"
  [modal]="true"
  [draggable]="false"
  (onHide)="close()"
>
  <div class="dialog-body">
    <label for="reminder-note">Note</label>
    <textarea
      pTextarea
      id="reminder-note"
      [ngModel]="note()"
      (ngModelChange)="note.set($event)"
      rows="3"
      placeholder="What do you want to be reminded about?"
      [maxlength]="500"
      autoResize="true"
    ></textarea>
    <label for="reminder-date">Date & Time</label>
    <p-datepicker
      inputId="reminder-date"
      [ngModel]="scheduledFor()"
      (ngModelChange)="scheduledFor.set($event)"
      [showTime]="true"
      [minDate]="minDate()"
      [showIcon]="true"
      placeholder="Select date and time"
    />
  </div>
  <ng-template pTemplate="footer">
    <p-button
      label="Cancel"
      severity="secondary"
      [text]="true"
      (onClick)="close()"
    />
    <p-button
      [label]="reminder() ? 'Save Changes' : 'Create Reminder'"
      [loading]="isSaving()"
      [disabled]="!note().trim() || !scheduledFor()"
      (onClick)="save()"
    />
  </ng-template>
</p-dialog>
```

---

### In-App Fallback Polling (Desktop, No Permission)

In the `/reminders` page component, set up a polling interval for when web push is not available and the app is open:

```ts
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { interval, Subscription } from "rxjs";
import { MessageService } from "primeng/api";
import { Capacitor } from "@capacitor/core";
import { RemindersService } from "../../services/reminders.service";
import { NotificationsService } from "../../services/notifications.service";
import { isDevMode } from "@angular/core";
import { environment } from "../../../environments/environment";

@Component({ /* ... */ })
export class RemindersPage implements OnInit, OnDestroy {
  private _remindersService = inject(RemindersService);
  private _notificationsService = inject(NotificationsService);
  private _messageService = inject(MessageService);
  private _pollSub: Subscription | null = null;

  public readonly isDev = !environment.production;

  public ngOnInit(): void {
    const needsFallbackPolling =
      !Capacitor.isNativePlatform() &&
      !this._notificationsService.hasWebPushSupport;

    if (needsFallbackPolling) {
      this._pollSub = interval(60_000).subscribe(() => {
        this._checkForDueReminders();
      });
    }
  }

  private _checkForDueReminders(): void {
    const now = new Date();
    const due = (this._remindersService.reminders.value() ?? []).filter(
      (r) => !r.isSent && new Date(r.scheduledFor) <= now,
    );

    for (const reminder of due) {
      this._messageService.add({
        severity: "info",
        summary: "Reminder",
        detail: reminder.note,
        life: 10_000,
        sticky: true,
      });

      this._remindersService.update(reminder.id, {}).subscribe(() => {
        this._remindersService.reminders.reload();
      });
    }
  }

  public ngOnDestroy(): void {
    this._pollSub?.unsubscribe();
  }
}
```

---

## Dev Testing

### What works in normal dev mode (`ng serve`)

The Angular service worker is **disabled in dev mode** by default, so web push via `SwPush` will not fire. However:

1. The `notifications/test` backend endpoint **works** — it sends a real push to any registered subscriptions.
2. The **in-app fallback polling** works for desktop fallback testing.
3. Capacitor on a **real iOS device** with the dev scheme works fully.

### Enabling the SW in dev (for full web push testing)

Set `enableSwInDev: true` in `environment.development.ts` and update `app.config.ts` as shown above. Then:
```bash
ng serve  # SW will register in dev mode
```

Note: You'll need HTTPS or `localhost` for the Notification API to work (localhost works).

### For a full end-to-end web push test without changing env flags

```bash
ng build --configuration=preview
npx serve dist/yardvark/browser -s -l 4200
```

The `preview` config has `serviceWorker: true` already.

### Dev Test Panel

In the reminders page, show a test panel only when `!environment.production`:

```html
@if (isDev) {
  <div class="dev-test-panel">
    <p-button
      label="Send test push now"
      severity="secondary"
      size="small"
      (onClick)="sendTestPush()"
    />
  </div>
}
```

```ts
public sendTestPush(): void {
  this._notificationsService.sendTestPush();
}
```

### Capacitor Dev Testing

- Run app on a real iOS device via Xcode dev scheme
- Log in, create a reminder or hit the test push button
- APNs requires a real device — simulators do not support push notifications

---

## Files to Create/Modify (Complete Checklist)

### Backend — New Files
- `backend/src/migrations/{timestamp}-AddRemindersAndPushSubscriptions.ts`
- `backend/src/modules/reminders/models/reminder.model.ts`
- `backend/src/modules/reminders/dto/create-reminder.dto.ts`
- `backend/src/modules/reminders/dto/update-reminder.dto.ts`
- `backend/src/modules/reminders/services/reminders.service.ts`
- `backend/src/modules/reminders/services/reminder-scheduler.service.ts`
- `backend/src/modules/reminders/controllers/reminders.controller.ts`
- `backend/src/modules/reminders/reminders.module.ts`
- `backend/src/modules/notifications/models/push-subscription.model.ts`
- `backend/src/modules/notifications/dto/save-web-subscription.dto.ts`
- `backend/src/modules/notifications/dto/save-device-token.dto.ts`
- `backend/src/modules/notifications/services/notifications.service.ts`
- `backend/src/modules/notifications/controllers/notifications.controller.ts`
- `backend/src/modules/notifications/notifications.module.ts`

### Backend — Modified Files
- `backend/src/app.module.ts` — add `ScheduleModule.forRoot()`, `NotificationsModule`, `RemindersModule`
- `backend/src/db/db.config.ts` — add `Reminder` and `PushSubscription` to entities list (if not auto-discovered via glob)
- `backend/.env` — add VAPID and Firebase vars
- `backend/package.json` — add `@nestjs/schedule`, `web-push`, `firebase-admin`

### Frontend — New Files
- `src/app/types/reminder.types.ts`
- `src/app/services/reminders.service.ts`
- `src/app/services/notifications.service.ts`
- `src/app/pages/reminders/reminders.page.ts` (and `.html`, `.scss`)

### Frontend — Modified Files
- `src/app/types/environments.types.ts` — add `enableSwInDev?: boolean`
- `src/app/types/endpoints.types.ts` — add `RemindersRoutes` and `NotificationsRoutes`
- `src/app/app.component.ts` — inject `NotificationsService`, call `initForUser()` on login
- `src/app/app.routes.ts` — add `/reminders` route
- `src/app/app.config.ts` — update `provideServiceWorker` to use `enableSwInDev`
- `src/app/components/reminders/reminder-dialog/reminder-dialog.ts` — fill in from stub
- `src/app/components/reminders/reminder-dialog/reminder-dialog.html` — fill in from stub
- `src/environments/environment.development.ts` — optionally add `enableSwInDev: true`
- `package.json` — add `@capacitor/push-notifications`

---

## Important Notes for the Implementing LLM

1. **TypeORM entity registration**: Check `backend/src/db/db.config.ts` — entities may be registered via a glob pattern like `modules/**/models/*.model.ts`. If so, no manual addition needed. If they're listed explicitly, add `Reminder` and `PushSubscription`.

2. **NestJS naming convention**: The project uses `SnakeNamingStrategy` from TypeORM, so camelCase column names in entities automatically map to snake_case in the database. `scheduledFor` → `scheduled_for`, `isSent` → `is_sent`, etc.

3. **No `@Public()` decorator needed**: All reminder and notification endpoints should be behind the global `JwtAuthGuard`. That's the default — don't add `@Public()`.

4. **No GraphQL**: Existing modules have GraphQL resolvers, but REST controllers are the primary interface used by the frontend (GraphQL is only used for specific queries). Use REST controllers only for reminders and notifications.

5. **`getReq` returns an Observable**: In `notifications.service.ts`, the VAPID key fetch uses `getReq(...).toPromise()`. This is fine for a one-shot async call inside an `async` method. Alternatively use `firstValueFrom()` from RxJS.

6. **Web push payload format for `ngsw-worker.js`**: Angular's generated service worker expects the push payload to have a `notification` property at the root with `title` and `body`. The backend `_sendWebPush` method already wraps it correctly: `JSON.stringify({ notification: { title, body, data } })`.

7. **Firebase `FIREBASE_PRIVATE_KEY` contains literal `\n` chars**: When stored in `.env`, the newlines become escaped. The `replace(/\\n/g, "\n")` in `NotificationsService._initFirebase()` handles this correctly.

8. **`reminder-dialog` currently uses the old Angular decorator style** (Component without inject, no signal properties). The stub needs to be fully replaced — the component class is effectively empty so there's nothing to preserve.

9. **Capacitor sync**: After installing `@capacitor/push-notifications`, run `npx cap sync` to update the iOS project. The AppDelegate in the iOS project may also need `UNUserNotificationCenter` configuration — Capacitor handles most of this automatically but verify in the iOS project.

10. **`@nestjs/schedule` requires `ScheduleModule.forRoot()` in the root module**: It must be in `AppModule`'s imports, not just `RemindersModule`. The `@Cron` decorator in `ReminderSchedulerService` won't work otherwise.

11. **CLAUDE.md rules to follow**:
    - Empty line before and after all `if` blocks
    - Empty line before `return` statements
    - No `any` types anywhere
    - Access modifiers on all class properties
    - No inline comments unless very necessary (no JSDoc unless public API)
    - No empty lines between HTML elements
    - Use signals and `httpResource`, avoid RxJS except where necessary
