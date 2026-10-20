import * as A from 'astronomy-engine';
import { constellationName } from './constellations';

export type Loc = { lat: number; lon: number; name: string };
export type Level = 'ojo' | 'bino' | 'tele';

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const observer = (l: Loc) => new A.Observer(l.lat, l.lon, 0);
export const isSouth = (l: Loc) => l.lat < 0;

export const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as const;
export type Planet = (typeof PLANETS)[number];
export const PLANET_ES: Record<Planet, string> = {
  Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno',
};

// ── Tiempo ──────────────────────────────────────────────────────────────────
// Todo se muestra en la zona horaria del dispositivo; el servidor recibe la del usuario.

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions, tz?: string) {
  const key = JSON.stringify(opts) + (tz ?? '');
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('es-AR', { ...opts, timeZone: tz });
    fmtCache.set(key, f);
  }
  return f;
}

export const hhmm = (d: Date, tz?: string) => fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }, tz).format(d);

const WD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WD_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MON_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Partes de la fecha local (año, mes 0-11, día, día de semana, hora, minuto) en la zona dada. */
export function parts(d: Date, tz?: string) {
  const p = fmt({ year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }, tz)
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {});
  const wdIdx = new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay();
  return { y: +p.year, m: +p.month - 1, d: +p.day, wd: wdIdx, h: +p.hour, min: +p.minute };
}

export const dayKey = (d: Date, tz?: string) => {
  const p = parts(d, tz);
  return `${p.y}${String(p.m + 1).padStart(2, '0')}${String(p.d).padStart(2, '0')}`;
};
export const wdShort = (d: Date, tz?: string) => WD[parts(d, tz).wd];
export const monShort = (d: Date, tz?: string) => MON[parts(d, tz).m];
/** "mié 21 oct" */
export const shortDate = (d: Date, tz?: string) => {
  const p = parts(d, tz);
  return `${WD[p.wd].toLowerCase()} ${p.d} ${MON[p.m]}`;
};
/** "Martes 20 de octubre" */
export const longDate = (d: Date, tz?: string) => {
  const p = parts(d, tz);
  return `${WD_LONG[p.wd]} ${p.d} de ${MON_LONG[p.m]}`;
};
export const monthLong = (m: number) => MON_LONG[m];
export const monthShort = (m: number) => MON[m];
export const weekdayShort = (wd: number) => WD[wd];

/** Instante UTC que corresponde a la hora local h:min del día local de `ref` en la zona `tz`. */
export function atLocal(ref: Date, h: number, min: number, tz?: string): Date {
  const p = parts(ref, tz);
  // Primera aproximación tratando la hora local como UTC, después se corrige por el desfase real.
  const guess = Date.UTC(p.y, p.m, p.d, h, min);
  const q = parts(new Date(guess), tz);
  const shown = Date.UTC(q.y, q.m, q.d, q.h, q.min);
  return new Date(guess - (shown - guess));
}

export const deg = (n: number, digits = 2) => n.toFixed(digits).replace('.', ',').replace('-', '−');
export const coords = (l: Loc) => `${deg(l.lat)}° ${deg(l.lon)}°`;
export const decimal = (n: number, digits = 1) => n.toFixed(digits).replace('.', ',');

// ── Posiciones ──────────────────────────────────────────────────────────────

export function bodyAltAz(body: A.Body | Planet, date: Date, obs: A.Observer) {
  const eq = A.Equator(body as A.Body, date, obs, true, true);
  return A.Horizon(date, obs, eq.ra, eq.dec, 'normal');
}

