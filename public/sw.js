const CACHE_NAME = 'holylink-pwa-v12-controlled-updates';
const MAX_ENTRIES = 120;
const urlsToCache = ['/', '/index.html', '/pwa-bootstrap.js', '/manifest.json', '/brand/hl-symbol-20261014.webp', '/brand/hl-text-20261014.webp', '/brand/hl-full-20261014.webp', '/pwa/local-symbol-dark-192.png', '/pwa/local-symbol-dark-512.png'];
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('install', event => {
  // Do not replace a running operator session until its user explicitly updates.
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    await Promise.all(urlsToCache.map(async url => { try { await cache.add(url); } catch { /* Retry when requested online. */ } }));
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('holylink-pwa-') && name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
async function remember(request, response) {
  if (!response.ok || response.type === 'opaque') return;
  const copy = response.clone();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, copy);
  const keys = await cache.keys();
  // Preserve the cached entry document while bounding runtime assets.
  const removable = keys.filter(key => !urlsToCache.some(path => new URL(path, self.location.origin).href === key.url));
  for (const key of removable.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) await cache.delete(key);
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          // Never store share tokens or arbitrary navigation queries as cache keys.
          event.waitUntil(remember('/index.html', response).catch(() => {}));
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/index.html')) || (await cache.match('/')) || new Response('HolyLink indisponível offline. Conecte-se para carregar o aplicativo.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }
  // Bible/API/P2P traffic has its own policy; never cache arbitrary remote responses.
  const asset = /^\/(assets|brand|pwa)\//.test(url.pathname) || ['/pwa-bootstrap.js','/manifest.json'].includes(url.pathname);
  if (!asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      event.waitUntil(remember(event.request, response).catch(() => {}));
      return response;
    } catch { return (await cache.match(event.request)) || new Response('', { status: 503 }); }
  })());
});
