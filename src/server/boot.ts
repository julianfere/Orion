import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb } from '@/db';
import { runOnce } from './scheduler';
import { getVapid } from './vapid';

const EVERY = 5 * 60_000;

async function migrateWithRetry() {
  // Al levantar el compose, Postgres puede tardar unos segundos más que la app.
  for (let i = 1; ; i++) {
    try {
      await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
      return;
    } catch (err) {
      if (i >= 20) throw err;
      console.log(`[orion] base no disponible todavía (intento ${i}), reintento en 3 s`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export async function boot() {
  const g = globalThis as { __orionBooted?: boolean };
  if (g.__orionBooted) return;
  g.__orionBooted = true;
  try {
    await migrateWithRetry();
    await getVapid();
    console.log('[orion] base migrada; programador de avisos cada 5 min');
    setTimeout(() => void runOnce(), 15_000);
    setInterval(() => void runOnce(), EVERY);
  } catch (err) {
    console.error('[orion] no se pudo iniciar el programador de avisos', err);
  }
}
