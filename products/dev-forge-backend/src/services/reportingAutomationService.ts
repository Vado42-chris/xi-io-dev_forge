/**
 * Reporting Automation Service
 * 
 * Automated report generation, scheduling, and distribution.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { businessIntelligenceService } from './businessIntelligenceService';
import { financialReportingService } from './financialReportingService';

const pool = getPool();

export interface ReportDefinition {
  id: string;
  name: string;
  type: 'financial' | 'analytics' | 'user' | 'extension' | 'custom';
  template: string; // Report template identifier
  schedule?: ReportSchedule;
  recipients: string[]; // Email addresses or user IDs
  format: 'pdf' | 'csv' | 'json' | 'html';
  enabled: boolean;
  parameters?: Record<string, any>;
  createdAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:MM format
  timezone?: string;
}

export interface GeneratedReport {
  id: string;
  reportDefinitionId: string;
  reportName: string;
  type: ReportDefinition['type'];
  period: {
    start: Date;
    end: Date;
  };
  format: ReportDefinition['format'];
  data: any; // Report data
  fileUrl?: string; // URL to generated file
  generatedAt: Date;
  generatedBy?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

export const reportingAutomationService = {
  /**
   * Create a report definition
   */
  async createReportDefinition(
    definition: Omit<ReportDefinition, 'id' | 'createdAt' | 'lastRunAt' | 'nextRunAt'>
  ): Promise<ReportDefinition> {
    try {
      const id = uuidv4();
      const nextRunAt = definition.schedule ? this.calculateNextRun(definition.schedule) : undefined;

      await pool.query(
        `INSERT INTO report_definitions 
         (id, name, type, template, schedule, recipients, format, enabled, parameters, created_at, next_run_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)`,
        [
          id,
          definition.name,
          definition.type,
          definition.template,
          definition.schedule ? JSON.stringify(definition.schedule) : null,
          JSON.stringify(definition.recipients),
          definition.format,
          definition.enabled,
          definition.parameters ? JSON.stringify(definition.parameters) : null,
          nextRunAt,
        ]
      );

      logger.info(`Report definition created: ${definition.name}`, { reportId: id });
      return {
        ...definition,
        id,
        createdAt: new Date(),
        nextRunAt,
      };
    } catch (error: any) {
      logger.error(`Error creating report definition:`, error);
      throw new Error(`Failed to create report definition: ${error.message}`);
    }
  },

  /**
   * Generate a report
   */
  async generateReport(
    reportDefinitionId: string,
    period?: { start: Date; end: Date },
    format?: ReportDefinition['format']
  ): Promise<GeneratedReport> {
    try {
      const definition = await this.getReportDefinition(reportDefinitionId);
      if (!definition) {
        throw new Error('Report definition not found');
      }

      // Determine period
      const reportPeriod = period || this.getDefaultPeriod(definition.type);

      // Generate report data based on type
      let reportData: any;
      switch (definition.type) {
        case 'financial':
          reportData = await financialReportingService.generateFinancialReport(
            reportPeriod.start,
            reportPeriod.end
          );
          break;
        case 'analytics':
          reportData = await businessIntelligenceService.generateDashboardData(
            reportPeriod.start,
            reportPeriod.end
          );
          break;
        case 'user':
          reportData = await this.generateUserReport(reportPeriod);
          break;
        case 'extension':
          reportData = await this.generateExtensionReport(reportPeriod);
          break;
        default:
          reportData = {};
      }

      // Generate file if format specified
      const fileUrl = format ? await this.generateReportFile(reportData, definition, format) : undefined;

      const report: GeneratedReport = {
        id: uuidv4(),
        reportDefinitionId: definition.id,
        reportName: definition.name,
        type: definition.type,
        period: reportPeriod,
        format: format || definition.format,
        data: reportData,
        fileUrl,
        generatedAt: new Date(),
        status: 'completed',
      };

      // Save generated report
      await this.saveGeneratedReport(report);

      // Update last run time
      await pool.query(
        `UPDATE report_definitions 
         SET last_run_at = NOW(), next_run_at = $1 
         WHERE id = $2`,
        [definition.schedule ? this.calculateNextRun(definition.schedule) : null, definition.id]
      );

      logger.info(`Report generated: ${definition.name}`, { reportId: report.id });
      return report;
    } catch (error: any) {
      logger.error(`Error generating report:`, error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  },

  /**
   * Process scheduled reports
   */
  async processScheduledReports(): Promise<GeneratedReport[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM report_definitions 
         WHERE enabled = true 
         AND next_run_at IS NOT NULL 
         AND next_run_at <= NOW()`
      );

      const reports: GeneratedReport[] = [];

      for (const row of result.rows) {
        const definition = this.mapRowToReportDefinition(row);
        try {
          const report = await this.generateReport(definition.id);
          reports.push(report);

          // Send report to recipients if configured
          if (definition.recipients.length > 0) {
            await this.sendReportToRecipients(report, definition);
          }
        } catch (error: any) {
          logger.error(`Error processing scheduled report ${definition.id}:`, error);
        }
      }

      logger.info(`Processed ${reports.length} scheduled reports`);
      return reports;
    } catch (error: any) {
      logger.error(`Error processing scheduled reports:`, error);
      throw new Error(`Failed to process scheduled reports: ${error.message}`);
    }
  },

  /**
   * Get report definition
   */
  async getReportDefinition(reportDefinitionId: string): Promise<ReportDefinition | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM report_definitions WHERE id = $1`,
        [reportDefinitionId]
      );

      if (result.rows.length > 0) {
        return this.mapRowToReportDefinition(result.rows[0]);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting report definition:`, error);
      throw new Error(`Failed to get report definition: ${error.message}`);
    }
  },

  /**
   * Get all report definitions
   */
  async getAllReportDefinitions(): Promise<ReportDefinition[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM report_definitions ORDER BY name ASC`
      );
      return result.rows.map(this.mapRowToReportDefinition);
    } catch (error: any) {
      logger.error(`Error getting report definitions:`, error);
      throw new Error(`Failed to get report definitions: ${error.message}`);
    }
  },

  /**
   * Get generated reports
   */
  async getGeneratedReports(
    reportDefinitionId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<GeneratedReport[]> {
    try {
      let query = `SELECT * FROM generated_reports`;
      const params: any[] = [];
      let paramIndex = 1;

      if (reportDefinitionId) {
        query += ` WHERE report_definition_id = $${paramIndex++}`;
        params.push(reportDefinitionId);
      }

      query += ` ORDER BY generated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows.map(this.mapRowToGeneratedReport);
    } catch (error: any) {
      logger.error(`Error getting generated reports:`, error);
      throw new Error(`Failed to get generated reports: ${error.message}`);
    }
  },

  /**
   * Helper methods
   */
  private getDefaultPeriod(type: ReportDefinition['type']): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (type) {
      case 'financial':
        // Last month
        start.setMonth(start.getMonth() - 1);
        break;
      case 'analytics':
        // Last 30 days
        start.setDate(start.getDate() - 30);
        break;
      default:
        // Last 7 days
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  },

  private calculateNextRun(schedule: ReportSchedule): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilNext = (schedule.dayOfWeek || 0) - now.getDay();
        next.setDate(next.getDate() + (daysUntilNext > 0 ? daysUntilNext : daysUntilNext + 7));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(schedule.dayOfMonth || 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        next.setDate(1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        next.setMonth(0);
        next.setDate(1);
        break;
    }

    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    return next;
  },

  private async generateReportFile(
    data: any,
    definition: ReportDefinition,
    format: ReportDefinition['format']
  ): Promise<string> {
    // TODO: Implement file generation (PDF, CSV, etc.)
    // For now, return placeholder URL
    logger.info(`Generating ${format} file for report: ${definition.name}`);
    return `https://reports.example.com/${definition.id}/${Date.now()}.${format}`;
  },

  private async generateUserReport(period: { start: Date; end: Date }): Promise<any> {
    // TODO: Implement user report generation
    return {};
  },

  private async generateExtensionReport(period: { start: Date; end: Date }): Promise<any> {
    // TODO: Implement extension report generation
    return {};
  },

  private async sendReportToRecipients(
    report: GeneratedReport,
    definition: ReportDefinition
  ): Promise<void> {
    // TODO: Implement email sending
    logger.info(`Sending report to ${definition.recipients.length} recipients`);
  },

  private async saveGeneratedReport(report: GeneratedReport): Promise<void> {
    await pool.query(
      `INSERT INTO generated_reports 
       (id, report_definition_id, report_name, type, period_start, period_end, format, data, file_url, generated_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        report.id,
        report.reportDefinitionId,
        report.reportName,
        report.type,
        report.period.start,
        report.period.end,
        report.format,
        JSON.stringify(report.data),
        report.fileUrl || null,
        report.generatedAt,
        report.status,
      ]
    );
  },

  private mapRowToReportDefinition(row: any): ReportDefinition {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      template: row.template,
      schedule: row.schedule ? (typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule) : undefined,
      recipients: typeof row.recipients === 'string' ? JSON.parse(row.recipients) : row.recipients,
      format: row.format,
      enabled: row.enabled,
      parameters: row.parameters ? (typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters) : undefined,
      createdAt: new Date(row.created_at),
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
      nextRunAt: row.next_run_at ? new Date(row.next_run_at) : undefined,
    };
  },

  private mapRowToGeneratedReport(row: any): GeneratedReport {
    return {
      id: row.id,
      reportDefinitionId: row.report_definition_id,
      reportName: row.report_name,
      type: row.type,
      period: {
        start: new Date(row.period_start),
        end: new Date(row.period_end),
      },
      format: row.format,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      fileUrl: row.file_url,
      generatedAt: new Date(row.generated_at),
      status: row.status,
      error: row.error,
    };
  },
};

