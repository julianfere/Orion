'use client';
// Estado de la app guardado en el dispositivo. Todo funciona sin red; lo que afecta a los avisos
// se manda además al servidor (ver push-client).
import { useSyncExternalStore } from 'react';
import type { Loc } from './astro/core';
import { DEFAULT_PREFS, type Prefs, type Trip } from './prefs';

export type Settings = Omit<Prefs, 'trips'> & {
  onboarded: boolean;
  locMode: 'gps' | 'fixed';
  location: Loc | null;
  red: boolean;
  trips: Trip[];
  push: { endpoint: string | null; dirty: boolean };
};

const KEY = 'orion:v1';

export const DEFAULTS: Settings = {
  ...DEFAULT_PREFS,
  trips: [],
  onboarded: false,
  locMode: 'gps',
  location: null,
  red: false,
  push: { endpoint: null, dirty: false },
};

let state: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Settings>;
      state = { ...DEFAULTS, ...s, cats: { ...DEFAULTS.cats, ...s.cats }, leads: { ...DEFAULTS.leads, ...s.leads }, push: { ...DEFAULTS.push, ...s.push } };
    }
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): la app arranca con los valores por defecto.
  }
}

export function getSettings(): Settings {
  load();
  return state;
}

export function setSettings(patch: Partial<Settings> | ((s: Settings) => Partial<Settings>)) {
  load();
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot = () => DEFAULTS;

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, serverSnapshot);
}

const noop = () => () => {};
/** true una vez que el cliente leyó lo guardado (evita parpadeos y redirecciones en el primer render). */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function prefsOf(s: Settings): Prefs {
  return {
    gear: s.gear,
    cats: s.cats,
    leads: s.leads,
    follows: s.follows,
    trips: s.trips.map(({ id, eventId, eventTitle, dest, depart, items }) => ({ id, eventId, eventTitle, dest, depart, items })),
  };
}
