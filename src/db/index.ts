import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let db: NodePgDatabase<typeof schema> | null = null;

export const hasDb = () => !!process.env.DATABASE_URL;

export function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
    db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }), { schema });
  }
  return db;
}
