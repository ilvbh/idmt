// Offline service worker: serves the saved copy instantly and refreshes it in the background
// whenever there is a connection. Bump VERSION only if you want to force a clean re-download.
const VERSION = 'relay-calc-v3';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(e.request, { ignoreSearch: true }).then((hit) => {
        const network = fetch(e.request)
          .then((res) => { if (res && res.ok) cache.put(e.request, res.clone()); return res; })
          .catch(() => null);
        e.waitUntil(network);
        return hit || network.then((res) => res || cache.match('./index.html'));
      })
    )
  );
});
