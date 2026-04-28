import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft,
  CheckCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { getFeaturesForBusinessType } from '../businessTypeFeatures';

const API_URL = 'http://localhost:8000/api';

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessTypeDisplay: '',
    industryDescription: ''
  });

  useEffect(() => {
    fetchBusinessTypes();
  }, []);



  const fetchBusinessTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/core/auth/business-types/`);
      const types = (response.data.business_types || []).map(type => ({
        label: type.label || type.name || type,
        value: type.value || type.code || type,
        description: type.description || 'Business category'
      }));
      setBusinessTypes(types);
    } catch (error) {
      console.error('Error fetching business types:', error);
    }
  };

  const fuse = new Fuse(businessTypes, {
    keys: ['label', 'description', 'value'],
    threshold: 0.4,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'businessTypeDisplay') {
      let bestMatch = null;
      if (value && businessTypes.length > 0) {
        const results = fuse.search(value);
        if (results.length > 0) {
          bestMatch = results[0].item;
        }
      }
      setSuggestedType(bestMatch);
      setFormData({
        ...formData,
        businessTypeDisplay: value,
        businessType: bestMatch ? bestMatch.value : ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  const handleSelectBusinessType = (type) => {
    setFormData({
      ...formData,
      businessType: type.value,
      businessTypeDisplay: type.label
    });
    setShowDropdown(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.businessType) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/core/tenants/create-organization/`,
        {
          business_name: formData.businessName,
          business_type: formData.businessType,
          industry_description: formData.industryDescription
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-organizations');
        }, 2000);
      }
    } catch (err) {
      console.error('Organization creation error:', err);
      setError(err.response?.data?.error || 'Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Organization Created!
            </h2>
            <p className="text-gray-600 mb-6">
              Your new business has been configured. Redirecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/my-organizations" className="inline-flex items-center space-x-2 mb-6 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to My Organizations</span>
          </Link>
          
          <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Organization
          </h1>
          <p className="text-gray-600">
            Set up another business with customized features
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My New Business"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="businessTypeDisplay"
                required
                value={formData.businessTypeDisplay}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your business type..."
                autoComplete="off"
              />
              {formData.businessTypeDisplay && suggestedType && (
                <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded px-3 py-2">
                  Closest match: <span className="font-semibold">{suggestedType.label}</span>
                  <span className="ml-2 text-gray-500">({suggestedType.description})</span>
                </div>
              )}
              {formData.businessTypeDisplay && !suggestedType && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                  No matching business type found. Your entry will be saved as is.
                </div>
              )}
              {/* Feature suggestions */}
              {formData.businessType && getFeaturesForBusinessType(formData.businessType).length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Suggested features for this business type:</div>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {getFeaturesForBusinessType(formData.businessType).map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Description (Optional)
              </label>
              <textarea
                name="industryDescription"
                value={formData.industryDescription}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us more about this business..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">What you'll get:</p>
                  <ul className="space-y-1">
                    <li>• Separate data storage for this business</li>
                    <li>• Independent user management</li>
                    <li>• Industry-specific features and terminology</li>
                    <li>• Customized dashboard and analytics</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Creating Organization...' : 'Create Organization'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
