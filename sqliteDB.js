/**
 * sqliteDB.js — Electron main-process SQLite manager.
 * Runs in Node context (electron-main.js), never in the renderer.
 *
 * Tables mirror the server schema, scoped by tenant_id so each
 * user only ever reads their own data.
 */

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

function getDBPath() {
  return path.join(app.getPath('userData'), 'oraka.db');
}

function getDB() {
  if (db) return db;
  db = new Database(getDBPath());
  db.pragma('journal_mode = WAL');   // faster writes, safe concurrent reads
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

// ── Migrations ────────────────────────────────────────────────────────────────
function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,   -- full JSON blob
      updated_at  TEXT NOT NULL,
      synced      INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);

    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);

    CREATE TABLE IF NOT EXISTS customers (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

    CREATE TABLE IF NOT EXISTS inventory (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON inventory(tenant_id);

    CREATE TABLE IF NOT EXISTS analytics (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);

    CREATE TABLE IF NOT EXISTS receipts (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant_id);

    CREATE TABLE IF NOT EXISTS forecast (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_forecast_tenant ON forecast(tenant_id);

    CREATE TABLE IF NOT EXISTS accounting (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_accounting_tenant ON accounting(tenant_id);

    CREATE TABLE IF NOT EXISTS queue (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id   TEXT NOT NULL,
      method      TEXT NOT NULL,
      url         TEXT NOT NULL,
      body        TEXT,
      headers     TEXT,
      timestamp   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_queue_tenant ON queue(tenant_id);
  `);
}

// ── Generic helpers ───────────────────────────────────────────────────────────

/** Upsert a single record into a table. */
function upsertRecord(table, tenantId, record) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO ${table} (id, tenant_id, data, updated_at)
    VALUES (@id, @tenantId, @data, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      data       = excluded.data,
      updated_at = excluded.updated_at
  `);
  stmt.run({
    id: String(record.id),
    tenantId,
    data: JSON.stringify(record),
    updatedAt: record.updated_at || new Date().toISOString(),
  });
}

/** Bulk upsert — replaces all rows for this tenant then inserts fresh. */
function bulkUpsert(table, tenantId, records) {
  const db = getDB();
  const upsert = db.prepare(`
    INSERT INTO ${table} (id, tenant_id, data, updated_at)
    VALUES (@id, @tenantId, @data, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      data       = excluded.data,
      updated_at = excluded.updated_at
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      upsert.run({
        id: String(r.id),
        tenantId,
        data: JSON.stringify(r),
        updatedAt: r.updated_at || new Date().toISOString(),
      });
    }
  });
  tx(records);
}

/** Get all records for a tenant from a table. */
function getAll(table, tenantId) {
  const db = getDB();
  const rows = db.prepare(`SELECT data FROM ${table} WHERE tenant_id = ?`).all(tenantId);
  return rows.map((r) => JSON.parse(r.data));
}

/** Get a single record by id + tenant. */
function getOne(table, tenantId, id) {
  const db = getDB();
  const row = db.prepare(`SELECT data FROM ${table} WHERE id = ? AND tenant_id = ?`).get(String(id), tenantId);
  return row ? JSON.parse(row.data) : null;
}

/** Delete a record. */
function deleteRecord(table, tenantId, id) {
  const db = getDB();
  db.prepare(`DELETE FROM ${table} WHERE id = ? AND tenant_id = ?`).run(String(id), tenantId);
}

/** Clear all records for a tenant in a table. */
function clearTable(table, tenantId) {
  const db = getDB();
  db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).run(tenantId);
}

// ── Meta (last sync timestamps) ───────────────────────────────────────────────
function getMeta(key) {
  const db = getDB();
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setMeta(key, value) {
  const db = getDB();
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(value));
}

// ── Mutation Queue ────────────────────────────────────────────────────────────
function enqueue(tenantId, mutation) {
  const db = getDB();
  db.prepare(`
    INSERT INTO queue (tenant_id, method, url, body, headers, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    tenantId,
    mutation.method,
    mutation.url,
    mutation.body ? JSON.stringify(mutation.body) : null,
    mutation.headers ? JSON.stringify(mutation.headers) : null,
    Date.now()
  );
}

function getQueue(tenantId) {
  const db = getDB();
  return db.prepare('SELECT * FROM queue WHERE tenant_id = ? ORDER BY timestamp ASC').all(tenantId);
}

function dequeue(id) {
  const db = getDB();
  db.prepare('DELETE FROM queue WHERE id = ?').run(id);
}

function clearQueue(tenantId) {
  const db = getDB();
  db.prepare('DELETE FROM queue WHERE tenant_id = ?').run(tenantId);
}

function getQueueCount(tenantId) {
  const db = getDB();
  return db.prepare('SELECT COUNT(*) as count FROM queue WHERE tenant_id = ?').get(tenantId)?.count || 0;
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  getDB,
  upsertRecord,
  bulkUpsert,
  getAll,
  getOne,
  deleteRecord,
  clearTable,
  getMeta,
  setMeta,
  enqueue,
  getQueue,
  dequeue,
  clearQueue,
  getQueueCount,
};
