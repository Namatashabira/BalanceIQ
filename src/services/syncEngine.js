/**
 * syncEngine.js — Server ↔ Local mirror sync.
 *
 * Strategy:
 *   1. Full snapshot on login (or if never synced)
 *   2. Delta sync every 5 min (only records updated since last sync)
 *   3. Flush mutation queue when back online
 *   4. All data is scoped to the authenticated tenant
 */

import axios from 'axios';
import * as store from './localStore';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

// Endpoints to mirror — only include endpoints that actually exist on the backend.
// Skipped: inventory (404), sales/dashboard (not a list), analytics (admin-only 404)
const ENDPOINTS = {
  orders:    '/core/orders/',
  products:  '/products/',
  customers: '/core/customers/',
  settings:  '/core/configuration/',
  receipts:  '/core/receipts/',
};

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function tenantId() {
  return store.getTenantId();
}

// ── Pull one endpoint and store locally ───────────────────────────────────────
async function pullTable(table, endpoint, since = null) {
  try {
    const params = since ? { updated_since: since } : {};
    const res = await axios.get(`${API}${endpoint}`, {
      headers: authHeaders(),
      params,
      timeout: 15000,
    });

    const raw = res.data;

    // Normalise: some endpoints return { results: [] }, some return []
    let records = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.results)
      ? raw.results
      : raw && typeof raw === 'object'
      ? [{ id: table, ...raw }]   // single-object endpoints (analytics, settings)
      : [];

    if (records.length > 0) {
      await store.bulkUpsert(table, records);
    }
    return records.length;
  } catch (err) {
    // Network error — silently skip, local data stays intact
    if (!navigator.onLine || err.code === 'ECONNABORTED') return 0;
    console.warn(`[sync] Failed to pull ${table}:`, err.message);
    return 0;
  }
}

// ── Full snapshot (login / first run) ────────────────────────────────────────
export async function fullSync() {
  if (!navigator.onLine) return { ok: false, reason: 'offline' };

  const tid = tenantId();
  const results = {};

  for (const [table, endpoint] of Object.entries(ENDPOINTS)) {
    results[table] = await pullTable(table, endpoint, null);
  }

  const now = new Date().toISOString();
  await store.setMeta(`lastSync:${tid}`, now);
  await store.setMeta(`lastFullSync:${tid}`, now);

  window.dispatchEvent(new CustomEvent('sync:full', { detail: results }));
  return { ok: true, results };
}

// ── Delta sync (only changed records) ────────────────────────────────────────
export async function deltaSync() {
  if (!navigator.onLine) return { ok: false, reason: 'offline' };

  const tid = tenantId();
  const since = await store.getMeta(`lastSync:${tid}`);

  // If never synced, do a full sync instead
  if (!since) return fullSync();

  const results = {};
  for (const [table, endpoint] of Object.entries(ENDPOINTS)) {
    results[table] = await pullTable(table, endpoint, since);
  }

  await store.setMeta(`lastSync:${tid}`, new Date().toISOString());
  window.dispatchEvent(new CustomEvent('sync:delta', { detail: results }));
  return { ok: true, results };
}

// ── Flush pending mutations then delta sync ───────────────────────────────────
export async function syncOnReconnect() {
  const flushed = await store.flushQueue();
  const syncResult = await deltaSync();
  window.dispatchEvent(new CustomEvent('sync:reconnect', { detail: { flushed, ...syncResult } }));
  return { flushed, ...syncResult };
}

// ── Wrap an API call with offline fallback ────────────────────────────────────
/**
 * Makes a network request. If offline, queues the mutation and returns
 * the local cached data instead of throwing.
 *
 * @param {'GET'|'POST'|'PATCH'|'PUT'|'DELETE'} method
 * @param {string} url  Full URL
 * @param {object} [body]
 * @param {string} [localTable]  If provided, returns local data on GET failure
 */
export async function apiWithFallback(method, url, body = null, localTable = null) {
  try {
    const res = await axios({ method, url, data: body, headers: authHeaders(), timeout: 10000 });
    // Cache successful GET responses
    if (method === 'GET' && localTable && res.data) {
      const records = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [{ id: localTable, ...res.data }];
      await store.bulkUpsert(localTable, records);
    }
    return res.data;
  } catch (err) {
    if (!navigator.onLine || err.code === 'ECONNABORTED' || !err.response) {
      // Offline — queue mutations, return local data for reads
      if (method !== 'GET') {
        await store.enqueue({ method, url, body });
        return { offline: true, queued: true };
      }
      if (localTable) {
        return store.getAll(localTable);
      }
    }
    throw err;
  }
}
