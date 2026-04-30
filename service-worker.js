const CACHE_NAME = 'oraka-v2';
const RUNTIME_CACHE = 'oraka-runtime';

// Files to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests - let them pass through untouched
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin API requests entirely - never cache authenticated/tenant data
  if (url.origin !== self.location.origin) {
    return;
  }

  // Static assets - Cache first, then network
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response.ok) return response;
          const toCache = response.clone(); // clone BEFORE returning
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, toCache));
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - Network first, cache fallback
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response.ok) return response;
          const toCache = response.clone(); // clone BEFORE returning
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, toCache));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default - Network first, cache fallback (same-origin only)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingRequests('/api/orders/'));
  }
  if (event.tag === 'sync-inventory') {
    event.waitUntil(syncPendingRequests('/api/inventory/'));
  }
});

async function syncPendingRequests(pathPrefix) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    for (const req of requests) {
      if (req.url.includes(pathPrefix)) {
        try {
          await fetch(req);
          await cache.delete(req);
        } catch (e) {
          console.log('Sync failed for:', req.url, e);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
