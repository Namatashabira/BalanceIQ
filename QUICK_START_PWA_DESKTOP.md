# Quick Start: PWA & Desktop App

## 1️⃣ Install Dependencies (2 min)

```bash
cd frontend
npm install
```

## 2️⃣ Create Icon Files (5 min)

Create these PNG files in `public/icons/`:
- `icon-192x192.png` (192×192px)
- `icon-512x512.png` (512×512px)

Can use: Figma, Canva, or online converters. Must be PNG with transparent background.

## 3️⃣ Run Development Server (1 min)

**For PWA (Web):**
```bash
npm run dev
# Open http://localhost:5173
# Look for install icon in browser address bar
```

**For Desktop App (Electron):**
```bash
npm run start:electron
# Opens Electron window automatically
```

## 4️⃣ Test Offline & Install Features (5 min)

### Test PWA Install:
1. Open http://localhost:5173 in Chrome/Edge
2. Click install icon (address bar right side) OR
3. Right-click → "Install Oraka app"
4. App opens as standalone window

### Test Offline:
1. Open DevTools (F12)
2. Network tab → Throttling: Offline
3. App should still work with cached content

### Test Desktop App:
1. `npm run start:electron` opens the app
2. Try offline again - works smoothly
3. All system features available

## 5️⃣ Build for Production

### Build PWA (Deploy to Web):
```bash
npm run build
# Output: dist/ folder
# Deploy to: Vercel, Netlify, or your server
```

### Build Desktop App Installer:

**Windows:**
```bash
npm run build:electron:win
# Output: dist/Oraka Setup 1.0.0.exe
# Users download and install like VS Code
```

**Mac:**
```bash
npm run build:electron:mac
# Output: dist/Oraka-1.0.0.dmg
```

**Linux:**
```bash
npm run build:electron:linux
# Output: dist/Oraka-1.0.0.AppImage
```

---

## 📱 What Users See

### Mobile / PWA:
- Download app from Google Play-like prompt
- Works offline
- Home screen icon
- Push notifications (optional)

### Desktop / Electron:
- Download installer from website
- Install like any desktop app
- System tray integration
- Automatic updates
- Works offline

---

## 🎯 Use These in React Components

```jsx
import { usePWAInstall, useElectron, useOnlineStatus } from '@/hooks/usePWA';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAComponents';

export function App() {
  const { showPrompt, handleInstall, handleDismiss } = usePWAInstall();
  const { isElectron, appVersion } = useElectron();
  const isOnline = useOnlineStatus();

  return (
    <>
      <PWAInstallPrompt showPrompt={showPrompt} onInstall={handleInstall} onDismiss={handleDismiss} />
      <OfflineIndicator isOnline={isOnline} />
      
      {isElectron && <p>Desktop App v{appVersion}</p>}
    </>
  );
}
```

---

## ⚡ Common Tasks

### Change App Name:
- `package.json`: `"name": "oraka"`
- `public/manifest.json`: `"short_name": "Oraka"`
- `electron-builder.yml`: `productName: Oraka`

### Change Theme Color:
- `public/manifest.json`: `"theme_color": "#1890ff"` (your color)
- `index.html`: `<meta name="theme-color">`

### Add Shortcuts (Right-Click Menu):
Edit `public/manifest.json` - add to `shortcuts` array:
```json
{
  "name": "Inventory",
  "short_name": "Inventory",
  "url": "/inventory",
  "icons": [{"src": "/icons/inventory-192x192.png", "sizes": "192x192"}]
}
```

### Enable Auto-Updates:
Edit `electron-builder.yml` → set up GitHub releases with your builds

---

## ✅ Checklist

- [ ] `npm install` completed
- [ ] Icons created in `public/icons/`
- [ ] `npm run dev` works
- [ ] `npm run start:electron` opens desktop app
- [ ] Offline mode works (DevTools Network offline)
- [ ] `npm run build` creates dist/
- [ ] `npm run build:electron:win` creates installer
- [ ] Users can install PWA from browser
- [ ] Desktop app auto-updates work (GitHub releases)

---

## 🆘 Help

Check [PWA_ELECTRON_SETUP.md](./PWA_ELECTRON_SETUP.md) for detailed troubleshooting

