/**
 * Logger Utility
 * 
 * Centralized logging system for Dev Forge backend.
 * Supports multiple log levels and file output.
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  logFile?: string;
  consoleOutput?: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private logFile: string | null = null;

  constructor(config: LoggerConfig) {
    this.config = {
      consoleOutput: true,
      ...config,
    };

    // Set up log file if specified
    if (this.config.logFile) {
      this.logFile = this.config.logFile;
      this.ensureLogDirectory();
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (this.logFile) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Format log message
   */
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  /**
   * Write to log file
   */
  private writeToFile(message: string): void {
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, message + '\n', 'utf-8');
      } catch (error) {
        console.error('[Logger] Failed to write to log file:', error);
      }
    }
  }

  /**
   * Log message
   */
  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level < this.config.level) {
      return; // Skip if below configured level
    }

    const formattedMessage = this.formatMessage(levelName, message, data);

    // Console output
    if (this.config.consoleOutput) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }

    // File output
    this.writeToFile(formattedMessage);
  }

  /**
   * Debug log
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  /**
   * Info log
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  /**
   * Warning log
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  /**
   * Error log
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data);
  }
}

// Singleton logger instance
let loggerInstance: Logger | null = null;

/**
 * Get logger instance
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logFile = process.env.LOG_FILE;

    const levelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
    };

    loggerInstance = new Logger({
      level: levelMap[logLevel.toLowerCase()] || LogLevel.INFO,
      logFile: logFile,
      consoleOutput: process.env.NODE_ENV !== 'production',
    });
  }

  return loggerInstance;
}

