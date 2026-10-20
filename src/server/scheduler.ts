import webpush from 'web-push';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { sent, subscriptions } from '@/db/schema';
import { type Loc, DAY, HOUR, atLocal, dayKey, hhmm, parts, shortDate, weekdayShort } from '@/lib/astro/core';
import { type AstroEvent, generateEvents } from '@/lib/astro/events';
import { isFollowed, leadTimes, notificationFor, notifiable } from '@/lib/alerts';
import { DEFAULT_PREFS, type Prefs } from '@/lib/prefs';
import { cloudsBetween, fetchClouds } from '@/lib/weather';
import { getVapid } from './vapid';

type Sub = typeof subscriptions.$inferSelect;
type Push = { key: string; title: string; body: string; url: string; tag: string };

// Si el servidor estuvo caído, un aviso atrasado se manda igual dentro de este margen.
const GRACE = 2 * HOUR;

const eventCache = new Map<string, { at: number; events: AstroEvent[] }>();

/** Eventos de los próximos días para una ubicación; se cachean una hora por ubicación redondeada. */
function eventsFor(loc: Loc, tz: string, now: Date) {
  const key = `${loc.lat.toFixed(1)},${loc.lon.toFixed(1)},${tz}`;
  const hit = eventCache.get(key);
  if (hit && now.getTime() - hit.at < HOUR) return hit.events;
  const events = generateEvents(loc, new Date(now.getTime() - DAY), 10, tz);
  eventCache.set(key, { at: now.getTime(), events });
  return events;
}

/** Fecha y hora local "YYYY-MM-DDTHH:mm" de un viaje → instante real en la zona del usuario. */
function localToDate(s: string, tz: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return atLocal(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)), +m[4], +m[5], tz);
}

export async function duePushes(sub: Pick<Sub, 'lat' | 'lon' | 'place' | 'tz'> & { prefs: Prefs }, now: Date): Promise<Push[]> {
  const prefs = { ...DEFAULT_PREFS, ...sub.prefs };
  const tz = sub.tz;
  const loc = { lat: sub.lat, lon: sub.lon, name: sub.place };
  const events = eventsFor(loc, tz, now);
  const out: Push[] = [];
  const inWindow = (at: Date) => at <= now && now.getTime() - at.getTime() < GRACE;

  for (const ev of events) {
    if (!notifiable(ev) || !isFollowed(ev, prefs)) continue;
    for (const lt of leadTimes(ev, prefs.leads, tz)) {
      if (!inWindow(lt.at)) continue;
      const n = notificationFor(ev, lt.key, tz);
      out.push({ key: `${ev.id}:${lt.key}`, ...n });
    }
  }

  // Viajes guardados: el día anterior y dos horas antes de salir.
  for (const trip of prefs.trips ?? []) {
    const depart = localToDate(trip.depart, tz);
    if (!depart) continue;
    const where = trip.dest?.name ? ` a ${trip.dest.name}` : '';
    const ready = Object.values(trip.items ?? {}).filter(Boolean).length;
    if (inWindow(new Date(depart.getTime() - DAY))) {
      out.push({ key: `viaje:${trip.id}:1d`, title: `Mañana salís${where}`, body: `${trip.eventTitle} · salida ${shortDate(depart, tz)} ${hhmm(depart, tz)}`, url: `/viajes?evento=${trip.eventId}`, tag: `viaje:${trip.id}` });
    }
    if (inWindow(new Date(depart.getTime() - 2 * HOUR))) {
      out.push({ key: `viaje:${trip.id}:2h`, title: `Salís en 2 horas${where}`, body: `${trip.eventTitle} · tenés ${ready} de 5 cosas listas para llevar`, url: `/viajes?evento=${trip.eventId}`, tag: `viaje:${trip.id}` });
    }
  }

  // Cielo de la semana: lunes a las 9, con lo que viene en los próximos 7 días.
  if (prefs.cats.p) {
    const monday9 = atLocal(now, 9, 0, tz);
    if (parts(now, tz).wd === 1 && inWindow(monday9)) {
      const week = events.filter((e) => {
        const t = new Date(e.nightOf ?? e.at).getTime();
        return notifiable(e) && t >= now.getTime() - 6 * HOUR && t < now.getTime() + 7 * DAY;
      });
      const body = week.length
        ? week.slice(0, 4).map((e) => `${weekdayShort(parts(new Date(e.nightOf ?? e.at), tz).wd)}: ${e.title}`).join(' · ')
        : 'Semana tranquila: buen momento para mirar la Luna y los planetas.';
      out.push({ key: `semana:${dayKey(now, tz)}`, title: 'El cielo de esta semana', body, url: '/', tag: 'semana' });
    }
  }
  return out;
}

/** Agrega la nubosidad prevista al aviso de "esta noche" si hay pronóstico. */
async function withClouds(p: Push, loc: Loc, ev: AstroEvent | undefined) {
  if (!ev?.window || !p.key.endsWith(':d')) return p;
  try {
    const f = await fetchClouds(loc.lat, loc.lon, 4000);
    const c = cloudsBetween(f, new Date(ev.window.start), new Date(ev.window.end));
    return c == null ? p : { ...p, body: `${p.body} Nubosidad prevista: ${c}%.` };
  } catch {
    return p;
  }
}

async function send(sub: Sub, p: Push) {
  return webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ title: p.title, body: p.body, url: p.url, tag: p.tag }),
    { TTL: 6 * 3600, urgency: 'high' },
  );
}

/** Manda un aviso y borra la suscripción si el navegador dice que ya no existe. Devuelve si salió. */
export async function sendTo(sub: Sub, p: Pick<Push, 'title' | 'body' | 'url' | 'tag'>): Promise<boolean> {
  await getVapid();
  try {
    await send(sub, { key: '', ...p });
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await getDb().delete(subscriptions).where(eq(subscriptions.id, sub.id));
    else console.error('[orion] push falló', status ?? err);
    return false;
  }
}

let running = false;

export async function runOnce(now = new Date()) {
  if (running) return;
  running = true;
  try {
    await getVapid();
    const db = getDb();
    const subs = await db.select().from(subscriptions);
    let count = 0;
    for (const sub of subs) {
      const loc = { lat: sub.lat, lon: sub.lon, name: sub.place };
      const due = await duePushes(sub, now);
      for (const p of due) {
        // Primero se reserva la clave: si ya estaba, este aviso ya salió.
        const claimed = await db.insert(sent).values({ subscriptionId: sub.id, key: p.key }).onConflictDoNothing().returning({ id: sent.id });
        if (!claimed.length) continue;
        const ev = eventsFor(loc, sub.tz, now).find((e) => p.key.startsWith(`${e.id}:`));
        const ok = await sendTo(sub, await withClouds(p, loc, ev));
        if (ok) count++;
        else await db.delete(sent).where(and(eq(sent.subscriptionId, sub.id), eq(sent.key, p.key)));
      }
    }
    if (count) console.log(`[orion] ${count} avisos enviados`);
  } catch (err) {
    console.error('[orion] error en el programador de avisos', err);
  } finally {
    running = false;
  }
}
