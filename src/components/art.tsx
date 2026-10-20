// Dibujos del cielo: Luna por fase, campo de estrellas y la constelación de Orión.
import type { CSSProperties } from 'react';

// ── Luna ────────────────────────────────────────────────────────────────────

/** Silueta iluminada en un círculo de radio 88 centrado en (100,100). Tal cual el canvas. */
export function moonPath(fraction: number, waxing: boolean) {
  if (fraction < 0.01) return 'M0,0';
  const r = 88, c = 100, rx = Math.abs(2 * fraction - 1) * r;
  const top = `${c},${c - r}`, bot = `${c},${c + r}`;
  if (waxing) return `M${top} A${r},${r} 0 0 0 ${bot} A${rx.toFixed(1)},${r} 0 0 ${fraction >= 0.5 ? 0 : 1} ${top} Z`;
  return `M${top} A${r},${r} 0 0 1 ${bot} A${rx.toFixed(1)},${r} 0 0 ${fraction >= 0.5 ? 1 : 0} ${top} Z`;
}

/**
 * La Luna como se ve desde el hemisferio del usuario: en el sur la creciente se ilumina a la
 * izquierda; en el norte, a la derecha (se espeja el dibujo).
 */
export function MoonGlyph({ fraction, waxing, south, size, dark = '#2A3250', craters = false, className, label }: {
  fraction: number; waxing: boolean; south: boolean; size: number; dark?: string; craters?: boolean; className?: string; label?: string;
}) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 200 200" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="100" cy="100" r="88" fill={dark} />
      <g transform={south ? undefined : 'translate(200,0) scale(-1,1)'}>
        <path d={moonPath(fraction, waxing)} fill="#F3E9CF" />
      </g>
      {craters && (
        <g fill="#000">
          <circle cx="78" cy="70" r="10" fillOpacity=".06" />
          <circle cx="120" cy="120" r="16" fillOpacity=".05" />
          <circle cx="70" cy="128" r="7" fillOpacity=".06" />
        </g>
      )}
    </svg>
  );
}

// ── Estrellas ───────────────────────────────────────────────────────────────

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TINTS = ['#FFFFFF', '#FFFFFF', '#DCE6FF', '#C9D6FF', '#FFE9C7'];

/** Estrellas al azar pero siempre las mismas para una semilla (no cambian entre renders). */
export function Stars({ w, h, count, seed }: { w: number; h: number; count: number; seed: number }) {
  const r = rng(seed);
  const stars = Array.from({ length: count }, (_, i) => {
    const big = r();
    const rad = big > 0.88 ? 1 + r() * 0.7 : big > 0.55 ? 0.45 + r() * 0.5 : 0.35;
    return { i, x: r() * w, y: r() * h, rad, fill: TINTS[Math.floor(r() * TINTS.length)], cls: rad > 0.4 ? `tw${1 + (i % 3)}` : undefined, op: 0.4 + rad * 0.35 };
  });
  return (
    <>
      {stars.map((s) => (
        <circle key={s.i} className={s.cls} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.rad.toFixed(2)} fill={s.fill} opacity={Math.min(0.95, s.op).toFixed(2)} />
      ))}
    </>
  );
}

export const GlowDef = ({ id }: { id: string }) => (
  <defs>
    <radialGradient id={id}>
      <stop offset="0" stopColor="#DCE6FF" stopOpacity=".9" />
      <stop offset=".35" stopColor="#9DB6FF" stopOpacity=".25" />
      <stop offset="1" stopColor="#9DB6FF" stopOpacity="0" />
    </radialGradient>
  </defs>
);

// ── Orión ───────────────────────────────────────────────────────────────────

