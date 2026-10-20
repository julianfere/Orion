import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SW_SOURCE } from '@/sw/source';

// El service worker lleva el id del build: cada deploy cambia el archivo y el navegador lo actualiza.
let version: string | null = null;
function buildId() {
  if (version) return version;
  try {
    version = readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
  } catch {
    version = `dev-${Date.now()}`;
  }
  return version;
}

export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(`const VERSION = ${JSON.stringify(buildId())};\n${SW_SOURCE}`, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
