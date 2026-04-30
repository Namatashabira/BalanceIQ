import { useEffect, useState, useRef, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const TOAST_DURATION = 3000;

const TOASTS = {
  offline:      { icon: WifiOff,       bg: 'bg-gray-900',    text: "You're offline",    sub: 'Changes saved locally',          persistent: true },
  online:       { icon: Wifi,          bg: 'bg-emerald-600', text: 'Back online',        sub: 'Reconnected successfully',        persistent: false },
  synced:       { icon: CheckCircle,   bg: 'bg-emerald-600', text: 'All data synced',    sub: 'Everything is up to date',        persistent: false },
  syncing:      { icon: RefreshCw,     bg: 'bg-blue-600',    text: 'Syncing data…',      sub: 'Uploading pending changes',       persistent: true,  spin: true },
  poorNetwork:  { icon: AlertTriangle, bg: 'bg-amber-500',   text: 'Poor network',       sub: 'Connection is slow or unstable',  persistent: false },
};

export default function OfflineBanner({ isOnline, syncing, pendingCount, onManualSync }) {
  const [toast, setToast]       = useState(null);   // current toast key
  const [visible, setVisible]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const timerRef                = useRef(null);
  const prevOnline              = useRef(isOnline);
  const prevSyncing             = useRef(syncing);
  const poorNetworkRef          = useRef(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => { setVisible(false); setExiting(false); setToast(null); }, 300);
  }, []);

  const show = useCallback((key) => {
    clearTimeout(timerRef.current);
    setToast(key);
    setVisible(true);
    setExiting(false);

    if (!TOASTS[key].persistent) {
      timerRef.current = setTimeout(dismiss, TOAST_DURATION);
    }
  }, [dismiss]);

  // ── Detect poor network via slow fetch ──────────────────────────────────────
  useEffect(() => {
    if (!isOnline) return;

    const checkNetwork = async () => {
      const start = Date.now();
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/health/`, {
          method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(8000),
        });
        const ms = Date.now() - start;
        if (ms > 3000) show('poorNetwork');
      } catch {
        // timeout or error — only flag poor network if still online
        if (navigator.onLine) show('poorNetwork');
      }
    };

    // Check once after coming online, then every 60s
    poorNetworkRef.current = setInterval(checkNetwork, 60000);
    return () => clearInterval(poorNetworkRef.current);
  }, [isOnline, show]);

  // ── React to online/offline/syncing changes ─────────────────────────────────
  useEffect(() => {
    const wasOnline  = prevOnline.current;
    const wasSyncing = prevSyncing.current;

    if (wasOnline && !isOnline) {
      // Just went offline
      show('offline');
    } else if (!wasOnline && isOnline) {
      // Just came back online
      show('online');
      // After 3s, if syncing started show syncing toast
    } else if (!wasSyncing && syncing && isOnline) {
      show('syncing');
    } else if (wasSyncing && !syncing && isOnline) {
      show('synced');
    } else if (!isOnline && toast !== 'offline') {
      // Ensure offline toast stays if still offline
      show('offline');
    }

    prevOnline.current  = isOnline;
    prevSyncing.current = syncing;
  }, [isOnline, syncing, show, toast]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!visible || !toast) return null;

  const { icon: Icon, bg, text, sub, spin } = TOASTS[toast];
  const isPersistent = TOASTS[toast].persistent;

  return (
    <div
      className={`
        fixed top-6 left-1/2 z-[9999] -translate-x-1/2
        transition-all duration-300 ease-out
        ${exiting ? 'opacity-0 -translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100'}
      `}
      style={{ transform: `translateX(-50%) ${exiting ? 'translateY(-12px) scale(0.95)' : 'translateY(0) scale(1)'}` }}
    >
      <div className={`${bg} text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-3 min-w-[260px] max-w-sm`}>
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${spin ? 'animate-spin' : ''}`} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{text}</p>
          <p className="text-xs opacity-75 mt-0.5">{sub}</p>
        </div>

        {/* Pending badge or sync button */}
        {toast === 'offline' && pendingCount > 0 && (
          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
            {pendingCount}
          </span>
        )}
        {toast === 'online' && pendingCount > 0 && onManualSync && (
          <button
            onClick={async () => { await onManualSync(); show('syncing'); }}
            className="bg-white/20 hover:bg-white/30 transition text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          >
            Sync
          </button>
        )}

        {/* Dismiss button for persistent toasts */}
        {isPersistent && (
          <button
            onClick={dismiss}
            className="text-white/60 hover:text-white transition text-lg leading-none flex-shrink-0 ml-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}

        {/* Progress bar for timed toasts */}
        {!isPersistent && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-white/40 animate-shrink"
              style={{ animationDuration: `${TOAST_DURATION}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
