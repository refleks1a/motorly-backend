// Simple notification service for Phase 2
// This provides the interface for notifications without requiring database changes

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'maintenance' | 'diagnosis' | 'offer' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  body: string;
  type: 'maintenance' | 'diagnosis' | 'offer' | 'system';
  data?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, Notification[]> = new Map();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a new notification (in-memory for now)
   */
  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      title: request.title,
      body: request.body,
      type: request.type,
      data: request.data,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Store in memory
    if (!this.notifications.has(request.userId)) {
      this.notifications.set(request.userId, []);
    }
    this.notifications.get(request.userId)!.push(notification);

    // Send push notification to user's devices
    await this.sendPushNotification(request.userId, {
      title: request.title,
      body: request.body,
      data: request.data
    });

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const userNotifications = this.notifications.get(userId) || [];
    const total = userNotifications.length;
    const unreadCount = userNotifications.filter(n => !n.isRead).length;
    
    // Apply pagination
    const notifications = userNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    return {
      notifications,
      total,
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      userNotifications.forEach(notification => {
        notification.isRead = true;
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const index = userNotifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        userNotifications.splice(index, 1);
      }
    }
  }

  /**
   * Send maintenance reminder notification
   */
  async sendMaintenanceReminder(
    userId: string,
    vehicleId: string,
    maintenanceItem: string,
    dueDate: Date,
    severity: 'info' | 'warning' | 'urgent'
  ): Promise<void> {
    const title = this.getMaintenanceTitle(severity, maintenanceItem);
    const body = this.getMaintenanceBody(maintenanceItem, dueDate, severity);

    await this.createNotification({
      userId,
      title,
      body,
      type: 'maintenance',
      data: {
        vehicleId,
        maintenanceItem,
        dueDate: dueDate.toISOString(),
        severity
      }
    });
  }

  /**
   * Send diagnosis alert notification
   */
  async sendDiagnosisAlert(
    userId: string,
    vehicleId: string,
    issueType: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<void> {
    const title = 'New Diagnosis Alert';
    const body = `Your vehicle has a ${severity} severity issue: ${issueType}`;

    await this.createNotification({
      userId,
      title,
      body,
      type: 'diagnosis',
      data: {
        vehicleId,
        issueType,
        severity
      }
    });
  }

  /**
   * Send offer notification
   */
  async sendOfferNotification(
    userId: string,
    shopId: string,
    offerTitle: string,
    shopName: string
  ): Promise<void> {
    const title = 'Special Offer Available!';
    const body = `${shopName}: ${offerTitle}`;

    await this.createNotification({
      userId,
      title,
      body,
      type: 'offer',
      data: {
        shopId,
        offerTitle,
        shopName
      }
    });
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    console.log(`[Device Token] Registered ${platform} token for user ${userId}: ${token.substring(0, 20)}...`);
    // In a real implementation, this would store the token in a database
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<void> {
    console.log(`[Device Token] Unregistered token for user ${userId}: ${token.substring(0, 20)}...`);
    // In a real implementation, this would remove the token from the database
  }

  /**
   * Send push notification to user's devices
   */
  private async sendPushNotification(userId: string, payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      // In a real implementation, this would send push notifications
      // using services like Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
      // For now, we'll just log the notification
      console.log(`[Push Notification] User: ${userId}, Title: ${payload.title}, Body: ${payload.body}`);
      
      if (payload.data) {
        console.log(`[Push Notification] Data:`, payload.data);
      }

    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Don't throw - push notifications are non-critical
    }
  }

  /**
   * Get maintenance notification title based on severity
   */
  private getMaintenanceTitle(severity: 'info' | 'warning' | 'urgent', item: string): string {
    switch (severity) {
      case 'urgent':
        return `🚨 Urgent: ${item} Required`;
      case 'warning':
        return `⚠️ ${item} Due Soon`;
      case 'info':
      default:
        return `🔧 ${item} Maintenance`;
    }
  }

  /**
   * Get maintenance notification body
   */
  private getMaintenanceBody(item: string, dueDate: Date, _severity: 'info' | 'warning' | 'urgent'): string {
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 0) {
      return `${item} is overdue. Please schedule service immediately.`;
    } else if (daysUntilDue <= 7) {
      return `${item} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}. Schedule service soon.`;
    } else {
      return `${item} is due on ${dueDate.toLocaleDateString()}.`;
    }
  }

  /**
   * Clear all notifications (for testing)
   */
  clearAllNotifications(): void {
    this.notifications.clear();
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();