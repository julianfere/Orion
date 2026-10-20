import { DEFAULT_PREFS, type Prefs } from '@/lib/prefs';

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

/** Normaliza lo que manda el cliente: sin campos raros y con tamaños acotados. */
export function cleanPrefs(raw: unknown): Prefs {
  const p = (raw ?? {}) as Partial<Prefs>;
  const gear = p.gear === 'ojo' || p.gear === 'bino' || p.gear === 'tele' ? p.gear : DEFAULT_PREFS.gear;
  const cats = Object.fromEntries(Object.entries(DEFAULT_PREFS.cats).map(([k, d]) => [k, bool(p.cats?.[k as keyof Prefs['cats']], d)])) as Prefs['cats'];
  const leads = Object.fromEntries(Object.entries(DEFAULT_PREFS.leads).map(([k, d]) => [k, bool(p.leads?.[k as keyof Prefs['leads']], d)])) as Prefs['leads'];
  const follows: Prefs['follows'] = {};
  for (const [k, v] of Object.entries(p.follows ?? {}).slice(-300)) if (typeof v === 'boolean' && k.length < 80) follows[k] = v;
  const trips = (Array.isArray(p.trips) ? p.trips : []).slice(-20).flatMap((t) => {
    if (!t || typeof t.id !== 'string' || typeof t.depart !== 'string') return [];
    const dest = t.dest && isNum(t.dest.lat) && isNum(t.dest.lon) ? { lat: t.dest.lat, lon: t.dest.lon, name: String(t.dest.name ?? '').slice(0, 80) } : null;
    return [{ id: t.id.slice(0, 40), eventId: String(t.eventId ?? '').slice(0, 80), eventTitle: String(t.eventTitle ?? '').slice(0, 120), dest, depart: t.depart.slice(0, 16), items: Object.fromEntries(Object.entries(t.items ?? {}).slice(0, 10).map(([k, v]) => [k, !!v])) }];
  });
  return { gear, cats, leads, follows, trips };
}

export function cleanLoc(raw: unknown) {
  const l = (raw ?? {}) as { lat?: unknown; lon?: unknown; name?: unknown };
  if (!isNum(l.lat) || !isNum(l.lon) || Math.abs(l.lat) > 90 || Math.abs(l.lon) > 180) return null;
  return { lat: l.lat, lon: l.lon, name: String(l.name ?? '').slice(0, 80) };
}

export function cleanTz(raw: unknown) {
  if (typeof raw !== 'string') return 'UTC';
  try {
    new Intl.DateTimeFormat('es', { timeZone: raw });
    return raw;
  } catch {
    return 'UTC';
  }
}
