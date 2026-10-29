'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { GlowDef, MoonGlyph, OrionArt, Stars } from '@/components/art';
import { IconBack, IconBell, IconEye, IconScope, IconShare } from '@/components/icons';
import { LevelBadge, Stat } from '@/components/ui';
import { type Level, hhmm, isSouth, moonInfo, parts, monthLong } from '@/lib/astro/core';
import { type AstroEvent, type Timeline, timeline } from '@/lib/astro/events';
import { describeLeads, isFollowed, notifiable } from '@/lib/alerts';
import { useEvent } from '@/lib/hooks';
import { enablePush } from '@/lib/push-client';
import { goBack, haptic } from '@/lib/platform';
import { setSettings, useHydrated, useSettings } from '@/lib/store';

export default function Page() {
  return (
    <Suspense>
      <Evento />
    </Suspense>
  );
}

function Evento() {
  const id = useSearchParams().get('id');
  const s = useSettings();
  const hydrated = useHydrated();
  const ev = useEvent(s.location, id);
  const router = useRouter();

  if (!hydrated) return null;
  if (!s.location) return <Empty text="Elegí tu ubicación para ver este evento." />;
  if (ev === undefined) return <Empty text="Calculando…" />;
  if (!ev) return <Empty text="No encontramos este evento. Puede que ya haya pasado." />;
  return <Detail ev={ev} onBack={() => goBack(router)} />;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="page">
      <Link className="icon-btn" href="/" transitionTypes={['nav-back']} aria-label="Volver"><IconBack /></Link>
      <p className="muted">{text}</p>
    </div>
  );
}

const PLANET_TINT: Record<string, string> = { Mercurio: '#D9C7A7', Venus: '#FFF1C9', Marte: '#FF9A6B', Júpiter: '#F2D6AE', Saturno: '#E9D08C', Urano: '#9FE3E0', Neptuno: '#8DB2FF' };

function Hero({ ev, south }: { ev: AstroEvent; south: boolean }) {
  const orion = ev.id.startsWith('lluvia-orionidas');
  const m = moonInfo(new Date(ev.at));
  const planet = ev.target?.type === 'body' && ev.target.body !== 'Moon' ? ev.target.label : null;
  return (
    <>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <GlowDef id="eglow" />
        <Stars w={390} h={300} count={46} seed={ev.id.length * 13} />
        {orion && <g transform="translate(130,-60) scale(0.75)"><OrionArt north={!south} glowId="eglow" /></g>}
        {planet && (ev.category === 'oposicion' || ev.category === 'planeta' || ev.category === 'conjuncion') && (
          <g className="spark" style={{ transformOrigin: '300px 120px' }}>
            <circle cx="300" cy="120" r="22" fill="url(#eglow)" />
            <circle cx="300" cy="120" r="5" fill={PLANET_TINT[planet] ?? '#fff'} />
          </g>
        )}
      </svg>
      {ev.category === 'meteoros' && (
        <div className="radiant" style={{ left: orion ? '84.6%' : '78%', top: orion ? '66%' : '58%' }}>
          {[196, 218, 240, 257].map((deg, i) => (
            <div key={deg} className="ray" style={{ transform: `rotate(${deg}deg)` }}>
              <div className="streak" style={{ animationDelay: `${i * 1.5}s`, animationDuration: i === 2 ? '7s' : undefined }} />
            </div>
          ))}
        </div>
      )}
      {(ev.category === 'luna' || ev.id.startsWith('eclipse-lunar') || ev.id.startsWith('conj-luna')) && (
        <div className="float" style={{ position: 'absolute', right: 24, top: 64 }}>
          <MoonGlyph className="glow-moon" size={110} fraction={ev.id.startsWith('eclipse-lunar') ? 1 : m.fraction} waxing={m.waxing} south={south} dark="#1E2540" craters />
        </div>
      )}
    </>
  );
}

