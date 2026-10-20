// Código del service worker. Sin backticks ni ${} adentro: va dentro de un String.raw.
export const SW_SOURCE = String.raw`// Service worker de Orion. La ruta /sw.js antepone la constante VERSION con el id del build.
const SHELL = "orion-shell-" + VERSION;
const STATIC = 'orion-static-v1';
const PAGES = ['/', '/bienvenida', '/luna', '/viajes', '/alertas', '/evento'];
// Sin barras invertidas a propósito: este código viaja dentro de un String.raw.
const ASSET_RE = new RegExp('/_next/static/[A-Za-z0-9_.~%/-]+', 'g');

// Guarda las páginas y todos los archivos de /_next/static que referencian, así la app abre sin red.
async function precache() {
  const shell = await caches.open(SHELL);
  const stat = await caches.open(STATIC);
  const assets = new Set(['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']);
  await Promise.all(PAGES.map(async (p) => {
    const res = await fetch(p, { cache: 'reload' });
    if (!res.ok) return;
    const html = await res.clone().text();
    for (const m of html.matchAll(ASSET_RE)) assets.add(m[0]);
    await shell.put(p, res);
  }));
  await Promise.all([...assets].map(async (a) => {
    if (await stat.match(a)) return;
    try { const r = await fetch(a); if (r.ok) await (a.startsWith('/_next/') ? stat : shell).put(a, r); } catch {}
  }));
}

self.addEventListener('install', (e) => e.waitUntil(precache()));

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('orion-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Archivos con hash: nunca cambian.
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // Páginas: primero la red; sin conexión, la copia guardada (sin importar el ?query).
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && PAGES.includes(url.pathname)) caches.open(SHELL).then((c) => c.put(url.pathname, res.clone()));
      return res;
    }).catch(async () => (await caches.match(url.pathname, { ignoreSearch: true })) || (await caches.match('/'))));
    return;
  }

  // Íconos, manifest y lo demás: lo guardado, y se refresca de fondo.
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => {
      if (res.ok) caches.open(SHELL).then((c) => c.put(req, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(data.title || 'Orion', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag,
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || '/', location.origin).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if (!c.url.startsWith(location.origin)) continue;
      // Se navega antes de enfocar, así el toque lleva al evento y no a donde estabas.
      return ('navigate' in c ? c.navigate(target) : Promise.resolve(c)).then((w) => (w || c).focus());
    }
    return clients.openWindow(target);
  }));
});
`;
