import * as A from 'astronomy-engine';
import { SHOWERS, type Shower } from './catalog';
import {
  type Interval, type Level, type Loc, type Night, type Planet,
  DAY, HOUR, PLANET_ES, bodyAltAz, cardinal, cardinalLong, constellationOf, dayKey, decimal, hhmm,
  levelForMag, longDate, longest, magnitude, monShort, moonInfo, nightFor, observer, parts, raDecAltAz,
  riseSet, scanIntervals, shortDate, tonight, wdShort, monthShort,
} from './core';

export type Category = 'meteoros' | 'luna' | 'conjuncion' | 'oposicion' | 'eclipse' | 'planeta';

export type Target = { type: 'radec'; ra: number; dec: number; label: string } | { type: 'body'; body: Planet | 'Moon'; label: string } | null;

export type Fact = { label: string; value: string; sub: string };

export type AstroEvent = {
  id: string;
  category: Category;
  name: string; // título corto para el encabezado del detalle
  title: string; // título de la tarjeta
  detail: string; // dato clave de la tarjeta
  subtitle: string; // bajo el nombre en el detalle
  level: Level;
  at: string; // instante principal (pico, fase, máximo)
  nightOf: string | null; // puesta del Sol de la noche que importa
  window: { start: string; end: string } | null; // ventana ideal para mirar
  dayLabel: { month: string; day: string };
  facts: Fact[];
  note: string;
  need: { title: string; text: string; avoid?: { title: string; text: string } };
  alert: string; // cuerpo de la notificación
  target: Target;
  lunar: boolean; // aparece en "Eventos lunares"
  trip: boolean; // vale la pena viajar a un cielo oscuro
  href: string;
};

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const iso = (d: Date) => d.toISOString();
const win = (i: Interval | null) => (i ? { start: iso(i.start), end: iso(i.end) } : null);
const label = (d: Date, tz?: string) => ({ month: monShort(d, tz).toUpperCase(), day: String(parts(d, tz).d).padStart(2, '0') });
const minutes = (i: Interval) => (i.end.getTime() - i.start.getTime()) / 60_000;

/** "21–22 oct" o "31 oct–1 nov" */
function nightRange(n: Night, tz?: string) {
  const a = parts(n.sunset, tz);
  const b = parts(n.sunrise, tz);
  return a.m === b.m ? `${a.d}–${b.d} ${monthShort(a.m)}` : `${a.d} ${monthShort(a.m)}–${b.d} ${monthShort(b.m)}`;
}

const isDark = (n: Night, t: Date) => t >= n.duskEnd && t <= n.dawnStart;

/** Noche cuyo centro está más cerca de `t`. */
function nearestNight(loc: Loc, t: Date): Night | null {
  const cands = [nightFor(loc, new Date(t.getTime() - 14 * HOUR)), nightFor(loc, t)].filter((n): n is Night => !!n);
  const mid = (n: Night) => (n.sunset.getTime() + n.sunrise.getTime()) / 2;
  return cands.sort((x, y) => Math.abs(mid(x) - t.getTime()) - Math.abs(mid(y) - t.getTime()))[0] ?? null;
}

function moonSummary(loc: Loc, n: Night, tz?: string) {
  const obs = observer(loc);
  const mid = new Date((n.sunset.getTime() + n.sunrise.getTime()) / 2);
  const m = moonInfo(mid);
  const upAtDusk = bodyAltAz(A.Body.Moon, n.sunset, obs).altitude > 0;
  const set = riseSet(A.Body.Moon, loc, -1, n.sunset, 1);
  const rise = riseSet(A.Body.Moon, loc, +1, n.sunset, 1);
  const setInNight = set && set < n.sunrise ? set : null;
  const riseInNight = rise && rise < n.sunrise ? rise : null;
  let sub: string;
  if (upAtDusk && setInNight) sub = `se pone ${hhmm(setInNight, tz)}`;
  else if (!upAtDusk && riseInNight) sub = `sale ${hhmm(riseInNight, tz)}`;
  else if (upAtDusk) sub = 'toda la noche';
  else sub = 'no sale de noche';
  return { ...m, upAtDusk, setInNight, riseInNight, sub, up: (t: Date) => bodyAltAz(A.Body.Moon, t, obs).altitude > 0 };
}

// ── Lluvias de meteoros ─────────────────────────────────────────────────────

