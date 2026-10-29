'use client';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { type Loc, dayKey } from './astro/core';
import { type AstroEvent, findEvent, generateEvents } from './astro/events';
import { type CloudForecast, fetchClouds } from './weather';

/** Días de efemérides que se calculan en el dispositivo. */
export const HORIZON_DAYS = 180;

const cache = new Map<string, AstroEvent[]>();
const keyOf = (loc: Loc, now: Date) => `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)},${dayKey(now)}`;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function eventsFor(loc: Loc): AstroEvent[] {
  const now = new Date();
  const k = keyOf(loc, now);
  let evs = cache.get(k);
  if (!evs) {
    evs = generateEvents(loc, startOfToday(), HORIZON_DAYS);
    cache.set(k, evs);
  }
  return evs;
}

/** Eventos de los próximos meses. Se calculan después del primer render para no trabar la carga. */
export function useEvents(loc: Loc | null): AstroEvent[] | null {
  const [state, setState] = useState<{ k: string; evs: AstroEvent[] } | null>(null);
  const k = loc ? keyOf(loc, new Date()) : '';
  useEffect(() => {
    if (!loc) return;
    const hit = cache.get(k);
    if (hit) {
      setState({ k, evs: hit });
      return;
    }
    const t = setTimeout(() => setState({ k, evs: eventsFor(loc) }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  // Si ya están en caché se devuelven en el mismo render: así la pantalla nueva aparece
  // completa durante la transición, sin pasar por "Calculando…".
  if (state && state.k === k) return state.evs;
  return loc ? cache.get(k) ?? null : null;
}

export function useEvent(loc: Loc | null, id: string | null): AstroEvent | null | undefined {
  const evs = useEvents(loc);
  return useMemo(() => {
    if (!loc || !id) return null;
    if (!evs) return undefined; // todavía calculando
    return evs.find((e) => e.id === id) ?? findEvent(loc, id, new Date());
  }, [evs, loc, id]);
}

// ── Conexión ────────────────────────────────────────────────────────────────

function subOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}
export const useOnline = () => useSyncExternalStore(subOnline, () => navigator.onLine, () => true);

// ── Nubes ───────────────────────────────────────────────────────────────────

const CLOUD_KEY = 'orion:clouds';

function readCloudCache(): CloudForecast[] {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_KEY) ?? '[]') as CloudForecast[];
  } catch {
    return [];
  }
}

const near = (f: CloudForecast, loc: Loc) => Math.abs(f.lat - loc.lat) < 0.05 && Math.abs(f.lon - loc.lon) < 0.05;

/** Pronóstico de nubes para un lugar: el guardado al instante y, si hay red y está viejo, uno nuevo. */
export function useClouds(loc: Loc | null): CloudForecast | null {
  const online = useOnline();
  const [f, setF] = useState<CloudForecast | null>(null);
  const k = loc ? `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}` : '';
  useEffect(() => {
    if (!loc) return;
    const cached = readCloudCache().find((x) => near(x, loc)) ?? null;
    setF(cached);
    if (!online || (cached && Date.now() - cached.fetchedAt < 60 * 60_000)) return;
    let alive = true;
    fetchClouds(loc.lat, loc.lon)
      .then((nf) => {
        if (!alive) return;
        setF(nf);
        try {
          const rest = readCloudCache().filter((x) => !near(x, loc)).slice(-4);
          localStorage.setItem(CLOUD_KEY, JSON.stringify([...rest, nf]));
        } catch {}
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, online]);
  return f;
}
