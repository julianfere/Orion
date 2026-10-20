'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GlowDef, OrionArt, Stars } from '@/components/art';
import { IconBell, IconCheck, IconPin } from '@/components/icons';
import { LocationSheet } from '@/components/LocationSheet';
import { coords } from '@/lib/astro/core';
import { nearestCity } from '@/lib/cities';
import { locateMe } from '@/lib/geo';
import { disablePush, enablePush } from '@/lib/push-client';
import { setSettings, useSettings } from '@/lib/store';

export default function Bienvenida() {
  const s = useSettings();
  const router = useRouter();
  const [locBusy, setLocBusy] = useState(false);
  const [locErr, setLocErr] = useState('');
  const [sheet, setSheet] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifErr, setNotifErr] = useState('');
  const north = (s.location?.lat ?? -1) > 0;

  async function useGps() {
    setLocBusy(true);
    setLocErr('');
    try {
      const loc = await locateMe();
      setSettings({ locMode: 'gps', location: { lat: loc.lat, lon: loc.lon, name: loc.name } });
    } catch (e) {
      setLocErr((e as Error).message);
    } finally {
      setLocBusy(false);
    }
  }

  async function toggleNotif() {
    setNotifErr('');
    if (s.push.endpoint) return disablePush();
    if (!s.location) {
      setNotifErr('Primero elegí tu ubicación: los avisos se calculan para ese lugar.');
      return;
    }
    setNotifBusy(true);
    const r = await enablePush();
    setNotifBusy(false);
    if (!r.ok) setNotifErr(r.reason);
  }

  const region = s.location ? nearestCity(s.location.lat, s.location.lon)?.region : undefined;

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div className="drift" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 520, transformOrigin: '50% 60%' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 390 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <GlowDef id="wglow" />
          <Stars w={390} h={520} count={48} seed={7} />
          <OrionArt north={north} glowId="wglow" />
        </svg>
      </div>

      <div style={{ position: 'relative', padding: '0 20px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="rise col" style={{ gap: 6, marginBottom: 6 }}>
          <h1 className="display" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1 }}>Orion</h1>
          <p className="soft" style={{ fontSize: 16, lineHeight: 1.45 }}>El cielo de esta noche, calculado para donde estés. Funciona sin conexión.</p>
        </div>

        <section className="panel rise" style={{ animationDelay: '.15s', background: 'rgba(16,22,42,0.92)', border: '1px solid var(--line)', borderRadius: 18 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <IconPin size={22} style={{ color: 'var(--gold)', flex: 'none' }} />
            <div className="col" style={{ flex: 1, gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Ubicación</span>
              <span className="muted" style={{ fontSize: 13 }}>Para saber qué se ve y a qué hora desde tu lugar.</span>
            </div>
          </div>
          {s.location ? (
            <div className="row" style={{ gap: 8, minHeight: 44, padding: '6px 12px', borderRadius: 12, background: 'rgba(127,209,174,0.12)', color: 'var(--green)', fontSize: 14, fontWeight: 500 }}>
              <IconCheck />
              <span style={{ flex: 1 }}>{s.location.name}{region ? `, ${region}` : ''} · {coords(s.location)}</span>
              <button type="button" className="chip" style={{ minHeight: 32, color: 'var(--green)', borderColor: 'rgba(127,209,174,0.4)' }} onClick={() => setSheet(true)}>Cambiar</button>
            </div>
          ) : (
            <div className="grid-2">
              <button type="button" className="btn btn-gold btn-sm" onClick={useGps} disabled={locBusy}>{locBusy ? 'Buscando…' : 'Usar mi ubicación'}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSheet(true)}>Elegir ciudad</button>
            </div>
          )}
          {locErr && <span className="err-text" role="alert">{locErr}</span>}
        </section>

        <section className="panel rise" style={{ animationDelay: '.3s', background: 'rgba(16,22,42,0.92)', border: '1px solid var(--line)', borderRadius: 18 }}>
          <div className="row">
            <IconBell style={{ color: 'var(--gold)', flex: 'none' }} />
            <div className="col" style={{ flex: 1, gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Notificaciones</span>
              <span className="muted" style={{ fontSize: 13 }}>Lluvias de meteoros, fases lunares y más.</span>
            </div>
            <button type="button" className={`btn btn-sm ${s.push.endpoint ? 'btn-on' : 'btn-gold'}`} aria-pressed={!!s.push.endpoint} onClick={toggleNotif} disabled={notifBusy}>
              {notifBusy ? 'Activando…' : s.push.endpoint ? 'Activadas' : 'Activar'}
            </button>
          </div>
          {notifErr && <span className="err-text" role="alert">{notifErr}</span>}
        </section>

        <button
          type="button"
          className="btn btn-gold rise"
          style={{ animationDelay: '.45s', marginTop: 4, minHeight: 54, fontSize: 16 }}
          onClick={() => {
            setSettings({ onboarded: true });
            router.replace('/');
          }}
        >
          Empezar a mirar el cielo
        </button>
        <span className="muted" style={{ fontSize: 12, textAlign: 'center' }}>Podés cambiar esto cuando quieras desde Alertas.</span>
      </div>
      <LocationSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