function meteorEvent(loc: Loc, s: Shower, peak: Date, tz?: string): AstroEvent | null {
  const n = nearestNight(loc, peak);
  if (!n) return null;
  const obs = observer(loc);
  const alt = (t: Date) => raDecAltAz(s.ra, s.dec, t, obs).altitude;

  let maxAlt = -90;
  for (let ms = n.duskEnd.getTime(); ms <= n.dawnStart.getTime(); ms += 10 * 60_000) maxAlt = Math.max(maxAlt, alt(new Date(ms)));
  if (maxAlt < 10) return null; // desde esta latitud el radiante no sube lo suficiente

  const moon = moonSummary(loc, n, tz);
  const rate = Math.round(s.zhr * Math.sin((maxAlt * Math.PI) / 180));
  if (rate < 3) return null;
  const minAlt = Math.min(25, maxAlt * 0.6);
  const brightMoon = moon.fraction >= 0.25;
  let window = longest(scanIntervals(n, (t) => isDark(n, t) && alt(t) >= minAlt && (!brightMoon || !moon.up(t))));
  const moonAllNight = !window;
  if (!window) window = longest(scanIntervals(n, (t) => isDark(n, t) && alt(t) >= minAlt));

  // Salida del radiante dentro de la noche
  let radRise: Date | null = null;
  let prev = alt(n.sunset);
  for (let ms = n.sunset.getTime() + 2 * 60_000; ms <= n.sunrise.getTime(); ms += 2 * 60_000) {
    const a = alt(new Date(ms));
    if (prev < 0 && a >= 0) { radRise = new Date(ms); break; }
    prev = a;
  }
  const riseAz = radRise ? raDecAltAz(s.ra, s.dec, radRise, obs).azimuth : null;
  const lookAz = window ? raDecAltAz(s.ra, s.dec, new Date((window.start.getTime() + window.end.getTime()) / 2), obs).azimuth : 0;

  const range = nightRange(n, tz);
  const trip = moon.fraction < 0.4 && rate >= 10;
  let best = '';
  if (window && !moonAllNight) {
    const reason = moon.setInNight && Math.abs(window.start.getTime() - moon.setInNight.getTime()) < 20 * 60_000 ? ' (se pone la Luna)' : '';
    best = `mejor desde ${hhmm(window.start, tz)}${reason}`;
  } else if (moonAllNight) {
    best = `con Luna ${moon.illum}%`;
  }
  const detail = trip
    ? `Luna ${moon.illum}%${moon.setInNight ? `, se pone ${hhmm(moon.setInNight, tz)}` : ''} · ideal para viajar`
    : `Pico ${range}${best ? ` · ${best}` : ''}`;

  const windowText = window
    ? moonAllNight
      ? `La Luna (${moon.illum}%) está arriba toda la noche y tapa los meteoros más débiles. Lo mejor es entre ${hhmm(window.start, tz)} y ${hhmm(window.end, tz)}, con el radiante alto.`
      : `La mejor ventana es entre ${hhmm(window.start, tz)} y ${hhmm(window.end, tz)}.`
    : '';
  const id = `lluvia-${s.key}-${dayKey(peak, 'UTC')}`;

  return {
    id,
    category: 'meteoros',
    name: s.name,
    title: `Lluvia de meteoros ${s.name}`,
    detail,
    subtitle: `Restos del ${s.origin} · pico ${range}`,
    level: 'ojo',
    at: iso(peak),
    nightOf: iso(n.sunset),
    window: win(window),
    dayLabel: label(n.sunset, tz),
    facts: [
      { label: 'Tasa máx.', value: `~${rate}/h`, sub: 'cielo oscuro' },
      radRise
        ? { label: 'Radiante', value: `~${hhmm(radRise, tz)}`, sub: `sale por el ${cardinal(riseAz!)}` }
        : { label: 'Radiante', value: `${Math.round(maxAlt)}°`, sub: 'altura máxima' },
      { label: 'Luna', value: `${moon.illum}%`, sub: moon.sub },
    ],
    note: `${windowText} Acostate mirando hacia ${cardinalLong(lookAz)}: los meteoros salen de cerca de ${s.near}, pero aparecen en todo el cielo.`.trim(),
    need: {
      title: 'Ojo desnudo',
      text: 'Recomendado · 20 min para adaptar la vista',
      avoid: { title: 'Telescopio o binoculares', text: 'No conviene: el campo es chico y te perdés meteoros' },
    },
    alert: window
      ? `${moonAllNight ? `Luna ${moon.illum}%. ` : moon.setInNight ? `La Luna se pone ${hhmm(moon.setInNight, tz)}. ` : ''}Mirá hacia ${cardinalLong(lookAz)} de ${hhmm(window.start, tz)} a ${hhmm(window.end, tz)} · a simple vista.`
      : `Pico ${range} · a simple vista.`,
    target: { type: 'radec', ra: s.ra, dec: s.dec, label: 'radiante' },
    lunar: false,
    trip,
    href: trip ? `/viajes?evento=${id}` : `/evento?id=${id}`,
  };
}

// ── Fases lunares ───────────────────────────────────────────────────────────

const QUARTERS = ['Luna nueva', 'Cuarto creciente', 'Luna llena', 'Cuarto menguante'];

