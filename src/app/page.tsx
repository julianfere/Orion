'use client';
import Link from 'next/link';
import { ViewTransition, useMemo, useState } from 'react';
import { GlowDef, MoonGlyph, OrionGlyph, Stars } from '@/components/art';
import { IconCloudOk, IconEye, IconPin } from '@/components/icons';
import { LocationSheet } from '@/components/LocationSheet';
import { EventCard, SkeletonCards, Stat } from '@/components/ui';
import { type Level, DAY, coords, isSouth, longDate, monthLong, parts } from '@/lib/astro/core';
import { skyTonight } from '@/lib/astro/events';
import { HORIZON_DAYS, useClouds, useEvents, useOnline } from '@/lib/hooks';
import { haptic } from '@/lib/platform';
import { setSettings, useHydrated, useSettings } from '@/lib/store';
import { cloudLabel, cloudsBetween } from '@/lib/weather';

const FILTERS: ['all' | Level, string][] = [['all', 'Todos'], ['ojo', 'A simple vista'], ['bino', 'Binoculares'], ['tele', 'Telescopio']];
const PAGE = 12;

export default function Cielo() {
  const s = useSettings();
  const hydrated = useHydrated();
  const loc = s.location;
  const [filter, setFilter] = useState<'all' | Level>('all');
  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const events = useEvents(loc);
  const clouds = useClouds(loc);
  const online = useOnline();

  const now = useMemo(() => new Date(), []);
  const sky = useMemo(() => (loc ? skyTonight(loc, now) : null), [loc, now]);
  const tonightClouds = sky?.night && clouds ? cloudsBetween(clouds, sky.night.duskEnd, new Date(sky.night.duskEnd.getTime() + 6 * 3600_000)) : null;
  const until = useMemo(() => {
    const p = parts(new Date(now.getTime() + HORIZON_DAYS * DAY));
    return `${monthLong(p.m)} ${p.y}`;
  }, [now]);

  const list = (events ?? []).filter((e) => filter === 'all' || e.level === filter);

  if (!hydrated) return null;

  return (
    <div className="page">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 10 }}>
          <OrionGlyph size={30} />
          <span className="display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.04em' }}>Orion</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            type="button"
            className="icon-btn"
            aria-pressed={s.red}
            aria-label="Modo noche rojo"
            onClick={() => { haptic(); setSettings({ red: !s.red }); }}
            style={s.red ? { background: '#fff', color: 'var(--bg)' } : { color: 'var(--coral)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <IconEye />
          </button>
          <button type="button" className="pill" aria-label="Cambiar ubicación" onClick={() => setSheet(true)}>
            <IconPin style={{ color: 'var(--gold)' }} />
            {loc ? loc.name : 'Elegir lugar'}
          </button>
        </div>
      </header>

      {!loc ? (
        <section className="hero-card rise">
          <span className="eyebrow">Falta tu ubicación</span>
          <p className="soft" style={{ fontSize: 15, lineHeight: 1.5 }}>Para calcular qué se ve y a qué hora necesitamos saber desde dónde mirás. Puede ser tu ubicación actual o una ciudad fija.</p>
          <button type="button" className="btn btn-gold" onClick={() => setSheet(true)}>Elegir ubicación</button>
        </section>
      ) : (
        <section className="hero-card rise">
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 350 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <GlowDef id="fglow" />
            <Stars w={350} h={300} count={34} seed={21} />
          </svg>
          <div className="meteor" />
          <div className="row" style={{ position: 'relative', alignItems: 'flex-start' }}>
            <div className="col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
              <span className="eyebrow">Esta noche</span>
              <span className="display" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15 }}>{longDate(now)}</span>
              <span className="muted" style={{ fontSize: 13 }}>Puesta del Sol {sky?.sunset} · {coords(loc)}</span>
            </div>
            {sky && (
              <Link href="/luna" aria-label={`Ver Luna: ${sky.moon.name}, ${sky.moon.illum} por ciento`} style={{ display: 'block', flex: 'none' }}>
                <ViewTransition name="moon-hero" share="morph">
                  <MoonGlyph className="glow-gold" size={60} fraction={sky.moon.fraction} waxing={sky.moon.waxing} south={isSouth(loc)} dark="#1E2540" />
                </ViewTransition>
              </Link>
            )}
          </div>
          <div className="grid-3" style={{ position: 'relative' }}>
            <Stat label="Luna" value={`${sky?.moon.illum ?? '—'}%`} sub={sky?.moon.sub} />
            {sky?.planet ? <Stat label={sky.planet.name} value={`${sky.planet.alt}° ${sky.planet.dir}`} sub={`a las ${sky.planet.at}`} /> : <Stat label="Planetas" value="—" sub="ninguno alto" />}
            <Stat
              label="Cielo"
              value={tonightClouds != null ? `${tonightClouds}%` : '—'}
              sub={tonightClouds != null ? `nubes · ${cloudLabel(tonightClouds)}` : online ? 'pronóstico' : 'sin conexión'}
            />
          </div>
          <div className="row small muted" style={{ position: 'relative', gap: 8 }}>
            <IconCloudOk style={{ color: 'var(--green)', flex: 'none' }} />
            Efemérides calculadas hasta {until} · funciona sin conexión
          </div>
        </section>
      )}

      {loc && (
        <section className="col" style={{ gap: 12 }}>
          <div className="between">
            <h2 className="h2">Próximos eventos</h2>
            <span className="small muted">desde {loc.name}</span>
          </div>
          <div role="group" aria-label="Filtrar por instrumento" className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(([v, l]) => (
              <button key={v} type="button" className="chip" aria-pressed={filter === v} onClick={() => { haptic(); setFilter(v); setShown(PAGE); }}>{l}</button>
            ))}
          </div>
          {/* key: al cambiar de filtro la lista vuelve a entrar escalonada */}
          <div key={filter} className="col" style={{ gap: 10 }}>
            {!events && <SkeletonCards label="Calculando el cielo…" />}
            {events && list.length === 0 && <span className="small muted fade-in">No hay eventos para este instrumento en los próximos meses.</span>}
            {list.slice(0, shown).map((ev, i) => <EventCard key={ev.id} ev={ev} index={i >= shown - PAGE ? i - (shown - PAGE) : 0} />)}
          </div>
          {list.length > shown && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown((n) => n + PAGE)}>Ver más eventos ({list.length - shown})</button>
          )}
        </section>
      )}
      <LocationSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
