import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { applyThemeColors } from '../utils/themeUtils';
import { defaultPricingSettings } from '../utils/pricingHelpers';

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

const ConfigContext = createContext(null);

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
    features: {
      dashboard_enabled: true,
      product_enabled: true,
      inventory_enabled: true,
      orders_enabled: true,
      sales_enabled: true,
      customers_enabled: true,
      scheduling_enabled: true,
      manual_entry_enabled: true,
      payments_enabled: true,
      analytics_enabled: true,
      ai_insights_enabled: true,
      accounting_enabled: true,
      enrollment_enabled: true,
      website_builder_enabled: true,
      organizations_enabled: true,
    },
    labels: {
      resource: 'Item',
      resource_plural: 'Items',
      transaction: 'Transaction',
      transaction_plural: 'Transactions',
      entity: 'Contact',
      entity_plural: 'Contacts',
      inventory: 'Stock',
      inventory_plural: 'Stock',
      payment: 'Payment',
      payment_plural: 'Payments',
      schedule: 'Schedule',
      schedule_plural: 'Schedules',
    },
    theme: null,
    logo: localStorage.getItem('cachedLogo') || null,
    schoolInfo: (() => {
      try { return JSON.parse(localStorage.getItem('cachedSchoolInfo') || 'null'); } catch { return null; }
    })(),
    pricingSettings: null,
    allowedPages: null,
    firstAccessiblePath: null,
    onboardingCompleted: false,
    loading: true,
    error: null,
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('cachedUserProfile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const fetchConfiguration = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setConfig(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await axios.get(`${API_BASE}/core/configuration/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfig({
        businessType: response.data.business_type,
        features: response.data.features || config.features,
        labels: response.data.labels || config.labels,
        theme: response.data.theme || null,
        logo: response.data.theme?.logo_url || null,
        pricingSettings: normalizePricingFromApi(response.data.pricing_settings),
        allowedPages: response.data.allowed_pages ?? null,
        firstAccessiblePath: response.data.first_accessible_path || null,
        onboardingCompleted: response.data.onboarding_completed,
        loading: false,
        error: null,
      });

      // Persist school_type so all pages stay in sync
      if (response.data.school_type) {
        localStorage.setItem('schoolType', response.data.school_type);
        try {
          const t = JSON.parse(localStorage.getItem('activeTenant') || '{}');
          t.school_type = response.data.school_type;
          localStorage.setItem('activeTenant', JSON.stringify(t));
        } catch { /* ignore */ }
        window.dispatchEvent(new Event('schoolTypeChanged'));
      }

      // Pre-fetch staff credentials for school tenants so report cards work offline
      if (response.data.business_type === 'school') {
        try {
          const credRes = await axios.get(`${API_BASE}/core/staff-credentials/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (credRes.data?.staff_credentials) {
            localStorage.setItem('staffCredentials', JSON.stringify(credRes.data.staff_credentials));
          }
        } catch { /* keep cached */ }
      }

      // Fetch school info only when business type is school
      if (response.data.business_type === 'school') {
        try {
          const bsRes = await axios.get(`${API_BASE}/core/business-settings/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const bs = bsRes.data;
          const schoolInfo = {
            name: bs.businessName || bs.business_name || '',
            businessName: bs.businessName || bs.business_name || '',
            address: [bs.location, bs.town, bs.district, bs.country].filter(Boolean).join(', '),
            location: bs.location || '',
            town: bs.town || '',
            district: bs.district || '',
            poBox: bs.poBox || bs.po_box || '',
            logo: bs.businessLogoUrl || response.data.theme?.logo_url || null,
            motto: bs.motto || '',
            phone: bs.phone || '',
            email: bs.email || '',
            website: bs.website || '',
            registration_number: bs.registration_number || bs.registrationNumber || '',
            regNumber: bs.registration_number || bs.registrationNumber || '',
          };
          localStorage.setItem('cachedSchoolInfo', JSON.stringify(schoolInfo));
          setConfig(prev => ({ ...prev, schoolInfo }));
        } catch { /* keep cached */ }
      }

      // Apply and cache theme colors
      if (response.data.theme) {
        try {
          applyThemeColors(
            response.data.theme.primary_color || '#3B82F6',
            response.data.theme.secondary_color || '#10B981',
            response.data.theme.accent_color || '#8B5CF6'
          );
          localStorage.setItem('cachedTheme', JSON.stringify(response.data.theme));
          const logoUrl = response.data.theme.logo_url || null;
          if (logoUrl) localStorage.setItem('cachedLogo', logoUrl);
          else localStorage.removeItem('cachedLogo');
        } catch { /* ignore storage errors */ }
      }
    } catch (error) {
      console.warn('Error fetching configuration (using defaults):', error.message);
      setConfig(prev => ({ ...prev, loading: false, error: null }));
    }
  };

  const fetchPricingSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const response = await axios.get(`${API_BASE}/core/pricing-settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalized = normalizePricingFromApi(response.data);
      setConfig(prev => ({ ...prev, pricingSettings: normalized }));
      return normalized;
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      return null;
    }
  };

  const reloadConfig = () => {
    setConfig(prev => ({ ...prev, loading: true }));
    fetchConfiguration();
  };

  const updateFeature = async (featureKey, enabled) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE}/core/feature-toggles/bulk_update/`,
        { features: { [featureKey]: enabled } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfig(prev => ({
        ...prev,
        features: { ...prev.features, [featureKey]: enabled },
      }));
      return { success: true };
    } catch (error) {
      console.error('Error updating feature:', error);
      return { success: false, error: error.message };
    }
  };

  const updateLabel = async (entity, label, labelPlural) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE}/core/terminology/bulk_update/`,
        { labels: { [entity]: { label, label_plural: labelPlural } } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfig(prev => ({
        ...prev,
        labels: { ...prev.labels, [entity]: label, [`${entity}_plural`]: labelPlural },
      }));
      return { success: true };
    } catch (error) {
      console.error('Error updating label:', error);
      return { success: false, error: error.message };
    }
  };

  const updateTheme = async (primaryColor, secondaryColor, accentColor, selectedPaletteId, logoFile = null) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return { success: false, error: 'Not authenticated' };

      const formData = new FormData();
      formData.append('primary_color', primaryColor);
      formData.append('secondary_color', secondaryColor);
      formData.append('accent_color', accentColor);
      if (selectedPaletteId) formData.append('selected_palette_id', selectedPaletteId);
      if (logoFile) formData.append('logo', logoFile);

      const themesResponse = await axios.get(`${API_BASE}/core/theme/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const themeId = themesResponse.data.results?.[0]?.id || themesResponse.data[0]?.id;

      if (themeId) {
        await axios.put(`${API_BASE}/core/theme/${themeId}/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post(`${API_BASE}/core/theme/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      }

      await fetchConfiguration();
      return { success: true };
    } catch (error) {
      console.error('Error updating theme:', error);
      return { success: false, error: error.message };
    }
  };

  const applyPreset = async (businessType) => {
    try {
      const token = localStorage.getItem('accessToken');
      const configsResponse = await axios.get(`${API_BASE}/core/business-config/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const configId = configsResponse.data.results?.[0]?.id || configsResponse.data[0]?.id;
      if (!configId) throw new Error('No business configuration found');

      await axios.post(
        `${API_BASE}/core/business-config/${configId}/apply_preset/`,
        { business_type: businessType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchConfiguration();
      return { success: true };
    } catch (error) {
      console.error('Error applying preset:', error);
      return { success: false, error: error.message };
    }
  };

  const updatePricingSettings = async (settings) => {
    try {
      const token = localStorage.getItem('accessToken');
      const payload = pricingToApi(settings);
      await axios.post(`${API_BASE}/core/pricing-settings/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfig(prev => ({ ...prev, pricingSettings: normalizePricingFromApi(settings) }));
      return { success: true };
    } catch (error) {
      console.error('Error updating pricing settings:', error);
      return { success: false, error: error.message };
    }
  };

  // Pre-apply cached theme instantly, then fetch fresh config
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
    } catch { /* ignore malformed cache */ }

    fetchConfiguration();

    const handleAuthChanged = () => fetchConfiguration();
    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, []);

  // Seed userProfile from API
  useEffect(() => {
    const fetchProfile = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      axios.get(`${API_BASE}/core/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        const fresh = res.data.user || res.data;
        setUserProfile(fresh);
        try { localStorage.setItem('cachedUserProfile', JSON.stringify(fresh)); } catch {}
      }).catch(() => {});
    };
    fetchProfile();
    window.addEventListener('auth-changed', fetchProfile);
    return () => window.removeEventListener('auth-changed', fetchProfile);
  }, []);

  // Seed avatar from backend profile into localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_BASE}/users/profile/get/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const profilePicUrl = data?.profile?.profile_picture_url || data?.profile_picture_url;
        if (profilePicUrl) {
          const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
          if (stored.avatar !== profilePicUrl) {
            stored.avatar = profilePicUrl;
            localStorage.setItem('userProfile', JSON.stringify(stored));
            window.dispatchEvent(new Event('storage'));
          }
        }
      })
      .catch(() => {});
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
    fetchPricingSettings,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
}

export function useFeature(featureKey) {
  const { features } = useConfig();
  return features[featureKey] === true;
}

export function useLabel(entity, plural = false) {
  const { labels } = useConfig();
  const key = plural ? `${entity}_plural` : entity;
  return labels[key] || (plural ? `${entity}s` : entity);
}

export function useLabels() {
  const { labels } = useConfig();
  const safe = labels || {};
  return {
    resource: safe.resource || 'Item',
    transaction: safe.transaction || 'Transaction',
    entity: safe.entity || 'Contact',
    inventory: safe.inventory || 'Stock',
    payment: safe.payment || 'Payment',
    schedule: safe.schedule || 'Schedule',
    resources: safe.resource_plural || 'Items',
    transactions: safe.transaction_plural || 'Transactions',
    entities: safe.entity_plural || 'Contacts',
    inventories: safe.inventory_plural || 'Stock',
    payments: safe.payment_plural || 'Payments',
    schedules: safe.schedule_plural || 'Schedules',
  };
}

export function useFeatures() {
  const { features } = useConfig();
  return features;
}

export function useAllowedPages() {
  const { allowedPages } = useConfig();
  return allowedPages === undefined ? null : allowedPages;
}
