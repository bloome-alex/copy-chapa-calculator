// CopyChapaCalculator — Service Worker
const APP_VERSION = '2026.05.21.1';
const CACHE_NAME = `copychapa-v${APP_VERSION}`;
const ASSETS = [
  './index.html',
  `./app.js?v=${APP_VERSION}`,
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cachear assets principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear assets locales (los de fuentes pueden fallar, ignoramos el error)
      return cache.addAll(ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first para HTML, cache-first para assets propios versionados.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo manejar GET
  if (event.request.method !== 'GET') return;

  if (url.origin === location.origin) {
    if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
      event.respondWith(
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
          }
          return response;
        }).catch(() => caches.match('./index.html'))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Estrategia Network-first para recursos externos (fuentes, etc.)
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// Notificaciones push
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./index.html'));
});
