# PWA & Desktop App Implementation Guide

This guide covers transforming Oraka into a Progressive Web App (PWA) and Electron Desktop Application.

## 📋 Overview

You now have:
- **PWA (Progressive Web App)**: Works on mobile and web browsers with offline capabilities
- **Desktop App (Electron)**: Native desktop application like VS Code with auto-updates
- **Service Worker**: Caches content, enables offline functionality, and background sync
- **Auto-Update**: Both PWA and Electron check for updates automatically

---

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs:
- `electron` - Desktop app framework
- `electron-builder` - Builds distributable installers
- `electron-updater` - Auto-update functionality
- `electron-is-dev` - Development mode detection
- `cross-env` - Cross-platform environment variables
- `wait-on` - Waits for dev server

### 2. Generate Required Assets

#### Create Icon Files

You need to create PNG icons in `public/icons/`:

```
public/icons/
├── icon-192x192.png (192x192px)
├── icon-512x512.png (512x512px)
├── icon-maskable-192x192.png (192x192px with safe area)
├── icon-maskable-512x512.png (512x512px with safe area)
├── dashboard-192x192.png (optional shortcut icon)
└── orders-192x192.png (optional shortcut icon)
```

**Icon Requirements:**
- **Minimum**: 192x192 and 512x512 standard icons
- **Recommended**: Add maskable variants for adaptive icons (Android)
- **Format**: PNG with transparency
- **Safe area**: Maskable icons need center logo in 80% of canvas

**Quick Icon Generation:**
```bash
# Using ImageMagick (if installed)
convert existing-logo.svg -resize 192x192 public/icons/icon-192x192.png
convert existing-logo.svg -resize 512x512 public/icons/icon-512x512.png
```

#### Create Screenshots

Add screenshots for app stores in `public/screenshots/`:

```
public/screenshots/
├── screenshot-540x720.png (narrow - mobile)
└── screenshot-1280x720.png (wide - desktop)
```

### 3. Create Electron App Icons

For Windows/Mac/Linux installers, place icons in `public/`:
- `public/icon.png` (256x256px) - General icon
- `public/icon.icns` (Mac)
- `public/icon.ico` (Windows)

---

## 🏃 Running the Applications

### Development - Web Version (PWA)

```bash
npm run dev
# Server runs at http://localhost:5173
```

Features:
- Hot module replacement (HMR)
- Service Worker in development
- Offline support testing
- Install as PWA from browser

### Development - Desktop Version (Electron)

```bash
npm run start:electron
# Opens both Vite dev server and Electron app
```

Or in separate terminals:
```bash
# Terminal 1
npm run dev:electron

# Terminal 2
npm run electron
```

---

## 🔨 Building for Production

### Build PWA (Web Version)

```bash
npm run build
```

Output: `dist/` folder ready to deploy to web server

Deployment options:
- Vercel, Netlify, GitHub Pages
- Azure Static Web Apps
- Your own web server

### Build Desktop Apps

#### Windows (NSIS Installer & Portable)
```bash
npm run build:electron:win
```
Output: 
- `dist/Oraka Setup 1.0.0.exe` - Installer
- `dist/Oraka-1.0.0-portable.exe` - Portable version

#### Mac (DMG & ZIP)
```bash
npm run build:electron:mac
```
Output:
- `dist/Oraka-1.0.0.dmg` - Installer
- `dist/Oraka-1.0.0.zip` - Archive

#### Linux (AppImage & DEB)
```bash
npm run build:electron:linux
```
Output:
- `dist/Oraka-1.0.0.AppImage` - AppImage
- `dist/Oraka-1.0.0.deb` - Debian package

#### All Platforms
```bash
npm run build:electron
# Detects your OS and builds for it
```

---

## 📱 PWA Features

### 1. Installation on Mobile

**iOS:**
1. Open in Safari
2. Tap Share → Add to Home Screen
3. Done! App appears on home screen

**Android:**
1. Open in Chrome/Firefox
2. Tap menu (⋮) → Install app
3. App installs to home screen with offline capabilities

**Desktop (Browser):**
1. Open in Chromium-based browser (Chrome, Edge, Brave)
2. Click install icon in address bar
3. App opens as standalone window

### 2. Offline Functionality

The Service Worker enables:
- **Offline page**: Beautiful offline indicator when disconnected
- **Caching**: Static assets cached on first visit
- **API caching**: Recent API responses cached
- **Background sync**: Orders/inventory sync when online
- **Sync retry**: Failed requests retry automatically

### 3. App Shortcuts

Right-click app icon (desktop) or long-press (mobile) for shortcuts:
- Dashboard
- Orders
- (Add more in `public/manifest.json`)

---

## 🖥️ Desktop App (Electron) Features

### 1. Installation

**Windows:**
- Run `Oraka Setup 1.0.0.exe` and follow installer
- Or use portable `.exe` - no installation needed

**Mac:**
- Open `Oraka-1.0.0.dmg` and drag app to Applications

**Linux:**
- Install `.deb`: `sudo dpkg -i Oraka-1.0.0.deb`
- Or run `.AppImage` directly

