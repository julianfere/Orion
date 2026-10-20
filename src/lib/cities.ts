// Lista de lugares incluida en la app: el buscador y el "dónde estoy" funcionan sin red.
// `dark` marca sitios con cielo oscuro, sugeridos como destino de viaje.
export type City = { name: string; region: string; lat: number; lon: number; dark?: boolean };

export const CITIES: City[] = [
  // Argentina
  { name: 'La Plata', region: 'Buenos Aires', lat: -34.92, lon: -57.96 },
  { name: 'Buenos Aires', region: 'CABA', lat: -34.6, lon: -58.38 },
  { name: 'Quilmes', region: 'Buenos Aires', lat: -34.72, lon: -58.25 },
  { name: 'Lomas de Zamora', region: 'Buenos Aires', lat: -34.76, lon: -58.4 },
  { name: 'Morón', region: 'Buenos Aires', lat: -34.65, lon: -58.62 },
  { name: 'San Isidro', region: 'Buenos Aires', lat: -34.47, lon: -58.51 },
  { name: 'Tigre', region: 'Buenos Aires', lat: -34.43, lon: -58.58 },
  { name: 'Pilar', region: 'Buenos Aires', lat: -34.46, lon: -58.91 },
  { name: 'Luján', region: 'Buenos Aires', lat: -34.57, lon: -59.11 },
  { name: 'Chascomús', region: 'Buenos Aires', lat: -35.58, lon: -58.01 },
  { name: 'Magdalena', region: 'Buenos Aires', lat: -35.08, lon: -57.52 },
  { name: 'Punta Indio', region: 'Buenos Aires', lat: -35.28, lon: -57.24, dark: true },
  { name: 'Mar del Plata', region: 'Buenos Aires', lat: -38.0, lon: -57.56 },
  { name: 'Bahía Blanca', region: 'Buenos Aires', lat: -38.72, lon: -62.27 },
  { name: 'Tandil', region: 'Buenos Aires', lat: -37.32, lon: -59.13 },
  { name: 'Sierra de la Ventana', region: 'Buenos Aires', lat: -38.14, lon: -61.79, dark: true },
  { name: 'Olavarría', region: 'Buenos Aires', lat: -36.89, lon: -60.32 },
  { name: 'Junín', region: 'Buenos Aires', lat: -34.59, lon: -60.95 },
  { name: 'Pergamino', region: 'Buenos Aires', lat: -33.89, lon: -60.57 },
  { name: 'San Nicolás', region: 'Buenos Aires', lat: -33.33, lon: -60.22 },
  { name: 'Necochea', region: 'Buenos Aires', lat: -38.55, lon: -58.74 },
  { name: 'Villa Gesell', region: 'Buenos Aires', lat: -37.26, lon: -56.97 },
  { name: 'San Clemente del Tuyú', region: 'Buenos Aires', lat: -36.36, lon: -56.72 },
  { name: 'Azul', region: 'Buenos Aires', lat: -36.78, lon: -59.86 },
  { name: 'Rosario', region: 'Santa Fe', lat: -32.95, lon: -60.65 },
  { name: 'Santa Fe', region: 'Santa Fe', lat: -31.63, lon: -60.7 },
  { name: 'Rafaela', region: 'Santa Fe', lat: -31.25, lon: -61.49 },
  { name: 'Córdoba', region: 'Córdoba', lat: -31.42, lon: -64.18 },
  { name: 'Villa Carlos Paz', region: 'Córdoba', lat: -31.42, lon: -64.5 },
  { name: 'Río Cuarto', region: 'Córdoba', lat: -33.13, lon: -64.35 },
  { name: 'Villa General Belgrano', region: 'Córdoba', lat: -31.98, lon: -64.56 },
  { name: 'Mina Clavero', region: 'Córdoba', lat: -31.72, lon: -65.0, dark: true },
  { name: 'Bosque Alegre (observatorio)', region: 'Córdoba', lat: -31.6, lon: -64.55, dark: true },
  { name: 'Paraná', region: 'Entre Ríos', lat: -31.73, lon: -60.53 },
  { name: 'Concordia', region: 'Entre Ríos', lat: -31.39, lon: -58.02 },
  { name: 'Gualeguaychú', region: 'Entre Ríos', lat: -33.01, lon: -58.52 },
  { name: 'Colón', region: 'Entre Ríos', lat: -32.22, lon: -58.14 },
  { name: 'Mendoza', region: 'Mendoza', lat: -32.89, lon: -68.84 },
  { name: 'San Rafael', region: 'Mendoza', lat: -34.62, lon: -68.33 },
  { name: 'Uspallata', region: 'Mendoza', lat: -32.59, lon: -69.35, dark: true },
  { name: 'Malargüe', region: 'Mendoza', lat: -35.47, lon: -69.58, dark: true },
  { name: 'San Juan', region: 'San Juan', lat: -31.54, lon: -68.53 },
  { name: 'Barreal', region: 'San Juan', lat: -31.65, lon: -69.47, dark: true },
  { name: 'El Leoncito (CASLEO)', region: 'San Juan', lat: -31.8, lon: -69.3, dark: true },
  { name: 'Ischigualasto', region: 'San Juan', lat: -30.16, lon: -67.84, dark: true },
  { name: 'San Luis', region: 'San Luis', lat: -33.3, lon: -66.34 },
  { name: 'Merlo', region: 'San Luis', lat: -32.34, lon: -65.01, dark: true },
  { name: 'La Rioja', region: 'La Rioja', lat: -29.41, lon: -66.86 },
  { name: 'Talampaya', region: 'La Rioja', lat: -29.8, lon: -67.84, dark: true },
  { name: 'Catamarca', region: 'Catamarca', lat: -28.47, lon: -65.78 },
  { name: 'Fiambalá', region: 'Catamarca', lat: -27.69, lon: -67.62, dark: true },
  { name: 'Tucumán', region: 'Tucumán', lat: -26.82, lon: -65.22 },
  { name: 'Tafí del Valle', region: 'Tucumán', lat: -26.85, lon: -65.71, dark: true },
  { name: 'Santiago del Estero', region: 'Santiago del Estero', lat: -27.78, lon: -64.26 },
  { name: 'Salta', region: 'Salta', lat: -24.79, lon: -65.41 },
  { name: 'Cafayate', region: 'Salta', lat: -26.07, lon: -65.98, dark: true },
  { name: 'Cachi', region: 'Salta', lat: -25.12, lon: -66.16, dark: true },
  { name: 'San Antonio de los Cobres', region: 'Salta', lat: -24.22, lon: -66.32, dark: true },
  { name: 'Jujuy', region: 'Jujuy', lat: -24.19, lon: -65.3 },
  { name: 'Purmamarca', region: 'Jujuy', lat: -23.74, lon: -65.5, dark: true },
  { name: 'Tilcara', region: 'Jujuy', lat: -23.58, lon: -65.4, dark: true },
  { name: 'Humahuaca', region: 'Jujuy', lat: -23.2, lon: -65.35, dark: true },
  { name: 'Resistencia', region: 'Chaco', lat: -27.46, lon: -58.98 },
  { name: 'Corrientes', region: 'Corrientes', lat: -27.47, lon: -58.83 },
  { name: 'Esteros del Iberá', region: 'Corrientes', lat: -28.54, lon: -57.17, dark: true },
  { name: 'Posadas', region: 'Misiones', lat: -27.37, lon: -55.9 },
  { name: 'Puerto Iguazú', region: 'Misiones', lat: -25.6, lon: -54.57 },
  { name: 'Formosa', region: 'Formosa', lat: -26.18, lon: -58.17 },
  { name: 'Santa Rosa', region: 'La Pampa', lat: -36.62, lon: -64.29 },
  { name: 'Parque Nacional Lihué Calel', region: 'La Pampa', lat: -38.0, lon: -65.6, dark: true },
  { name: 'Neuquén', region: 'Neuquén', lat: -38.95, lon: -68.06 },
  { name: 'San Martín de los Andes', region: 'Neuquén', lat: -40.16, lon: -71.35 },
  { name: 'Villa La Angostura', region: 'Neuquén', lat: -40.76, lon: -71.65 },
  { name: 'Bariloche', region: 'Río Negro', lat: -41.13, lon: -71.31 },
  { name: 'El Bolsón', region: 'Río Negro', lat: -41.96, lon: -71.53, dark: true },
  { name: 'Viedma', region: 'Río Negro', lat: -40.81, lon: -63.0 },
  { name: 'Las Grutas', region: 'Río Negro', lat: -40.8, lon: -65.08 },
  { name: 'Rawson', region: 'Chubut', lat: -43.3, lon: -65.1 },
  { name: 'Puerto Madryn', region: 'Chubut', lat: -42.77, lon: -65.04 },
  { name: 'Trelew', region: 'Chubut', lat: -43.25, lon: -65.31 },
  { name: 'Esquel', region: 'Chubut', lat: -42.91, lon: -71.32 },
  { name: 'Comodoro Rivadavia', region: 'Chubut', lat: -45.86, lon: -67.48 },
  { name: 'Río Gallegos', region: 'Santa Cruz', lat: -51.62, lon: -69.22 },
  { name: 'El Calafate', region: 'Santa Cruz', lat: -50.34, lon: -72.27, dark: true },
  { name: 'El Chaltén', region: 'Santa Cruz', lat: -49.33, lon: -72.89, dark: true },
  { name: 'Ushuaia', region: 'Tierra del Fuego', lat: -54.8, lon: -68.3 },
  { name: 'Río Grande', region: 'Tierra del Fuego', lat: -53.79, lon: -67.71 },
  // Países vecinos
  { name: 'Montevideo', region: 'Uruguay', lat: -34.9, lon: -56.16 },
  { name: 'Colonia del Sacramento', region: 'Uruguay', lat: -34.47, lon: -57.84 },
  { name: 'Punta del Este', region: 'Uruguay', lat: -34.96, lon: -54.95 },
  { name: 'Cabo Polonio', region: 'Uruguay', lat: -34.4, lon: -53.78, dark: true },
  { name: 'Salto', region: 'Uruguay', lat: -31.39, lon: -57.96 },
  { name: 'Santiago', region: 'Chile', lat: -33.45, lon: -70.67 },
  { name: 'Valparaíso', region: 'Chile', lat: -33.05, lon: -71.62 },
  { name: 'La Serena', region: 'Chile', lat: -29.9, lon: -71.25 },
  { name: 'Vicuña (Valle del Elqui)', region: 'Chile', lat: -30.03, lon: -70.71, dark: true },
  { name: 'San Pedro de Atacama', region: 'Chile', lat: -22.91, lon: -68.2, dark: true },
  { name: 'Antofagasta', region: 'Chile', lat: -23.65, lon: -70.4 },
  { name: 'Puerto Montt', region: 'Chile', lat: -41.47, lon: -72.94 },
  { name: 'Punta Arenas', region: 'Chile', lat: -53.16, lon: -70.91 },
  { name: 'Asunción', region: 'Paraguay', lat: -25.26, lon: -57.58 },
  { name: 'La Paz', region: 'Bolivia', lat: -16.5, lon: -68.15 },
  { name: 'Salar de Uyuni', region: 'Bolivia', lat: -20.13, lon: -67.49, dark: true },
  { name: 'Santa Cruz de la Sierra', region: 'Bolivia', lat: -17.78, lon: -63.18 },
  { name: 'São Paulo', region: 'Brasil', lat: -23.55, lon: -46.63 },
  { name: 'Río de Janeiro', region: 'Brasil', lat: -22.91, lon: -43.17 },
  { name: 'Florianópolis', region: 'Brasil', lat: -27.6, lon: -48.55 },
  { name: 'Porto Alegre', region: 'Brasil', lat: -30.03, lon: -51.23 },
  { name: 'Brasilia', region: 'Brasil', lat: -15.79, lon: -47.88 },
  { name: 'Salvador', region: 'Brasil', lat: -12.97, lon: -38.5 },
  { name: 'Lima', region: 'Perú', lat: -12.05, lon: -77.04 },
  { name: 'Cusco', region: 'Perú', lat: -13.53, lon: -71.97 },
  { name: 'Quito', region: 'Ecuador', lat: -0.18, lon: -78.47 },
  { name: 'Bogotá', region: 'Colombia', lat: 4.71, lon: -74.07 },
  { name: 'Medellín', region: 'Colombia', lat: 6.24, lon: -75.58 },
  { name: 'Caracas', region: 'Venezuela', lat: 10.48, lon: -66.9 },
  { name: 'Ciudad de Panamá', region: 'Panamá', lat: 8.98, lon: -79.52 },
  { name: 'San José', region: 'Costa Rica', lat: 9.93, lon: -84.08 },
  { name: 'Ciudad de México', region: 'México', lat: 19.43, lon: -99.13 },
  { name: 'Guadalajara', region: 'México', lat: 20.67, lon: -103.35 },
  { name: 'Monterrey', region: 'México', lat: 25.69, lon: -100.32 },
  { name: 'La Habana', region: 'Cuba', lat: 23.11, lon: -82.37 },
  // Resto del mundo
  { name: 'Madrid', region: 'España', lat: 40.42, lon: -3.7 },
  { name: 'Barcelona', region: 'España', lat: 41.39, lon: 2.17 },
  { name: 'La Palma (Roque de los Muchachos)', region: 'España', lat: 28.76, lon: -17.88, dark: true },
  { name: 'Lisboa', region: 'Portugal', lat: 38.72, lon: -9.14 },
  { name: 'París', region: 'Francia', lat: 48.86, lon: 2.35 },
  { name: 'Roma', region: 'Italia', lat: 41.9, lon: 12.5 },
  { name: 'Berlín', region: 'Alemania', lat: 52.52, lon: 13.4 },
  { name: 'Londres', region: 'Reino Unido', lat: 51.51, lon: -0.13 },
  { name: 'Ámsterdam', region: 'Países Bajos', lat: 52.37, lon: 4.9 },
  { name: 'Nueva York', region: 'Estados Unidos', lat: 40.71, lon: -74.01 },
  { name: 'Miami', region: 'Estados Unidos', lat: 25.76, lon: -80.19 },
  { name: 'Los Ángeles', region: 'Estados Unidos', lat: 34.05, lon: -118.24 },
  { name: 'Toronto', region: 'Canadá', lat: 43.65, lon: -79.38 },
  { name: 'Tokio', region: 'Japón', lat: 35.68, lon: 139.69 },
  { name: 'Sídney', region: 'Australia', lat: -33.87, lon: 151.21 },
  { name: 'Auckland', region: 'Nueva Zelanda', lat: -36.85, lon: 174.76 },
  { name: 'Lake Tekapo', region: 'Nueva Zelanda', lat: -44.0, lon: 170.48, dark: true },
  { name: 'Ciudad del Cabo', region: 'Sudáfrica', lat: -33.92, lon: 18.42 },
];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function searchCities(q: string, limit = 8): City[] {
  const n = norm(q.trim());
  if (!n) return [];
  const starts = CITIES.filter((c) => norm(c.name).startsWith(n));
  const contains = CITIES.filter((c) => !starts.includes(c) && (norm(c.name).includes(n) || norm(c.region).includes(n)));
  return [...starts, ...contains].slice(0, limit);
}

/** Distancia en km (haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Nombre para unas coordenadas: la ciudad más cercana si está a menos de 40 km. */
export function nearestCity(lat: number, lon: number): City | null {
  let best: City | null = null;
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = distanceKm({ lat, lon }, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD <= 40 ? best : null;
}

export const DARK_SITES = CITIES.filter((c) => c.dark);
