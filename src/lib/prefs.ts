import type { Level, Loc } from './astro/core';

export type CatKey = 'm' | 'l' | 'c' | 'o' | 'e' | 'p';
export type LeadKey = 'w' | 'd' | 'h';

export type Trip = {
  id: string;
  eventId: string;
  eventTitle: string;
  dest: Loc | null;
  depart: string; // "YYYY-MM-DDTHH:mm", hora local
  back: string;
  items: Record<number, boolean>;
  savedAt: string;
};

/** Lo que el servidor necesita para decidir qué avisos mandar. */
export type Prefs = {
  gear: Level;
  cats: Record<CatKey, boolean>;
  leads: Record<LeadKey, boolean>;
  follows: Record<string, boolean>; // preferencia explícita por evento ("Avisarme")
  trips: Pick<Trip, 'id' | 'eventId' | 'eventTitle' | 'dest' | 'depart' | 'items'>[];
};

export const DEFAULT_PREFS: Prefs = {
  gear: 'bino',
  cats: { m: true, l: true, c: true, o: true, e: true, p: false },
  leads: { w: false, d: true, h: true },
  follows: {},
  trips: [],
};

export const CATS: { key: CatKey; label: string; hint: string }[] = [
  { key: 'm', label: 'Lluvias de meteoros', hint: 'Con la Luna y la hora ideal' },
  { key: 'l', label: 'Fases lunares', hint: 'Llena, nueva y cuartos, con salida y puesta' },
  { key: 'c', label: 'Conjunciones', hint: 'Luna y planetas cerca en el cielo' },
  { key: 'o', label: 'Planetas en oposición', hint: 'La mejor época para verlos' },
  { key: 'e', label: 'Eclipses', hint: 'Solo si son visibles desde tu ubicación' },
  { key: 'p', label: 'Cielo de la semana', hint: 'Resumen cada lunes' },
];

export const LEADS: { key: LeadKey; label: string }[] = [
  { key: 'w', label: '1 semana antes' },
  { key: 'd', label: 'El día' },
  { key: 'h', label: '1 h antes' },
];

export const CHECKLIST = ['Mapa del cielo descargado', 'Reposera o manta', 'Abrigo: de noche refresca', 'Linterna con luz roja', 'Mirar el pronóstico de nubes'];