function NightLine({ tl, ev }: { tl: Timeline; ev: AstroEvent }) {
  const { night } = tl;
  const span = night.sunrise.getTime() - night.sunset.getTime();
  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - night.sunset.getTime()) / span) * 100));
  const a = parts(night.sunset), b = parts(night.sunrise);
  const title = a.m === b.m ? `Noche del ${a.d} al ${b.d} de ${monthLong(a.m)}` : `Noche del ${a.d} de ${monthLong(a.m)} al ${b.d} de ${monthLong(b.m)}`;
  const moonWide = tl.moonUp.reduce((w, i) => Math.max(w, pct(i.end) - pct(i.start)), 0);
  const labels = [
    { t: night.sunset, text: hhmm(night.sunset), color: undefined as string | undefined },
    ...tl.marks.map((m) => ({ t: m.t, text: `~${hhmm(m.t)} ${m.label}`, color: '#8DB2FF' })),
    ...(tl.window ? [{ t: tl.window.start, text: hhmm(tl.window.start), color: '#F4C76A' }] : []),
    { t: night.sunrise, text: hhmm(night.sunrise), color: undefined },
  ]
    .sort((x, y) => x.t.getTime() - y.t.getTime())
    .filter((l, i, arr) => i === 0 || Math.abs(pct(l.t) - pct(arr[i - 1].t)) > 6);
  const moonText = tl.moonUp.length
    ? `Luna: ${tl.moonUp.map((i) => `${hhmm(i.start)}–${hhmm(i.end)}`).join(', ')}`
    : 'Sin Luna en toda la noche';

  return (
    <section className="panel">
      <h2 className="h3">{title}</h2>
      <div
        role="img"
        aria-label={`${moonText}.${tl.window ? ` Mejor momento de ${hhmm(tl.window.start)} a ${hhmm(tl.window.end)}.` : ''} Puesta del Sol ${hhmm(night.sunset)}, amanecer ${hhmm(night.sunrise)}.`}
        style={{ position: 'relative', height: 40, borderRadius: 10, background: 'var(--bg)', overflow: 'hidden' }}
      >
        {tl.moonUp.map((i, k) => (
          <div key={k} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(i.start)}%`, width: `${pct(i.end) - pct(i.start)}%`, background: 'rgba(243,233,207,0.10)' }} />
        ))}
        {tl.window && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(tl.window.start)}%`, width: `${Math.max(1, pct(tl.window.end) - pct(tl.window.start))}%`, background: 'rgba(244,199,106,0.30)', borderLeft: '2px solid var(--gold)' }} />
        )}
        {tl.marks.map((m, k) => (
          <div key={k} style={{ position: 'absolute', left: `${pct(m.t)}%`, top: 6, bottom: 6, width: 2, background: 'var(--blue)' }} />
        ))}
        {moonWide > 28 && tl.moonUp[0] && (
          <span className="xs soft" style={{ position: 'absolute', left: `calc(${pct(tl.moonUp.find((i) => pct(i.end) - pct(i.start) === moonWide)!.start)}% + 10px)`, top: 12, whiteSpace: 'nowrap' }}>Luna en el cielo</span>
        )}
        {tl.window && pct(tl.window.end) - pct(tl.window.start) > 12 && (
          <span className="xs" style={{ position: 'absolute', left: `calc(${pct(tl.window.end)}% - 40px)`, top: 12, fontWeight: 600, color: 'var(--gold)' }}>Ideal</span>
        )}
      </div>
      <div className="xs muted" style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        {labels.map((l, i) => <span key={i} style={{ color: l.color }}>{l.text}</span>)}
      </div>
      <p className="soft" style={{ fontSize: 13, lineHeight: 1.5 }}>{ev.note}</p>
    </section>
  );
}

