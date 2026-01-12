/**
 * Database Configuration
 * 
 * Database configuration for Dev Forge backend.
 */

export interface DatabaseConfig {
  type: 'postgresql' | 'sqlite';
  connectionString?: string;
  path?: string;
  poolSize?: number;
  timeout?: number;
}

/**
 * Get database configuration from environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DATABASE_TYPE || 'sqlite') as 'postgresql' | 'sqlite';

  return {
    type: dbType,
    connectionString: process.env.DATABASE_URL,
    path: process.env.DATABASE_PATH || './data/dev-forge.db',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    timeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
  };
}

