const SHELL_CACHE = 'bruno-mars-shell-v2';
const RUNTIME_CACHE = 'bruno-mars-runtime-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/admin-secret',
  '/admin-secret/dashboard',
  '/admin-secret/events',
  '/admin-secret/bookings',
  '/admin-secret/payment-settings',
  '/site.webmanifest',
  '/admin.webmanifest',
  '/icons/admin-icon-192.png',
  '/icons/admin-icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  const allowedCaches = [SHELL_CACHE, RUNTIME_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!allowedCaches.includes(key)) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cachedResponse = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, cachedResponse);
          });
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }
          return caches.match('/index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkResponse = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    })
  );
});