function Need({ ev }: { ev: AstroEvent }) {
  const icon = (lvl: Level | 'filtro', color: string) => (lvl === 'ojo' ? <IconEye size={22} style={{ color, flex: 'none' }} /> : <IconScope style={{ color, flex: 'none' }} />);
  const recLevel: Level | 'filtro' = ev.need.title.startsWith('Ojo') ? 'ojo' : ev.need.title.startsWith('Filtro') ? 'filtro' : ev.level;
  return (
    <section className="col" style={{ gap: 10 }}>
      <h2 className="h3">¿Qué necesito?</h2>
      <div className="row" style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(244,199,106,0.10)', border: '1px solid rgba(244,199,106,0.35)' }}>
        {icon(recLevel, 'var(--gold)')}
        <div className="col" style={{ gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{ev.need.title}</span>
          <span className="small soft">{ev.need.text}</span>
        </div>
      </div>
      {ev.need.avoid && (
        <div className="row" style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--surface)' }}>
          <IconScope style={{ color: 'var(--ink-mute)', flex: 'none' }} />
          <div className="col" style={{ gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{ev.need.avoid.title}</span>
            <span className="small muted">{ev.need.avoid.text}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ ev, onBack }: { ev: AstroEvent; onBack: () => void }) {
  const s = useSettings();
  const loc = s.location!;
  const tl = useMemo(() => timeline(loc, ev), [loc, ev]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const now = useMemo(() => new Date(), []);
  const canNotify = notifiable(ev);
  const on = !!s.push.endpoint && isFollowed(ev, s);

  async function toggle() {
    setMsg(null);
    haptic();
    if (!s.push.endpoint) {
      setBusy(true);
      const r = await enablePush();
      setBusy(false);
      if (!r.ok) return setMsg({ ok: false, text: r.reason });
      setSettings((cur) => ({ follows: { ...cur.follows, [ev.id]: true } }));
      return;
    }
    setSettings((cur) => ({ follows: { ...cur.follows, [ev.id]: !on } }));
  }

  async function share() {
    const url = `${location.origin}/evento?id=${ev.id}`;
    const text = `${ev.title} · ${ev.subtitle}`;
    try {
      if (navigator.share) await navigator.share({ title: ev.title, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setMsg({ ok: true, text: 'Enlace copiado.' });
      }
    } catch {}
  }

  const anyLead = s.leads.w || s.leads.d || s.leads.h;

  return (
    <div className="col">
      {/* El alto suma el área segura: en iPhone la isla queda sobre el cielo, no sobre los botones. */}
      <section className="ev-hero">
        <Hero ev={ev} south={isSouth(loc)} />
        <div className="row" style={{ position: 'relative', justifyContent: 'space-between' }}>
          <button type="button" className="icon-btn glass" aria-label="Volver" onClick={onBack}><IconBack /></button>
          <button type="button" className="icon-btn glass" aria-label="Compartir" onClick={share}><IconShare /></button>
        </div>
        <div className="col" style={{ position: 'relative', gap: 6 }}>
          <LevelBadge level={ev.level} big />
          <h1 className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{ev.name}</h1>
          <span className="soft" style={{ fontSize: 13 }}>{ev.subtitle}</span>
        </div>
      </section>

      <div className="page stagger">
        <div className="grid-3">
          {ev.facts.map((f) => <Stat key={f.label} solid label={f.label} value={f.value} sub={f.sub} />)}
        </div>

        {tl ? <NightLine tl={tl} ev={ev} /> : (
          <section className="panel"><p className="soft" style={{ fontSize: 13, lineHeight: 1.5 }}>{ev.note}</p></section>
        )}

        <Need ev={ev} />

        <div className={canNotify ? 'grid-2' : 'col'} style={{ gap: 10 }}>
          {canNotify && (
            <button type="button" className={`btn ${on ? 'btn-on rang' : 'btn-ghost'}`} aria-pressed={on} onClick={toggle} disabled={busy}>
              <IconBell size={18} />
              {busy ? 'Activando…' : on ? 'Avisos activos' : 'Avisarme'}
            </button>
          )}
          <Link className="btn btn-gold" href={`/viajes?evento=${ev.id}`} transitionTypes={['nav-forward']}>Planificar viaje</Link>
        </div>
        {on && <p className="ok-text fade-in">{anyLead ? describeLeads(ev, s.leads, now) : 'Elegí en Alertas con cuánta anticipación querés el aviso.'}</p>}
        {msg && <p className={`${msg.ok ? 'ok-text' : 'err-text'} fade-in`} role="status">{msg.text}</p>}
      </div>
    </div>
  );
}
