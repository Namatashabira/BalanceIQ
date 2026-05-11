import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
const CACHE_KEY = 'cachedSubscription';
const TRIAL_START_KEY = 'trialStart';
const SELECTED_PLAN_KEY = 'selectedPlan';

export const PLAN_PAGES = {
  free:       ['dashboard_enabled','product_enabled','inventory_enabled','orders_enabled','manual_entry_enabled','payments_enabled'],
  starter:    ['dashboard_enabled','product_enabled','inventory_enabled','orders_enabled','manual_entry_enabled','payments_enabled','sales_enabled'],
  business:   ['dashboard_enabled','product_enabled','inventory_enabled','orders_enabled','manual_entry_enabled','payments_enabled','sales_enabled','customers_enabled','analytics_enabled','ai_insights_enabled','accounting_enabled'],
  enterprise: null,
};

const PLAN_LIMITS = {
  free:       { product_limit: 7,  trial_days: 14 },
  starter:    { product_limit: -1, trial_days: 0  },
  business:   { product_limit: -1, trial_days: 0  },
  enterprise: { product_limit: -1, trial_days: 0  },
};

// ── localStorage helpers ─────────────────────────────────────────────────────
const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
};

const writeCache = (data) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
};

/**
 * Compute the effective subscription purely from localStorage.
 * This runs even when the backend is completely offline.
 */