function phaseEvent(loc: Loc, q: A.MoonQuarter, tz?: string): AstroEvent {
  const at = q.time.date;
  const name = QUARTERS[q.quarter];
  // Salida más cercana a la fase, en la tarde o noche de ese día.
  const rise = riseSet(A.Body.Moon, loc, +1, new Date(at.getTime() - 18 * HOUR), 1.5);
  const set = rise ? riseSet(A.Body.Moon, loc, -1, rise, 1.2) : null;
  const n = nearestNight(loc, at);
  const when = `${shortDate(at, tz)} ${hhmm(at, tz)}`;
  const detail =
    q.quarter === 2 && rise ? `Sale ${hhmm(rise, tz)} · plenilunio ${shortDate(at, tz)} ${hhmm(at, tz)}`
    : q.quarter === 0 ? `${when} · noches más oscuras del mes`
    : `${when}${rise ? ` · sale ${hhmm(rise, tz)}` : ''}`;
  const obs = observer(loc);
  const window = n ? longest(scanIntervals(n, (t) => bodyAltAz(A.Body.Moon, t, obs).altitude > 10)) : null;
  const riseAz = rise ? bodyAltAz(A.Body.Moon, rise, obs).azimuth : 90;
  return {
    id: `fase-${slug(name)}-${dayKey(at, 'UTC')}`,
    category: 'luna',
    name,
    title: name,
    detail,
    subtitle: `${longDate(at, tz)} · ${hhmm(at, tz)}`,
    level: 'ojo',
    at: iso(at),
    nightOf: n ? iso(n.sunset) : null,
    window: q.quarter === 0 ? null : win(window),
    dayLabel: label(at, tz),
    facts: [
      { label: 'Fase exacta', value: hhmm(at, tz), sub: shortDate(at, tz) },
      { label: 'Sale', value: rise ? hhmm(rise, tz) : '—', sub: rise ? `por el ${cardinal(riseAz)}` : 'ese día no sale' },
      { label: 'Se pone', value: set ? hhmm(set, tz) : '—', sub: set ? shortDate(set, tz) : '' },
    ],
    note:
      q.quarter === 0 ? 'Sin Luna en el cielo: son las mejores noches para ver la Vía Láctea y objetos débiles.'
      : q.quarter === 2 ? `Sale por ${cardinalLong(riseAz)} justo cuando se pone el Sol y cruza el cielo toda la noche.`
      : 'Con media Luna, la línea entre luz y sombra muestra cráteres con mucho relieve: buen momento para mirarla con binoculares.',
    need: q.quarter === 1 || q.quarter === 3
      ? { title: 'Binoculares', text: 'Opcional · se ven los cráteres del terminador' }
      : { title: 'Ojo desnudo', text: 'Recomendado' },
    alert: q.quarter === 2 && rise ? `Sale a las ${hhmm(rise, tz)} por ${cardinalLong(riseAz)}.` : `${name} ${shortDate(at, tz)} a las ${hhmm(at, tz)}.`,
    target: { type: 'body', body: 'Moon', label: 'Luna' },
    lunar: q.quarter === 2,
    trip: false,
    href: '/luna',
  };
}

// ── Conjunciones ────────────────────────────────────────────────────────────

function separation(a: A.Body, b: A.Body, t: Date) {
  return A.AngleBetween(A.GeoVector(a, t, true), A.GeoVector(b, t, true));
}

/** Mínimos de separación por debajo de `maxSep`, refinados por búsqueda ternaria. */
function closeApproaches(a: A.Body, b: A.Body, from: Date, to: Date, stepH: number, maxSep: number) {
  const out: { t: Date; sep: number }[] = [];
  const step = stepH * HOUR;
  let t0 = from.getTime() - step;
  let s0 = separation(a, b, new Date(t0));
  let s1 = separation(a, b, new Date(t0 + step));
  for (let ms = t0 + 2 * step; ms <= to.getTime() + step; ms += step) {
    const s2 = separation(a, b, new Date(ms));
    if (s1 < s0 && s1 <= s2 && s1 < maxSep + 2) {
      let lo = ms - 2 * step, hi = ms;
      for (let i = 0; i < 40; i++) {
        const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
        if (separation(a, b, new Date(m1)) < separation(a, b, new Date(m2))) hi = m2; else lo = m1;
      }
      const t = new Date((lo + hi) / 2);
      const sep = separation(a, b, t);
      if (sep < maxSep && t >= from && t <= to) out.push({ t, sep });
    }
    s0 = s1; s1 = s2; t0 = ms;
  }
  return out;
}

function whenVisible(n: Night, iv: Interval, tz?: string) {
  const nightMin = (n.dawnStart.getTime() - n.duskEnd.getTime()) / 60_000;
  if (minutes(iv) > nightMin * 0.8) return { text: 'toda la noche', key: 'all' as const };
  if (iv.start.getTime() - n.sunset.getTime() < 1.5 * HOUR) return { text: 'al anochecer', key: 'dusk' as const };
  if (n.sunrise.getTime() - iv.end.getTime() < 1.5 * HOUR) return { text: 'antes del amanecer', key: 'dawn' as const };
  return { text: `de ${hhmm(iv.start, tz)} a ${hhmm(iv.end, tz)}`, key: 'mid' as const };
}

function visibleTogether(loc: Loc, a: A.Body, b: A.Body, t: Date) {
  const obs = observer(loc);
  const nights = [nearestNight(loc, t), nightFor(loc, new Date(t.getTime() - DAY)), nightFor(loc, t)].filter((x): x is Night => !!x);
  for (const n of nights) {
    const iv = longest(scanIntervals(n, (x) => {
      const sun = bodyAltAz(A.Body.Sun, x, obs).altitude;
      return sun < -6 && bodyAltAz(a, x, obs).altitude > 8 && bodyAltAz(b, x, obs).altitude > 8;
    }));
    if (iv && minutes(iv) >= 30) return { n, iv };
  }
  return null;
}

