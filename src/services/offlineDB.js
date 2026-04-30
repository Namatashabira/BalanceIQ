/**
 * offlineDB.js — Unified IndexedDB wrapper for offline-first storage.
 *
 * Stores:
 *  - orders       : cached order list
 *  - products     : cached product list
 *  - analytics    : cached analytics snapshot
 *  - settings     : cached settings
 *  - queue        : pending mutations to replay when back online
 */

const DB_NAME = 'orakaOfflineDB';
const DB_VERSION = 4; // bumped: adds sales, inventory stores

const STORES = ['orders', 'products', 'analytics', 'settings', 'customers', 'receipts', 'forecast', 'accounting', 'sales', 'inventory', 'queue'];

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id', autoIncrement: name === 'queue' });
        }
      });
    };
  });
}

/** Save a single record (or replace) in a store. */
export async function dbPut(store, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Save an array of records (replaces all). */
export async function dbPutAll(store, records) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    os.clear();
    records.forEach((r) => os.put(r));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all records from a store. */
export async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Get a single record by key. */
export async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Delete a record by key. */
export async function dbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Clear all records in a store. */
export async function dbClear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Mutation Queue ────────────────────────────────────────────────────────────

/**
 * Enqueue a mutation to be replayed when back online.
 * @param {{ method: string, url: string, body: any, headers: object }} mutation
 */
export async function enqueueRequest(mutation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').add({ ...mutation, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all queued mutations. */
export async function getQueue() {
  return dbGetAll('queue');
}

/** Remove a queued mutation by its auto-incremented id. */
export async function dequeueRequest(id) {
  return dbDelete('queue', id);
}

/** Replay all queued mutations against the network, then clear them. */
export async function flushQueue() {
  const items = await getQueue();
  if (!items.length) return 0;

  let flushed = 0;
  for (const item of items) {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(item.headers || {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      await dequeueRequest(item.id);
      flushed++;
    } catch {
      break; // stop on first failure — will retry next time online
    }
  }
  return flushed;
}
