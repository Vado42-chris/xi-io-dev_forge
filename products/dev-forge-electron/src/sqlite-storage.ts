/**
 * SQLite Storage
 * 
 * Local storage using SQLite for Dev Forge.
 * Stores configuration, plugin data, and user preferences.
 */

// SQLite will be loaded via better-sqlite3
const Database = require('better-sqlite3');

export interface StorageConfig {
  dbPath: string;
}

export class SQLiteStorage {
  private db: any;

  constructor(config: StorageConfig) {
    this.db = new Database(config.dbPath);
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    // Configuration table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Plugins table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        config TEXT,
        updated_at INTEGER NOT NULL
      )
    `);

    // User preferences table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    console.log('[SQLiteStorage] Schema initialized');
  }

  /**
   * Get configuration value
   */
  getConfig(key: string): any {
    const row = this.db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    if (row) {
      try {
        return JSON.parse(row.value);
      } catch {
        return row.value;
      }
    }
    return null;
  }

  /**
   * Set configuration value
   */
  setConfig(key: string, value: any): void {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const now = Date.now();
    
    this.db.prepare(`
      INSERT INTO config (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, valueStr, now);
  }

  /**
   * Get plugin configuration
   */
  getPlugin(id: string): any {
    const row = this.db.prepare('SELECT * FROM plugins WHERE id = ?').get(id);
    if (row) {
      return {
        id: row.id,
        name: row.name,
        enabled: row.enabled === 1,
        config: row.config ? JSON.parse(row.config) : {},
        updatedAt: row.updated_at
      };
    }
    return null;
  }

  /**
   * Save plugin configuration
   */
  savePlugin(plugin: { id: string; name: string; enabled: boolean; config?: any }): void {
    const now = Date.now();
    const configStr = plugin.config ? JSON.stringify(plugin.config) : null;
    
    this.db.prepare(`
      INSERT INTO plugins (id, name, enabled, config, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        enabled = excluded.enabled,
        config = excluded.config,
        updated_at = excluded.updated_at
    `).run(plugin.id, plugin.name, plugin.enabled ? 1 : 0, configStr, now);
  }

  /**
   * Get user preference
   */
  getPreference(key: string): any {
    const row = this.db.prepare('SELECT value FROM preferences WHERE key = ?').get(key);
    if (row) {
      try {
        return JSON.parse(row.value);
      } catch {
        return row.value;
      }
    }
    return null;
  }

  /**
   * Set user preference
   */
  setPreference(key: string, value: any): void {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const now = Date.now();
    
    this.db.prepare(`
      INSERT INTO preferences (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, valueStr, now);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

