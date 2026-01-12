/**
 * Database Connection
 * 
 * Handles database connections for Dev Forge backend.
 * Supports PostgreSQL (production) and SQLite (development).
 */

import { Pool, PoolConfig } from 'pg';
// SQLite support - will be added when needed
// import Database from 'better-sqlite3';

export interface DatabaseConfig {
  type: 'postgresql' | 'sqlite';
  connectionString?: string;
  path?: string;
}

export class DatabaseConnection {
  private pool: Pool | null = null;
  private sqlite: any = null; // SQLite Database type - will be typed when better-sqlite3 is added
  private config: DatabaseConfig;
  private type: 'postgresql' | 'sqlite';

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.type = config.type;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    if (this.type === 'postgresql') {
      await this.connectPostgreSQL();
    } else {
      this.connectSQLite();
    }
    console.log(`[Database] Connected to ${this.type}`);
  }

  /**
   * Connect to PostgreSQL
   */
  private async connectPostgreSQL(): Promise<void> {
    const poolConfig: PoolConfig = {
      connectionString: this.config.connectionString || process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(poolConfig);

    // Test connection
    try {
      await this.pool.query('SELECT NOW()');
      console.log('[Database] PostgreSQL connection successful');
    } catch (error) {
      console.error('[Database] PostgreSQL connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to SQLite
   */
  private connectSQLite(): void {
    // SQLite support will be added when better-sqlite3 is available
    // For now, use PostgreSQL
    console.log('[Database] SQLite not available, using PostgreSQL');
    throw new Error('SQLite support not yet implemented. Please use PostgreSQL.');
  }

  /**
   * Execute query (PostgreSQL)
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (this.type === 'postgresql') {
      if (!this.pool) {
        throw new Error('Database not connected');
      }
      return await this.pool.query(text, params);
    } else {
      throw new Error('Use executeSQLite for SQLite queries');
    }
  }

  /**
   * Execute query (SQLite)
   */
  executeSQLite(sql: string, params?: any[]): any {
    if (this.type === 'sqlite') {
      if (!this.sqlite) {
        throw new Error('Database not connected');
      }
      if (params) {
        return this.sqlite.prepare(sql).run(...params);
      }
      return this.sqlite.exec(sql);
    } else {
      throw new Error('Use query for PostgreSQL queries');
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.type === 'postgresql' && this.pool) {
      await this.pool.end();
      this.pool = null;
    } else if (this.type === 'sqlite' && this.sqlite) {
      this.sqlite.close();
      this.sqlite = null;
    }
    console.log('[Database] Connection closed');
  }

  /**
   * Get database type
   */
  getType(): 'postgresql' | 'sqlite' {
    return this.type;
  }
}

// Singleton instance
let dbConnection: DatabaseConnection | null = null;

/**
 * Get database connection instance
 */
export function getDatabase(): DatabaseConnection {
  if (!dbConnection) {
    const dbType = (process.env.DATABASE_TYPE || 'sqlite') as 'postgresql' | 'sqlite';
    dbConnection = new DatabaseConnection({
      type: dbType,
      connectionString: process.env.DATABASE_URL,
      path: process.env.DATABASE_PATH,
    });
  }
  return dbConnection;
}

