import { useEffect, useState } from 'react';

/**
 * Hook for handling PWA installation prompts
 * Returns: { deferredPrompt, showPrompt, handleInstall, handleDismiss }
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Stash the event for later use
      setDeferredPrompt(e);
      // Show the install prompt to user
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', (e) => {
      setIsInstalled(e.matches);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', () => {});
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return {
    deferredPrompt,
    showPrompt,
    handleInstall,
    handleDismiss,
    isInstalled
  };
}

/**
 * Hook for detecting if running in Electron
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkElectron = async () => {
      if (window.electronAPI) {
        setIsElectron(true);
        try {
          const version = await window.electronAPI.getAppVersion();
          setAppVersion(version);
        } catch (error) {
          console.error('Failed to get app version:', error);
        }
      }
    };

    checkElectron();

    // Listen for update available notification
    if (window.electronAPI?.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable(() => {
        setIsUpdateAvailable(true);
      });
    }
  }, []);

  const checkForUpdates = async () => {
    if (window.electronAPI?.checkForUpdates) {
      try {
        const result = await window.electronAPI.checkForUpdates();
        return result;
      } catch (error) {
        console.error('Check for updates failed:', error);
        return null;
      }
    }
  };

  const openExternal = async (url) => {
    if (window.electronAPI?.openExternal) {
      try {
        await window.electronAPI.openExternal(url);
      } catch (error) {
        console.error('Open external failed:', error);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    isElectron,
    appVersion,
    isUpdateAvailable,
    checkForUpdates,
    openExternal
  };
}

/**
 * Hook for service worker registration and updates
 */
export function useServiceWorker() {
  const [swRegistration, setSwRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setSwRegistration(registration);

        // Check for updates periodically
        const interval = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour

        return () => clearInterval(interval);
      });

      // Listen for controller change (service worker updated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          setUpdateAvailable(true);
        }
      });
    }
  }, []);

  const skipWaiting = async () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    swRegistration,
    updateAvailable,
    skipWaiting
  };
}

/**
 * Hook for offline detection
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const [isSyncAvailable, setIsSyncAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      setIsSyncAvailable(true);
    }
  }, []);

  const registerSync = async (tag) => {
    if (isSyncAvailable) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`Background sync registered for: ${tag}`);
        return true;
      } catch (error) {
        console.error(`Failed to register background sync: ${error}`);
        return false;
      }
    }
    return false;
  };

  return {
    isSyncAvailable,
    registerSync
  };
}
