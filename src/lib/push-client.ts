'use client';
// Suscripción push del dispositivo, igual que en Cine: el navegador da una suscripción y el
// servidor la guarda junto con la ubicación y las preferencias de Alertas.
import { getSettings, prefsOf, setSettings } from './store';

export type PushSupport = 'ok' | 'unsupported' | 'ios-browser' | 'denied';

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    // En iPhone el push solo existe con la app instalada en la pantalla de inicio.
    return ios && !standalone ? 'ios-browser' : 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

async function post(sub: PushSubscription) {
  const s = getSettings();
  if (!s.location) throw new Error('Elegí una ubicación primero');
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON(), loc: s.location, tz: tz(), prefs: prefsOf(s) }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'No se pudo guardar la suscripción');
}

/** Pide permiso y suscribe. Tiene que llamarse desde un toque del usuario. */
export async function enablePush(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const support = pushSupport();
  if (support === 'ios-browser') return { ok: false, reason: 'En iPhone, primero agregá Orion a la pantalla de inicio (Compartir → Agregar a inicio).' };
  if (support === 'unsupported') return { ok: false, reason: 'Este navegador no admite notificaciones push.' };
  if (support === 'denied') return { ok: false, reason: 'Las notificaciones están bloqueadas: habilitalas en los ajustes del navegador.' };
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'Sin permiso no podemos avisarte.' };
    const keyRes = await fetch('/api/push/key');
    if (!keyRes.ok) return { ok: false, reason: 'El servidor de avisos no está disponible ahora.' };
    const { publicKey } = (await keyRes.json()) as { publicKey: string };
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource });
    await post(sub);
    setSettings({ push: { endpoint: sub.endpoint, dirty: false } });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'No se pudo activar.' };
  }
}

export async function disablePush() {
  const endpoint = getSettings().push.endpoint;
  setSettings({ push: { endpoint: null, dirty: false } });
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
    if (endpoint) await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) });
  } catch {}
}

/** Manda ubicación y preferencias actuales. Si no hay red, queda marcado para reintentar. */
export async function syncPush() {
  const s = getSettings();
  if (!s.push.endpoint || !s.location) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // El navegador borró la suscripción (permisos revocados, datos borrados).
      setSettings({ push: { endpoint: null, dirty: false } });
      return;
    }
    await post(sub);
    setSettings({ push: { endpoint: sub.endpoint, dirty: false } });
  } catch {
    setSettings({ push: { ...getSettings().push, dirty: true } });
  }
}

export async function testPush() {
  const endpoint = getSettings().push.endpoint;
  if (!endpoint) return false;
  const res = await fetch('/api/push/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) }).catch(() => null);
  return !!res?.ok;
}