function moonConjunctions(loc: Loc, from: Date, to: Date, tz?: string): AstroEvent[] {
  const out: AstroEvent[] = [];
  const obs = observer(loc);
  for (const p of ['Venus', 'Mars', 'Jupiter', 'Saturn'] as Planet[]) {
    for (const { t } of closeApproaches(A.Body.Moon, p as A.Body, from, to, 6, 8)) {
      const vis = visibleTogether(loc, A.Body.Moon, p as A.Body, t);
      if (!vis) continue;
      const mid = new Date((vis.iv.start.getTime() + vis.iv.end.getTime()) / 2);
      const ref = vis.iv.end.getTime() - vis.iv.start.getTime() > 4 * HOUR ? mid : vis.iv.start;
      const sep = separation(A.Body.Moon, p as A.Body, ref);
      const w = whenVisible(vis.n, vis.iv, tz);
      const pos = bodyAltAz(p as A.Body, ref, obs);
      const es = PLANET_ES[p];
      const mag = magnitude(p, ref);
      const sepTxt = `~${sep < 10 ? decimal(sep) : Math.round(sep)}°`;
      const title = w.key === 'dawn' ? `Luna y ${es} antes del amanecer` : w.key === 'dusk' ? `Luna y ${es} al anochecer` : `La Luna pasa cerca de ${es}`;
      const detail = w.key === 'all' ? `Separación ${sepTxt} · toda la noche` : `${hhmm(ref, tz)} · separación ${sepTxt} hacia ${cardinalLong(pos.azimuth)}`;
      const id = `conj-luna-${slug(es)}-${dayKey(t, 'UTC')}`;
      out.push({
        id,
        category: 'conjuncion',
        name: `Luna y ${es}`,
        title,
        detail,
        subtitle: `${longDate(vis.n.sunset, tz)} · ${w.text}`,
        level: levelForMag(mag),
        at: iso(ref),
        nightOf: iso(vis.n.sunset),
        window: win(vis.iv),
        dayLabel: label(ref, tz),
        facts: [
          { label: 'Separación', value: sepTxt, sub: `a las ${hhmm(ref, tz)}` },
          { label: es, value: `${Math.round(pos.altitude)}° ${cardinal(pos.azimuth)}`, sub: 'altura y dirección' },
          { label: 'Brillo', value: decimal(mag), sub: 'magnitud' },
        ],
        note: `Se ven juntos ${w.text}${w.key === 'mid' ? '' : ` (${hhmm(vis.iv.start, tz)}–${hhmm(vis.iv.end, tz)})`}. Buscá a ${es} como el punto brillante que no titila al lado de la Luna.`,
        need: { title: 'Ojo desnudo', text: 'Recomendado · con binoculares entran los dos en el mismo campo si están a menos de 5°' },
        alert: `${title}: ${sepTxt} hacia ${cardinalLong(pos.azimuth)} a las ${hhmm(ref, tz)}.`,
        target: { type: 'body', body: p, label: es },
        lunar: true,
        trip: false,
        href: '/luna',
      });
    }
  }
  return out;
}

function planetConjunctions(loc: Loc, from: Date, to: Date, tz?: string): AstroEvent[] {
  const out: AstroEvent[] = [];
  const list: Planet[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const obs = observer(loc);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      for (const { t, sep } of closeApproaches(a as A.Body, b as A.Body, from, to, 24, 3)) {
        const vis = visibleTogether(loc, a as A.Body, b as A.Body, t);
        if (!vis) continue;
        const w = whenVisible(vis.n, vis.iv, tz);
        const ref = w.key === 'dawn' ? vis.iv.end : vis.iv.start;
        const pos = bodyAltAz(a as A.Body, ref, obs);
        const mag = Math.max(magnitude(a, t), magnitude(b, t));
        const sepTxt = `${decimal(sep)}°`;
        const names = `${PLANET_ES[a]} y ${PLANET_ES[b]}`;
        const id = `conj-${slug(PLANET_ES[a])}-${slug(PLANET_ES[b])}-${dayKey(t, 'UTC')}`;
        out.push({
          id,
          category: 'conjuncion',
          name: names,
          title: `${names} juntos`,
          detail: `Separación ${sepTxt} · ${w.text}, hacia ${cardinalLong(pos.azimuth)}`,
          subtitle: `${longDate(t, tz)} · máximo acercamiento`,
          level: levelForMag(mag),
          at: iso(t),
          nightOf: iso(vis.n.sunset),
          window: win(vis.iv),
          dayLabel: label(t, tz),
          facts: [
            { label: 'Separación', value: sepTxt, sub: 'mínima' },
            { label: 'Cuándo', value: hhmm(ref, tz), sub: w.text },
            { label: 'Dirección', value: cardinal(pos.azimuth), sub: `${Math.round(pos.altitude)}° de altura` },
          ],
          note: `Los dos planetas se ven ${w.text}, separados por ${sepTxt}: menos que el ancho de ${sep < 1 ? 'dos Lunas llenas' : 'tu dedo meñique con el brazo estirado'}.`,
          need: { title: 'Ojo desnudo', text: 'Recomendado · con binoculares entran en el mismo campo' },
          alert: `${names} a ${sepTxt} ${w.text}, hacia ${cardinalLong(pos.azimuth)}.`,
          target: { type: 'body', body: a, label: PLANET_ES[a] },
          lunar: false,
          trip: false,
          href: `/evento?id=${id}`,
        });
      }
    }
  }
  return out;
}

