import { logger } from '../utils/logger.js';

export interface InAppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export interface INotificationService {
  sendNotification(userId: string, title: string, message: string, type?: string): Promise<InAppNotification>;
  getUserNotifications(userId: string): Promise<InAppNotification[]>;
}

export class MockNotificationService implements INotificationService {
  private notifications: InAppNotification[] = [];

  public async sendNotification(userId: string, title: string, message: string, type: string = 'INFO'): Promise<InAppNotification> {
    const notification: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      type,
      title,
      message,
      createdAt: new Date(),
      isRead: false,
    };
    this.notifications.push(notification);
    logger.info({ userId, title, type }, `[NOTIFICATION DISPATCHED] ${title}: ${message}`);
    return notification;
  }

  public async getUserNotifications(userId: string): Promise<InAppNotification[]> {
    return this.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const notificationService: INotificationService = new MockNotificationService();
