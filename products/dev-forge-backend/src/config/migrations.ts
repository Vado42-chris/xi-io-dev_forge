/**
 * Database Migrations
 * 
 * Handles database schema migrations.
 */

import { pool, query } from './database';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

export interface Migration {
  id: string;
  name: string;
  appliedAt: Date;
}

/**
 * Create migrations table if it doesn't exist
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations(): Promise<Migration[]> {
  await ensureMigrationsTable();
  const result = await query('SELECT id, name, applied_at FROM migrations ORDER BY applied_at');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    appliedAt: row.applied_at,
  }));
}

/**
 * Mark migration as applied
 */
async function markMigrationApplied(id: string, name: string): Promise<void> {
  await ensureMigrationsTable();
  await query(
    'INSERT INTO migrations (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
    [id, name]
  );
}

/**
 * Run a migration SQL file
 */
async function runMigration(sql: string, migrationId: string, migrationName: string): Promise<void> {
  try {
    // Run migration in a transaction
    await pool.query('BEGIN');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }

    await markMigrationApplied(migrationId, migrationName);
    await pool.query('COMMIT');

    logger.info(`Migration applied: ${migrationName}`);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    logger.error(`Migration failed: ${migrationName}`, error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Checking for pending migrations...');

    const appliedMigrations = await getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    // Get migration files
    const migrationsDir = join(__dirname, '../../migrations');
    const migrationFiles = [
      { id: '001', name: '001_initial_schema.sql' },
      { id: '002', name: '002_extension_registry.sql' },
      { id: '003', name: '003_community_forum.sql' },
      { id: '004', name: '004_financial_automation.sql' },
      { id: '005', name: '005_analytics_automation.sql' },
      { id: '006', name: '006_distribution_automation.sql' },
      { id: '007', name: '007_final_automation.sql' },
      { id: '008', name: '008_integration_validation.sql' },
      // Add more migrations here as they are created
    ];

    for (const migration of migrationFiles) {
      if (appliedIds.has(migration.id)) {
        logger.info(`Migration ${migration.id} already applied, skipping`);
        continue;
      }

      try {
        const migrationPath = join(migrationsDir, migration.name);
        const sql = readFileSync(migrationPath, 'utf-8');
        await runMigration(sql, migration.id, migration.name);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          logger.warn(`Migration file not found: ${migration.name}, skipping`);
          continue;
        }
        throw error;
      }
    }

    logger.info('All migrations completed');
  } catch (error: any) {
    logger.error('Migration process failed:', error);
    throw error;
  }
}