// ── Oposiciones ─────────────────────────────────────────────────────────────

function oppositions(loc: Loc, from: Date, to: Date, tz?: string): AstroEvent[] {
  const out: AstroEvent[] = [];
  const obs = observer(loc);
  for (const p of ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as Planet[]) {
    const r = A.SearchRelativeLongitude(p as A.Body, 0, new Date(from.getTime() - 2 * DAY));
    const t = r.date;
    if (t > to || t < new Date(from.getTime() - 2 * DAY)) continue;
    const n = nearestNight(loc, t);
    if (!n) continue;
    let best = { alt: -90, t: n.sunset };
    for (let ms = n.sunset.getTime(); ms <= n.sunrise.getTime(); ms += 15 * 60_000) {
      const a = bodyAltAz(p as A.Body, new Date(ms), obs).altitude;
      if (a > best.alt) best = { alt: a, t: new Date(ms) };
    }
    if (best.alt < 10) continue;
    const window = longest(scanIntervals(n, (x) => isDark(n, x) && bodyAltAz(p as A.Body, x, obs).altitude > 20));
    const mag = magnitude(p, t);
    const es = PLANET_ES[p];
    const cons = constellationOf(p, t);
    const dir = cardinal(bodyAltAz(p as A.Body, best.t, obs).azimuth);
    const level = levelForMag(mag);
    const id = `oposicion-${slug(es)}-${dayKey(t, 'UTC')}`;
    out.push({
      id,
      category: 'oposicion',
      name: es,
      title: `${es} en oposición`,
      detail: `Toda la noche · magnitud ${decimal(mag)}, en ${cons}`,
      subtitle: `${longDate(t, tz)} · su mejor momento del año`,
      level,
      at: iso(t),
      nightOf: iso(n.sunset),
      window: win(window),
      dayLabel: label(t, tz),
      facts: [
        { label: 'Brillo', value: decimal(mag), sub: 'magnitud' },
        { label: 'Más alto', value: hhmm(best.t, tz), sub: `${Math.round(best.alt)}° al ${dir}` },
        { label: 'Dónde', value: cons, sub: 'constelación' },
      ],
      note: `${es} está del lado opuesto al Sol: sale al anochecer, cruza el cielo toda la noche y está en su punto más cercano y brillante del año.`,
      need:
        level === 'ojo' ? { title: 'Ojo desnudo', text: p === 'Mars' ? 'Se ve a simple vista · con telescopio, casquete polar y manchas' : p === 'Jupiter' ? 'Se ve a simple vista · con binoculares, sus 4 lunas grandes' : 'Se ve a simple vista · con telescopio, los anillos' }
        : level === 'bino' ? { title: 'Binoculares', text: 'Necesarios · se ve como una estrella verdosa' }
        : { title: 'Telescopio', text: 'Necesario · un punto azulado, con carta del cielo' },
      alert: `${es} en oposición: visible toda la noche, más alto a las ${hhmm(best.t, tz)} hacia el ${dir}.`,
      target: { type: 'body', body: p, label: es },
      lunar: false,
      trip: false,
      href: `/evento?id=${id}`,
    });
  }
  return out;
}

// ── Eclipses ────────────────────────────────────────────────────────────────

const LUNAR_KIND: Record<string, string> = { penumbral: 'penumbral', partial: 'parcial', total: 'total' };
const SOLAR_KIND: Record<string, string> = { partial: 'parcial', annular: 'anular', total: 'total' };

