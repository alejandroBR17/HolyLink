const CACHE_NAME = 'holylink-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through without forcing cache since Vite app takes care of assets usually,
  // but we can serve offline fallback if needed.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          // Offline fallback
          return caches.match('/');
        });
      })
  );
});
