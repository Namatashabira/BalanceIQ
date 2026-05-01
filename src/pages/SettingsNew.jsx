// ...existing code...
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
import { Settings as SettingsIcon, Tag, Sparkles, ShieldCheck, Coins, ToggleRight, Save, RefreshCw, Edit2, Check, Loader2, Palette, Upload, X, Building2, FileText, CreditCard } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { defaultPricingSettings } from '../utils/pricingHelpers';
import BusinessSettings from '../components/settings/BusinessSettings';
import TemplatePage from './TemplatePage';
import AdminPaymentRequests from './AdminPaymentRequests';
import { applyThemeColors } from '../utils/themeUtils';
import { useSavingAction } from '../hooks/useSavingAction';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('terminology');
  const { user } = useAuth();
  const isSuperAdmin = user?.is_staff || user?.is_superuser || user?.role === 'superadmin';
  const { 
    businessType: _businessType, 
    features, 
    labels, 
    theme,
    allowedPages,
    updateFeature, 
    updateLabel,
    updateTheme,
    updatePricingSettings,
    pricingSettings: pricingSettingsFromContext,
    reloadConfig,
    loading: _loading 
  } = useConfig();
  const themeSaving = useSavingAction({ successMessage: 'Theme saved successfully!', errorLabel: 'saving theme' });
  const featureSaving = useSavingAction({ successMessage: 'Feature updated successfully', errorLabel: 'updating feature' });
  const labelSaving = useSavingAction({ successMessage: 'Label saved!', errorLabel: 'saving label' });
  const pricingSaving = useSavingAction({ successMessage: 'Pricing settings saved', errorLabel: 'saving pricing settings' });
  const [message, setMessage] = useState(null);
  const [invites, setInvites] = useState([]);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEditPages, setInviteEditPages] = useState([]);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteToast, setInviteToast] = useState(null);
  const [accessForm, setAccessForm] = useState({ name: '', email: '', allowed_pages: [] });
  const [assignForm, setAssignForm] = useState({ email: '', allowed_pages: [] });
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessMessage, setAccessMessage] = useState(null);

  // Local state for terminology editing - track which field is being edited
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(null);
  const [fieldMessage, setFieldMessage] = useState({});
  const [editedLabels, setEditedLabels] = useState({
    resource: (labels && labels.resource) ? labels.resource : 'Item',
    resource_plural: (labels && (labels.resources || labels.resource_plural)) ? (labels.resources || labels.resource_plural) : 'Items',
    transaction: (labels && labels.transaction) ? labels.transaction : 'Transaction',
    transaction_plural: (labels && (labels.transactions || labels.transaction_plural)) ? (labels.transactions || labels.transaction_plural) : 'Transactions',
    entity: (labels && labels.entity) ? labels.entity : 'Contact',
    entity_plural: (labels && (labels.entities || labels.entity_plural)) ? (labels.entities || labels.entity_plural) : 'Contacts',
    inventory: (labels && labels.inventory) ? labels.inventory : 'Stock',
    inventory_plural: (labels && (labels.inventories || labels.inventory_plural)) ? (labels.inventories || labels.inventory_plural) : 'Stock',
  });

  // Theme state
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [predictedColors, setPredictedColors] = useState([]);
  const [analyzingLogo, setAnalyzingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Product & Currency settings state
  const [pricingSettings, setPricingSettings] = useState(defaultPricingSettings);

  const toggleWholesaleAvailability = (value) => {
    setPricingSettings((prev) => {
      const exists = prev.wholesaleAvailability.includes(value);
      const next = exists
        ? prev.wholesaleAvailability.filter((v) => v !== value)
        : [...prev.wholesaleAvailability, value];
      return { ...prev, wholesaleAvailability: next.length ? next : ['everyone'] };
    });
  };

  const setPriceMissing = (value) => setPricingSettings((p) => ({ ...p, priceMissing: value }));
  const setTaxMode = (value) => setPricingSettings((p) => ({ ...p, taxMode: value }));
  const setEnableTax = (value) => setPricingSettings((p) => ({ ...p, enableTax: value }));
  const setPricePriority = (value) => setPricingSettings((p) => ({ ...p, pricePriority: value }));

  // hydrate pricing settings from context
  useEffect(() => {
    if (pricingSettingsFromContext) {
      setPricingSettings({ ...defaultPricingSettings, ...pricingSettingsFromContext });
    }
  }, [pricingSettingsFromContext]);

  // Load invites when visiting settings
  const loadInvites = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/core/access/invite/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvites(res.data || []);
    } catch (err) {
      console.error('Failed to load invites', err);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  // Handler: Palette selection
  const handlePaletteSelect = (palette) => {
    setSelectedPalette(palette.id);
    setPrimaryColor(palette.colors[0]);
    setSecondaryColor(palette.colors[1]);
    setAccentColor(palette.colors[2]);
    setPredictedColors([]);
    // Apply colors immediately as preview (without saving)
    applyThemeColors(palette.colors[0], palette.colors[1], palette.colors[2]);
  };

  // Handler: Logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        // Optionally, analyze logo colors here if needed
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Remove logo
  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    setPredictedColors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Predefined color palettes (15 palettes - primary color is used as identifier)
  // Backend stores only the primary color and looks up the full triplet
  const colorPalettes = [
    { id: 1, colors: ['#00A09D', '#F8F8F8', '#F3D2C1'] },
    { id: 2, colors: ['#6C63FF', '#F8F8F8', '#F7C6D0'] },
    { id: 3, colors: ['#875A7B', '#F8F8F8', '#F4B6C2'] },
    { id: 4, colors: ['#A9A9F5', '#F8F8F8', '#B8F5C2'] },
    { id: 5, colors: ['#B0B3F8', '#F8F8F8', '#FFF1D6'] },
    { id: 6, colors: ['#F06050', '#F8F8F8', '#FFD6B3'] },
    { id: 7, colors: ['#D97380', '#F8F8F8', '#E3ECFA'] },
    { id: 8, colors: ['#E2A76F', '#F8F8F8', '#D7D2CB'] },
    { id: 9, colors: ['#F7CD1F', '#F8F8F8', '#5F9C7E'] },
    { id: 10, colors: ['#5F9C7E', '#F8F8F8', '#E9E4DF'] },
    { id: 11, colors: ['#00C0EF', '#F8F8F8', '#C0392B'] },
    { id: 12, colors: ['#3F51B5', '#F8F8F8', '#A6A6A6'] },
    { id: 13, colors: ['#34495E', '#F8F8F8', '#F5E1C8'] },
    { id: 14, colors: ['#1ABC9C', '#F8F8F8', '#2E7D5A'] },
    { id: 15, colors: ['#2C3E50', '#F8F8F8', '#C0392B'] },
    { id: 16, colors: ['#0D9488', '#0F172A', '#F8FAFC'] },
    { id: 17, colors: ['#4F46E5', '#111827', '#F9FAFB'] },
    { id: 18, colors: ['#10B981', '#1F2937', '#F3F4F6'] },
    { id: 19, colors: ['#2563EB', '#1E293B', '#FFFFFF'] },
    { id: 20, colors: ['#0F3D2E', '#1F2933', '#F8FAF9'] },
    { id: 21, colors: ['#7C3AED', '#1F1F2E', '#FAFAFB'] },
    { id: 22, colors: ['#F97316', '#1F2937', '#FFF7ED'] },
    { id: 23, colors: ['#E11D48', '#334155', '#FFFFFF'] },
    { id: 24, colors: ['#06B6D4', '#020617', '#F1F5F9'] },
    { id: 25, colors: ['#111827', '#374151', '#F9FAFB'] },
  ];

  // Initialize theme from context
  useEffect(() => {
    if (theme) {
      setPrimaryColor(theme.primary_color || '#3B82F6');
      setSecondaryColor(theme.secondary_color || '#10B981');
      setAccentColor(theme.accent_color || '#8B5CF6');
      setSelectedPalette(theme.selected_palette_id || null);
      setLogoPreview(theme.logo_url || null);
      
      // Apply theme colors to CSS variables
      applyThemeColors(
        theme.primary_color || '#3B82F6',
        theme.secondary_color || '#10B981',
        theme.accent_color || '#8B5CF6'
      );
    }
  }, [theme]);
// ...existing code...

  // Handle color changes with immediate preview
  const handlePrimaryColorChange = (color) => {
    setPrimaryColor(color);
    applyThemeColors(color, secondaryColor, accentColor);
  };

  const handleSecondaryColorChange = (color) => {
    setSecondaryColor(color);
    applyThemeColors(primaryColor, color, accentColor);
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
    applyThemeColors(primaryColor, secondaryColor, color);
  };

  const saveTheme = async () => {
    try {
      await themeSaving.runWithSaving(async () => {
        const result = await updateTheme(
          primaryColor, 
          secondaryColor, 
          accentColor, 
          selectedPalette,
          logo
        );

        if (!result.success) {
          throw new Error('Failed to save theme');
        }

        setMessage({ type: 'success', text: 'Theme saved successfully!' });
        // Apply theme colors dynamically
        applyThemeColors(primaryColor, secondaryColor, accentColor);
      });
    } catch (error) {
      const errMsg = error?.message || 'Failed to save theme';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Feature toggles configuration (aligned with sidebar visibility)
  const featureConfig = [
    { key: 'dashboard_enabled', label: 'Dashboard', description: 'Show the main dashboard overview' },
    { key: 'organizations_enabled', label: 'My Organizations', description: 'Allow switching between organizations/locations' },
    { key: 'product_enabled', label: 'Products/Services', description: 'Show catalog/product management' },
    { key: 'inventory_enabled', label: 'Inventory Management', description: 'Enable stock tracking and inventory management' },
    { key: 'orders_enabled', label: 'Orders/Transactions', description: 'Show order/transaction management screens' },
    { key: 'customers_enabled', label: 'Customers/Contacts', description: 'Show customer/client/student management' },
    { key: 'scheduling_enabled', label: 'Scheduling & Appointments', description: 'Enable appointment scheduling and calendar' },
    { key: 'manual_entry_enabled', label: 'Manual Entry', description: 'Allow manual entry of new orders/transactions' },
    { key: 'payments_enabled', label: 'Payments & Receipts', description: 'Enable payment processing and receipt lookup' },
    { key: 'partial_payments_enabled', label: 'Partial Payments', description: 'Allow partial/installment payments' },
    { key: 'analytics_enabled', label: 'Analytics', description: 'Show analytics dashboards' },
    { key: 'ai_insights_enabled', label: 'AI Insights', description: 'Show AI-driven insights and recommendations' },
    { key: 'accounting_enabled', label: 'Accounting', description: 'Show accounting/finance workspace' },
    { key: 'enrollment_enabled', label: 'Enrollment', description: 'Show enrollment/registration workspace' },
    { key: 'approval_required', label: 'Approval Workflow', description: 'Require approval for transactions' },
    { key: 'delivery_enabled', label: 'Delivery Management', description: 'Enable delivery tracking' },
    { key: 'batch_tracking', label: 'Batch/Lot Tracking', description: 'Track batch numbers for products' },
    { key: 'expiry_tracking', label: 'Expiry Date Tracking', description: 'Track product expiry dates' },
  ];

  // Page access options (same keys as featureConfig nav gating)
  const pageOptions = featureConfig
    .filter((f) => !['approval_required', 'delivery_enabled', 'batch_tracking', 'expiry_tracking'].includes(f.key))
    .map(({ key, label }) => ({ key, label }));

  // Handle feature toggle
  const handleFeatureToggle = async (featureKey) => {
    const current = features?.[featureKey] !== false;
    const newValue = !current;
    try {
      await featureSaving.runWithSaving(async () => {
        const result = await updateFeature(featureKey, newValue);
        if (!result.success) {
          throw new Error('Failed to update feature');
        }
        setMessage({ type: 'success', text: 'Feature updated successfully' });
      });
    } catch (error) {
      const errMsg = error?.message || 'Failed to update feature';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const togglePageSelection = (formSetter, formState, pageKey) => {
    formSetter((prev) => {
      const exists = (formState.allowed_pages || []).includes(pageKey);
      const nextAllowed = exists
        ? (formState.allowed_pages || []).filter((k) => k !== pageKey)
        : [...(formState.allowed_pages || []), pageKey];
      return { ...prev, allowed_pages: nextAllowed };
    });
  };

  const toggleInvitePage = (pageKey) => {
    setInviteEditPages((prev) => {
      const exists = prev.includes(pageKey);
      return exists ? prev.filter((k) => k !== pageKey) : [...prev, pageKey];
    });
  };

  const submitInvite = async () => {
    setAccessSaving(true);
    setAccessMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(
        `${API_BASE}/core/access/invite/`,
        accessForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccessMessage({ type: 'success', text: 'Invite created. OTP generated.' });
      setAccessForm({ name: '', email: '', allowed_pages: [] });
      if (res.data?.invite) {
        setInvites((prev) => [res.data.invite, ...prev.filter((i) => i.id !== res.data.invite.id)]);
      } else {
        loadInvites();
      }
    } catch (err) {
      const text = err.response?.data?.error || 'Failed to create invite';
      setAccessMessage({ type: 'error', text });
    } finally {
      setAccessSaving(false);
      setTimeout(() => setAccessMessage(null), 4000);
    }
  };

  const submitAccessUpdate = async () => {
    setAccessSaving(true);
    setAccessMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE}/core/access/pages/`,
        assignForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccessMessage({ type: 'success', text: 'Access updated' });
    } catch (err) {
      const text = err.response?.data?.error || 'Failed to update access';
      setAccessMessage({ type: 'error', text });
    } finally {
      setAccessSaving(false);
      setTimeout(() => setAccessMessage(null), 4000);
    }
  };

  const openInviteModal = (inv) => {
    setSelectedInvite(inv);
    setInviteEditPages(inv.allowed_pages || []);
    setInviteToast(null);
    setInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setSelectedInvite(null);
    setInviteEditPages([]);
    setInviteSaving(false);
  };

  const saveInviteAccess = async () => {
    if (!selectedInvite) return;
    setInviteSaving(true);
    setInviteToast({ type: 'info', text: 'Saving changes...' });
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE}/core/access/invite/`,
        {
          name: selectedInvite.name,
          email: selectedInvite.email,
          allowed_pages: inviteEditPages,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Simulate a 3s save delay per requirements
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setInviteToast({ type: 'success', text: 'Saved/Updated successfully' });
      await loadInvites();
    } catch (err) {
      const text = err.response?.data?.error || 'Failed to update invite';
      setInviteToast({ type: 'error', text });
    } finally {
      setInviteSaving(false);
      setTimeout(() => setInviteToast(null), 4000);
    }
  };

  // Handle label update
  const handleLabelUpdate = (entity, field, value) => {
    setEditedLabels(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save individual label
  const saveSingleLabel = async (fieldKey, entity) => {
    setSavingField(fieldKey);
    
    // Determine which values to send based on field
    let label, plural;
    if (fieldKey === 'resource') {
      label = editedLabels.resource;
      plural = editedLabels.resource_plural;
      entity = 'resource';
    } else if (fieldKey === 'resource_plural') {
      label = editedLabels.resource;
      plural = editedLabels.resource_plural;
      entity = 'resource';
    } else if (fieldKey === 'transaction') {
      label = editedLabels.transaction;
      plural = editedLabels.transaction_plural;
      entity = 'transaction';
    } else if (fieldKey === 'transaction_plural') {
      label = editedLabels.transaction;
      plural = editedLabels.transaction_plural;
      entity = 'transaction';
    } else if (fieldKey === 'entity') {
      label = editedLabels.entity;
      plural = editedLabels.entity_plural;
      entity = 'entity';
    } else if (fieldKey === 'entity_plural') {
      label = editedLabels.entity;
      plural = editedLabels.entity_plural;
      entity = 'entity';
    } else if (fieldKey === 'inventory') {
      label = editedLabels.inventory;
      plural = editedLabels.inventory_plural;
      entity = 'inventory';
    } else if (fieldKey === 'inventory_plural') {
      label = editedLabels.inventory;
      plural = editedLabels.inventory_plural;
      entity = 'inventory';
    }

    try {
      await labelSaving.runWithSaving(async () => {
        const result = await updateLabel(entity, label, plural);
        if (!result.success) {
          throw new Error('Failed to save');
        }
        setFieldMessage({ [fieldKey]: { type: 'success', text: 'Saved!' } });
        setEditingField(null);
      });
    } catch (error) {
      const errMsg = error?.message || 'Failed to save';
      setFieldMessage({ [fieldKey]: { type: 'error', text: errMsg } });
    } finally {
      setSavingField(null);
      setTimeout(() => setFieldMessage({}), 2000);
    }
  };

  const tabs = [
    { id: 'terminology', label: 'Terminology', icon: Tag },
    { id: 'features', label: 'Features', icon: Sparkles },
    { id: 'access', label: 'Roles & Privacy', icon: ShieldCheck },
    { id: 'pricing', label: 'Product & Currency', icon: Coins },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'template', label: 'Template', icon: FileText },
    ...(isSuperAdmin ? [{ id: 'payments', label: 'Payment Requests', icon: CreditCard }] : []),
  ];

  const handlePricingSave = async () => {
    try {
      await pricingSaving.runWithSaving(async () => {
        const result = await updatePricingSettings(pricingSettings);
        if (!result.success) {
          throw new Error('Failed to save pricing settings');
        }
        setMessage({ type: 'success', text: 'Pricing settings saved' });
      });
    } catch (error) {
      const errMsg = error?.message || 'Failed to save pricing settings';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePricingReset = async () => {
    setPricingSettings(pricingSettingsFromContext ? { ...defaultPricingSettings, ...pricingSettingsFromContext } : defaultPricingSettings);
    setMessage({ type: 'success', text: 'Reverted to saved pricing settings' });
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1 text-sm">Configure your business settings, features, and terminology</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs — scrollable on mobile */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <div className="flex overflow-x-auto scrollbar-hide gap-1 sm:gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        {/* Terminology Tab */}
        {activeTab === 'terminology' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Customize Terminology</h2>
              <p className="text-gray-600 text-sm">
                Customize the labels used throughout the application to match your business terminology.
              </p>
            </div>

            <div className="space-y-6">
              {/* Resource */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource (Singular)
                    <span className="text-gray-500 text-xs ml-2">e.g., Product, Service, Subject</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'resource' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.resource ?? ''}
                          onChange={(e) => handleLabelUpdate('resource', 'resource', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('resource')}
                          disabled={savingField === 'resource'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'resource' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.resource ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('resource')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.resource && (
                    <div className={`mt-1 text-xs ${fieldMessage.resource.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.resource.text}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource (Plural)
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'resource_plural' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.resource_plural ?? ''}
                          onChange={(e) => handleLabelUpdate('resource', 'resource_plural', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('resource_plural')}
                          disabled={savingField === 'resource_plural'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'resource_plural' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.resource_plural ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('resource_plural')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.resource_plural && (
                    <div className={`mt-1 text-xs ${fieldMessage.resource_plural.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.resource_plural.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction (Singular)
                    <span className="text-gray-500 text-xs ml-2">e.g., Order, Visit, Enrollment</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'transaction' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.transaction ?? ''}
                          onChange={(e) => handleLabelUpdate('transaction', 'transaction', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('transaction')}
                          disabled={savingField === 'transaction'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'transaction' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.transaction ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('transaction')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.transaction && (
                    <div className={`mt-1 text-xs ${fieldMessage.transaction.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.transaction.text}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction (Plural)
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'transaction_plural' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.transaction_plural ?? ''}
                          onChange={(e) => handleLabelUpdate('transaction', 'transaction_plural', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('transaction_plural')}
                          disabled={savingField === 'transaction_plural'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'transaction_plural' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.transaction_plural ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('transaction_plural')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.transaction_plural && (
                    <div className={`mt-1 text-xs ${fieldMessage.transaction_plural.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.transaction_plural.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Entity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity (Singular)
                    <span className="text-gray-500 text-xs ml-2">e.g., Customer, Patient, Student</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'entity' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.entity ?? ''}
                          onChange={(e) => handleLabelUpdate('entity', 'entity', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('entity')}
                          disabled={savingField === 'entity'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'entity' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.entity ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('entity')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.entity && (
                    <div className={`mt-1 text-xs ${fieldMessage.entity.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.entity.text}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity (Plural)
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'entity_plural' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.entity_plural ?? ''}
                          onChange={(e) => handleLabelUpdate('entity', 'entity_plural', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('entity_plural')}
                          disabled={savingField === 'entity_plural'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'entity_plural' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.entity_plural ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('entity_plural')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.entity_plural && (
                    <div className={`mt-1 text-xs ${fieldMessage.entity_plural.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.entity_plural.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory (Singular)
                    <span className="text-gray-500 text-xs ml-2">e.g., Stock, Supplies</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'inventory' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.inventory ?? ''}
                          onChange={(e) => handleLabelUpdate('inventory', 'inventory', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('inventory')}
                          disabled={savingField === 'inventory'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'inventory' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.inventory ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('inventory')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.inventory && (
                    <div className={`mt-1 text-xs ${fieldMessage.inventory.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.inventory.text}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory (Plural)
                  </label>
                  <div className="flex items-center gap-2">
                    {editingField === 'inventory_plural' ? (
                      <>
                        <input
                          type="text"
                          value={editedLabels.inventory_plural ?? ''}
                          onChange={(e) => handleLabelUpdate('inventory', 'inventory_plural', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => saveSingleLabel('inventory_plural')}
                          disabled={savingField === 'inventory_plural'}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingField === 'inventory_plural' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                          {editedLabels.inventory_plural ?? ''}
                        </div>
                        <button
                          onClick={() => setEditingField('inventory_plural')}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          <span className="text-sm">Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                  {fieldMessage.inventory_plural && (
                    <div className={`mt-1 text-xs ${fieldMessage.inventory_plural.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {fieldMessage.inventory_plural.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Feature Toggles</h2>
              <p className="text-gray-600 text-sm">
                Enable or disable features based on your business needs. Pages and functionality will appear/disappear accordingly.
              </p>
            </div>

            <div className="space-y-4">
              {featureConfig.map(feature => {
                const isEnabled = features?.[feature.key] !== false;
                return (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{feature.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFeatureToggle(feature.key)}
                      disabled={featureSaving.saving}
                      className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isEnabled ? 'bg-green-600 focus:ring-green-500' : 'bg-gray-300 focus:ring-gray-400'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${feature.label}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Roles & Privacy Tab */}
        {activeTab === 'access' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Roles &amp; Privacy</h2>
              <p className="text-gray-600 text-sm">Invite workers with a one-time password and choose which pages they can access.</p>
            </div>

            {accessMessage && (
              <div className={`p-3 rounded border text-sm ${accessMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                {accessMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Invite worker (OTP)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={accessForm.name}
                      onChange={(e) => setAccessForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={accessForm.email}
                      onChange={(e) => setAccessForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="jane@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pages allowed</label>
                    <div className="grid grid-cols-2 gap-2">
                      {pageOptions.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={(accessForm.allowed_pages || []).includes(opt.key)}
                            onChange={() => togglePageSelection(setAccessForm, accessForm, opt.key)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitInvite}
                    disabled={accessSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 block mx-auto"
                  >
                    {accessSaving ? 'Saving...' : 'Generate OTP & Invite'}
                  </button>

                  <p className="text-xs text-gray-500">The worker will use the generated OTP to log in once and create their own password.</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Update access for existing user</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={assignForm.email}
                      onChange={(e) => setAssignForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="worker@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pages allowed</label>
                    <div className="grid grid-cols-2 gap-2">
                      {pageOptions.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={(assignForm.allowed_pages || []).includes(opt.key)}
                            onChange={() => togglePageSelection(setAssignForm, assignForm, opt.key)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitAccessUpdate}
                    disabled={accessSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 block mx-auto"
                  >
                    {accessSaving ? 'Saving...' : 'Save Access'}
                  </button>
                  <p className="text-xs text-gray-500">Use this to change what pages an existing worker can see.</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[2px] md:text-base">Invites (OTP)</h3>
                  <p className="text-[1px] md:text-xs text-gray-500">Share the OTP with the worker; it expires after 24 hours.</p>
                </div>
                <button onClick={loadInvites} className="text-[1px] md:text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <div className="min-w-[560px] md:min-w-full">
                  <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-[2px] md:text-xs font-semibold py-1.5 px-2 md:px-3">
                    <div className="col-span-2">Name</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">OTP</div>
                    <div className="col-span-2">Expires</div>
                    <div className="col-span-3">Pages</div>
                    <div className="col-span-1 text-right pr-1">Action</div>
                  </div>
                  <div className="divide-y">
                    {invites.length === 0 && (
                      <div className="py-4 px-2 text-center text-gray-500 text-[1px] md:text-sm">No invites yet.</div>
                    )}
                    {invites.map((inv, idx) => (
                      <button
                        key={inv.id}
                          className={`grid grid-cols-12 items-center w-full text-left text-[1px] md:text-sm px-2 md:px-3 py-2 focus:outline-none ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                        onClick={() => openInviteModal(inv)}
                      >
                        <div className="col-span-2 font-semibold text-gray-900 truncate whitespace-nowrap">{inv.name}</div>
                        <div className="col-span-2 text-gray-800 truncate whitespace-nowrap">{inv.email}</div>
                        <div className="col-span-2 font-mono text-gray-800 truncate whitespace-nowrap">{inv.otp}</div>
                          <div className="col-span-2 text-gray-700 text-[1px] md:text-xs truncate whitespace-nowrap">
                          {inv.otp_expires_at ? new Date(inv.otp_expires_at).toLocaleString() : '—'}
                        </div>
                          <div className="col-span-3 text-gray-700 text-[1px] md:text-xs truncate whitespace-nowrap">{(inv.allowed_pages || []).join(', ') || 'None'}</div>
                          <div className="col-span-1 text-right text-[1px] md:text-xs font-semibold">
                          <span className={inv.used ? 'text-green-600' : 'text-amber-600'}>
                            {inv.used ? 'Used' : 'Pending'}
                          </span>
                            <div className="text-blue-600 hover:underline text-[1px] md:text-[10px]">View</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-1">Your current access</h3>
              <p className="text-sm text-gray-700">{(allowedPages || pageOptions.map((p) => p.key)).join(', ')}</p>
              <p className="text-xs text-gray-500 mt-1">If access is empty, you can see everything.</p>
            </div>

            {inviteModalOpen && selectedInvite && (
              <div className="fixed inset-0 bg-white sm:bg-black sm:bg-opacity-40 z-[999] flex items-start justify-center px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-[calc(100%-24px)] sm:max-w-2xl md:max-w-3xl p-3 sm:p-5 relative max-h-[90vh] overflow-y-auto overflow-x-auto text-[3px] sm:text-sm">
                  <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={closeInviteModal}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                  <h3 className="text-[5px] sm:text-lg font-semibold text-gray-900 mb-1">Invite details</h3>
                  <p className="text-[3px] sm:text-sm text-gray-600 mb-4">Review and update allowed pages for this invite.</p>

                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-4 mb-4">
                    <div>
                      <p className="text-[11px] text-gray-500">Name</p>
                      <p className="text-[3px] sm:text-sm font-semibold text-gray-900">{selectedInvite.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Email</p>
                      <p className="text-[3px] sm:text-sm font-semibold text-gray-900">{selectedInvite.email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">OTP</p>
                      <p className="text-[3px] sm:text-sm font-mono text-gray-900">{selectedInvite.otp}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Expires</p>
                      <p className="text-[3px] sm:text-sm text-gray-900">{selectedInvite.otp_expires_at ? new Date(selectedInvite.otp_expires_at).toLocaleString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Status</p>
                      <p className={`text-[3px] sm:text-sm font-semibold ${selectedInvite.used ? 'text-green-600' : 'text-amber-600'}`}>
                        {selectedInvite.used ? 'Used' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-2 sm:p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-[5px] sm:text-sm">Allowed pages</h4>
                      {inviteToast && (
                        <span className={`text-[3px] sm:text-[11px] ${inviteToast.type === 'error' ? 'text-red-600' : inviteToast.type === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                          {inviteToast.text}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
                      {pageOptions.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-1 sm:gap-2 text-[3px] sm:text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={inviteEditPages.includes(opt.key)}
                            onChange={() => toggleInvitePage(opt.key)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={closeInviteModal}
                      className="px-3 py-2 text-[3px] sm:text-sm text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveInviteAccess}
                      disabled={inviteSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 text-[3px] sm:text-sm"
                    >
                      {inviteSaving && <Loader2 size={16} className="animate-spin" />}
                      {inviteSaving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product & Currency Settings Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Product &amp; Currency Settings</h2>
              <p className="text-gray-600 text-sm">Control currencies, wholesale rules, tax handling, and safety defaults.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Global Pricing Rules */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Global Pricing Rules</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Threshold</label>
                    <p className="text-xs text-gray-500 mb-2">Units in one purchase before wholesale price applies.</p>
                    <input
                      type="number"
                      min={1}
                      value={pricingSettings.wholesaleThreshold}
                      onChange={(e) => setPricingSettings((p) => ({ ...p, wholesaleThreshold: Number(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Priority</label>
                    <p className="text-xs text-gray-500 mb-2">Which price to try first when both exist.</p>
                    <div className="space-y-2">
                      {[
                        { id: 'retail-first', label: 'Retail first, then wholesale' },
                        { id: 'wholesale-first', label: 'Wholesale first, then retail' },
                        { id: 'country-first', label: 'Country-specific first, then default' },
                      ].map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="pricePriority"
                            value={opt.id}
                            checked={pricingSettings.pricePriority === opt.id}
                            onChange={() => setPricePriority(opt.id)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale available to</label>
                    <div className="space-y-2 text-sm text-gray-700">
                      {[
                        { id: 'everyone', label: 'Everyone (quantity-based)' },
                        { id: 'wholesalers', label: 'Only approved wholesalers' },
                        { id: 'assigned', label: 'Admin-assigned users' },
                      ].map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pricingSettings.wholesaleAvailability.includes(opt.id)}
                            onChange={() => toggleWholesaleAvailability(opt.id)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency & Country Rules */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Currency &amp; Country Rules</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select
                      value={pricingSettings.defaultCurrency}
                      onChange={(e) => setPricingSettings((p) => ({ ...p, defaultCurrency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="UGX">UGX</option>
                      <option value="KES">KES</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Mapping</label>
                    <p className="text-xs text-gray-500 mb-2">Choose the primary country for this catalog.</p>
                    <select
                      value={pricingSettings.country}
                      onChange={(e) => setPricingSettings((p) => ({ ...p, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UG">Uganda</option>
                      <option value="KE">Kenya</option>
                      <option value="TZ">Tanzania</option>
                      <option value="RW">Rwanda</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rounding</label>
                    <select
                      value={pricingSettings.rounding}
                      onChange={(e) => setPricingSettings((p) => ({ ...p, rounding: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="nearest">Nearest whole</option>
                      <option value="down">Round down</option>
                      <option value="up">Round up</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Taxes & Limits */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Taxes &amp; Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enable tax</label>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="enableTax"
                          value="yes"
                          checked={pricingSettings.enableTax === true}
                          onChange={() => setEnableTax(true)}
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="enableTax"
                          value="no"
                          checked={pricingSettings.enableTax === false}
                          onChange={() => setEnableTax(false)}
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {pricingSettings.enableTax && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Tax mode</p>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="taxMode"
                            value="included"
                            checked={pricingSettings.taxMode === 'included'}
                            onChange={() => setTaxMode('included')}
                          />
                          Tax included in price
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="taxMode"
                            value="checkout"
                            checked={pricingSettings.taxMode === 'checkout'}
                            onChange={() => setTaxMode('checkout')}
                          />
                          Tax calculated at checkout
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax rate (%)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={pricingSettings.taxRate ?? 0}
                          onChange={(e) => setPricingSettings((p) => ({ ...p, taxRate: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">This rate drives receipt tax calculations automatically.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min order qty</label>
                      <input
                        type="number"
                        min={0}
                        value={pricingSettings.orderLimitMin}
                        onChange={(e) => setPricingSettings((p) => ({ ...p, orderLimitMin: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max order qty</label>
                      <input
                        type="number"
                        min={1}
                        value={pricingSettings.orderLimitMax}
                        onChange={(e) => setPricingSettings((p) => ({ ...p, orderLimitMax: Number(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety & Logs */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety &amp; Fallbacks</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">If price missing:</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      {[
                        { id: 'default', label: 'Use default currency price' },
                        { id: 'block', label: 'Block checkout' },
                        { id: 'hide', label: 'Hide product' },
                      ].map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="priceMissing"
                            value={opt.id}
                            checked={pricingSettings.priceMissing === opt.id}
                            onChange={() => setPriceMissing(opt.id)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price change rules</label>
                    <p className="text-xs text-gray-500 mb-2">Lock prices unless changed by admin.</p>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked /> Require admin approval
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" /> Log all overrides
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Price Simulator</p>
                      <p className="text-xs text-gray-600">Preview retail/wholesale with tax.</p>
                    </div>
                    <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Open</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePricingSave}
                disabled={pricingSaving.saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
              >
                {pricingSaving.saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Product &amp; Currency Settings
              </button>
              <button
                onClick={handlePricingReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw size={16} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Brand Theme</h2>
              <p className="text-gray-600 text-sm">
                Choose from predefined color palettes or upload your logo to generate custom colors.
              </p>
            </div>

            <div className="space-y-8">
              {/* Color Palette Selection or Logo Upload */}
              <div>
                <h3 className="text-lg font-medium mb-4">Choose Your Brand Colors</h3>
                
                <div className="flex gap-8 items-start">
                  {/* Predefined Palettes Grid */}
                  <div className="flex-1">
                    <div className="grid grid-cols-5 gap-3">
                      {colorPalettes.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => handlePaletteSelect(palette)}
                          className={`group relative flex items-center gap-0 h-10 rounded-full overflow-hidden transition-all hover:scale-105 ${
                            selectedPalette === palette.id 
                              ? 'ring-4 ring-blue-500 ring-offset-2' 
                              : 'hover:ring-2 hover:ring-gray-300'
                          }`}
                          title={`Palette ${palette.id}`}
                        >
                          {palette.colors.map((color, index) => (
                            <div
                              key={index}
                              className="flex-1 h-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* OR Divider with Upload */}
                  <div className="flex flex-col items-center justify-center gap-4">
                    <span className="text-gray-500 font-medium">OR</span>
                    
                    {logoPreview ? (
                      <div className="relative">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="h-24 w-24 object-contain border-2 border-gray-200 rounded-lg bg-white p-2"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                        {analyzingLogo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                            <Loader2 size={20} className="animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label 
                          htmlFor="logo-upload" 
                          className="cursor-pointer flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                        >
                          <Upload className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Upload</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {predictedColors.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-3">
                      🎨 Colors extracted from your logo:
                    </p>
                    <div className="flex gap-3">
                      {predictedColors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-mono text-gray-600">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Colors Display */}
              <div>
                <h3 className="text-lg font-medium mb-4">Your Brand Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => handlePrimaryColorChange(e.target.value)}
                          className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => handlePrimaryColorChange(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                      <div 
                        className="h-20 rounded-lg border border-gray-200"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <p className="text-xs text-gray-500">Buttons, links, primary actions</p>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => handleSecondaryColorChange(e.target.value)}
                          className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => handleSecondaryColorChange(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                      <div 
                        className="h-20 rounded-lg border border-gray-200"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <p className="text-xs text-gray-500">Success states, highlights</p>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => handleAccentColorChange(e.target.value)}
                          className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={accentColor}
                          onChange={(e) => handleAccentColorChange(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                      <div 
                        className="h-20 rounded-lg border border-gray-200"
                        style={{ backgroundColor: accentColor }}
                      />
                      <p className="text-xs text-gray-500">Badges, tags, special elements</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Preview</h3>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="h-10 w-auto" />
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-shadow"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Primary Button
                        </button>
                        <button 
                          className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-shadow"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          Secondary Button
                        </button>
                        <span 
                          className="px-3 py-2 rounded-full text-white text-sm font-medium shadow-sm"
                          style={{ backgroundColor: accentColor }}
                        >
                          Badge
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveTheme}
                disabled={themeSaving.saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {themeSaving.saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Theme
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <div>
            <BusinessSettings />
          </div>
        )}
        {/* Template Tab */}
        {activeTab === 'template' && <TemplatePage />}
        {/* Payment Requests Tab — superadmin only */}
        {activeTab === 'payments' && isSuperAdmin && <AdminPaymentRequests />}
      </div>
    </div>
  );
}
