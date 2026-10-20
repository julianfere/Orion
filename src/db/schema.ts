import { doublePrecision, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Prefs } from '@/lib/prefs';

// Sin cuentas: cada dispositivo suscripto es una fila, identificada por su endpoint de push.
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  lat: doublePrecision('lat').notNull(),
  lon: doublePrecision('lon').notNull(),
  place: text('place').notNull().default(''),
  tz: text('tz').notNull().default('UTC'),
  prefs: jsonb('prefs').$type<Prefs>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Avisos ya mandados, para no repetir.
export const sent = pgTable(
  'sent',
  {
    id: serial('id').primaryKey(),
    subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('sent_sub_key').on(t.subscriptionId, t.key)],
);

// Ajustes del servidor (por ejemplo, las claves VAPID generadas al primer arranque).
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
