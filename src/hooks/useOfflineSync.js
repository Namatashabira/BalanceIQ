import { useState, useEffect, useCallback, useRef } from 'react';

export default function useOfflineSync(data, api) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const syncTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Store data locally
  const storeLocally = useCallback((data) => {
    try {
      localStorage.setItem('manualEntryData', JSON.stringify(data));
      localStorage.setItem('manualEntryTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Failed to store data locally:', error);
    }
  }, []);

  // Load data from local storage
  const loadLocalData = useCallback(() => {
    try {
      const stored = localStorage.getItem('manualEntryData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load local data:', error);
      return null;
    }
  }, []);

  // Enhanced sync with server
  const syncWithServer = useCallback(async (force = false) => {
    if ((!isOnline && !force) || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    try {
      const localData = loadLocalData();
      if (localData && localData.length > 0) {
        // Check for conflicts before syncing
        const serverData = await api.getAll();
        const conflictingItems = detectConflicts(localData, serverData);
        
        if (conflictingItems.length > 0 && !force) {
          setConflicts(conflictingItems);
          setSyncStatus('conflict');
          return;
        }
        
        await api.bulkUpdate(localData);
        setPendingChanges(0);
        setLastSyncTime(new Date().toISOString());
        localStorage.removeItem('manualEntryPending');
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        retryCountRef.current = 0;
      }
      setSyncStatus('success');
      
      // Auto-clear success status after 3 seconds
      setTimeout(() => {
        if (syncStatus === 'success') setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      retryCountRef.current++;
      
      if (retryCountRef.current < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        syncTimeoutRef.current = setTimeout(() => syncWithServer(force), delay);
      } else {
        setSyncStatus('error');
        retryCountRef.current = 0;
      }
    }
  }, [isOnline, syncStatus, loadLocalData, api]);

  // Detect conflicts between local and server data
  const detectConflicts = useCallback((localData, serverData) => {
    const conflicts = [];
    
    localData.forEach(localItem => {
      const serverItem = serverData.find(s => s.id === localItem.id);
      if (serverItem) {
        // Check if server item was modified after local timestamp
        const localTimestamp = localStorage.getItem('manualEntryTimestamp');
        const serverTimestamp = new Date(serverItem.updated_at || serverItem.date).getTime();
        
        if (serverTimestamp > parseInt(localTimestamp)) {
          conflicts.push({
            id: localItem.id,
            local: localItem,
            server: serverItem,
            field: 'multiple' // Could be enhanced to detect specific fields
          });
        }
      }
    });
    
    return conflicts;
  }, []);

  // Resolve conflicts
  const resolveConflict = useCallback((conflictId, resolution) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    if (conflicts.length === 1) {
      // Last conflict resolved, proceed with sync
      syncWithServer(true);
    }
  }, [conflicts.length, syncWithServer]);

  // Force sync (ignore conflicts)
  const forceSync = useCallback(() => {
    setConflicts([]);
    syncWithServer(true);
  }, [syncWithServer]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithServer();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithServer]);

  // Store data when it changes
  useEffect(() => {
    if (data && data.length > 0) {
      storeLocally(data);
      
      // Track pending changes when offline
      if (!isOnline) {
        const pending = parseInt(localStorage.getItem('manualEntryPending') || '0');
        setPendingChanges(pending + 1);
        localStorage.setItem('manualEntryPending', (pending + 1).toString());
      }
    }
  }, [data, isOnline, storeLocally]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingChanges > 0) {
      // Delay sync to allow network to stabilize
      syncTimeoutRef.current = setTimeout(() => syncWithServer(), 2000);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, pendingChanges, syncWithServer]);

  // Listen for real-time updates
  useEffect(() => {
    const handleOrderUpdate = (event) => {
      const { detail } = event;
      if (detail && detail.data) {
        // Update local data with server changes
        const updatedData = loadLocalData().map(item => 
          item.id === detail.data.id ? { ...item, ...detail.data } : item
        );
        storeLocally(updatedData);
      }
    };

    window.addEventListener('orderUpdate', handleOrderUpdate);
    return () => window.removeEventListener('orderUpdate', handleOrderUpdate);
  }, [loadLocalData, storeLocally]);

  // Initialize last sync time
  useEffect(() => {
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(lastSync);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingChanges,
    lastSyncTime,
    conflicts,
    storeLocally,
    loadLocalData,
    syncWithServer,
    resolveConflict,
    forceSync,
    retryCount: retryCountRef.current
  };
}