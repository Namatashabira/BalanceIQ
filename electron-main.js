const { app, BrowserWindow, Menu, ipcMain, autoUpdater, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater: updater } = require('electron-updater');

// Keep a global reference of the window object
let mainWindow;

// Auto updater config
updater.checkForUpdatesAndNotify();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, 'public/icons/icon-512x512.png')
  });

  // Load the app
  const startUrl = isDev
    ? 'http://127.0.0.1:5175'
    : `file://${path.join(__dirname, 'dist/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle app updates
  setupAutoUpdater(mainWindow);
}

function setupAutoUpdater(window) {
  updater.on('update-available', () => {
    dialog.showMessageBox(window, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version of BusinessIQ is available.',
      buttons: ['Install', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        updater.downloadUpdate();
      }
    });
  });

  updater.on('update-downloaded', () => {
    dialog.showMessageBox(window, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update has been downloaded. The app will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        updater.quitAndInstall();
      }
    });
  });

  updater.on('error', (error) => {
    console.error('Update error:', error);
  });
}

// App event listeners
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, applications stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for app communication
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await updater.checkForUpdates();
    return result;
  } catch (error) {
    console.error('Check for updates error:', error);
    return null;
  }
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            updater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createMenu);
