import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemindersService } from './reminders.service';
import { Reminder, PushSubscription } from '../models/reminder.model';

describe('RemindersService', () => {
  let service: RemindersService;
  let remindersRepo: Repository<Reminder>;
  let subscriptionsRepo: Repository<PushSubscription>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: getRepositoryToken(Reminder),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PushSubscription),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    remindersRepo = module.get<Repository<Reminder>>(
      getRepositoryToken(Reminder),
    );
    subscriptionsRepo = module.get<Repository<PushSubscription>>(
      getRepositoryToken(PushSubscription),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReminder', () => {
    it('should create a reminder', async () => {
      const mockReminder = {
        id: 1,
        userId: 'user1',
        title: 'Test Reminder',
        description: 'Test description',
        scheduledDate: new Date('2024-01-01'),
        isActive: true,
      };

      jest.spyOn(remindersRepo, 'create').mockReturnValue(mockReminder as any);

      jest.spyOn(remindersRepo, 'save').mockResolvedValue(mockReminder as any);

      const result = await service.createReminder('user1', {
        title: 'Test Reminder',
        description: 'Test description',
        scheduledDate: new Date('2024-01-01'),
      });

      expect(result).toEqual(mockReminder);
      expect(remindersRepo.create).toHaveBeenCalledWith({
        title: 'Test Reminder',
        description: 'Test description',
        scheduledDate: new Date('2024-01-01'),
        userId: 'user1',
      });
      expect(remindersRepo.save).toHaveBeenCalled();
    });
  });

  describe('getUserReminders', () => {
    it('should return user reminders', async () => {
      const mockReminders = [
        {
          id: 1,
          userId: 'user1',
          title: 'Reminder 1',
          isActive: true,
        },
        {
          id: 2,
          userId: 'user1',
          title: 'Reminder 2',
          isActive: true,
        },
      ];

      jest
        .spyOn(remindersRepo, 'find')
        .mockResolvedValue(mockReminders as any);

      const result = await service.getUserReminders('user1');

      expect(result).toEqual(mockReminders);
      expect(remindersRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user1', isActive: true },
        order: { scheduledDate: 'ASC' },
      });
    });
  });

  describe('savePushSubscription', () => {
    it('should create new subscription if not exists', async () => {
      const mockSubscription = {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      };

      const savedSubscription = {
        id: 1,
        userId: 'user1',
        endpoint: mockSubscription.endpoint,
        p256dhKey: mockSubscription.keys.p256dh,
        authKey: mockSubscription.keys.auth,
      };

      jest.spyOn(subscriptionsRepo, 'findOne').mockResolvedValue(null);

      jest
        .spyOn(subscriptionsRepo, 'create')
        .mockReturnValue(savedSubscription as any);

      jest
        .spyOn(subscriptionsRepo, 'save')
        .mockResolvedValue(savedSubscription as any);

      const result = await service.savePushSubscription(
        'user1',
        mockSubscription,
      );

      expect(result).toEqual(savedSubscription);
      expect(subscriptionsRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user1', endpoint: mockSubscription.endpoint },
      });
      expect(subscriptionsRepo.create).toHaveBeenCalled();
      expect(subscriptionsRepo.save).toHaveBeenCalled();
    });

    it('should return existing subscription if it exists', async () => {
      const mockSubscription = {
        endpoint: 'https://example.com/push',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      };

      const existingSubscription = {
        id: 1,
        userId: 'user1',
        endpoint: mockSubscription.endpoint,
        p256dhKey: mockSubscription.keys.p256dh,
        authKey: mockSubscription.keys.auth,
      };

      jest
        .spyOn(subscriptionsRepo, 'findOne')
        .mockResolvedValue(existingSubscription as any);

      const result = await service.savePushSubscription(
        'user1',
        mockSubscription,
      );

      expect(result).toEqual(existingSubscription);
      expect(subscriptionsRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user1', endpoint: mockSubscription.endpoint },
      });
    });
  });

  describe('sendReminderNotification', () => {
    it('should return early if reminder not found', async () => {
      jest.spyOn(remindersRepo, 'findOne').mockResolvedValue(null);

      await service.sendReminderNotification(1);

      expect(remindersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
