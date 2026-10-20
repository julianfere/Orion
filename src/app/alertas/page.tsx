'use client';
import { useMemo, useState } from 'react';
import { OrionGlyph } from '@/components/art';
import { LocationSheet } from '@/components/LocationSheet';
import { Segmented, SwitchRow } from '@/components/ui';
import { type Level, coords } from '@/lib/astro/core';
import { isFollowed, notificationFor } from '@/lib/alerts';
import { locateMe } from '@/lib/geo';
import { useEvents } from '@/lib/hooks';
import { CATS, LEADS } from '@/lib/prefs';
import { disablePush, enablePush, pushSupport, testPush } from '@/lib/push-client';
import { setSettings, useHydrated, useSettings } from '@/lib/store';

export default function Alertas() {
  const s = useSettings();
  const hydrated = useHydrated();
  const events = useEvents(s.location);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Vista previa: el próximo aviso real según lo elegido, o uno de ejemplo.
  const preview = useMemo(() => {
    const next = (events ?? []).find((e) => isFollowed(e, s) && new Date(e.at).getTime() > Date.now());
    if (next) return notificationFor(next, 'd');
    return { title: 'Oriónidas esta noche', body: 'La Luna se pone 03:51. Mirá al este hasta las 06:00 · a simple vista.' };
  }, [events, s]);

  if (!hydrated) return null;
  const support = pushSupport();
  const pushOn = !!s.push.endpoint;

  async function togglePush() {
    setMsg(null);
    if (pushOn) return disablePush();
    setBusy(true);
    const r = await enablePush();
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: 'Listo: este dispositivo recibe avisos.' } : { ok: false, text: r.reason });
  }

  async function test() {
    setMsg(null);
    setBusy(true);
    const ok = await testPush();
    setBusy(false);
    setMsg(ok ? { ok: true, text: 'Aviso de prueba enviado: debería llegar en unos segundos.' } : { ok: false, text: 'No se pudo enviar. Revisá la conexión.' });
  }

  async function setMode(mode: 'gps' | 'fixed') {
    if (mode === 'fixed') return setSheet(true);
    try {
      const loc = await locateMe();
      setSettings({ locMode: 'gps', location: { lat: loc.lat, lon: loc.lon, name: loc.name } });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }

  const pushHint =
    support === 'ios-browser' ? 'En iPhone, primero agregá Orion a la pantalla de inicio'
    : support === 'unsupported' ? 'Este navegador no admite notificaciones'
    : support === 'denied' ? 'Bloqueadas en el navegador: habilitalas en sus ajustes'
    : pushOn ? (s.push.dirty ? 'Activos · cambios pendientes de sincronizar' : 'Activos en este dispositivo')
    : 'Apagados: no vas a recibir avisos';

  return (
    <div className="page">
      <h1 className="h1">Alertas</h1>

      <div className="drop row" style={{ borderRadius: 20, background: 'rgba(30,37,64,0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: 14, alignItems: 'flex-start' }} aria-label="Vista previa de un aviso">
        <div className="ring" style={{ flex: 'none', width: 40, height: 40, borderRadius: 12, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OrionGlyph size={26} color="#1A1406" lines="#1A1406" />
        </div>
        <div className="col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <div className="between"><span className="small soft" style={{ fontWeight: 600 }}>ORION</span><span className="small muted">vista previa</span></div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{preview.title}</span>
          <span className="soft" style={{ fontSize: 13, lineHeight: 1.4 }}>{preview.body}</span>
        </div>
      </div>

      <section className="col" style={{ gap: 10 }}>
        <div className="list">
          <SwitchRow label="Avisos en este dispositivo" hint={busy ? 'Un momento…' : pushHint} on={pushOn} onToggle={togglePush} />
        </div>
        {pushOn && <button type="button" className="btn btn-ghost btn-sm" onClick={test} disabled={busy}>Mandarme un aviso de prueba</button>}
        {msg && <span className={msg.ok ? 'ok-text' : 'err-text'} role="status">{msg.text}</span>}
      </section>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="h3">Ubicación para calcular</h2>
        <Segmented
          label="Modo de ubicación"
          value={s.locMode}
          options={[['gps', 'Ubicación actual'], ['fixed', s.locMode === 'fixed' && s.location ? `Fija: ${s.location.name}` : 'Fija']]}
          onChange={setMode}
        />
        <span className="small muted">
          {s.locMode === 'gps'
            ? 'Se actualiza cuando abrís la app; si viajás, los horarios se recalculan solos.'
            : s.location ? `Usa siempre ${coords(s.location)}, aunque estés en otro lado.` : 'Elegí una ciudad.'}
        </span>
      </section>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="h3">Avisame de lo que pueda ver con</h2>
        <Segmented<Level> label="Instrumento disponible" value={s.gear} options={[['ojo', 'Ojo'], ['bino', '+ Binoculares'], ['tele', '+ Telescopio']]} onChange={(gear) => setSettings({ gear })} />
      </section>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="h3">Tipos de evento</h2>
        <div className="list">
          {CATS.map((c) => (
            <SwitchRow key={c.key} label={c.label} hint={c.hint} on={s.cats[c.key]} onToggle={() => setSettings((cur) => ({ cats: { ...cur.cats, [c.key]: !cur.cats[c.key] } }))} />
          ))}
        </div>
      </section>

      <section className="col" style={{ gap: 10 }}>
        <h2 className="h3">Anticipación</h2>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {LEADS.map((l) => (
            <button key={l.key} type="button" className="chip soft-on" style={{ minHeight: 40 }} aria-pressed={s.leads[l.key]} onClick={() => setSettings((cur) => ({ leads: { ...cur.leads, [l.key]: !cur.leads[l.key] } }))}>{l.label}</button>
          ))}
        </div>
      </section>

      <div className="list">
        <SwitchRow label="Modo noche rojo" hint="Cuida tu visión nocturna al abrir la app afuera" on={s.red} onToggle={() => setSettings({ red: !s.red })} />
      </div>
      <LocationSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
