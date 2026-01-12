/**
 * Migration Runner
 * 
 * Handles database migrations for schema changes.
 */

import { getDatabase } from '../connection';
import { getLogger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = getLogger();

export interface Migration {
  id: string;
  name: string;
  up: string;
  down?: string;
}

export class MigrationRunner {
  private db = getDatabase();
  private migrationsTable = 'schema_migrations';

  /**
   * Initialize migrations table
   */
  async initialize(): Promise<void> {
    try {
      if (this.db.getType() === 'postgresql') {
        await this.db.query(`
          CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        logger.info('Migrations table initialized');
      }
    } catch (error: any) {
      logger.error('Failed to initialize migrations table', { error: error.message });
      throw error;
    }
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<string[]> {
    try {
      if (this.db.getType() === 'postgresql') {
        const result = await this.db.query(
          `SELECT id FROM ${this.migrationsTable} ORDER BY executed_at`
        );
        return result.rows.map((row: any) => row.id);
      }
      return [];
    } catch (error: any) {
      logger.error('Failed to get executed migrations', { error: error.message });
      return [];
    }
  }

  /**
   * Mark migration as executed
   */
  async markExecuted(migrationId: string, migrationName: string): Promise<void> {
    try {
      if (this.db.getType() === 'postgresql') {
        await this.db.query(
          `INSERT INTO ${this.migrationsTable} (id, name) VALUES ($1, $2)`,
          [migrationId, migrationName]
        );
      }
    } catch (error: any) {
      logger.error('Failed to mark migration as executed', { error: error.message });
      throw error;
    }
  }

  /**
   * Run a migration
   */
  async runMigration(migration: Migration): Promise<void> {
    try {
      logger.info(`Running migration: ${migration.name}`, { id: migration.id });
      
      if (this.db.getType() === 'postgresql') {
        await this.db.query(migration.up);
        await this.markExecuted(migration.id, migration.name);
        logger.info(`Migration completed: ${migration.name}`, { id: migration.id });
      }
    } catch (error: any) {
      logger.error(`Migration failed: ${migration.name}`, { error: error.message, id: migration.id });
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.initialize();
    
    const executed = await this.getExecutedMigrations();
    const pending = migrations.filter(m => !executed.includes(m.id));

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Running ${pending.length} pending migrations`);
    
    for (const migration of pending) {
      await this.runMigration(migration);
    }

    logger.info('All migrations completed');
  }
}

