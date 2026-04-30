/**
 * localStore.js — Unified offline storage adapter.
 *
 * Automatically routes to:
 *   - window.sqliteAPI  (Electron desktop → SQLite via better-sqlite3)
 *   - offlineDB         (PWA / browser    → IndexedDB)
 *
 * All methods are tenant-scoped. The tenantId is read from localStorage
 * ('activeTenant') unless explicitly passed.
 *
 * Usage:
 *   import * as store from './localStore';
 *   await store.getAll('orders');
 *   await store.bulkUpsert('products', products);
 *   await store.enqueue({ method: 'POST', url: '...', body: {...} });
 *   await store.flushQueue();
 */

import * as idb from './offlineDB';

// ── Platform detection ────────────────────────────────────────────────────────
export const isElectron = () => typeof window !== 'undefined' && !!window.sqliteAPI;

// ── Tenant resolution ─────────────────────────────────────────────────────────
export function getTenantId() {
  try {
    const t = localStorage.getItem('activeTenant');
    if (t) {
      const parsed = JSON.parse(t);
      return String(parsed.uuid || parsed.id || parsed);
    }
  } catch {}
  return 'default';
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getAll(table, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.getAll(table, tenantId);
  return idb.dbGetAll(table);
}

export async function getOne(table, id, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.getOne(table, tenantId, id);
  return idb.dbGet(table, id);
}

export async function upsert(table, record, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.upsert(table, tenantId, record);
  return idb.dbPut(table, record);
}

export async function bulkUpsert(table, records, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.bulkUpsert(table, tenantId, records);
  return idb.dbPutAll(table, records);
}

export async function remove(table, id, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.delete(table, tenantId, id);
  return idb.dbDelete(table, id);
}

export async function clearTable(table, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.clear(table, tenantId);
  return idb.dbClear(table);
}

// ── Meta (last-sync timestamps) ───────────────────────────────────────────────

export async function getMeta(key) {
  if (isElectron()) return window.sqliteAPI.getMeta(key);
  return localStorage.getItem(`meta:${key}`);
}

export async function setMeta(key, value) {
  if (isElectron()) return window.sqliteAPI.setMeta(key, value);
  localStorage.setItem(`meta:${key}`, String(value));
}

// ── Mutation Queue ────────────────────────────────────────────────────────────

export async function enqueue(mutation, tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.enqueue(tenantId, mutation);
  return idb.enqueueRequest(mutation);
}

export async function getQueue(tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.getQueue(tenantId);
  return idb.getQueue();
}

export async function dequeue(id) {
  if (isElectron()) return window.sqliteAPI.dequeue(id);
  return idb.dequeueRequest(id);
}

export async function queueCount(tenantId = getTenantId()) {
  if (isElectron()) return window.sqliteAPI.queueCount(tenantId);
  const q = await idb.getQueue();
  return q.length;
}

// ── Flush queue ───────────────────────────────────────────────────────────────

export async function flushQueue(tenantId = getTenantId()) {
  if (isElectron()) {
    const token = localStorage.getItem('accessToken');
    const result = await window.sqliteAPI.flushQueue(tenantId, token);
    return result.flushed;
  }
  return idb.flushQueue();
}
