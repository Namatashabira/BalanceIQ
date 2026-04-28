import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Mail, Phone, Save, Image as ImageIcon, X as XIcon } from 'lucide-react';
import axios from 'axios';
import { useConfig } from '../../context/ConfigContext';
import { useSavingAction } from '../../hooks/useSavingAction';

const API_URL = 'http://127.0.0.1:8000/api/core';

export default function BusinessSettings() {
    const getTenantUUID = () => {
      const activeTenant = JSON.parse(localStorage.getItem('activeTenant'));
      return activeTenant?.uuid || activeTenant?.id;
    };
    const getAuthHeaders = () => ({
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    });
  const { reloadConfig, theme } = useConfig();
  const { saving: savingSubmit, runWithSaving } = useSavingAction({
    successMessage: 'Business information saved successfully!',
    errorLabel: 'saving business settings'
  });
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
    phone: '',
    email: '',
    location: '',
    district: '',
    town: '',
    poBox: '',
    country: 'Uganda',
    taxId: '',
    registrationNumber: '',
    website: '',
    businessLogoUrl: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load business info from API on mount
  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      setIsLoading(true);
      const tenant_uuid = getTenantUUID();
      const response = await axios.get(`${API_URL}/business-settings/`, {
        params: { tenant_uuid },
        headers: getAuthHeaders(),
      });
      setBusinessInfo(prev => ({ ...prev, ...response.data }));
      if (response.data?.businessName) {
        localStorage.setItem('businessName', response.data.businessName);
      }
      if (response.data?.businessLogoUrl) {
        setLogoPreview(response.data.businessLogoUrl);
        localStorage.setItem('businessLogoUrl', response.data.businessLogoUrl);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching business settings:', err);
      setError('Failed to load business settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result || '');
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setBusinessInfo(prev => ({ ...prev, businessLogoUrl: '' }));
    localStorage.removeItem('businessLogoUrl');
  };

  // If theme provides a logo and business logo is empty, hydrate from theme so it appears in Business Settings and sidebar.
  useEffect(() => {
    if (theme?.logo_url && !businessInfo.businessLogoUrl) {
      setBusinessInfo(prev => ({ ...prev, businessLogoUrl: theme.logo_url }));
      setLogoPreview(theme.logo_url);
      localStorage.setItem('businessLogoUrl', theme.logo_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme?.logo_url]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setIsSaved(false);

      await runWithSaving(async () => {
        console.log('Saving business info:', businessInfo);
        let response;

        if (logoFile) {
          const formData = new FormData();
          Object.entries(businessInfo).forEach(([key, value]) => {
            formData.append(key, value ?? '');
          });
          formData.append('businessLogo', logoFile);
          response = await axios.post(`${API_URL}/business-settings/`, formData, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await axios.post(`${API_URL}/business-settings/`, businessInfo, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          });
        }
        
        console.log('Save response:', response.data);
        
        setIsSaved(true);
        setLogoFile(null);
        setTimeout(() => setIsSaved(false), 5000);

        const savedBusinessName = response.data?.businessName || businessInfo.businessName;
        if (savedBusinessName) {
          localStorage.setItem('businessName', savedBusinessName);
        }

        const savedLogoUrl = response.data?.businessLogoUrl || businessInfo.businessLogoUrl || logoPreview;
        if (savedLogoUrl) {
          localStorage.setItem('businessLogoUrl', savedLogoUrl);
          setLogoPreview(savedLogoUrl);
          setBusinessInfo(prev => ({ ...prev, businessLogoUrl: savedLogoUrl }));
        }

        // Refresh global config so sidebar/navbar pick up the new logo if exposed there
        if (reloadConfig) {
          reloadConfig();
        }
      });
    } catch (err) {
      console.error('Error saving business settings:', err);
      console.error('Error details:', err.response?.data);
      const message = err.response?.data?.message || 'Failed to save business settings. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !businessInfo.businessName) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading business settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <Building2 size={32} className="text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Business Settings</h2>
            <p className="text-sm text-gray-600">Manage your business information and details</p>
          </div>
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 text-green-800 rounded-lg flex items-center gap-3 shadow-sm animate-pulse">
            <div className="bg-green-500 rounded-full p-1">
              <Save size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Business information saved successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={businessInfo.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="businessType"
                  value={businessInfo.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select business type</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Supermarket">Supermarket</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={businessInfo.phone}
                  onChange={handleChange}
                  placeholder="e.g., +256700123456"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={businessInfo.email}
                  onChange={handleChange}
                  placeholder="business@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Logo URL
                </label>
                <input
                  type="url"
                  name="businessLogoUrl"
                  value={businessInfo.businessLogoUrl}
                  onChange={handleChange}
                  placeholder="https://your-cdn.com/logo.png"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {businessInfo.businessLogoUrl && (
                  <div className="mt-2">
                    <img
                      src={businessInfo.businessLogoUrl}
                      alt="Business logo preview"
                      className="h-16 w-16 rounded object-contain border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Or upload logo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <ImageIcon size={16} />
                      <span className="text-sm">Choose file</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                    </label>
                    {logoFile && <span className="text-sm text-gray-600 truncate max-w-xs">{logoFile.name}</span>}
                    {(logoPreview || businessInfo.businessLogoUrl) && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <XIcon size={14} /> Remove
                      </button>
                    )}
                  </div>
                  {(logoPreview || businessInfo.businessLogoUrl) && (
                    <div className="mt-2">
                      <img
                        src={logoPreview || businessInfo.businessLogoUrl}
                        alt="Business logo preview"
                        className="h-16 w-16 rounded object-contain border"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={businessInfo.website}
                  onChange={handleChange}
                  placeholder="www.yourbusiness.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={businessInfo.location}
                  onChange={handleChange}
                  placeholder="e.g., Plot 123, Main Street"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Town/City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="town"
                  value={businessInfo.town}
                  onChange={handleChange}
                  placeholder="e.g., Kampala"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={businessInfo.district}
                  onChange={handleChange}
                  placeholder="e.g., Kampala"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  P.O. Box <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="poBox"
                  value={businessInfo.poBox}
                  onChange={handleChange}
                  placeholder="e.g., P.O. Box 12345"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={businessInfo.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Legal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail size={20} />
              Legal & Tax Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Identification Number (TIN)
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={businessInfo.taxId}
                  onChange={handleChange}
                  placeholder="Enter TIN"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={businessInfo.registrationNumber}
                  onChange={handleChange}
                  placeholder="Enter registration number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={isLoading || savingSubmit}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              {isLoading || savingSubmit ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Business Information
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

