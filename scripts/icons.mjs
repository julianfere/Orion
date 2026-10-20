// Genera los íconos PNG de la app a partir del glifo de Orión del canvas.
import sharp from 'sharp';

const glyph = (scale, cx, cy, mono = false, k = 0.62) => {
  const gold = mono ? '#fff' : '#F4C76A';
  const t = `translate(${cx} ${cy}) scale(${scale}) translate(-14 -14.15)`;
  return `<g transform="${t}">
    <path d="M14.1 25.9L20.1 22.9L15.8 11.7L14.4 12.6L13.2 13.6L11.1 21.6L14.1 25.9M15.8 11.7L17.9 2.4M13.2 13.6L7.9 4.2" fill="none" stroke="${mono ? '#fff' : '#AFC3FF'}" stroke-opacity="${mono ? 1 : 0.55}" stroke-width="0.55" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="20.1" cy="22.9" r="${(1.6*k).toFixed(2)}" fill="${mono ? '#fff' : '#FFB27A'}"/>
    <circle cx="11.1" cy="21.6" r="${(1.2*k).toFixed(2)}" fill="${mono ? '#fff' : '#DCE6FF'}"/>
    <circle cx="14.1" cy="25.9" r="${(0.75*k).toFixed(2)}" fill="${mono ? '#fff' : '#DCE6FF'}"/>
    <circle cx="13.2" cy="13.6" r="${(1.05*k).toFixed(2)}" fill="${gold}"/>
    <circle cx="14.4" cy="12.6" r="${(1.15*k).toFixed(2)}" fill="${gold}"/>
    <circle cx="15.8" cy="11.7" r="${(1.1*k).toFixed(2)}" fill="${gold}"/>
    <circle cx="17.9" cy="2.4" r="${(1.05*k).toFixed(2)}" fill="${mono ? '#fff' : '#DCE6FF'}"/>
    <circle cx="7.9" cy="4.2" r="${(1.7*k).toFixed(2)}" fill="${mono ? '#fff' : '#BFD4FF'}"/>
  </g>`;
};

const icon = (size, { pad, round }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#121A3A"/><stop offset="1" stop-color="#070A14"/></radialGradient></defs>
  <rect width="${size}" height="${size}" rx="${round ? size * 0.22 : 0}" fill="url(#g)"/>
  ${glyph((size * (1 - pad * 2)) / 24, size / 2, size / 2)}
</svg>`;

const out = [
  ['public/icons/icon-192.png', 192, { pad: 0.12, round: true }],
  ['public/icons/icon-512.png', 512, { pad: 0.12, round: true }],
  ['public/icons/maskable-512.png', 512, { pad: 0.24, round: false }],
  ['public/icons/apple-touch-icon.png', 180, { pad: 0.16, round: false }],
];
for (const [file, size, opts] of out) await sharp(Buffer.from(icon(size, opts))).png().toFile(file);

// Ícono monocromo para la barra de estado de Android (solo cuenta el canal alfa).
const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${glyph(3.4, 48, 48, true, 0.9)}</svg>`;
await sharp(Buffer.from(badge)).png().toFile('public/icons/badge-96.png');
console.log('íconos listos');
