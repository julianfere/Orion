import { NextResponse } from 'next/server';
import { hasDb } from '@/db';
import { getVapid } from '@/server/vapid';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDb()) return NextResponse.json({ error: 'Avisos no configurados' }, { status: 503 });
  const { publicKey } = await getVapid();
  return NextResponse.json({ publicKey });
}
