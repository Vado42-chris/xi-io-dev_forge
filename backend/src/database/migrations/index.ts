/**
 * Migration Index
 * 
 * Exports all migrations in order.
 */

import { migration as initialSchema } from './001_initial_schema';
import { Migration } from './migrationRunner';

export const migrations: Migration[] = [
  initialSchema,
];

export { MigrationRunner } from './migrationRunner';

