'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { MoonGlyph } from '@/components/art';
import { IconAltitude, IconBack, IconCheck, IconClose, IconCloud, IconPin, IconTrash } from '@/components/icons';
import { CitySearch } from '@/components/LocationSheet';
import { LevelBadge, Sheet } from '@/components/ui';
import { type Loc, DAY, LEVELS, cardinalLong, hhmm, isSouth, moonInfo, parts, shortDate } from '@/lib/astro/core';
import { type AstroEvent, findEvent, timeline } from '@/lib/astro/events';
import { DARK_SITES, distanceKm } from '@/lib/cities';
import { cityLoc } from '@/lib/geo';
import { useClouds, useEvents, useOnline } from '@/lib/hooks';
import { CHECKLIST, type Trip } from '@/lib/prefs';
import { enablePush } from '@/lib/push-client';
import { goBack, haptic } from '@/lib/platform';
import { setSettings, useHydrated, useSettings } from '@/lib/store';
import { cloudLabel, cloudsBetween } from '@/lib/weather';

export default function Page() {
  return (
    <Suspense>
      <Viajes />
    </Suspense>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const toInput = (d: Date) => {
  const p = parts(d);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
};
/** "YYYY-MM-DDTHH:mm" → "dom 13 dic 19:00" */
const departLabel = (v: string) => {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/);
  return m ? `${shortDate(new Date(+m[1], +m[2] - 1, +m[3], 12))} ${m[4]}` : v;
};
const PLANNABLE =new Set(['meteoros', 'eclipse', 'oposicion', 'conjuncion', 'luna']);

function Viajes() {
  const s = useSettings();
  const hydrated = useHydrated();
  const events = useEvents(s.location);
  const param = useSearchParams().get('evento');

  const options = useMemo(() => (events ?? []).filter((e) => PLANNABLE.has(e.category) && new Date(e.at).getTime() < Date.now() + 200 * DAY), [events]);
  const fallback = options.find((e) => e.trip) ?? options.find((e) => e.category === 'meteoros') ?? options[0];
  const id = param ?? fallback?.id ?? null;
  const ev = useMemo(() => {
    if (!s.location || !id) return null;
    return options.find((e) => e.id === id) ?? findEvent(s.location, id, new Date());
  }, [s.location, id, options]);

  if (!hydrated) return null;
  if (!s.location) {
    return (
      <div className="page">
        <h1 className="h1">Planificar viaje</h1>
        <p className="muted">Elegí tu ubicación en <Link href="/">Cielo</Link> primero.</p>
      </div>
    );
  }
  if (!events && !ev) return <div className="page"><h1 className="h1">Planificar viaje</h1><p className="muted">Calculando…</p></div>;
  if (!ev) return <div className="page"><h1 className="h1">Planificar viaje</h1><p className="muted">No encontramos ese evento.</p></div>;
  return <Planner key={ev.id} ev={ev} home={s.location} options={options} />;
}

function Planner({ ev, home, options }: { ev: AstroEvent; home: Loc; options: AstroEvent[] }) {
  const s = useSettings();
  const router = useRouter();
  const online = useOnline();
  const saved = s.trips.find((t) => t.eventId === ev.id);
  const night = useMemo(() => timeline(home, ev)?.night ?? null, [home, ev]);

  const [dest, setDest] = useState<Loc | null>(saved?.dest ?? null);
  const [depart, setDepart] = useState(saved?.depart ?? (night ? toInput(new Date(night.sunset.getTime() - 3600_000)) : toInput(new Date(ev.at))));
  const [back, setBack] = useState(saved?.back ?? (night ? toInput(new Date(night.sunrise.getTime() + 2 * 3600_000)) : toInput(new Date(new Date(ev.at).getTime() + 6 * 3600_000))));
  const [items, setItems] = useState<Record<number, boolean>>(saved?.items ?? { 0: false });
  const [picker, setPicker] = useState(false);
  const [note, setNote] = useState('');

  // Si el viaje guardado cambia desde otra pestaña o al volver, se toma lo guardado.
  useEffect(() => {
    if (!saved) return;
    setDest(saved.dest);
    setDepart(saved.depart);
    setBack(saved.back);
    setItems(saved.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.savedAt]);

  const place = dest ?? home;
  const evHere = useMemo(() => (dest ? findEvent(dest, ev.id, new Date()) : ev), [dest, ev]);
  const tl = useMemo(() => (evHere ? timeline(place, evHere) : null), [place, evHere]);
  const clouds = useClouds(dest ?? home);
  const daysAway = (new Date(ev.at).getTime() - Date.now()) / DAY;
  const cloud = tl?.window && clouds && daysAway <= 3 ? cloudsBetween(clouds, tl.window.start, tl.window.end) : null;

  const suggestions = useMemo(() => [...DARK_SITES].sort((a, b) => distanceKm(home, a) - distanceKm(home, b)).slice(0, 6), [home]);
  const done = CHECKLIST.filter((_, i) => items[i]).length;
  const dirty = !saved || saved.depart !== depart || saved.back !== back || JSON.stringify(saved.dest) !== JSON.stringify(dest) || JSON.stringify(saved.items) !== JSON.stringify(items);

  async function save() {
    const trip: Trip = { id: ev.id, eventId: ev.id, eventTitle: ev.title, dest, depart, back, items, savedAt: new Date().toISOString() };
    setSettings((cur) => ({ trips: [...cur.trips.filter((t) => t.id !== trip.id), trip], follows: { ...cur.follows, [ev.id]: true } }));
    setNote('');
    if (!s.push.endpoint) {
      const r = await enablePush();
      if (!r.ok) setNote(`El viaje quedó guardado, pero sin avisos: ${r.reason}`);
    }
  }

  // Condiciones en el destino
  const moonLine = (() => {
    if (!tl) return null;
    const m = moonInfo(new Date((tl.night.sunset.getTime() + tl.night.sunrise.getTime()) / 2));
    const up = tl.moonUp;
    const span = (i: { start: Date; end: Date }) => i.end.getTime() - i.start.getTime();
    const main = up.length ? up.reduce((a, b) => (span(b) > span(a) ? b : a)) : null;
    const fromDusk = main && main.start.getTime() - tl.night.sunset.getTime() < 15 * 60_000;
    const toDawn = main && tl.night.sunrise.getTime() - main.end.getTime() < 15 * 60_000;
    let title = `${m.name} ${m.illum}%`;
    let sub = 'Sin Luna en toda la noche: cielo oscuro de punta a punta';
    if (main && fromDusk && toDawn) sub = 'La Luna está toda la noche: solo se ve lo más brillante';
    else if (main && fromDusk) { title += `, se pone ${hhmm(main.end)}`; sub = `Cielo sin Luna desde ${hhmm(main.end)} hasta el amanecer`; }
    else if (main) { title += `, sale ${hhmm(main.start)}`; sub = `Cielo oscuro hasta las ${hhmm(main.start)}`; }
    return { title, sub, m };
  })();

  const altLine = (() => {
    if (!tl?.peak || !evHere?.target) return null;
    const low = tl.peak.alt < 30;
    const what = evHere.target.type === 'radec' ? 'Radiante' : evHere.target.label;
    const lat = `${Math.round(Math.abs(place.lat))}° ${place.lat < 0 ? 'S' : 'N'}`;
    return {
      title: `${what} ${low ? 'bajo' : 'alto'}, hacia ${cardinalLong(tl.peak.az)}`,
      sub: `Desde ~${lat} sube como máximo ~${Math.max(0, Math.round(tl.peak.alt))}°${low && evHere.category === 'meteoros' ? ': se ven menos meteoros que con el radiante alto' : ''}`,
    };
  })();

  const level = LEVELS[ev.level];
  const nightLabel = night ? `Noche del ${shortDate(night.sunset)} al ${shortDate(night.sunrise)}` : shortDate(new Date(ev.at));

  return (
    <div className="page" style={{ gap: 18 }}>
      <header className="row">
        <button type="button" className="icon-btn" aria-label="Volver" onClick={() => goBack(router)}><IconBack /></button>
        <h1 className="display" style={{ fontSize: 22, fontWeight: 700 }}>Planificar viaje</h1>
      </header>

      <section className="rise row" style={{ borderRadius: 20, background: 'var(--surface-2)', border: '1px solid var(--line)', padding: 16, gap: 14 }}>
        <div className="date-box" style={{ width: 56, height: 56, borderRadius: 16, justifyContent: 'center' }}>
          <span className="m">{ev.dayLabel.month}</span>
          <span className="d">{ev.dayLabel.day}</span>
        </div>
        <Link href={`/evento?id=${ev.id}`} transitionTypes={['nav-forward']} className="col" style={{ flex: 1, gap: 3, color: 'var(--ink)', textDecoration: 'none', minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{ev.title}</span>
          <span className="small muted">{nightLabel} · {level.label.toLowerCase()}</span>
        </Link>
        <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 13, padding: '0 12px' }} aria-label="Cambiar evento" onClick={() => setPicker(true)}>Cambiar</button>
      </section>

      {dest ? (
        <div className="field">
          <span className="small muted" style={{ fontWeight: 500 }}>Destino</span>
          <div className="row" style={{ minHeight: 48, padding: '0 6px 0 14px', borderRadius: 14, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <IconPin style={{ color: 'var(--gold)' }} />
            <span style={{ flex: 1, fontWeight: 500 }}>{dest.name} · {Math.round(distanceKm(home, dest))} km</span>
            <button type="button" className="icon-btn" style={{ width: 40, height: 40, background: 'transparent' }} aria-label="Quitar destino" onClick={() => setDest(null)}><IconClose /></button>
          </div>
        </div>
      ) : (
        <CitySearch id="destino" label="Destino" placeholder="Buscá un lugar con cielo oscuro" suggestions={suggestions} onPick={(c) => setDest(cityLoc(c))} />
      )}

      <div className="grid-2" style={{ gap: 10 }}>
        <div className="field">
          <label htmlFor="salida">Salida</label>
          <input id="salida" className="input" type="datetime-local" value={depart} onChange={(e) => setDepart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="vuelta">Vuelta</label>
          <input id="vuelta" className="input" type="datetime-local" value={back} onChange={(e) => setBack(e.target.value)} />
        </div>
      </div>

      <section className="panel">
        <h2 className="h3">Condiciones previstas{dest ? ` en ${dest.name}` : ''}</h2>
        {!evHere && <p className="small soft">Desde ese destino este evento no se ve: el objeto no sube lo suficiente sobre el horizonte.</p>}
        {moonLine && (
          <div className="row">
            <MoonGlyph size={36} fraction={moonLine.m.fraction} waxing={moonLine.m.waxing} south={isSouth(place)} />
            <div className="col" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{moonLine.title}</span><span className="small muted">{moonLine.sub}</span></div>
          </div>
        )}
        {altLine && (
          <div className="row">
            <IconAltitude style={{ color: 'var(--blue)', flex: 'none' }} />
            <div className="col" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{altLine.title}</span><span className="small muted">{altLine.sub}</span></div>
          </div>
        )}
        <div className="row">
          <IconCloud style={{ color: 'var(--ink-mute)', flex: 'none' }} />
          <div className="col" style={{ gap: 2 }}>
            {cloud != null ? (
              <><span style={{ fontSize: 14, fontWeight: 600 }}>Nubosidad prevista: {cloud}%</span><span className="small muted">{cloudLabel(cloud)} en la ventana ideal · pronóstico Open-Meteo</span></>
            ) : (
              <><span style={{ fontSize: 14, fontWeight: 600 }}>Nubosidad: se actualiza 3 días antes</span><span className="small muted">{online ? 'Necesita conexión; lo demás funciona offline' : 'Sin conexión ahora; lo demás funciona igual'}</span></>
            )}
          </div>
        </div>
      </section>

      <section className="col" style={{ gap: 8 }}>
        <div className="between">
          <h2 className="h3">Para llevar</h2>
          <span className="small muted">{done} de {CHECKLIST.length}</span>
        </div>
        {CHECKLIST.map((label, i) => (
          <button key={label} type="button" className="check" aria-pressed={!!items[i]} onClick={() => { haptic(); setItems((cur) => ({ ...cur, [i]: !cur[i] })); }}>
            <span className="box">{items[i] && <IconCheck size={14} style={{ color: 'var(--on-gold)' }} />}</span>
            {label}
          </button>
        ))}
      </section>

      <button type="button" className="btn shine" style={{ minHeight: 54, color: 'var(--on-gold)', border: 0, opacity: 1 }} onClick={save} disabled={!dirty}>
        {!dirty ? 'Guardado · disponible sin conexión' : saved ? 'Guardar cambios' : 'Guardar viaje y avisarme'}
      </button>
      {note && <p className="err-text fade-in" role="status">{note}</p>}

      {s.trips.length > 0 && (
        <section className="col" style={{ gap: 8 }}>
          <h2 className="h3">Tus viajes</h2>
          {s.trips.map((t) => (
            <div key={t.id} className="row rise" style={{ background: 'var(--surface)', borderRadius: 16, padding: '10px 8px 10px 16px' }}>
              <Link href={`/viajes?evento=${t.eventId}`} className="col" style={{ flex: 1, gap: 2, color: 'var(--ink)', textDecoration: 'none' }} aria-current={t.eventId === ev.id ? 'true' : undefined}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.eventTitle}</span>
                <span className="small muted">{t.dest?.name ?? 'Desde casa'} · sale {departLabel(t.depart)}</span>
              </Link>
              <button type="button" className="icon-btn" style={{ background: 'transparent', color: 'var(--ink-mute)' }} aria-label={`Borrar viaje: ${t.eventTitle}`} onClick={() => setSettings((cur) => ({ trips: cur.trips.filter((x) => x.id !== t.id) }))}>
                <IconTrash />
              </button>
            </div>
          ))}
        </section>
      )}

      <Sheet open={picker} onClose={() => setPicker(false)} title="Elegí un evento">
        <div className="col" style={{ gap: 8, overflowY: 'auto', maxHeight: '60dvh' }}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="ev-card"
              style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', width: '100%' }}
              onClick={() => { setPicker(false); router.replace(`/viajes?evento=${o.id}`); }}
            >
              <div className="date-box"><span className="m">{o.dayLabel.month}</span><span className="d">{o.dayLabel.day}</span></div>
              <div className="col" style={{ flex: 1, gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{o.title}</span>
                <span className="small muted">{o.detail}</span>
                <LevelBadge level={o.level} />
              </div>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
