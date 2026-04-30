import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { applyThemeColors } from '../utils/themeUtils';
import { defaultPricingSettings } from '../utils/pricingHelpers';

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

/**
 * Configuration Context
 * Provides business configuration, feature toggles, and dynamic labels throughout the app
 */

const ConfigContext = createContext(null);

// ---------- helpers: pricing settings shape (snake <-> camel) ----------
const normalizePricingFromApi = (apiData) => {
  if (!apiData) return null;
  return {
    ...defaultPricingSettings,
    ...apiData,
    defaultCurrency: apiData.default_currency ?? apiData.defaultCurrency ?? defaultPricingSettings.defaultCurrency,
    wholesaleThreshold: apiData.wholesale_threshold ?? apiData.wholesaleThreshold ?? defaultPricingSettings.wholesaleThreshold,
    wholesaleAvailability: apiData.wholesale_availability ?? apiData.wholesaleAvailability ?? defaultPricingSettings.wholesaleAvailability,
    pricePriority: apiData.price_priority ?? apiData.pricePriority ?? defaultPricingSettings.pricePriority,
    priceMissing: apiData.price_missing ?? apiData.priceMissing ?? defaultPricingSettings.priceMissing,
    enableTax: apiData.enable_tax ?? apiData.enableTax ?? defaultPricingSettings.enableTax,
    taxRate: apiData.tax_rate ?? apiData.taxRate ?? defaultPricingSettings.taxRate,
    taxMode: apiData.tax_mode ?? apiData.taxMode ?? defaultPricingSettings.taxMode,
    orderLimitMin: apiData.order_limit_min ?? apiData.orderLimitMin ?? defaultPricingSettings.orderLimitMin,
    orderLimitMax: apiData.order_limit_max ?? apiData.orderLimitMax ?? defaultPricingSettings.orderLimitMax,
    country: apiData.country ?? defaultPricingSettings.country,
  };
};