### 2. Auto-Updates

The app checks for updates automatically:
- Checks on app start and hourly
- Downloads updates in background
- Prompts user to install when ready
- On restart: new version loads

Configure update server in `electron-builder.yml`:
```yaml
publish:
  provider: github
  owner: your-org
  repo: oraka-desktop
```

### 3. Native Features

- System menu (File, Edit, View, Help)
- Keyboard shortcuts (Ctrl+Q to quit, F12 for DevTools, etc.)
- System tray integration (customizable)
- Crash recovery
- Auto-restart on crashes

### 4. Distributing Updates

For auto-updates, set up GitHub Releases:

```bash
# Tag and push your release
git tag v1.0.0
git push origin v1.0.0

# Create GitHub Release with built files from dist/
# electron-updater will detect and install
```

---

## 🔗 Integrating with React App

### 1. Use PWA Hooks

In any React component:

```jsx
import { usePWAInstall, useElectron, useOnlineStatus } from '@/hooks/usePWA';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAComponents';

export function MyComponent() {
  const { showPrompt, handleInstall, handleDismiss, isInstalled } = usePWAInstall();
  const { isElectron, appVersion } = useElectron();
  const isOnline = useOnlineStatus();

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <PWAInstallPrompt 
        showPrompt={showPrompt}
        onInstall={handleInstall}
        onDismiss={handleDismiss}
        isInstalled={isInstalled}
      />
      
      <div>
        {isElectron && <p>Running as desktop app v{appVersion}</p>}
        {isOnline ? 'Online' : 'Offline'}
      </div>
    </>
  );
}
```

### 2. Update Service Worker (if needed)

Edit `public/service-worker.js`:

```javascript
// Cache API calls specific to your backend
if (url.pathname.startsWith('/api/your-endpoint/')) {
  // Custom caching strategy
}
```

### 3. Add More PWA Features

**Background Sync:**
```jsx
import { useBackgroundSync } from '@/hooks/usePWA';

export function OrderForm() {
  const { registerSync } = useBackgroundSync();

  const submitOrder = async (data) => {
    try {
      await api.post('/orders', data);
    } catch (error) {
      // Register background sync to retry when online
      await registerSync('sync-orders');
    }
  };
}
```

---

## 📋 Configuration Files

### `public/manifest.json`
- PWA metadata (name, icons, theme colors)
- App shortcuts
- Screenshots for store listings
- Display mode (standalone = removes address bar)

### `public/service-worker.js`
- Caching strategies for different resource types
- Offline page fallback
- Background sync handlers
- API cache management

### `electron-builder.yml`
- Build configuration for each platform
- Auto-updater settings
- Installer appearance
- Code signing configuration

### `electron-main.js`
- Main Electron process
- Window creation and management
- IPC handlers for app communication
- Auto-updater setup

### `electron-preload.js`
- Bridge between React and Electron
- Exposes safe APIs to renderer process
- Event listeners

---

## 🐛 Troubleshooting

### PWA Not Installable?
- Check: HTTPS only (or localhost for dev)
- Verify: manifest.json has all required fields
- Check: Service Worker is registered (open DevTools → Application)

### Electron App Won't Launch?
```bash
# Check logs
npm run start:electron -- --verbose

# Or check main process:
electron . --inspect
```

### Updates Not Working?
- Verify: GitHub release has all platform builds
- Check: Version in package.json is updated
- Confirm: electron-updater can reach GitHub API

### Service Worker Issues?
```javascript
// In browser DevTools Console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
// Then refresh page
```

---

## 📊 Analytics & Monitoring

Add to your backend API calls:

```javascript
// Log install source
if (window.electronAPI) {
  api.defaults.headers.common['X-App-Source'] = 'electron';
  api.defaults.headers.common['X-App-Version'] = window.electronAPI.getAppVersion();
} else if (window.matchMedia('(display-mode: standalone)').matches) {
  api.defaults.headers.common['X-App-Source'] = 'pwa';
}
```

---

## 🔐 Security Notes

1. **Service Worker Caching**: Don't cache sensitive data (tokens, passwords)
2. **Electron Context Isolation**: Preload script isolates main/renderer process
3. **HTTPS**: PWA requires HTTPS in production (not localhost)
4. **Code Signing**: For production Electron apps, sign installers
5. **Update Verification**: electron-updater verifies update integrity

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Generate icon files (192x192 & 512x512)
3. ✅ Test PWA: `npm run dev` → browser install
4. ✅ Test Electron: `npm run start:electron`
5. ✅ Build for production: `npm run build:electron:win` (or your OS)
6. ✅ Set up GitHub releases for auto-updates
7. ✅ Deploy PWA to your server
8. ✅ Distribute desktop installers to users

---

## 📞 Support Resources

- **Vite Docs**: https://vitejs.dev
- **Electron Docs**: https://www.electronjs.org/docs
- **PWA Guide**: https://developers.google.com/web/progressive-web-apps
- **electron-builder**: https://www.electron.build
- **electron-updater**: https://github.com/electron-userland/electron-updater