function eclipses(loc: Loc, from: Date, to: Date, tz?: string): AstroEvent[] {
  const out: AstroEvent[] = [];
  const obs = observer(loc);
  const start = new Date(from.getTime() - DAY);

  let le = A.SearchLunarEclipse(start);
  while (le.peak.date <= to) {
    const peak = le.peak.date;
    const alt = bodyAltAz(A.Body.Moon, peak, obs).altitude;
    if (alt > 0) {
      const kind = LUNAR_KIND[le.kind] ?? le.kind;
      const half = (m: number) => m * 60_000;
      const begin = le.sd_partial > 0 ? new Date(peak.getTime() - half(le.sd_partial)) : new Date(peak.getTime() - half(le.sd_penum));
      const end = le.sd_partial > 0 ? new Date(peak.getTime() + half(le.sd_partial)) : new Date(peak.getTime() + half(le.sd_penum));
      const n = nearestNight(loc, peak);
      const id = `eclipse-lunar-${dayKey(peak, 'UTC')}`;
      out.push({
        id,
        category: 'eclipse',
        name: `Eclipse lunar ${kind}`,
        title: `Eclipse lunar ${kind}`,
        detail: `Máximo ${hhmm(peak, tz)} · Luna a ${Math.round(alt)}° de altura`,
        subtitle: `${longDate(peak, tz)} · visible desde tu ubicación`,
        level: 'ojo',
        at: iso(peak),
        nightOf: n ? iso(n.sunset) : null,
        window: { start: iso(begin), end: iso(end) },
        dayLabel: label(peak, tz),
        facts: [
          { label: le.sd_partial > 0 ? 'Empieza' : 'Penumbra', value: hhmm(begin, tz), sub: le.sd_partial > 0 ? 'fase parcial' : 'desde' },
          { label: 'Máximo', value: hhmm(peak, tz), sub: `${Math.round(alt)}° de altura` },
          { label: le.sd_total > 0 ? 'Totalidad' : 'Termina', value: le.sd_total > 0 ? `${Math.round(le.sd_total * 2)} min` : hhmm(end, tz), sub: le.sd_total > 0 ? 'duración' : 'fase parcial' },
        ],
        note: le.kind === 'penumbral'
          ? 'En un eclipse penumbral la Luna apenas se oscurece: se nota como una sombra gris en un borde cerca del máximo.'
          : le.kind === 'total'
            ? 'Durante la totalidad la Luna se pone rojiza: es la luz de todos los atardeceres de la Tierra que la sombra deja pasar.'
            : 'Se ve una mordida oscura en la Luna que crece hasta el máximo y después se retira.',
        need: { title: 'Ojo desnudo', text: 'Seguro de mirar · con binoculares se ve el color' },
        alert: `Eclipse lunar ${kind}: máximo a las ${hhmm(peak, tz)}.`,
        target: { type: 'body', body: 'Moon', label: 'Luna' },
        lunar: true,
        trip: false,
        href: `/evento?id=${id}`,
      });
    }
    le = A.NextLunarEclipse(le.peak);
  }

  let se = A.SearchLocalSolarEclipse(start, obs);
  while (se.peak.time.date <= to) {
    if (se.peak.altitude > 0) {
      const peak = se.peak.time.date;
      const kind = SOLAR_KIND[se.kind] ?? se.kind;
      const pct = se.obscuration != null ? Math.round(se.obscuration * 100) : null;
      const b = se.partial_begin.time.date, e = se.partial_end.time.date;
      const id = `eclipse-solar-${dayKey(peak, 'UTC')}`;
      out.push({
        id,
        category: 'eclipse',
        name: `Eclipse solar ${kind}`,
        title: `Eclipse solar ${kind}`,
        detail: `Máximo ${hhmm(peak, tz)}${pct != null ? ` · ${pct}% del Sol cubierto` : ''}`,
        subtitle: `${longDate(peak, tz)} · visible desde tu ubicación`,
        level: 'ojo',
        at: iso(peak),
        nightOf: null,
        window: { start: iso(b), end: iso(e) },
        dayLabel: label(peak, tz),
        facts: [
          { label: 'Empieza', value: hhmm(b, tz), sub: 'primer contacto' },
          { label: 'Máximo', value: hhmm(peak, tz), sub: pct != null ? `${pct}% cubierto` : `${Math.round(se.peak.altitude)}° de altura` },
          { label: 'Termina', value: hhmm(e, tz), sub: 'último contacto' },
        ],
        note: `El Sol va a estar a ${Math.round(se.peak.altitude)}° de altura en el máximo. Probá antes el lugar: que no lo tapen edificios ni árboles.`,
        need: {
          title: 'Filtro solar certificado',
          text: 'Obligatorio · anteojos ISO 12312-2 o proyección con un agujerito',
          avoid: { title: 'Binoculares o telescopio sin filtro', text: 'Nunca: dañan la vista en segundos' },
        },
        alert: `Eclipse solar ${kind}: de ${hhmm(b, tz)} a ${hhmm(e, tz)}. Solo con filtro certificado.`,
        target: null,
        lunar: false,
        trip: false,
        href: `/evento?id=${id}`,
      });
    }
    se = A.NextLocalSolarEclipse(se.peak.time, obs);
  }
  return out;
}

// ── Planetas débiles de esta noche ──────────────────────────────────────────

