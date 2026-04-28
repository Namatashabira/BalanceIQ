# Oraka Electronic Application & PWA - Complete Architecture

## 📋 Overview

Your Oraka system is now transformed into a **3-in-1 application**:

```
┌─────────────────────────────────────────────────────┐
│           ORAKA BUSINESS SYSTEM                     │
├─────────────────┬─────────────────┬─────────────────┤
│   WEB (Browser) │   PWA (Mobile)  │ ELECTRON (Desk) │
│                 │                 │                 │
│ Chrome/Firefox  │ iOS/Android     │ Windows/Mac     │
│ Online only     │ Offline capable │ Offline capable │
│                 │ Installable     │ Native install  │
│                 │                 │ Auto-update     │
└─────────────────┴─────────────────┴─────────────────┘
        ↓              ↓                   ↓
              All Share Same Code
      React Frontend + Django Backend
```

---

## 🏗️ Architecture

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── PWAComponents.jsx (Install, Update, Offline UI)
│   ├── hooks/
│   │   └── usePWA.js (PWA, Electron, Offline hooks)
│   ├── services/
│   │   └── api.js (API client + offline sync)
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── manifest.json (PWA metadata)
│   ├── service-worker.js (Offline capabilities)
│   ├── offline.html (Offline fallback page)
│   ├── icons/ (App icons - 192x192, 512x512)
│   └── screenshots/ (App store screenshots)
├── electron-main.js (Desktop app entrypoint)
├── electron-preload.js (Secure IPC bridge)
├── electron-builder.yml (Build configuration)
├── vite.config.js (Build setup)
├── package.json (Dependencies + scripts)
├── index.html (PWA manifest link + SW registration)
└── docs/
    ├── QUICK_START_PWA_DESKTOP.md ⭐ START HERE
    ├── PWA_ELECTRON_SETUP.md (Detailed guide)
    ├── BACKEND_INTEGRATION.md (Django setup)
    └── ORAKA_ARCHITECTURE.md (This file)
```

### Backend Structure (Django)

```
admin_dashboard_backend/
├── accounts/ (User management)
├── product/ (Product/Inventory)
├── orders/ (Order management)
├── users/ (User profiles)
├── tenants/ (Multi-tenant support)
├── settings.py (CORS, Auth, etc.)
├── requirements.txt
└── manage.py
```

---

## 🔄 Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool (ultra-fast)
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Ant Design** - UI components

### Desktop (Electron)
- **Electron 32** - Desktop framework (Like VS Code)
- **electron-builder** - Installer generator
- **electron-updater** - Auto-updates
- **electron-is-dev** - Dev detection

### PWA
- **Service Worker** - Offline, caching, background sync
- **Web App Manifest** - Install prompt, icons, metadata
- **IndexedDB** - Local data storage
- **Background Sync API** - Sync when online

### Backend
- **Django** - Web framework
- **Django REST Framework** - API
- **Django Channels** - WebSockets
- **PostgreSQL/MySQL** - Database
- **Redis** - Caching, WebSocket layer

---

## 📱 How Each Version Works

### 1. **Web Version** (Browser)
```
Browser → http://localhost:5173
        → Service Worker (if online/offline)
        → Cache strategy (network-first for pages)
        → Django Backend
```

**Run:**
```bash
npm run dev
```

**Best for:** Quick testing, cross-platform, no install

---

### 2. **PWA Version** (Mobile/Web Installable)
```
Mobile Browser → Install Prompt
              → Home Screen Icon
              → Standalone Window (no browser UI)
              → Service Worker Caching
              → Offline Mode → Cached Content
              → Background Sync → Sync when online
              → Django Backend
```

**Installation:**
- Android: Chrome menu → Install app
- iOS: Safari Share → Add to Home Screen
- Windows/Mac: Browser install icon

**Run:**
```bash
npm run dev  # Then install from browser
```

**Best for:** Mobile users, offline work, home screen shortcut

---

### 3. **Desktop Version** (Electron)
```
Windows/Mac/Linux → Installer (.exe/.dmg/.AppImage)
                  → Native App Window
                  → System Menu, Keyboard Shortcuts
                  → System Tray (optional)
                  → Service Worker Caching
                  → Offline Mode
                  → Auto-Updates (via GitHub)
                  → Django Backend
