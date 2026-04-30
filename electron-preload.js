const { contextBridge, ipcRenderer } = require('electron');

// ── Existing electronAPI (unchanged) ─────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion:  () => ipcRenderer.invoke('get-app-version'),
  getAppPath:     () => ipcRenderer.invoke('get-app-path'),
  checkForUpdates:() => ipcRenderer.invoke('check-for-updates'),
  openExternal:   (url) => ipcRenderer.invoke('open-external', url),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
  onUpdateInstalled: (cb) => ipcRenderer.on('update-installed', cb),
});

// ── SQLite API — exposed to renderer as window.sqliteAPI ─────────────────────
contextBridge.exposeInMainWorld('sqliteAPI', {

  // ── CRUD ──────────────────────────────────────────────────────────────────
  getAll:      (table, tenantId)          => ipcRenderer.invoke('db:getAll',      { table, tenantId }),
  getOne:      (table, tenantId, id)      => ipcRenderer.invoke('db:getOne',      { table, tenantId, id }),
  upsert:      (table, tenantId, record)  => ipcRenderer.invoke('db:upsert',      { table, tenantId, record }),
  bulkUpsert:  (table, tenantId, records) => ipcRenderer.invoke('db:bulkUpsert',  { table, tenantId, records }),
  delete:      (table, tenantId, id)      => ipcRenderer.invoke('db:delete',      { table, tenantId, id }),
  clear:       (table, tenantId)          => ipcRenderer.invoke('db:clear',       { table, tenantId }),

  // ── Meta ──────────────────────────────────────────────────────────────────
  getMeta: (key)         => ipcRenderer.invoke('db:getMeta', { key }),
  setMeta: (key, value)  => ipcRenderer.invoke('db:setMeta', { key, value }),

  // ── Queue ─────────────────────────────────────────────────────────────────
  enqueue:    (tenantId, mutation) => ipcRenderer.invoke('db:enqueue',    { tenantId, mutation }),
  getQueue:   (tenantId)           => ipcRenderer.invoke('db:getQueue',   { tenantId }),
  dequeue:    (id)                 => ipcRenderer.invoke('db:dequeue',    { id }),
  clearQueue: (tenantId)           => ipcRenderer.invoke('db:clearQueue', { tenantId }),
  queueCount: (tenantId)           => ipcRenderer.invoke('db:queueCount', { tenantId }),

  // ── Flush (replay queued mutations against server) ────────────────────────
  flushQueue: (tenantId, accessToken) => ipcRenderer.invoke('db:flushQueue', { tenantId, accessToken }),

  // ── Listen for sync events from main process ──────────────────────────────
  onSyncComplete: (cb) => ipcRenderer.on('sync:complete', (_, data) => cb(data)),
});