function faintPlanets(loc: Loc, now: Date, tz?: string): AstroEvent[] {
  const n = tonight(loc, now, tz);
  if (!n) return [];
  const obs = observer(loc);
  const out: AstroEvent[] = [];
  for (const p of ['Uranus', 'Neptune'] as Planet[]) {
    let best = { alt: -90, t: n.duskEnd };
    for (let ms = n.duskEnd.getTime(); ms <= n.dawnStart.getTime(); ms += 15 * 60_000) {
      const a = bodyAltAz(p as A.Body, new Date(ms), obs).altitude;
      if (a > best.alt) best = { alt: a, t: new Date(ms) };
    }
    if (best.alt < 20) continue;
    const rise = riseSet(p as A.Body, loc, +1, n.sunset, 1);
    const riseInNight = rise && rise < n.sunrise ? rise : null;
    const mag = magnitude(p, now);
    const es = PLANET_ES[p];
    const cons = constellationOf(p, now);
    const at22 = (() => {
      const t = new Date(n.sunset.getTime() + 3 * HOUR);
      return { t, ...bodyAltAz(p as A.Body, t, obs) };
    })();
    const window = longest(scanIntervals(n, (x) => isDark(n, x) && bodyAltAz(p as A.Body, x, obs).altitude > 25));
    const dirRise = riseInNight ? cardinal(bodyAltAz(p as A.Body, new Date(riseInNight.getTime() + HOUR), obs).azimuth) : cardinal(at22.azimuth);
    const id = `planeta-${slug(es)}-${dayKey(n.sunset, tz)}`;
    out.push({
      id,
      category: 'planeta',
      name: es,
      title: `${es} en ${cons}`,
      detail: riseInNight
        ? `Sale ${hhmm(riseInNight, tz)} · magnitud ${decimal(mag)}, buscalo al ${dirRise}`
        : `Magnitud ${decimal(mag)} · ${Math.round(at22.altitude)}° de altura a las ${hhmm(at22.t, tz)}`,
      subtitle: `Esta noche · en ${cons}`,
      level: levelForMag(mag),
      at: iso(best.t),
      nightOf: iso(n.sunset),
      window: win(window),
      dayLabel: label(n.sunset, tz),
      facts: [
        { label: 'Brillo', value: decimal(mag), sub: 'magnitud' },
        { label: 'Más alto', value: hhmm(best.t, tz), sub: `${Math.round(best.alt)}° de altura` },
        { label: 'Dónde', value: cons, sub: 'constelación' },
      ],
      note: `${es} no se distingue de una estrella a simple vista. Ubicá ${cons} con una carta del cielo y buscá el punto que no aparece en el mapa.`,
      need: levelForMag(mag) === 'bino'
        ? { title: 'Binoculares', text: 'Necesarios · se ve como una estrella verdosa que no titila' }
        : { title: 'Telescopio', text: 'Necesario · un punto azulado, con carta del cielo' },
      alert: `${es} visible esta noche en ${cons}.`,
      target: { type: 'body', body: p, label: es },
      lunar: false,
      trip: false,
      href: `/evento?id=${id}`,
    });
  }
  return out;
}

// ── API ─────────────────────────────────────────────────────────────────────

export function generateEvents(loc: Loc, from: Date, days: number, tz?: string): AstroEvent[] {
  const to = new Date(from.getTime() + days * DAY);
  const list: AstroEvent[] = [];

  for (const s of SHOWERS) {
    // SearchSunLongitude con rangos largos puede saltearse el cruce más cercano: se busca de a 30 días.
    let start = new Date(from.getTime() - 1.5 * DAY);
    while (start <= to) {
      const r = A.SearchSunLongitude(s.lambda, start, 30);
      if (r && r.date <= to) {
        const ev = meteorEvent(loc, s, r.date, tz);
        if (ev) list.push(ev);
        start = new Date(r.date.getTime() + 300 * DAY);
      } else {
        start = new Date(start.getTime() + 30 * DAY);
      }
    }
  }

  let q = A.SearchMoonQuarter(new Date(from.getTime() - DAY));
  while (q.time.date <= to) {
    if (q.time.date >= new Date(from.getTime() - 12 * HOUR)) list.push(phaseEvent(loc, q, tz));
    q = A.NextMoonQuarter(q);
  }

  list.push(...moonConjunctions(loc, from, to, tz));
  list.push(...planetConjunctions(loc, from, to, tz));
  list.push(...oppositions(loc, from, to, tz));
  list.push(...eclipses(loc, from, to, tz));
  list.push(...faintPlanets(loc, from, tz));

  // Lo que ya pasó del todo queda afuera; lo de esta noche sigue.
  const cutoff = from.getTime() - 12 * HOUR;
  // Se ordena por la fecha que muestra la tarjeta: la noche para lluvias y planetas, el instante para el resto.
  const key = (e: AstroEvent) => new Date((e.category === 'meteoros' || e.category === 'planeta') && e.nightOf ? e.nightOf : e.at).getTime();
  return list.filter((e) => new Date(e.window?.end ?? e.at).getTime() >= cutoff).sort((a, b) => key(a) - key(b));
}

/** Busca un evento por id regenerando alrededor de su fecha (para abrir enlaces viejos o de notificaciones). */
export function findEvent(loc: Loc, id: string, now: Date, tz?: string): AstroEvent | null {
  const m = id.match(/(\d{4})(\d{2})(\d{2})$/);
  const from = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - 3 * DAY) : now;
  return generateEvents(loc, from, 7, tz).find((e) => e.id === id) ?? null;
}

// ── Línea de la noche (detalle) ─────────────────────────────────────────────

export type Timeline = {
  night: Night;
  moonUp: Interval[];
  targetUp: Interval[];
  window: Interval | null;
  marks: { t: Date; label: string }[];
  /** Altura máxima del objeto con el cielo oscuro, y hacia dónde. */
  peak: { alt: number; az: number; t: Date } | null;
};

