'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MoonGlyph } from '@/components/art';
import { IconBell, IconRise, IconSet } from '@/components/icons';
import { type Loc, DAY, decimal, hhmm, isSouth, monShort, parts, shortDate, wdShort } from '@/lib/astro/core';
import { moonDay, nextQuarters } from '@/lib/astro/events';
import { isFollowed } from '@/lib/alerts';
import { useEvents } from '@/lib/hooks';
import { enablePush } from '@/lib/push-client';
import { setSettings, useHydrated, useSettings } from '@/lib/store';

export default function Luna() {
  const s = useSettings();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  if (!s.location) {
    return (
      <div className="page">
        <h1 className="h1">Luna</h1>
        <p className="muted">Elegí tu ubicación en <Link href="/">Cielo</Link> para calcular salida y puesta.</p>
      </div>
    );
  }
  return <LunaView loc={s.location} />;
}

function LunaView({ loc }: { loc: Loc }) {
  const s = useSettings();
  const south = isSouth(loc);
  const [day, setDay] = useState(0);
  const [err, setErr] = useState('');
  const now = useMemo(() => new Date(), []);
  const days = useMemo(() => Array.from({ length: 8 }, (_, i) => moonDay(loc, new Date(now.getTime() + i * DAY))), [loc, now]);
  const phases = useMemo(() => nextQuarters(now), [now]);
  const events = useEvents(loc);
  const lunar = (events ?? []).filter((e) => e.lunar).slice(0, 6);
  const sel = days[day];

  const riseText = (d: (typeof days)[number]) => (d.rise ? hhmm(d.rise) : '—');
  const setText = (d: (typeof days)[number]) => {
    if (!d.set) return '—';
    // Si se pone después de medianoche, es la madrugada siguiente.
    return parts(d.set).d !== parts(d.date).d ? `${hhmm(d.set)}*` : hhmm(d.set);
  };

  async function toggle(id: string, on: boolean) {
    setErr('');
    if (!s.push.endpoint) {
      const r = await enablePush();
      if (!r.ok) return setErr(r.reason);
      setSettings((cur) => ({ follows: { ...cur.follows, [id]: true } }));
      return;
    }
    setSettings((cur) => ({ follows: { ...cur.follows, [id]: !on } }));
  }

  return (
    <div className="page">
      <header className="between">
        <h1 className="h1">Luna</h1>
        <span className="small muted">{loc.name} · hora local</span>
      </header>

      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'var(--surface-2)', padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div className="stars-bg" />
        <div className="float" style={{ position: 'relative' }}>
          <MoonGlyph className="glow-moon" size={180} fraction={sel.fraction} waxing={sel.waxing} south={south} dark="#1E2540" craters label={`${sel.name}, ${sel.illum} por ciento iluminada`} />
        </div>
        <div className="col" style={{ position: 'relative', alignItems: 'center', gap: 2 }}>
          <span className="display" style={{ fontSize: 22, fontWeight: 600 }}>{sel.name}</span>
          <span className="muted" style={{ fontSize: 13 }}>{sel.wd} {sel.num} {monShort(sel.date)} · {sel.illum}% iluminada · {decimal(sel.ageDays)} días</span>
        </div>
        <div className="grid-2" style={{ position: 'relative', width: '100%' }}>
          <div className="stat row" style={{ flexDirection: 'row', gap: 10 }}>
            <IconRise style={{ color: 'var(--gold)', flex: 'none' }} />
            <div className="col"><span className="stat-label">Sale</span><span className="stat-value">{riseText(sel)}</span></div>
          </div>
          <div className="stat row" style={{ flexDirection: 'row', gap: 10 }}>
            <IconSet style={{ color: 'var(--blue)', flex: 'none' }} />
            <div className="col"><span className="stat-label">Se pone</span><span className="stat-value">{setText(sel)}</span></div>
          </div>
        </div>
        <span className="xs muted" style={{ position: 'relative', textAlign: 'center' }}>
          {south ? 'Dibujada como se ve desde el hemisferio sur: creciente iluminada a la izquierda.' : 'Dibujada como se ve desde el hemisferio norte: creciente iluminada a la derecha.'}
          {sel.set && parts(sel.set).d !== parts(sel.date).d && ' * madrugada siguiente.'}
        </span>
      </section>

      <div role="group" aria-label="Elegir día" className="scroll-x">
        {days.map((d, i) => {
          const on = i === day;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              aria-label={`${d.wd} ${d.num}, ${d.illum} por ciento`}
              onClick={() => setDay(i)}
              style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 48, minHeight: 72, padding: '8px 4px', borderRadius: 14, cursor: 'pointer', font: '500 11px var(--body)', transition: 'all .2s', ...(on ? { background: 'var(--gold)', color: 'var(--on-gold)', border: '1px solid var(--gold)' } : { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid rgba(255,255,255,0.06)' }) }}
            >
              <span>{d.wd}</span>
              <MoonGlyph size={22} fraction={d.fraction} waxing={d.waxing} south={south} />
              <span style={{ fontWeight: 600 }}>{d.num}</span>
            </button>
          );
        })}
      </div>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="display" style={{ fontSize: 18, fontWeight: 600 }}>Próximas fases</h2>
        <div className="grid-2">
          {phases.map((p) => (
            <div key={p.at.toISOString()} className="row" style={{ background: 'var(--surface)', borderRadius: 14, padding: 12, gap: 10 }}>
              <MoonGlyph size={30} fraction={[0, 0.5, 1, 0.5][p.quarter]} waxing={p.quarter <= 1} south={south} />
              <div className="col" style={{ gap: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                <span className="small muted">{wdShort(p.at)} {parts(p.at).d} {monShort(p.at)} · {hhmm(p.at)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="display" style={{ fontSize: 18, fontWeight: 600 }}>Eventos lunares</h2>
        {!events && <span className="small muted">Calculando…</span>}
        {events && lunar.length === 0 && <span className="small muted">No hay encuentros de la Luna con planetas visibles en las próximas semanas.</span>}
        {lunar.map((e) => {
          const on = !!s.push.endpoint && isFollowed(e, s);
          return (
            <div key={e.id} className="row" style={{ background: 'var(--surface)', borderRadius: 16, padding: '12px 12px 12px 16px' }}>
              <Link href={`/evento?id=${e.id}`} className="col" style={{ flex: 1, gap: 2, color: 'var(--ink)', textDecoration: 'none' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{e.title}</span>
                <span className="small muted">{e.category === 'luna' ? e.detail : `${shortDate(new Date(e.at))} · ${e.detail}`}</span>
              </Link>
              <button type="button" className="bell" aria-pressed={on} aria-label={`${on ? 'Desactivar aviso' : 'Avisarme'}: ${e.title}`} onClick={() => toggle(e.id, on)}>
                <IconBell size={20} />
              </button>
            </div>
          );
        })}
        {err && <span className="err-text" role="alert">{err}</span>}
      </section>
    </div>
  );
}