const pricingToApi = (settings) => ({
  default_currency: settings.defaultCurrency ?? settings.default_currency,
  country: settings.country,
  wholesale_threshold: settings.wholesaleThreshold ?? settings.wholesale_threshold,
  wholesale_availability: settings.wholesaleAvailability ?? settings.wholesale_availability,
  price_priority: settings.pricePriority ?? settings.price_priority,
  price_missing: settings.priceMissing ?? settings.price_missing,
  enable_tax: settings.enableTax ?? settings.enable_tax,
  tax_rate: settings.taxRate ?? settings.tax_rate,
  tax_mode: settings.taxMode ?? settings.tax_mode,
  order_limit_min: settings.orderLimitMin ?? settings.order_limit_min,
  order_limit_max: settings.orderLimitMax ?? settings.order_limit_max,
});

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    businessType: null,
    features: null,
    labels: null,
    theme: null,
    logo: localStorage.getItem('cachedLogo') || null,
    pricingSettings: null,
    allowedPages: null,
    firstAccessiblePath: null,
    onboardingCompleted: false,
    loading: true,
    error: null
  });
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('cachedUserProfile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  // Fetch configuration from backend
  const fetchConfiguration = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setConfig(prev => ({ ...prev, loading: false, error: 'No authentication token' }));
        return;
      }

      const response = await axios.get(`${API_BASE}/core/configuration/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConfig({
        businessType: response.data.business_type,
        features: response.data.features,
        labels: response.data.labels,
        theme: response.data.theme || null,
        logo: response.data.theme?.logo_url || null,
        pricingSettings: normalizePricingFromApi(response.data.pricing_settings),
        // Preserve empty array (no access) instead of defaulting to null/full access
        allowedPages: response.data.allowed_pages ?? null,
        firstAccessiblePath: response.data.first_accessible_path || null,
        onboardingCompleted: response.data.onboarding_completed,
        loading: false,
        error: null
      });

      // Apply theme colors if available and cache to reduce page flash on reload
      if (response.data.theme) {
        applyThemeColors(
          response.data.theme.primary_color || '#3B82F6',
          response.data.theme.secondary_color || '#10B981',
          response.data.theme.accent_color || '#8B5CF6'
        );
        try {
          localStorage.setItem('cachedTheme', JSON.stringify(response.data.theme));
          // Cache logo URL separately for instant access
          const logoUrl = response.data.theme.logo_url || null;
          if (logoUrl) localStorage.setItem('cachedLogo', logoUrl);
          else localStorage.removeItem('cachedLogo');
        } catch (err) {
          // ignore storage errors (e.g., private mode)
        }
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setConfig(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || 'Failed to load configuration'
      }));
    }
  };

  // Fetch pricing settings directly (for pages that need freshest state)
  const fetchPricingSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const response = await axios.get(`${API_BASE}/core/pricing-settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalized = normalizePricingFromApi(response.data);
      setConfig(prev => ({ ...prev, pricingSettings: normalized }));
      return normalized;
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      return null;
    }
  };

  // Reload configuration
  const reloadConfig = () => {
    setConfig(prev => ({ ...prev, loading: true }));
    fetchConfiguration();
  };

  // Update feature toggle
  const updateFeature = async (featureKey, enabled) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE}/core/feature-toggles/bulk_update/`,
        {
          features: { [featureKey]: enabled }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setConfig(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureKey]: enabled
        }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating feature:', error);
      return { success: false, error: error.message };
    }
  };

  // Update terminology
  const updateLabel = async (entity, label, labelPlural) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE}/core/terminology/bulk_update/`,
        {
          labels: {
            [entity]: {
              label: label,
              label_plural: labelPlural
            }
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setConfig(prev => ({
        ...prev,
        labels: {
          ...prev.labels,
          [entity]: label,
          [`${entity}_plural`]: labelPlural
        }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating label:', error);
      return { success: false, error: error.message };
    }
  };

  // Update theme (colors + optional logo)
  const updateTheme = async (primaryColor, secondaryColor, accentColor, selectedPaletteId, logoFile = null) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return { success: false, error: 'Not authenticated' };

      // Always send full theme payload; multipart works with or without a file
      const formData = new FormData();
      formData.append('primary_color', primaryColor);
      formData.append('secondary_color', secondaryColor);
      formData.append('accent_color', accentColor);
      if (selectedPaletteId) formData.append('selected_palette_id', selectedPaletteId);
      if (logoFile) formData.append('logo', logoFile);

      // Get current theme ID or create new one
      const themesResponse = await axios.get(
        `${API_BASE}/core/theme/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const themeId = themesResponse.data.results?.[0]?.id || themesResponse.data[0]?.id;

      if (themeId) {
        await axios.put(
          `${API_BASE}/core/theme/${themeId}/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        await axios.post(
          `${API_BASE}/core/theme/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      // Reload configuration to get updated theme (logo URL, etc.)
      await fetchConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Error updating theme:', error);
      return { success: false, error: error.message };
    }
  };

  // Apply business preset
  const applyPreset = async (businessType) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // First get the business config ID
      const configsResponse = await axios.get(
        `${API_BASE}/core/business-config/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const configId = configsResponse.data.results?.[0]?.id || configsResponse.data[0]?.id;

      if (!configId) {
        throw new Error('No business configuration found');
      }

      // Apply preset
      await axios.post(
        `${API_BASE}/core/business-config/${configId}/apply_preset/`,
        { business_type: businessType },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Reload configuration
      await fetchConfiguration();

      return { success: true };
    } catch (error) {
      console.error('Error applying preset:', error);
      return { success: false, error: error.message };
    }
  };

  // Update pricing settings and persist to backend
  const updatePricingSettings = async (settings) => {
    try {
      const token = localStorage.getItem('accessToken');
      const payload = pricingToApi(settings);
      await axios.post(
        `${API_BASE}/core/pricing-settings/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfig(prev => ({ ...prev, pricingSettings: normalizePricingFromApi(settings) }));
      return { success: true };
    } catch (error) {
      console.error('Error updating pricing settings:', error);
      return { success: false, error: error.message };
    }
  };

  // Effect 1: logo — pre-apply cached theme instantly, then fetch from API
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cachedTheme');
      if (cached) {
        const theme = JSON.parse(cached);
        applyThemeColors(
          theme.primary_color || '#3B82F6',
          theme.secondary_color || '#10B981',
          theme.accent_color || '#8B5CF6'
        );
      }
    } catch (err) {
      // ignore malformed cache
    }
    fetchConfiguration();
  }, []);

  // Effect 2: userProfile — seed from localStorage, then fetch fresh from API
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    axios.get(`${API_BASE}/core/auth/profile/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const fresh = res.data.user || res.data;
      setUserProfile(fresh);
      try { localStorage.setItem('cachedUserProfile', JSON.stringify(fresh)); } catch {}
    }).catch(() => {
      // keep cached value on failure
    });
  }, []);

  const value = {
    ...config,
    userProfile,
    setUserProfile,
    reloadConfig,
    updateFeature,
    updateLabel,
    updateTheme,
    applyPreset,
    updatePricingSettings,
    fetchPricingSettings
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook to access configuration
 */
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(featureKey) {
  const { features } = useConfig();
  return features[featureKey] === true;
}

/**
 * Hook to get dynamic label
 * @param {string} entity - Entity name (resource, transaction, entity, inventory, etc.)
 * @param {boolean} plural - Whether to return plural form
 * @returns {string} - The label
 */
export function useLabel(entity, plural = false) {
  const { labels } = useConfig();
  const key = plural ? `${entity}_plural` : entity;
  return labels[key] || (plural ? `${entity}s` : entity);
}

/**
 * Hook to get all labels
 */
export function useLabels() {
  const { labels } = useConfig();
  const safe = labels || {};

  return {
    // Singular forms
    resource: safe.resource || 'Item',
    transaction: safe.transaction || 'Transaction',
    entity: safe.entity || 'Contact',
    inventory: safe.inventory || 'Stock',
    payment: safe.payment || 'Payment',
    schedule: safe.schedule || 'Schedule',
    
    // Plural forms
    resources: safe.resource_plural || 'Items',
    transactions: safe.transaction_plural || 'Transactions',
    entities: safe.entity_plural || 'Contacts',
    inventories: safe.inventory_plural || 'Stock',
    payments: safe.payment_plural || 'Payments',
    schedules: safe.schedule_plural || 'Schedules',
  };
}

/**
 * Hook to get multiple features at once
 */
export function useFeatures() {
  const { features } = useConfig();
  return features;
}

/**
 * Hook to get page-level access control list
 */
export function useAllowedPages() {
  const { allowedPages } = useConfig();
  // Preserve empty array (no access) instead of collapsing to null/full access
  return allowedPages === undefined ? null : allowedPages;
}
