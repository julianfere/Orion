import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { appSettings } from '@/db/schema';

type Keys = { publicKey: string; privateKey: string };
let cached: Keys | null = null;

/**
 * Claves VAPID: las de las variables de entorno si están; si no, las que se generaron y guardaron
 * en la base en el primer arranque. Así un deploy nuevo funciona sin configurar nada.
 */
export async function getVapid(): Promise<Keys> {
  if (cached) return cached;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    cached = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  } else {
    const db = getDb();
    const row = await db.select().from(appSettings).where(eq(appSettings.key, 'vapid'));
    if (row[0]) {
      cached = JSON.parse(row[0].value) as Keys;
    } else {
      const k = webpush.generateVAPIDKeys();
      await db.insert(appSettings).values({ key: 'vapid', value: JSON.stringify(k) }).onConflictDoNothing();
      // Si otro proceso la escribió primero, nos quedamos con esa.
      const again = await db.select().from(appSettings).where(eq(appSettings.key, 'vapid'));
      cached = JSON.parse(again[0].value) as Keys;
    }
  }
  webpush.setVapidDetails(`mailto:${process.env.VAPID_EMAIL ?? 'orion@example.com'}`, cached.publicKey, cached.privateKey);
  return cached;
}