const computeLocalSub = () => {
  const cached = readCache();
  const planKey = localStorage.getItem(SELECTED_PLAN_KEY) || cached?.plan?.key || 'free';
  const limits  = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
  const pages   = PLAN_PAGES[planKey] ?? null;

  // If we have a full cached subscription from the backend, use it as base
  if (cached) {
    // Re-compute trial expiry locally using stored trial_end timestamp
    const trialEnd = cached.trial_end ? new Date(cached.trial_end) : null;
    const now = new Date();
    const locallyExpired = trialEnd ? now > trialEnd : false;

    return {
      ...cached,
      is_trial_expired: locallyExpired || cached.is_trial_expired,
      status: locallyExpired ? 'expired' : cached.status,
      days_left: trialEnd
        ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
        : cached.days_left,
      _source: 'cache',
    };
  }

  // No cache at all — build from scratch using trialStart in localStorage
  const trialStartMs = Number(localStorage.getItem(TRIAL_START_KEY)) || Date.now();
  const trialDays = limits.trial_days || 14;
  const trialEndMs = trialStartMs + trialDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const locallyExpired = planKey === 'free' && now > trialEndMs;
  const daysLeft = Math.max(0, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24)));

  return {
    plan: {
      key: planKey,
      name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
      product_limit: limits.product_limit,
      trial_days: limits.trial_days,
      allowed_pages: pages || [],
    },
    status: locallyExpired ? 'expired' : (planKey === 'free' ? 'trial' : 'active'),
    is_trial_expired: locallyExpired,
    days_left: planKey === 'free' ? daysLeft : null,
    trial_end: new Date(trialEndMs).toISOString(),
    _source: 'local',
  };
};

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin' || user?.is_staff === true;

  const [sub, setSub] = useState(() => computeLocalSub());
  const [loading, setLoading] = useState(true);
  // planReady = we have fetched from DB at least once this session
  const [planReady, setPlanReady] = useState(false);

  // Re-compute local expiry every minute so the UI stays accurate offline
  useEffect(() => {
    const interval = setInterval(() => {
      setSub(prev => {
        const refreshed = computeLocalSub();
        if (refreshed.is_trial_expired !== prev.is_trial_expired ||
            refreshed.days_left !== prev.days_left) {
          return refreshed;
        }
        return prev;
      });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSub = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setSub(computeLocalSub());
      setLoading(false);
      setPlanReady(true);
      return;
    }
    // Superadmin is the owner — skip subscription API entirely
    try {
      const stored = localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : null;
      if (u?.role === 'superadmin' || u?.is_superuser === true) {
        setLoading(false);
        setPlanReady(true);
        return;
      }
    } catch {}
    try {
      const res = await axios.get(`${API}/plans/my-subscription/`, {
        headers: authHeaders(),
        timeout: 8000,
      });
      const fresh = res.data;
      if (fresh && fresh.plan && fresh.status) {
        writeCache(fresh);
        if (fresh.plan?.key) localStorage.setItem(SELECTED_PLAN_KEY, fresh.plan.key);
        if (fresh.trial_start) localStorage.setItem(TRIAL_START_KEY, String(new Date(fresh.trial_start).getTime()));
        setSub({ ...fresh, _source: 'db' });
      } else {
        setSub(computeLocalSub());
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 500 || status === 503) {
        // Plans app not deployed yet — localStorage is the source of truth
        console.info('[PlanContext] Plans API unavailable, using localStorage enforcement.');
      }
      setSub(computeLocalSub());
    } finally {
      setLoading(false);
      setPlanReady(true);
    }
  }, []);

  useEffect(() => {
    // Small delay to let AuthContext restore user from localStorage first
    const timer = setTimeout(() => fetchSub(), 50);
    window.addEventListener('auth-changed', fetchSub);
    window.addEventListener('plan-changed', fetchSub);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('auth-changed', fetchSub);
      window.removeEventListener('plan-changed', fetchSub);
    };
  }, [fetchSub]);

  const planKey      = sub?.plan?.key || 'free';
  const trialExpired = sub?.is_trial_expired || sub?.status === 'expired';
  const daysLeft     = sub?.days_left ?? null;
  const planDef      = sub?.plan || { key: 'free', product_limit: 7, allowed_pages: PLAN_PAGES.free };

  const allowedPages = (() => {
    const pages = planDef?.allowed_pages;
    if (!pages) return PLAN_PAGES[planKey] ?? null;
    if (pages.length === 0) return null; // enterprise = all
    return pages;
  })();

  // Guard uses planReady (not loading) so spinner only shows until first DB fetch
  const isPageAllowed = (pageKey) => {
    if (isSuperAdmin) return true;      // owner bypasses subscription
    if (!planReady) return false;       // block until DB truth arrives
    if (trialExpired) return false;
    if (allowedPages === null) return true;
    return allowedPages.includes(pageKey);
  };

  const canAddProduct = (currentCount) => {
    if (isSuperAdmin) return true;      // owner bypasses product limit
    if (trialExpired) return false;
    const limit = planDef.product_limit ?? 7;
    if (limit === -1) return true;
    return currentCount < limit;
  };

  const selectPlan = async (key) => {
    // Optimistically update localStorage immediately
    localStorage.setItem(SELECTED_PLAN_KEY, key);
    if (!localStorage.getItem(TRIAL_START_KEY)) {
      localStorage.setItem(TRIAL_START_KEY, String(Date.now()));
    }

    const token = localStorage.getItem('accessToken');
    try {
      if (token) {
        const res = await axios.post(
          `${API}/plans/select/`,
          { plan_key: key },
          { headers: authHeaders() }
        );
        const fresh = res.data;
        writeCache(fresh);
        if (fresh.trial_start) localStorage.setItem(TRIAL_START_KEY, String(new Date(fresh.trial_start).getTime()));
        setSub({ ...fresh, _source: 'db' });
      } else {
        // No token yet (pre-registration) — just update local state
        setSub(computeLocalSub());
      }
    } catch {
      // Backend down — local state already updated above
      setSub(computeLocalSub());
    }
    window.dispatchEvent(new Event('plan-changed'));
  };

  return (
    <PlanContext.Provider value={{
      sub, planKey, planDef, trialExpired: isSuperAdmin ? false : trialExpired, daysLeft,
      isPageAllowed, canAddProduct, selectPlan,
      loading, planReady, isSuperAdmin, refetch: fetchSub,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
