'use client';
// Efectos globales: service worker, aviso de nueva versión, modo rojo, primer uso,
// ubicación por GPS y sincronización de preferencias con el servidor de avisos.
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { distanceKm } from '@/lib/cities';
import { locateMe } from '@/lib/geo';
import { syncPush } from '@/lib/push-client';
import { getSettings, setSettings, subscribe, useHydrated, useSettings } from '@/lib/store';
import { IconClose } from './icons';

const signature = () => {
  const s = getSettings();
  return JSON.stringify([s.location, s.gear, s.cats, s.leads, s.follows, s.trips.map((t) => [t.id, t.depart, t.dest, t.items])]);
};

export function AppEffects() {
  const s = useSettings();
  const hydrated = useHydrated();
  const path = usePathname();
  const router = useRouter();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  // Modo noche rojo
  useEffect(() => {
    document.documentElement.classList.toggle('red', s.red);
  }, [s.red]);

  // Primer uso: a la bienvenida.
  useEffect(() => {
    if (hydrated && !s.onboarded && path !== '/bienvenida') router.replace('/bienvenida');
  }, [hydrated, s.onboarded, path, router]);

  // Service worker y aviso de versión nueva
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(sw);
        });
      });
    }).catch(() => {});
  }, []);

  // Preferencias → servidor (con espera para juntar cambios, y reintento al volver la red).
  useEffect(() => {
    let last = signature();
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (getSettings().push.endpoint) void syncPush();
    const unsub = subscribe(() => {
      const sig = signature();
      if (sig === last) return;
      last = sig;
      clearTimeout(timer);
      timer = setTimeout(() => void syncPush(), 1200);
    });
    const retry = () => { if (getSettings().push.dirty) void syncPush(); };
    window.addEventListener('online', retry);
    return () => {
      unsub();
      clearTimeout(timer);
      window.removeEventListener('online', retry);
    };
  }, []);

  // Ubicación actual: se refresca al abrir la app si ya hay permiso (no se pide de nuevo).
  useEffect(() => {
    if (!hydrated || !s.onboarded || s.locMode !== 'gps' || !('permissions' in navigator)) return;
    let alive = true;
    const refresh = async () => {
      try {
        const st = await navigator.permissions.query({ name: 'geolocation' });
        if (st.state !== 'granted') return;
        const loc = await locateMe();
        const cur = getSettings().location;
        if (alive && (!cur || distanceKm(cur, loc) > 3)) setSettings({ location: { lat: loc.lat, lon: loc.lon, name: loc.name } });
      } catch {}
    };
    void refresh();
    const onVis = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [hydrated, s.onboarded, s.locMode]);

  return (
    <>
      {s.red && <div className="red-layer" aria-hidden="true" />}
      {waiting && (
        <div className="toast" role="status">
          <span className="soft">Nueva versión disponible</span>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            style={{ minHeight: 36 }}
            onClick={() => {
              navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
              waiting.postMessage('skipWaiting');
            }}
          >
            Actualizar
          </button>
          <button type="button" className="icon-btn" style={{ width: 36, height: 36, background: 'transparent' }} aria-label="Cerrar" onClick={() => setWaiting(null)}>
            <IconClose />
          </button>
        </div>
      )}
    </>
  );
}
