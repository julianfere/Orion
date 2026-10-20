import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, hasDb } from '@/db';
import { subscriptions } from '@/db/schema';
import { cleanLoc, cleanPrefs, cleanTz } from '@/server/validate';

export const dynamic = 'force-dynamic';

// Alta o actualización: el cliente manda la suscripción junto con ubicación y preferencias cada vez que cambian.
export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: 'Avisos no configurados' }, { status: 503 });
  const body = await req.json().catch(() => null);
  const sub = body?.subscription;
  const loc = cleanLoc(body?.loc);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth || typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  }
  if (!loc) return NextResponse.json({ error: 'Ubicación inválida' }, { status: 400 });
  const values = {
    endpoint: sub.endpoint as string,
    p256dh: String(sub.keys.p256dh),
    auth: String(sub.keys.auth),
    lat: loc.lat,
    lon: loc.lon,
    place: loc.name,
    tz: cleanTz(body?.tz),
    prefs: cleanPrefs(body?.prefs),
    updatedAt: new Date(),
  };
  await getDb()
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({ target: subscriptions.endpoint, set: { ...values, endpoint: undefined } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ ok: true });
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint === 'string') await getDb().delete(subscriptions).where(eq(subscriptions.endpoint, body.endpoint));
  return NextResponse.json({ ok: true });
}
