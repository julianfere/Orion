'use client';
import type { Loc } from './astro/core';
import { type City, nearestCity } from './cities';

export const cityLoc = (c: City): Loc => ({ lat: c.lat, lon: c.lon, name: c.name });

/** Pide la posición al navegador y le pone nombre con la lista de ciudades (sin red). */
export function locateMe(): Promise<Loc & { region?: string }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Este navegador no da ubicación.'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lon = +pos.coords.longitude.toFixed(4);
        const c = nearestCity(lat, lon);
        resolve({ lat, lon, name: c?.name ?? 'Mi ubicación', region: c?.region });
      },
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED ? 'Sin permiso de ubicación: elegí una ciudad.' : 'No pudimos ubicarte. Probá de nuevo o elegí una ciudad.')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60_000 },
    );
  });
}
