import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, hasDb } from '@/db';
import { subscriptions } from '@/db/schema';
import { sendTo } from '@/server/scheduler';

export const dynamic = 'force-dynamic';

// Botón "Probar" de Alertas: manda un aviso de muestra a este dispositivo.
export async function POST(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: 'Avisos no configurados' }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== 'string') return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 });
  const [sub] = await getDb().select().from(subscriptions).where(eq(subscriptions.endpoint, body.endpoint));
  if (!sub) return NextResponse.json({ error: 'Este dispositivo no está suscripto' }, { status: 404 });
  const ok = await sendTo(sub, { title: 'Orion · aviso de prueba', body: `Los avisos llegan bien a este dispositivo. Calculamos el cielo desde ${sub.place || 'tu ubicación'}.`, url: '/alertas', tag: 'prueba' });
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 });
}
