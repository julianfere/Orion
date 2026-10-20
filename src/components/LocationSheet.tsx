'use client';
import { useState } from 'react';
import { coords } from '@/lib/astro/core';
import { type City, searchCities } from '@/lib/cities';
import { cityLoc, locateMe } from '@/lib/geo';
import { setSettings, useSettings } from '@/lib/store';
import { IconLocate, IconPin } from './icons';
import { Sheet } from './ui';

/** Buscador de ciudades de la lista incluida (anda sin red). */
export function CitySearch({ onPick, placeholder = 'Buscá una ciudad', suggestions = [], id = 'city-q', label = 'Ciudad' }: {
  onPick: (c: City) => void; placeholder?: string; suggestions?: City[]; id?: string; label?: string;
}) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const results = q ? searchCities(q) : focused ? suggestions : [];
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          className="input"
          type="search"
          autoComplete="off"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
      </div>
      {results.length > 0 && (
        <div className="suggest" role="list">
          {results.map((c) => (
            <button key={`${c.name}-${c.region}`} type="button" role="listitem" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(c); setQ(''); }}>
              <span>{c.name}</span>
              <span className="small muted">{c.region}</span>
            </button>
          ))}
        </div>
      )}
      {q && results.length === 0 && <span className="small muted">No está en la lista. Probá con la ciudad más cercana.</span>}
    </div>
  );
}

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function gps() {
    setBusy(true);
    setErr('');
    try {
      const loc = await locateMe();
      setSettings({ locMode: 'gps', location: { lat: loc.lat, lon: loc.lon, name: loc.name } });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Ubicación">
      {s.location && (
        <div className="row small soft">
          <IconPin style={{ color: 'var(--gold)' }} />
          <span>{s.location.name} · {coords(s.location)} · {s.locMode === 'gps' ? 'actual' : 'fija'}</span>
        </div>
      )}
      <button type="button" className="btn btn-gold btn-sm" onClick={gps} disabled={busy}>
        <IconLocate />
        {busy ? 'Buscando…' : 'Usar mi ubicación actual'}
      </button>
      {err && <span className="err-text" role="alert">{err}</span>}
      <CitySearch
        id="loc-q"
        label="O fijá una ciudad"
        onPick={(c) => {
          setSettings({ locMode: 'fixed', location: cityLoc(c) });
          onClose();
        }}
      />
      <span className="small muted">Al cambiarla se recalculan todos los horarios y eventos.</span>
    </Sheet>
  );
}
