// Pronóstico de nubes con Open-Meteo (gratis, sin clave). Es lo único de la app que necesita red.
export type CloudForecast = { lat: number; lon: number; fetchedAt: number; hours: { t: number; c: number }[] };

export async function fetchClouds(lat: number, lon: number, timeoutMs = 6000): Promise<CloudForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=cloud_cover&forecast_days=16&timezone=UTC&timeformat=unixtime`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const j = (await res.json()) as { hourly: { time: number[]; cloud_cover: (number | null)[] } };
    const hours = j.hourly.time
      .map((t, i) => ({ t: t * 1000, c: j.hourly.cloud_cover[i] }))
      .filter((h): h is { t: number; c: number } => h.c != null);
    return { lat, lon, fetchedAt: Date.now(), hours };
  } finally {
    clearTimeout(timer);
  }
}

/** Nubosidad media (0-100) entre dos instantes, o null si el pronóstico no llega. */
export function cloudsBetween(f: CloudForecast, start: Date, end: Date): number | null {
  const xs = f.hours.filter((h) => h.t >= start.getTime() - 30 * 60_000 && h.t <= end.getTime() + 30 * 60_000);
  if (!xs.length) return null;
  return Math.round(xs.reduce((s, h) => s + h.c, 0) / xs.length);
}

export const cloudLabel = (c: number) => (c < 25 ? 'despejado' : c < 60 ? 'parcial' : 'nublado');
