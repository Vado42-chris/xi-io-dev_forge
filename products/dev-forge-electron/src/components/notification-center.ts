/**
 * Notification Center Component
 * 
 * UI component for displaying notifications.
 */

import { NotificationService, Notification } from '../services/notification-service';

export class NotificationCenter {
  private container: HTMLElement;
  private notificationService: NotificationService;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, notificationService: NotificationService) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.notificationService = notificationService;
  }

  /**
   * Initialize notification center
   */
  initialize(): void {
    this.container.innerHTML = `
      <div class="notification-center">
        <div class="notification-center-header">
          <span class="notification-center-title">NOTIFICATIONS</span>
          <button id="dismiss-all-notifications" class="icon-button" title="Dismiss All">✕</button>
        </div>
        <div id="notifications-list" class="notifications-list">
          <!-- Notifications will be rendered here -->
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to notification changes
    this.unsubscribe = this.notificationService.onNotificationChange((notifications) => {
      this.renderNotifications(notifications);
    });

    // Initial render
    this.renderNotifications(this.notificationService.getAll());
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Dismiss all button
    const dismissAllBtn = this.container.querySelector('#dismiss-all-notifications');
    if (dismissAllBtn) {
      dismissAllBtn.addEventListener('click', () => {
        this.notificationService.dismissAll();
      });
    }
  }

  /**
   * Render notifications
   */
  private renderNotifications(notifications: Notification[]): void {
    const listContainer = this.container.querySelector('#notifications-list');
    if (!listContainer) return;

    if (notifications.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No notifications</div>';
      return;
    }

    // Sort by timestamp (newest first)
    const sorted = [...notifications].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    listContainer.innerHTML = sorted.map(notification => 
      this.renderNotification(notification)
    ).join('');

    // Set up notification event listeners
    sorted.forEach(notification => {
      const notificationElement = this.container.querySelector(`[data-notification-id="${notification.id}"]`);
      if (notificationElement) {
        // Dismiss button
        const dismissBtn = notificationElement.querySelector('.notification-dismiss');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', () => {
            this.notificationService.dismiss(notification.id);
          });
        }

        // Action buttons
        if (notification.actions) {
          notification.actions.forEach((action, index) => {
            const actionBtn = notificationElement.querySelector(`.notification-action[data-action-index="${index}"]`);
            if (actionBtn) {
              actionBtn.addEventListener('click', () => {
                action.handler();
                if (!action.primary) {
                  this.notificationService.dismiss(notification.id);
                }
              });
            }
          });
        }
      }
    });
  }

  /**
   * Render notification card
   */
  private renderNotification(notification: Notification): string {
    const typeClass = notification.type;
    const readClass = notification.read ? 'read' : 'unread';
    const icon = this.getNotificationIcon(notification.type);

    return `
      <div class="notification-card ${typeClass} ${readClass}" data-notification-id="${notification.id}">
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-title">${notification.title}</span>
            <button class="notification-dismiss icon-button" title="Dismiss">✕</button>
          </div>
          <div class="notification-message">${notification.message}</div>
          ${notification.actions && notification.actions.length > 0 ? `
            <div class="notification-actions">
              ${notification.actions.map((action, index) => `
                <button class="notification-action ${action.primary ? 'primary' : 'secondary'}" 
                        data-action-index="${index}">
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get notification icon
   */
  private getNotificationIcon(type: 'info' | 'success' | 'warning' | 'error'): string {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