export function raDecAltAz(ra: number, dec: number, date: Date, obs: A.Observer) {
  return A.Horizon(date, obs, ra, dec, 'normal');
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
export const cardinal = (az: number) => DIRS[Math.round((((az % 360) + 360) % 360) / 45) % 8];
const DIRS_LONG = ['el norte', 'el noreste', 'el este', 'el sureste', 'el sur', 'el suroeste', 'el oeste', 'el noroeste'];
export const cardinalLong = (az: number) => DIRS_LONG[Math.round((((az % 360) + 360) % 360) / 45) % 8];

export function riseSet(body: A.Body, loc: Loc, dir: 1 | -1, from: Date, days = 1.2): Date | null {
  const r = A.SearchRiseSet(body, observer(loc), dir, from, days);
  return r ? r.date : null;
}

export function constellationOf(body: Planet, date: Date) {
  const eq = A.Equator(body as A.Body, date, new A.Observer(0, 0, 0), true, false);
  // Equator con ofdate=false devuelve J2000, que es lo que espera Constellation.
  const c = A.Constellation(eq.ra, eq.dec);
  return constellationName(c.symbol, c.name);
}

export const magnitude = (body: Planet, date: Date) => A.Illumination(body as A.Body, date).mag;

/** Instrumento según magnitud. Umbrales pensados para cielo de ciudad: ajustar con pruebas reales. */
export function levelForMag(mag: number): Level {
  if (mag <= 5) return 'ojo';
  if (mag <= 7.5) return 'bino';
  return 'tele';
}

export const LEVELS: Record<Level, { label: string; color: string; bg: string }> = {
  ojo: { label: 'A simple vista', color: '#F4C76A', bg: 'rgba(244,199,106,0.12)' },
  bino: { label: 'Binoculares', color: '#8DB2FF', bg: 'rgba(141,178,255,0.12)' },
  tele: { label: 'Telescopio', color: '#C9B2FF', bg: 'rgba(201,178,255,0.12)' },
};
export const LEVEL_RANK: Record<Level, number> = { ojo: 0, bino: 1, tele: 2 };

// ── Luna ────────────────────────────────────────────────────────────────────

export const SYNODIC = 29.530588;

export function moonInfo(date: Date) {
  const phase = A.MoonPhase(date); // 0 nueva, 90 cuarto creciente, 180 llena
  const fraction = A.Illumination(A.Body.Moon, date).phase_fraction;
  const waxing = phase < 180;
  return { phase, fraction, waxing, illum: Math.round(fraction * 100), ageDays: (phase / 360) * SYNODIC, name: phaseName(fraction, waxing) };
}

export function phaseName(fraction: number, waxing: boolean) {
  const pct = fraction * 100;
  if (pct < 2) return 'Luna nueva';
  if (pct > 98.5) return 'Luna llena';
  if (pct >= 47 && pct <= 53) return waxing ? 'Cuarto creciente' : 'Cuarto menguante';
  if (pct < 50) return waxing ? 'Creciente' : 'Menguante';
  return waxing ? 'Gibosa creciente' : 'Gibosa menguante';
}

// ── Noche ───────────────────────────────────────────────────────────────────

export type Night = { sunset: Date; sunrise: Date; duskEnd: Date; dawnStart: Date };

/** La noche que contiene `t`; si `t` cae de día, la noche siguiente. */
export function nightFor(loc: Loc, t: Date): Night | null {
  const obs = observer(loc);
  const sunAlt = bodyAltAz(A.Body.Sun, t, obs).altitude;
  let sunset: Date | null;
  if (sunAlt < -0.83) {
    sunset = riseSet(A.Body.Sun, loc, -1, new Date(t.getTime() - DAY), 1);
    if (sunset && sunset > t) sunset = riseSet(A.Body.Sun, loc, -1, new Date(t.getTime() - 1.5 * DAY), 1);
  } else {
    sunset = riseSet(A.Body.Sun, loc, -1, t, 1);
  }
  if (!sunset) return null;
  const sunrise = riseSet(A.Body.Sun, loc, +1, sunset, 1);
  if (!sunrise) return null;
  // Con el Sol a −12° ya está oscuro para mirar; respaldo de una hora por si no llega a bajar tanto.
  const dusk = A.SearchAltitude(A.Body.Sun, obs, -1, sunset, 1, -12);
  const dawn = A.SearchAltitude(A.Body.Sun, obs, +1, dusk ? dusk.date : sunset, 1, -12);
  return {
    sunset,
    sunrise,
    duskEnd: dusk && dusk.date < sunrise ? dusk.date : new Date(sunset.getTime() + HOUR),
    dawnStart: dawn && dawn.date < sunrise ? dawn.date : new Date(sunrise.getTime() - HOUR),
  };
}

/** Noche que empieza el día local de `ref` (para "esta noche"). */
export function tonight(loc: Loc, ref: Date, tz?: string): Night | null {
  return nightFor(loc, atLocal(ref, 13, 0, tz));
}

export type Interval = { start: Date; end: Date };

/** Recorre la noche cada `step` minutos y devuelve los tramos donde `pred` se cumple. */
export function scanIntervals(n: Night, pred: (t: Date) => boolean, stepMin = 10): Interval[] {
  const out: Interval[] = [];
  let cur: Date | null = null;
  const step = stepMin * 60_000;
  for (let ms = n.sunset.getTime(); ms <= n.sunrise.getTime(); ms += step) {
    const t = new Date(ms);
    if (pred(t)) {
      if (!cur) cur = t;
    } else if (cur) {
      out.push({ start: cur, end: t });
      cur = null;
    }
  }
  if (cur) out.push({ start: cur, end: n.sunrise });
  return out;
}

export const longest = (xs: Interval[]) =>
  xs.reduce<Interval | null>((best, x) => (!best || x.end.getTime() - x.start.getTime() > best.end.getTime() - best.start.getTime() ? x : best), null);
