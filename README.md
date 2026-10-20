# Orion

PWA de eventos astronómicos: qué se ve esta noche desde tu ubicación, avisos push antes de cada evento y un planificador de viajes a cielos oscuros. Funciona sin conexión.

Diseño: canvas **Orion** (6 pantallas) y doc **Orion — Funcionalidades y botones** en claude.ai.

## Stack

- **Next 16** (App Router, Turbopack) + React 19, pnpm.
- **astronomy-engine**: todos los cálculos (fases, salida y puesta, posiciones, eclipses, oposiciones, conjunciones) corren en el dispositivo, así la app anda offline.
- **Push**: igual que en Cine (`web-push` + VAPID). El servidor guarda cada suscripción con su ubicación y sus preferencias de Alertas, y cada 5 minutos calcula qué avisos tocan.
- **Postgres** + Drizzle. Las migraciones corren solas al arrancar.
- **Open-Meteo** para la nubosidad (gratis, sin clave). Es lo único que necesita red.

## Deploy en Dokploy

1. Crear un servicio de tipo **Compose** apuntando a este repo (usa `docker-compose.yml`).
2. En *Environment*, poner al menos `POSTGRES_PASSWORD` (y `VAPID_EMAIL` con un mail real). Ver `.env.example`.
3. En *Domains*, asignarle un dominio al servicio `app`, puerto `3000`, con HTTPS. **El push solo funciona con HTTPS.**
4. Deploy.

No hace falta generar claves VAPID: si no están en el entorno, se generan en el primer arranque y quedan guardadas en la base. Si después las ponés a mano, las suscripciones existentes dejan de servir y cada dispositivo tiene que volver a activar los avisos.

## Desarrollo local

```bash
pnpm install
docker run -d --name orion-db -e POSTGRES_USER=orion -e POSTGRES_PASSWORD=orion -e POSTGRES_DB=orion -p 5432:5432 postgres:17-alpine
DATABASE_URL=postgres://orion:orion@localhost:5432/orion pnpm dev
```

Sin `DATABASE_URL`, la app anda igual pero sin avisos push.

- Cambios en `src/db/schema.ts` → `pnpm db:generate` para crear la migración.
- Íconos → `pnpm icons` (regenera `public/icons/` desde el glifo de Orión).

## Cómo está armado

| Dónde | Qué |
| --- | --- |
| `src/lib/astro/` | Motor astronómico: catálogo de lluvias, generador de eventos, línea de la noche |
| `src/lib/alerts.ts` | Reglas de avisos: qué eventos y cuándo. Lo usan la app y el servidor |
| `src/lib/store.ts` | Estado en el dispositivo (localStorage) |
| `src/lib/push-client.ts` | Suscripción push y sincronización de preferencias |
| `src/server/scheduler.ts` | Programador de avisos (cada 5 min, dentro del mismo proceso) |
| `src/sw/source.ts` | Service worker; `/sw.js` lo sirve con el id del build para que se actualice en cada deploy |

## Decisiones tomadas sobre los pendientes del doc

- **Nubes**: Open-Meteo. En Planificar viaje se muestra 3 días antes del evento.
- **Backend de push**: push con servidor. En la web no existen las notificaciones locales programadas.
- **Modo noche**: el interruptor de Alertas y el botón de la pantalla principal son el mismo ajuste.
- **Efemérides offline**: 6 meses desde hoy, recalculados al abrir.
- **"Para llevar"**: lista fija de 5 ítems.
- **Umbrales de instrumento**: hasta magnitud 5 ojo desnudo, hasta 7,5 binoculares, más débil telescopio. Coinciden con el design (Urano en binoculares, Neptuno en telescopio); conviene ajustarlos con pruebas reales.