// Coordenadas del canvas (Bienvenida, 390 × 520), Orión como se ve desde el sur: cabeza abajo.
const ORION = {
  stars: [
    { x: 266.2, y: 346.3, r: 2.93, color: '#FFB27A', glow: 9.4, spark: true, name: 'Betelgeuse', lx: 266.2, ly: 372, anchor: 'middle' },
    { x: 168.5, y: 332.6, r: 2.24, color: '#DCE6FF', glow: 7.2 },
    { x: 201.0, y: 379.1, r: 1.17, color: '#DCE6FF', glow: 3.8 },
    { x: 190.9, y: 246.1, r: 1.88, color: '#DCE6FF', glow: 6.0 },
    { x: 204.5, y: 234.4, r: 2.21, color: '#DCE6FF', glow: 7.1 },
    { x: 219.4, y: 224.8, r: 2.16, color: '#DCE6FF', glow: 6.9 },
    { x: 242.1, y: 124.3, r: 1.96, color: '#DCE6FF', glow: 6.3 },
    { x: 134.1, y: 143.4, r: 3.15, color: '#BFD4FF', glow: 10.1, spark: true, name: 'Rigel', lx: 122, ly: 147.4, anchor: 'end' },
  ],
  lines: [
    [201.0, 379.1, 266.2, 346.3], [201.0, 379.1, 168.5, 332.6], [266.2, 346.3, 219.4, 224.8], [168.5, 332.6, 190.9, 246.1],
    [190.9, 246.1, 204.5, 234.4], [204.5, 234.4, 219.4, 224.8], [219.4, 224.8, 242.1, 124.3], [190.9, 246.1, 134.1, 143.4],
  ],
};

/** Orión con nombres. `north` la da vuelta: desde el norte se ve con la cabeza arriba. */
export function OrionArt({ north = false, labels = true, belt = true, glowId = 'oglow' }: { north?: boolean; labels?: boolean; belt?: boolean; glowId?: string }) {
  return (
    <g transform={north ? 'rotate(180 200 250)' : undefined}>
      {ORION.lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} className="draw" pathLength={1} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#AFC3FF" strokeOpacity=".35" strokeWidth="0.8" strokeLinecap="round" />
      ))}
      {ORION.stars.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.glow} fill={`url(#${glowId})`} opacity={Math.min(0.9, s.glow / 11.6)} />
          {s.spark && (
            <g className="spark" style={{ transformOrigin: `${s.x}px ${s.y}px`, animationDelay: s.name === 'Rigel' ? '1.4s' : undefined } as CSSProperties}>
              <path d={`M${s.x - s.r * 5.5} ${s.y}H${s.x + s.r * 5.5}M${s.x} ${s.y - s.r * 5.5}V${s.y + s.r * 5.5}`} stroke={s.color} strokeOpacity=".55" strokeWidth="0.75" strokeLinecap="round" />
            </g>
          )}
          <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} />
          <circle cx={s.x} cy={s.y} r={s.r * 0.45} fill="#FFFFFF" />
        </g>
      ))}
      {labels && (
        <g fill="#C7CEE0" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing=".04em">
          {ORION.stars.filter((s) => s.name).map((s) => (
            <text key={s.name} x={s.lx} y={s.ly} textAnchor={s.anchor as 'middle' | 'end'} transform={north ? `rotate(180 ${s.lx} ${(s.ly ?? 0) - 4})` : undefined}>{s.name}</text>
          ))}
          {belt && <text x="178" y="264" textAnchor="end" transform={north ? 'rotate(180 178 260)' : undefined}>Las Tres Marías</text>}
        </g>
      )}
    </g>
  );
}

/** Orión chiquito (logo, ícono de notificación), en una caja de 28 × 28. */
export function OrionGlyph({ size = 30, color = '#F4C76A', lines = '#AFC3FF' }: { size?: number; color?: string; lines?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14.1 25.9L20.1 22.9L15.8 11.7L14.4 12.6L13.2 13.6L11.1 21.6L14.1 25.9M15.8 11.7L17.9 2.4M13.2 13.6L7.9 4.2" fill="none" stroke={lines} strokeOpacity=".55" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20.1" cy="22.9" r="1.6" fill="#FFB27A" />
      <circle cx="11.1" cy="21.6" r="1.2" fill="#DCE6FF" />
      <circle cx="14.1" cy="25.9" r="0.7" fill="#DCE6FF" />
      <circle cx="13.2" cy="13.6" r="1.05" fill={color} />
      <circle cx="14.4" cy="12.6" r="1.15" fill={color} />
      <circle cx="15.8" cy="11.7" r="1.1" fill={color} />
      <circle cx="17.9" cy="2.4" r="1.05" fill="#DCE6FF" />
      <circle cx="7.9" cy="4.2" r="1.7" fill="#BFD4FF" />
    </svg>
  );
}