```

**Distribution:**
- Users download `Oraka-Setup-1.0.0.exe`
- Click to install like VS Code
- App opens from desktop shortcut or Start Menu
- Auto-updates check on startup

**Run Development:**
```bash
npm run start:electron
```

**Build:**
```bash
npm run build:electron:win  # Windows
npm run build:electron:mac  # Mac
npm run build:electron:linux  # Linux
```

**Best for:** Desktop power users, advanced features, offline work

---

## 🔌 Data Flow & Offline Sync

### Online Mode
```
User Action → React Component
           → API Call (Axios)
           → Django Backend
           → Response → Update UI + Cache
```

### Offline Mode
```
User Action → React Component
           → Check Online Status (useOnlineStatus hook)
           ├─ YES → API Call → Cache + Update
           └─ NO  → IndexedDB Save (offlineManager)
                  → UI Updates immediately
                  → Queue for sync

When Back Online:
           → Detect Connection (window 'online' event)
           → offlineManager.syncChanges()
           → POST /api/sync/ with queued changes
           → Django processes batch
           → Success → Clear queue
           → Failure → Retry with exponential backoff
```

---

## 🔐 Security

### Authentication Flow
```
1. User Login
   ├─ POST /api/auth/login/ → Django
   ├─ Response: {access_token, refresh_token}
   └─ Store in localStorage (or sessionStorage for sensitive)

2. API Requests
   ├─ Add Authorization: Bearer {access_token}
   ├─ Django verifies JWT
   └─ Response with data or 401 if expired

3. Token Refresh (Auto)
   ├─ On 401 response
   ├─ POST /api/token/refresh/ with refresh_token
   ├─ Get new access_token
   └─ Retry original request

4. Logout
   ├─ Clear tokens from storage
   ├─ Redirect to /login
   └─ Block all API calls
```

### Electron Security
- **Context Isolation**: Renderer can't access main process directly
- **Preload Script**: Limited API exposed to React
- **Code Signing**: Future - sign installers (production)
- **HTTPS Only**: Production PWA requires HTTPS

---

## 📦 Build Process

### Development Builds

**PWA Web:**
```
npm run dev
    → Vite starts dev server
    → HMR enabled (hot reload)
    → Service Worker in dev mode
    → No build needed - instant updates
```

**Electron:**
```
npm run start:electron
    → npm run dev:electron (Vite dev server)
    → npm run electron (Electron launcher)
    → Opens app window pointing to http://localhost:5173
    → HMR works in Electron too
```

### Production Builds

**PWA Web:**
```
npm run build
    → Vite bundles React code
    → Tree-shaking removes unused code
    → Minifies and optimizes
    → Outputs: dist/ folder
    → Deploy to: Vercel, Netlify, GitHub Pages, etc.
    → Users access: https://yourdomain.com
```

**Electron Windows:**
```
npm run build:electron:win
    → Vite builds React (dist/)
    → electron-builder packages it
    → Creates:
      ├─ Oraka Setup 1.0.0.exe (Installer with NSIS)
      ├─ Oraka-1.0.0-portable.exe (No install needed)
      └─ Oraka-1.0.0.exe.blockmap (Update delta)
    → Users download and install
```

---

## 🚀 Deployment Guide

### 1. Web PWA Deployment (Vercel Example)

```bash
# Build
npm run build

# Deploy to Vercel
npm install -g vercel
vercel
```

Users access: `https://yourdomain.vercel.app`
- Install as PWA from browser
- Works on mobile/desktop
- Automatic HTTPS

### 2. Desktop App Distribution

**Option A: Direct Download**
```
1. Build: npm run build:electron:win
2. Upload dist/Oraka-Setup-1.0.0.exe to your website
3. Users download and install
4. Auto-updates check GitHub for new versions
```

**Option B: App Store**
```
1. Windows: Microsoft Store submission (paid)
2. Mac: App Store submission (requires signing)
3. Linux: Package repositories (Ubuntu, Fedora, etc.)
```

### 3. Auto-Update Setup (GitHub)

