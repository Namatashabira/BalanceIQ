const CACHE_NAME = 'oraka-v4';
const RUNTIME_CACHE = 'oraka-runtime-v4';
const API_CACHE = 'oraka-api-v4';

// Derive base path from SW location (e.g. '/BalanceIQ/' or '/')
const BASE = self.registration.scope;

// Only precache the SW's own scope root — avoids 404s on missing files
const PRECACHE_URLS = [BASE, `${BASE}index.html`].filter(Boolean);

// API origins to cache GET responses from
const API_ORIGINS = [
  'https://web-production-36021.up.railway.app',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
];
const isApiRequest = (url) =>
  API_ORIGINS.some((o) => url.origin === o) || url.pathname.startsWith('/api/');

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll fails if any URL 404s — use individual add() with catch instead
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const valid = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => !valid.includes(n)).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Offline mutation queuing (POST / PATCH / PUT / DELETE to API) ──────────
  if (request.method !== 'GET' && isApiRequest(url)) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        // Store the failed mutation in IndexedDB queue via the page
        const body = await request.clone().text().catch(() => null);
        const token = null; // token is added at flush time from localStorage
        await saveToQueue({
          method: request.method,
          url: request.url,
          body: body ? JSON.parse(body) : null,
          headers: Object.fromEntries(request.headers.entries()),
        });
        return new Response(
          JSON.stringify({ offline: true, queued: true }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // ── API GET — network first, cache fallback ────────────────────────────────
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ offline: true, cached: false }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              })
          )
        )
    );
    return;
  }

  // ── Static assets — cache first ───────────────────────────────────────────
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // ── HTML documents — network first, offline fallback ─────────────────────
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(`${BASE}offline.html`) || caches.match(BASE))
        )
    );
    return;
  }

  // ── Default ───────────────────────────────────────────────────────────────
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-queue') {
    event.waitUntil(flushQueueFromSW());
  }
});

// ── Message from page ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'FLUSH_QUEUE') {
    flushQueueFromSW().then((count) => {
      event.source?.postMessage({ type: 'FLUSH_DONE', count });
    });
  }
});

// ── IndexedDB helpers (SW context) ────────────────────────────────────────────
const DB_NAME = 'orakaOfflineDB';
const DB_VERSION = 4;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      ['orders', 'products', 'analytics', 'settings', 'customers', 'receipts', 'forecast', 'accounting', 'sales', 'inventory', 'queue'].forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id', autoIncrement: name === 'queue' });
        }
      });
    };
  });
}

async function saveToQueue(mutation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').add({ ...mutation, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueueFromSW() {
  const db = await openDB();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const req = tx.objectStore('queue').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  let flushed = 0;
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...(item.headers || {}) },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      if (res.ok || res.status < 500) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('queue', 'readwrite');
          tx.objectStore('queue').delete(item.id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        flushed++;
      }
    } catch {
      break;
    }
  }

  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: 'SYNC_COMPLETE', flushed }));
  return flushed;
}