export function timeline(loc: Loc, ev: AstroEvent): Timeline | null {
  if (!ev.nightOf) return null;
  const n = nightFor(loc, new Date(new Date(ev.nightOf).getTime() + 30 * 60_000));
  if (!n) return null;
  const obs = observer(loc);
  const moonUp = scanIntervals(n, (t) => bodyAltAz(A.Body.Moon, t, obs).altitude > 0);
  const tgt = ev.target;
  const altOf = (t: Date) =>
    !tgt ? -90 : tgt.type === 'radec' ? raDecAltAz(tgt.ra, tgt.dec, t, obs).altitude : bodyAltAz(tgt.body === 'Moon' ? A.Body.Moon : (tgt.body as A.Body), t, obs).altitude;
  const targetUp = tgt && !(tgt.type === 'body' && tgt.body === 'Moon') ? scanIntervals(n, (t) => altOf(t) > 0, 2) : [];
  const marks: { t: Date; label: string }[] = [];
  const firstUp = targetUp[0];
  if (tgt && firstUp && firstUp.start.getTime() - n.sunset.getTime() > 20 * 60_000) marks.push({ t: firstUp.start, label: tgt.label });
  const window = ev.window ? { start: new Date(ev.window.start), end: new Date(ev.window.end) } : null;
  let peak: Timeline['peak'] = null;
  if (tgt) {
    for (let ms = n.duskEnd.getTime(); ms <= n.dawnStart.getTime(); ms += 10 * 60_000) {
      const t = new Date(ms);
      const a = altOf(t);
      if (!peak || a > peak.alt) {
        const az = tgt.type === 'radec' ? raDecAltAz(tgt.ra, tgt.dec, t, obs).azimuth : bodyAltAz(tgt.body === 'Moon' ? A.Body.Moon : (tgt.body as A.Body), t, obs).azimuth;
        peak = { alt: a, az, t };
      }
    }
  }
  return { night: n, moonUp, targetUp, window, marks, peak };
}

// ── Resumen de esta noche ───────────────────────────────────────────────────

export function skyTonight(loc: Loc, now: Date, tz?: string) {
  const n = tonight(loc, now, tz);
  const obs = observer(loc);
  const moonRef = n ? new Date(n.sunset.getTime() + 2 * HOUR) : now;
  const moon = moonInfo(moonRef);
  const moonSet = n ? riseSet(A.Body.Moon, loc, -1, n.sunset, 1) : null;
  const moonRise = n ? riseSet(A.Body.Moon, loc, +1, n.sunset, 1) : null;
  const moonUpAtDusk = n ? bodyAltAz(A.Body.Moon, n.sunset, obs).altitude > 0 : false;

  // Planeta destacado: el más brillante bien alto a las 22:00 (o 2 h después de la puesta).
  let ref = n ? new Date(Math.max(new Date(n.sunset.getTime() + 2 * HOUR).getTime(), 0)) : now;
  if (n) {
    const at22 = new Date(n.sunset);
    const p = parts(n.sunset, tz);
    const t22 = new Date(at22.getTime() + ((22 - p.h) * 60 - p.min) * 60_000);
    if (t22 > n.sunset && t22 < n.sunrise) ref = t22;
  }
  let planet: { name: string; alt: number; dir: string; at: string } | null = null;
  let bestMag = 99;
  for (const p of ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Mercury'] as Planet[]) {
    const h = bodyAltAz(p as A.Body, ref, obs);
    const mag = magnitude(p, ref);
    if (h.altitude > 10 && mag < bestMag) {
      bestMag = mag;
      planet = { name: PLANET_ES[p], alt: Math.round(h.altitude), dir: cardinal(h.azimuth), at: hhmm(ref, tz) };
    }
  }

  return {
    night: n,
    sunset: n ? hhmm(n.sunset, tz) : '—',
    moon: {
      ...moon,
      sub: moonUpAtDusk ? (moonSet && n && moonSet < n.sunrise ? `se pone ${hhmm(moonSet, tz)}` : 'toda la noche') : moonRise && n && moonRise < n.sunrise ? `sale ${hhmm(moonRise, tz)}` : 'no sale de noche',
    },
    planet,
  };
}

// ── Luna día por día ────────────────────────────────────────────────────────

export function moonDay(loc: Loc, day: Date, tz?: string) {
  const midnight = (() => {
    const p = parts(day, tz);
    const guess = new Date(Date.UTC(p.y, p.m, p.d, 0, 0));
    const q = parts(guess, tz);
    return new Date(guess.getTime() - (Date.UTC(q.y, q.m, q.d, q.h, q.min) - guess.getTime()));
  })();
  const evening = new Date(midnight.getTime() + 21 * HOUR);
  const m = moonInfo(evening);
  const rise = riseSet(A.Body.Moon, loc, +1, midnight, 1);
  const set = rise ? riseSet(A.Body.Moon, loc, -1, rise, 1.2) : riseSet(A.Body.Moon, loc, -1, midnight, 1);
  return { date: evening, ...m, rise, set, wd: wdShort(evening, tz), num: parts(evening, tz).d };
}

export function nextQuarters(from: Date, count = 4) {
  const out: { name: string; at: Date; quarter: number }[] = [];
  let q = A.SearchMoonQuarter(from);
  for (let i = 0; i < count; i++) {
    out.push({ name: QUARTERS[q.quarter], at: q.time.date, quarter: q.quarter });
    q = A.NextMoonQuarter(q);
  }
  return out;
}