```bash
# Tag and release
git tag v1.0.1
git push origin v1.0.1

# Create GitHub Release:
# 1. Go to GitHub repo
# 2. Releases → Create new release
# 3. Upload files from dist/
# 4. Publish

# electron-updater automatically detects and installs
```

---

## 📊 File Changes Summary

### New Files Created
✅ `public/manifest.json` - PWA metadata  
✅ `public/service-worker.js` - Offline support  
✅ `public/offline.html` - Offline page  
✅ `src/hooks/usePWA.js` - React hooks for PWA/Electron  
✅ `src/components/PWAComponents.jsx` - UI components  
✅ `src/services/api.js` - Enhanced API client  
✅ `electron-main.js` - Electron entry point  
✅ `electron-preload.js` - Secure IPC  
✅ `electron-builder.yml` - Build config  
✅ `PWA_ELECTRON_SETUP.md` - Detailed guide  
✅ `QUICK_START_PWA_DESKTOP.md` - Quick start  
✅ `BACKEND_INTEGRATION.md` - Django setup  
✅ `setup-pwa-electron.sh` - Setup script (Linux/Mac)  
✅ `setup-pwa-electron.bat` - Setup script (Windows)  

### Modified Files
📝 `package.json` - Added Electron + PWA dependencies  
📝 `vite.config.js` - Added build optimizations  
📝 `index.html` - Added PWA meta tags + SW registration  

### No Changes Needed
- Django backend works as-is
- All API endpoints compatible
- Database schema unchanged

---

## ✅ Getting Started Checklist

### Phase 1: Setup (15 minutes)
- [ ] Read `QUICK_START_PWA_DESKTOP.md`
- [ ] Run `setup-pwa-electron.bat` (Windows) or `setup-pwa-electron.sh` (Mac/Linux)
- [ ] Create icon files (192x192 & 512x512 PNG)
- [ ] Test with `npm run dev`

### Phase 2: Development (1 hour)
- [ ] Test PWA in browser
- [ ] Test Electron app with `npm run start:electron`
- [ ] Test offline mode (DevTools Network → Offline)
- [ ] Verify Service Worker registration
- [ ] Test install prompts

### Phase 3: Configuration (30 minutes)
- [ ] Update Django CORS settings
- [ ] Configure authentication
- [ ] Update theme colors in manifest
- [ ] Add your company branding

### Phase 4: Building (30 minutes)
- [ ] Build PWA: `npm run build`
- [ ] Build Desktop: `npm run build:electron:win` (or your OS)
- [ ] Test installers
- [ ] Set up auto-update (GitHub releases)

### Phase 5: Deployment (Varies)
- [ ] Deploy PWA (Vercel/Netlify)
- [ ] Create GitHub releases
- [ ] Share download links with users
- [ ] Monitor auto-update usage

---

## 📞 Support & Resources

### Documentation (In This Folder)
1. **QUICK_START_PWA_DESKTOP.md** ⭐ Start here!
2. **PWA_ELECTRON_SETUP.md** - Detailed guide
3. **BACKEND_INTEGRATION.md** - Django integration
4. **ORAKA_ARCHITECTURE.md** - This file

### External Resources
- **Electron Docs**: https://www.electronjs.org/docs
- **PWA Docs**: https://developers.google.com/web/progressive-web-apps
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Django REST**: https://www.django-rest-framework.org

### Common Issues

**PWA Not Installing?**
- Check HTTPS (or use localhost)
- Verify manifest.json has all fields
- Check Service Worker registration in DevTools

**Electron Won't Build?**
- Run `npm install` again
- Check Node version (14+)
- On Mac/Linux, may need Xcode/build tools

**Auto-Updates Not Working?**
- Set up GitHub release with correct file names
- Check electron-builder.yml configuration
- Verify version in package.json incremented

---

## 🎉 You Now Have

✨ **PWA** - Download on mobile, works offline  
🖥️ **Desktop App** - Install like VS Code, auto-updates  
🌐 **Web Version** - Traditional browser access  
🔄 **Automatic Sync** - Offline changes sync when online  
📊 **Same Codebase** - One build, three deployment methods  
🚀 **Modern Stack** - React, Vite, Electron, Service Workers  

Ready to distribute your Oraka system to users globally! 🚀

