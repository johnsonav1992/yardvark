import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder, PushSubscription } from '../models/reminder.model';
import webpush, { WebPushError } from 'web-push';
import { LogHelpers } from '../../../logger/logger.helpers';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private remindersRepo: Repository<Reminder>,
    @InjectRepository(PushSubscription)
    private subscriptionsRepo: Repository<PushSubscription>,
  ) {
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }

  async createReminder(userId: string, reminderData: Partial<Reminder>) {
    const reminder = this.remindersRepo.create({ ...reminderData, userId });
    const saved = await LogHelpers.withDatabaseTelemetry(() =>
      this.remindersRepo.save(reminder),
    );

    LogHelpers.addBusinessContext('reminderCreated', saved.id);

    return saved;
  }

  async getUserReminders(userId: string) {
    const reminders = await LogHelpers.withDatabaseTelemetry(() =>
      this.remindersRepo.find({
        where: { userId, isActive: true },
        order: { scheduledDate: 'ASC' },
      }),
    );

    LogHelpers.addBusinessContext('remindersCount', reminders.length);

    return reminders;
  }

  async savePushSubscription(
    userId: string,
    subscription: PushSubscriptionData,
  ) {
    const existingSubscription = await LogHelpers.withDatabaseTelemetry(() =>
      this.subscriptionsRepo.findOne({
        where: { userId, endpoint: subscription.endpoint },
      }),
    );

    if (!existingSubscription) {
      const newSubscription = this.subscriptionsRepo.create({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
      });

      const saved = await LogHelpers.withDatabaseTelemetry(() =>
        this.subscriptionsRepo.save(newSubscription),
      );

      LogHelpers.addBusinessContext('pushSubscriptionCreated', true);

      return saved;
    }

    LogHelpers.addBusinessContext('pushSubscriptionExists', true);

    return existingSubscription;
  }

  async sendReminderNotification(reminderId: number) {
    LogHelpers.addBusinessContext('reminderId', reminderId);

    const reminder = await LogHelpers.withDatabaseTelemetry(() =>
      this.remindersRepo.findOne({
        where: { id: reminderId },
      }),
    );

    if (!reminder) return;

    const subscriptions = await LogHelpers.withDatabaseTelemetry(() =>
      this.subscriptionsRepo.find({
        where: { userId: reminder.userId },
      }),
    );

    LogHelpers.addBusinessContext('pushSubscriptionCount', subscriptions.length);

    const payload = JSON.stringify({
      title: reminder.title,
      body: reminder.description || 'You have a lawn care reminder',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        reminderId: reminder.id,
        url: '/dashboard',
      },
    });

    let successCount = 0;
    let failCount = 0;

    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dhKey,
          auth: sub.authKey,
        },
      };

      const start = Date.now();

      try {
        await webpush.sendNotification(pushSubscription, payload);
        LogHelpers.recordExternalCall('webpush', Date.now() - start, true);
        successCount++;
      } catch (error) {
        LogHelpers.recordExternalCall('webpush', Date.now() - start, false);
        failCount++;

        if (error instanceof WebPushError && error.statusCode === 410) {
          void this.subscriptionsRepo.delete(sub.id);
        }
      }
    });

    await Promise.all(promises);

    LogHelpers.addBusinessContext('pushNotificationsSent', successCount);
    LogHelpers.addBusinessContext('pushNotificationsFailed', failCount);
  }
}
