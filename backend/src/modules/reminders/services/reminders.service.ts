import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder, PushSubscription } from '../models/reminder.model';
import webpush, { WebPushError } from 'web-push';

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
    return this.remindersRepo.save(reminder);
  }

  async getUserReminders(userId: string) {
    return this.remindersRepo.find({
      where: { userId, isActive: true },
      order: { scheduledDate: 'ASC' },
    });
  }

  async savePushSubscription(
    userId: string,
    subscription: PushSubscriptionData,
  ) {
    const existingSubscription = await this.subscriptionsRepo.findOne({
      where: { userId, endpoint: subscription.endpoint },
    });

    if (!existingSubscription) {
      const newSubscription = this.subscriptionsRepo.create({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
      });

      return this.subscriptionsRepo.save(newSubscription);
    }

    return existingSubscription;
  }

  async sendReminderNotification(reminderId: number) {
    const reminder = await this.remindersRepo.findOne({
      where: { id: reminderId },
    });

    if (!reminder) return;

    const subscriptions = await this.subscriptionsRepo.find({
      where: { userId: reminder.userId },
    });

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

    const promises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dhKey,
          auth: sub.authKey,
        },
      };

      return webpush
        .sendNotification(pushSubscription, payload)
        .catch((error: WebPushError) => {
          console.error('Error sending notification:', error);
          if (error.statusCode === 410) {
            void this.subscriptionsRepo.delete(sub.id);
          }
        });
    });

    await Promise.all(promises);
  }
}
