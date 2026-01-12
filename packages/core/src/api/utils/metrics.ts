/**
 * Metrics Utility
 * 
 * Performance metrics tracking for API client.
 */

export interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  statusCode?: number;
  success: boolean;
  timestamp: number;
  error?: string;
}

export class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private maxMetrics: number = 1000;

  /**
   * Record request metric
   */
  record(metric: Omit<RequestMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics
   */
  getMetrics(filter?: {
    url?: string;
    method?: string;
    success?: boolean;
    startTime?: number;
    endTime?: number;
  }): RequestMetrics[] {
    let filtered = [...this.metrics];

    if (filter) {
      if (filter.url) {
        filtered = filtered.filter(m => m.url.includes(filter.url!));
      }
      if (filter.method) {
        filtered = filtered.filter(m => m.method === filter.method);
      }
      if (filter.success !== undefined) {
        filtered = filtered.filter(m => m.success === filter.success);
      }
      if (filter.startTime) {
        filtered = filtered.filter(m => m.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        filtered = filtered.filter(m => m.timestamp <= filter.endTime!);
      }
    }

    return filtered;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = total - successful;
    const durations = this.metrics.map(m => m.duration);
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      total,
      successful,
      failed,
      averageDuration,
      minDuration,
      maxDuration,
      successRate,
    };
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

