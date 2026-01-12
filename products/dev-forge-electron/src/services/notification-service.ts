/**
 * Notification Service
 * 
 * Manages notifications and toast messages for user feedback.
 * Provides non-intrusive notifications with different types and priorities.
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 = persistent
  actions?: NotificationAction[];
  timestamp: Date;
  read: boolean;
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  primary?: boolean;
}

export interface NotificationOptions {
  duration?: number;
  actions?: NotificationAction[];
  persistent?: boolean;
}

export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private statusCallbacks: Set<(notifications: Notification[]) => void> = new Set();
  private defaultDuration: number = 5000; // 5 seconds

  constructor() {
    // Initialize notification service
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, options?: NotificationOptions): string {
    return this.show('info', title, message, options);
  }

  /**
   * Show success notification
   */
  success(title: string, message: string, options?: NotificationOptions): string {
    return this.show('success', title, message, options);
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, options?: NotificationOptions): string {
    return this.show('warning', title, message, options);
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, options?: NotificationOptions): string {
    return this.show('error', title, message, {
      ...options,
      duration: options?.persistent ? 0 : (options?.duration || 10000), // Errors last longer
    });
  }

  /**
   * Show notification
   */
  private show(
    type: NotificationType,
    title: string,
    message: string,
    options?: NotificationOptions
  ): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration: options?.persistent ? 0 : (options?.duration || this.defaultDuration),
      actions: options?.actions,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.set(id, notification);
    this.notifyStatusChange();

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * Dismiss notification
   */
  dismiss(id: string): void {
    this.notifications.delete(id);
    this.notifyStatusChange();
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notifications.clear();
    this.notifyStatusChange();
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifyStatusChange();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyStatusChange();
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.getAll().filter(n => !n.read);
  }

  /**
   * Get notifications by type
   */
  getByType(type: NotificationType): Notification[] {
    return this.getAll().filter(n => n.type === type);
  }

  /**
   * Get notification count
   */
  getCount(): number {
    return this.notifications.size;
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Subscribe to notification changes
   */
  onNotificationChange(callback: (notifications: Notification[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const notifications = this.getAll();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        console.error('[NotificationService] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();

