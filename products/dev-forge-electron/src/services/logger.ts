/**
 * Logger Service
 * 
 * Centralized logging system for Dev Forge.
 * Supports multiple log levels and file output.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile || false,
      filePath: config.filePath,
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, error?: Error | any): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.log('error', message, context, error, stack);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    stack?: string
  ): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      stack,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // File output
    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(entry);
    }
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const message = `${prefix} ${contextStr} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data || '');
        break;
      case 'info':
        console.info(message, entry.data || '');
        break;
      case 'warn':
        console.warn(message, entry.data || '');
        break;
      case 'error':
        console.error(message, entry.data || '', entry.stack || '');
        break;
    }
  }

  /**
   * Log to file
   */
  private async logToFile(entry: LogEntry): Promise<void> {
    // In Electron, we'd use fs to write to file
    // For now, this is a placeholder
    try {
      const logLine = this.formatLogEntry(entry);
      // TODO: Implement file writing via Electron IPC
      // await window.electronAPI.writeLog(this.config.filePath!, logLine);
    } catch (error) {
      console.error('[Logger] Error writing to file:', error);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    const stack = entry.stack ? `\n${entry.stack}` : '';
    return `${timestamp} ${level} ${context} ${entry.message}${data}${stack}\n`;
  }

  /**
   * Get log entries
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let logs = [...this.logBuffer];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    if (limit) {
      logs = logs.slice(-limit);
    }
    
    return logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs
   */
  exportLogs(): string {
    return this.logBuffer.map(entry => this.formatLogEntry(entry)).join('');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const logger = new Logger({
  level: 'info',
  enableConsole: true,
  enableFile: false,
});

