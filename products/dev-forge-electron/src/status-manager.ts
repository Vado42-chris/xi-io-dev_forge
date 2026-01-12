/**
 * Status Manager
 * 
 * Manages status bar updates and notifications.
 * Uses Xibalba Framework styling.
 */

export class StatusManager {
  private statusBar: HTMLElement | null = null;
  private statusTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.statusBar = document.querySelector('.status-bar');
  }

  /**
   * Update status bar
   */
  update(message: string, duration?: number): void {
    if (!this.statusBar) return;

    this.statusBar.textContent = message;

    // Clear existing timeout
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    // Auto-clear after duration (default 5 seconds)
    if (duration !== 0) {
      const timeout = duration || 5000;
      this.statusTimeout = setTimeout(() => {
        this.clear();
      }, timeout);
    }
  }

  /**
   * Clear status bar
   */
  clear(): void {
    if (!this.statusBar) return;
    this.statusBar.textContent = 'Ready';
    
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }
  }

  /**
   * Show error status
   */
  error(message: string, duration?: number): void {
    this.update(`Error: ${message}`, duration);
    // Could add visual error indicator
  }

  /**
   * Show success status
   */
  success(message: string, duration?: number): void {
    this.update(`✓ ${message}`, duration);
  }

  /**
   * Show info status
   */
  info(message: string, duration?: number): void {
    this.update(`ℹ ${message}`, duration);
  }
}

