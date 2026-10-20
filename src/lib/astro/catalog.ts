// Catálogo versionado de lluvias de meteoros (valores de la IMO).
// El pico se guarda como longitud solar, así la fecha exacta se calcula para cada año
// en vez de tener que actualizar fechas a mano.
export const CATALOG_VERSION = '2026.1';

export type Shower = {
  key: string;
  name: string; // "Oriónidas"
  lambda: number; // longitud solar del pico, grados
  ra: number; // radiante, horas (J2000)
  dec: number; // radiante, grados
  zhr: number; // tasa horaria cenital
  origin: string; // cuerpo progenitor
  near: string; // estrella de referencia para encontrar el radiante
};

export const SHOWERS: Shower[] = [
  { key: 'cuadrantidas', name: 'Cuadrántidas', lambda: 283.15, ra: 15.33, dec: 49, zhr: 80, origin: 'asteroide 2003 EH1', near: 'la Osa Mayor' },
  { key: 'liridas', name: 'Líridas', lambda: 32.32, ra: 18.07, dec: 34, zhr: 18, origin: 'cometa C/1861 G1 Thatcher', near: 'Vega' },
  { key: 'eta-acuaridas', name: 'Eta Acuáridas', lambda: 45.5, ra: 22.53, dec: -1, zhr: 50, origin: 'cometa 1P/Halley', near: 'Acuario' },
  { key: 'delta-acuaridas', name: 'Delta Acuáridas del Sur', lambda: 127, ra: 22.67, dec: -16, zhr: 25, origin: 'cometa 96P/Machholz', near: 'Fomalhaut' },
  { key: 'perseidas', name: 'Perseidas', lambda: 140.0, ra: 3.2, dec: 58, zhr: 100, origin: 'cometa 109P/Swift-Tuttle', near: 'Perseo' },
  { key: 'orionidas', name: 'Oriónidas', lambda: 208, ra: 6.33, dec: 16, zhr: 20, origin: 'cometa 1P/Halley', near: 'Betelgeuse' },
  { key: 'leonidas', name: 'Leónidas', lambda: 235.27, ra: 10.13, dec: 22, zhr: 15, origin: 'cometa 55P/Tempel-Tuttle', near: 'Régulo' },
  { key: 'geminidas', name: 'Gemínidas', lambda: 262.2, ra: 7.47, dec: 33, zhr: 150, origin: 'asteroide 3200 Faetón', near: 'Cástor y Pólux' },
  { key: 'ursidas', name: 'Úrsidas', lambda: 270.7, ra: 14.47, dec: 76, zhr: 10, origin: 'cometa 8P/Tuttle', near: 'la Osa Menor' },
  { key: 'alfa-centauridas', name: 'Alfa Centáuridas', lambda: 319.4, ra: 14.0, dec: -59, zhr: 6, origin: 'desconocido', near: 'Alfa Centauri' },
];
