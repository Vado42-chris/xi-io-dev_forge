/**
 * Production Utilities
 * 
 * Production-ready features and helpers.
 */

/**
 * Environment detection
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Feature flags
 */
export class FeatureFlags {
  private flags: Map<string, boolean> = new Map();

  /**
   * Enable feature flag
   */
  enable(flag: string): void {
    this.flags.set(flag, true);
  }

  /**
   * Disable feature flag
   */
  disable(flag: string): void {
    this.flags.set(flag, false);
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }

  /**
   * Load flags from environment
   */
  loadFromEnv(prefix: string = 'FEATURE_'): void {
    for (const key in process.env) {
      if (key.startsWith(prefix)) {
        const flagName = key.slice(prefix.length).toLowerCase();
        const value = process.env[key]?.toLowerCase() === 'true';
        this.flags.set(flagName, value);
      }
    }
  }
}

/**
 * Error reporting
 */
export interface ErrorReport {
  message: string;
  stack?: string;
  context?: any;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export class ErrorReporter {
  private reports: ErrorReport[] = [];
  private maxReports: number = 100;
  private onReport?: (report: ErrorReport) => void;

  /**
   * Set error report handler
   */
  setHandler(handler: (report: ErrorReport) => void): void {
    this.onReport = handler;
  }

  /**
   * Report error
   */
  report(error: Error, context?: any): void {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.reports.push(report);

    // Keep only recent reports
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    // Call handler if set
    if (this.onReport) {
      this.onReport(report);
    }
  }

  /**
   * Get error reports
   */
  getReports(): ErrorReport[] {
    return [...this.reports];
  }

  /**
   * Clear reports
   */
  clearReports(): void {
    this.reports = [];
  }
}

/**
 * Version info
 */
export interface VersionInfo {
  version: string;
  build: string;
  timestamp: number;
  environment: string;
}

/**
 * Get version info
 */
export function getVersionInfo(): VersionInfo {
  return {
    version: process.env.VERSION || '1.0.0',
    build: process.env.BUILD || 'dev',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Mark start time
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure duration
   */
  measure(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);
    return duration;
  }

  /**
   * Measure and log
   */
  measureAndLog(name: string): number | null {
    const duration = this.measure(name);
    if (duration !== null) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }
}

