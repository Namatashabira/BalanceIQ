/**
 * useSync.js — React hook for offline sync lifecycle.
 *
 * Mount this once at the app root (inside AuthProvider).
 * It handles:
 *   - Full snapshot sync on login
 *   - Delta sync every 5 minutes while online
 *   - Flush queue + delta sync on reconnect
 *   - Exposes { syncing, lastSync, pendingCount, isOnline }
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { fullSync, deltaSync, syncOnReconnect } from '../services/syncEngine';
import { queueCount, getMeta, getTenantId } from '../services/localStore';

const DELTA_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function useSync(isAuthenticated) {
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [syncing, setSyncing]         = useState(false);
  const [lastSync, setLastSync]       = useState(null);
  const [pendingCount, setPending]    = useState(0);
  const intervalRef                   = useRef(null);
  const didFullSync                   = useRef(false);

  // ── Refresh pending count ─────────────────────────────────────────────────
  const refreshPending = useCallback(async () => {
    const count = await queueCount();
    setPending(count);
  }, []);

  // ── Full sync on login ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || didFullSync.current) return;
    didFullSync.current = true;

    (async () => {
      setSyncing(true);
      try {
        await fullSync();
        const tid = getTenantId();
        const ts = await getMeta(`lastSync:${tid}`);
        setLastSync(ts);
      } finally {
        setSyncing(false);
        refreshPending();
      }
    })();
  }, [isAuthenticated, refreshPending]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) didFullSync.current = false;
  }, [isAuthenticated]);

  // ── Delta sync every 5 min ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    intervalRef.current = setInterval(async () => {
      if (!navigator.onLine || syncing) return;
      setSyncing(true);
      try {
        await deltaSync();
        const tid = getTenantId();
        const ts = await getMeta(`lastSync:${tid}`);
        setLastSync(ts);
      } finally {
        setSyncing(false);
        refreshPending();
      }
    }, DELTA_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated, syncing, refreshPending]);

  // ── Online / offline events ───────────────────────────────────────────────
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      if (!isAuthenticated) return;
      setSyncing(true);
      try {
        await syncOnReconnect();
        const tid = getTenantId();
        const ts = await getMeta(`lastSync:${tid}`);
        setLastSync(ts);
      } finally {
        setSyncing(false);
        refreshPending();
      }
    };

    const onOffline = () => {
      setIsOnline(false);
      refreshPending();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [isAuthenticated, refreshPending]);

  // ── Listen for Electron sync:complete from main process ──────────────────
  useEffect(() => {
    if (!window.sqliteAPI) return;
    window.sqliteAPI.onSyncComplete(({ flushed }) => {
      if (flushed > 0) refreshPending();
    });
  }, [refreshPending]);

  // ── Poll pending count every 10s ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(refreshPending, 10000);
    return () => clearInterval(id);
  }, [refreshPending]);

  return { isOnline, syncing, lastSync, pendingCount };
}
