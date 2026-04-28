# 🚀 Quick Reference - PWA & Electron Commands

## Development

```bash
# Web (PWA) - http://localhost:5173
npm run dev

# Desktop (Electron) - Opens window automatically  
npm run start:electron

# Or separately:
npm run dev:electron          # Terminal 1: Start Vite
npm run electron              # Terminal 2: Start Electron
```

## Building

```bash
# Web - Deploy to Vercel/Netlify
npm run build
→ Output: dist/ folder

# Desktop - All platforms
npm run build:electron
→ Auto-detects your OS

# Desktop - Specific platforms
npm run build:electron:win    # Windows (.exe, .msi)
npm run build:electron:mac    # Mac (.dmg)
npm run build:electron:linux  # Linux (.AppImage, .deb)
```

## Testing

```bash
# Offline mode
1. Open DevTools (F12)
2. Network tab
3. Set Throttling: Offline
4. App continues working with cached data

# Install prompt (PWA)
1. npm run dev
2. Chrome/Edge: Look for install icon in address bar
3. Or right-click → Install

# Desktop app
1. npm run build:electron:win
2. dist/Oraka Setup 1.0.0.exe
3. Run installer
```

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/usePWA.js` | 5 React hooks for PWA/Electron |
| `src/components/PWAComponents.jsx` | UI for install/update prompts |
| `src/services/api.js` | API client + offline sync |
| `public/manifest.json` | PWA configuration |
| `public/service-worker.js` | Offline + caching logic |
| `electron-main.js` | Desktop app entry |
| `electron-builder.yml` | Build configuration |

## Using in React

```jsx
// Import hooks
import { usePWAInstall, useElectron, useOnlineStatus } from '@/hooks/usePWA';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAComponents';

// In component
const { showPrompt, handleInstall, handleDismiss } = usePWAInstall();
const { isElectron, appVersion } = useElectron();
const isOnline = useOnlineStatus();

return (
  <>
    <OfflineIndicator isOnline={isOnline} />
    <PWAInstallPrompt showPrompt={showPrompt} onInstall={handleInstall} onDismiss={handleDismiss} />
    {isElectron && <p>Desktop v{appVersion}</p>}
  </>
);
```

## User Installation

**Mobile (PWA):**
1. Open app URL
2. Tap install (Chrome) or Share → Add to Home Screen (iOS)
3. Done!

**Desktop (Electron):**
1. Download Oraka-Setup-1.0.0.exe
2. Run installer
3. Launch from Start Menu or desktop

## Environment Setup

```bash
# Installation
npm install

# Create icons in:
public/icons/
├── icon-192x192.png
├── icon-512x512.png
├── icon-maskable-192x192.png
└── icon-maskable-512x512.png

# Start developing!
npm run dev
```

## Configuration

**App Name:**
- `package.json`: `"name": "oraka"`
- `public/manifest.json`: `"short_name": "Oraka"`
- `electron-builder.yml`: `productName: Oraka`

**Theme Color:**
- `public/manifest.json`: `"theme_color": "#1890ff"`
- `index.html`: `<meta name="theme-color" content="#1890ff">`

**API URL:**
- `.env`: `VITE_API_URL=http://localhost:8000/api`

## Django Integration

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "app://oraka",  # Electron
]

CSRF_TRUSTED_ORIGINS = [
    "https://yourdomain.com",
    "app://oraka",
]
```

## Deployment

**Web PWA:**
- Vercel: `npm run build` → `vercel`
- Netlify: `npm run build` → upload `dist/`
- Your server: Copy `dist/` folder

**Desktop App:**
- Create GitHub release
- Upload `dist/Oraka-Setup-*.exe` (and other OS files)
- Users download and install
- Auto-update checks on startup

## Documentation Files

📖 **Start Here:**
- `QUICK_START_PWA_DESKTOP.md` (5 min)

📚 **Detailed Guides:**
- `PWA_ELECTRON_SETUP.md` (30 min)
- `BACKEND_INTEGRATION.md` (Django setup)
- `ORAKA_ARCHITECTURE.md` (Architecture)

## Troubleshooting

**PWA not installing?**
- HTTPS required (or localhost)
- Check `public/manifest.json` complete
- Service Worker registered? (DevTools → Application)

**Electron won't build?**
- `npm install` again
- Node 14+ required
- On Mac/Linux: May need build tools

**Offline not working?**
- Service Worker registered? (DevTools → Application → Service Workers)
- Check Network throttling OFF
- Refresh page

**Auto-update not working?**
- GitHub release with correct version tag
- Check `electron-builder.yml` publish config
- Verify `package.json` version incremented

## Quick Stats

```
Size:     ~15MB Electron app, ~2MB PWA
Install:  1-2 minutes
Build:    ~1 minute
Dev:      Instant HMR
Performance: Enterprise-grade
```

---

**Ready? Start with:** `QUICK_START_PWA_DESKTOP.md` ⭐
