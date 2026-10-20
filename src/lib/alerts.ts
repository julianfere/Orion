// Reglas de avisos. Las usa la app (para mostrar cuándo llegan) y el servidor (para mandarlos),
// así lo que promete la pantalla es exactamente lo que pasa.
import { type Level, DAY, HOUR, LEVEL_RANK, atLocal, hhmm, parts, shortDate } from './astro/core';
import type { AstroEvent, Category } from './astro/events';
import type { CatKey, LeadKey, Prefs } from './prefs';

export const CAT_OF: Partial<Record<Category, CatKey>> = { meteoros: 'm', luna: 'l', conjuncion: 'c', oposicion: 'o', eclipse: 'e' };

export const notifiable = (ev: AstroEvent) => !!CAT_OF[ev.category];

/** Si el evento genera avisos: la elección por evento manda; si no hay, la categoría y el instrumento. */
export function isFollowed(ev: AstroEvent, prefs: Pick<Prefs, 'gear' | 'cats' | 'follows'>): boolean {
  const cat = CAT_OF[ev.category];
  if (!cat) return false;
  const explicit = prefs.follows[ev.id];
  if (explicit !== undefined) return explicit;
  return !!prefs.cats[cat] && LEVEL_RANK[ev.level] <= LEVEL_RANK[prefs.gear as Level];
}

/** Momento de cada aviso según la anticipación elegida. */
export function leadTimes(ev: AstroEvent, leads: Record<LeadKey, boolean>, tz?: string) {
  const start = new Date(ev.window?.start ?? ev.at);
  const out: { key: LeadKey; at: Date }[] = [];
  if (leads.w) out.push({ key: 'w', at: new Date(start.getTime() - 7 * DAY) });
  if (leads.d) {
    // "El día": una hora antes de que se ponga el Sol esa noche; si el evento es de día, a las 8.
    const at = ev.nightOf ? new Date(new Date(ev.nightOf).getTime() - HOUR) : atLocal(start, 8, 0, tz);
    out.push({ key: 'd', at });
  }
  if (leads.h) out.push({ key: 'h', at: new Date(start.getTime() - HOUR) });
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** "Te avisamos el 20 a las 18:10 y a las 02:30." */
export function describeLeads(ev: AstroEvent, leads: Record<LeadKey, boolean>, now: Date, tz?: string): string {
  const times = leadTimes(ev, leads, tz).filter((x) => x.at > now);
  if (!times.length) return 'Ya pasaron los momentos de aviso elegidos en Alertas.';
  let lastDay = -1;
  const bits = times.map(({ at }) => {
    const p = parts(at, tz);
    const s = p.d === lastDay ? `a las ${hhmm(at, tz)}` : `el ${p.d} a las ${hhmm(at, tz)}`;
    lastDay = p.d;
    return s;
  });
  const list = bits.length > 1 ? `${bits.slice(0, -1).join(', ')} y ${bits[bits.length - 1]}` : bits[0];
  return `Te avisamos ${list}.`;
}

export function notificationFor(ev: AstroEvent, key: LeadKey, tz?: string) {
  const start = new Date(ev.window?.start ?? ev.at);
  const daytime = !ev.nightOf;
  const title =
    key === 'w' ? `${ev.title}: en una semana`
    : key === 'd' ? `${ev.title} ${daytime ? 'hoy' : 'esta noche'}`
    : `${ev.title} en 1 hora`;
  const body = key === 'w' ? `${shortDate(start, tz)} · ${ev.detail}` : ev.alert;
  const url = ev.category === 'luna' ? '/luna' : `/evento?id=${ev.id}`;
  return { title, body, url, tag: `${ev.id}:${key}` };
}
