const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater: updater } = require('electron-updater');
const sqlite = require('./sqliteDB');

let mainWindow;

// ── Auto updater ──────────────────────────────────────────────────────────────
updater.checkForUpdatesAndNotify();

function setupAutoUpdater(window) {
  updater.on('update-available', () => {
    dialog.showMessageBox(window, {
      type: 'info', title: 'Update Available',
      message: 'A new version of BusinessIQ is available.',
      buttons: ['Install', 'Later']
    }).then((r) => { if (r.response === 0) updater.downloadUpdate(); });
  });

  updater.on('update-downloaded', () => {
    dialog.showMessageBox(window, {
      type: 'info', title: 'Update Ready',
      message: 'Update downloaded. The app will restart to apply it.',
      buttons: ['Restart Now', 'Later']
    }).then((r) => { if (r.response === 0) updater.quitAndInstall(); });
  });

  updater.on('error', (e) => console.error('Updater error:', e));
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1000, minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,   // must be false for preload to use require
    },
    icon: isDev
      ? path.join(__dirname, 'public/icons/icon-512x512.png')
      : path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'icons', 'icon-512x512.png'),
  });

  const startUrl = isDev
    ? 'http://127.0.0.1:5175'
    : `file://${path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.html')}`;

  mainWindow.loadURL(startUrl);
  if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => { mainWindow = null; });
  setupAutoUpdater(mainWindow);
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function createMenu() {
  const template = [
    { label: 'File', submenu: [{ label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Help', submenu: [{ label: 'Check for Updates', click: () => updater.checkForUpdatesAndNotify() }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', () => { createWindow(); createMenu(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });

// ── IPC: App ──────────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getAppPath());
ipcMain.handle('check-for-updates', async () => {
  try { return await updater.checkForUpdates(); } catch { return null; }
});
ipcMain.handle('open-external', async (_, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

// ── IPC: SQLite — generic CRUD ────────────────────────────────────────────────

/** db:getAll  { table, tenantId } → record[] */
ipcMain.handle('db:getAll', (_, { table, tenantId }) => {
  return sqlite.getAll(table, tenantId);
});

/** db:getOne  { table, tenantId, id } → record | null */
ipcMain.handle('db:getOne', (_, { table, tenantId, id }) => {
  return sqlite.getOne(table, tenantId, id);
});

/** db:upsert  { table, tenantId, record } */
ipcMain.handle('db:upsert', (_, { table, tenantId, record }) => {
  sqlite.upsertRecord(table, tenantId, record);
  return { ok: true };
});

/** db:bulkUpsert  { table, tenantId, records } */
ipcMain.handle('db:bulkUpsert', (_, { table, tenantId, records }) => {
  sqlite.bulkUpsert(table, tenantId, records);
  return { ok: true };
});

/** db:delete  { table, tenantId, id } */
ipcMain.handle('db:delete', (_, { table, tenantId, id }) => {
  sqlite.deleteRecord(table, tenantId, id);
  return { ok: true };
});

/** db:clear  { table, tenantId } */
ipcMain.handle('db:clear', (_, { table, tenantId }) => {
  sqlite.clearTable(table, tenantId);
  return { ok: true };
});

// ── IPC: Meta (sync timestamps) ───────────────────────────────────────────────
ipcMain.handle('db:getMeta', (_, { key }) => sqlite.getMeta(key));
ipcMain.handle('db:setMeta', (_, { key, value }) => { sqlite.setMeta(key, value); return { ok: true }; });

// ── IPC: Mutation Queue ───────────────────────────────────────────────────────

/** db:enqueue  { tenantId, mutation: { method, url, body, headers } } */
ipcMain.handle('db:enqueue', (_, { tenantId, mutation }) => {
  sqlite.enqueue(tenantId, mutation);
  return { ok: true };
});

/** db:getQueue  { tenantId } → queue[] */
ipcMain.handle('db:getQueue', (_, { tenantId }) => sqlite.getQueue(tenantId));

/** db:dequeue  { id } */
ipcMain.handle('db:dequeue', (_, { id }) => { sqlite.dequeue(id); return { ok: true }; });

/** db:clearQueue  { tenantId } */
ipcMain.handle('db:clearQueue', (_, { tenantId }) => { sqlite.clearQueue(tenantId); return { ok: true }; });

/** db:queueCount  { tenantId } → number */
ipcMain.handle('db:queueCount', (_, { tenantId }) => sqlite.getQueueCount(tenantId));

// ── IPC: Flush queue (replay mutations against server) ────────────────────────
ipcMain.handle('db:flushQueue', async (_, { tenantId, accessToken }) => {
  const https = require('https');
  const http = require('http');
  const items = sqlite.getQueue(tenantId);
  let flushed = 0;

  for (const item of items) {
    try {
      await httpRequest({
        method: item.method,
        url: item.url,
        body: item.body ? JSON.parse(item.body) : null,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(item.headers ? JSON.parse(item.headers) : {}),
        },
      });
      sqlite.dequeue(item.id);
      flushed++;
    } catch {
      break; // stop on first failure, retry next time
    }
  }

  // Notify renderer
  if (mainWindow) {
    mainWindow.webContents.send('sync:complete', { flushed });
  }
  return { flushed };
});

// ── HTTP helper for main process ──────────────────────────────────────────────
function httpRequest({ method, url, body, headers }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? require('https') : require('http');
    const payload = body ? JSON.stringify(body) : null;

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          ...headers,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve({ status: res.statusCode, data });
          else reject(new Error(`HTTP ${res.statusCode}`));
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}
