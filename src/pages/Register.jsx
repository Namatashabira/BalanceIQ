import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  ArrowLeft,
  CheckCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { getFeaturesForBusinessType } from '../businessTypeFeatures';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000/api';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessTypes, setBusinessTypes] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    businessType: '',
    businessTypeDisplay: ''
  });

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  useEffect(() => {
    if (window.history.state && window.history.state.usr && window.history.state.usr.preselectedBusinessType) {
      const preType = window.history.state.usr.preselectedBusinessType;
      const match = businessTypes.find(t => t.value === preType);
      setFormData((prev) => ({
        ...prev,
        businessTypeDisplay: match ? match.label : preType,
        businessType: preType
      }));
      setSuggestedType(match || { label: preType, value: preType, description: 'Business category' });
    }
  }, [businessTypes]);

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

  const handleNext = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    if (step === 2) {
      if (!formData.businessName || !formData.businessType) {
        setError('Please fill in all required fields');
        return;
      }
    }

    setStep(step + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        business_name: formData.businessName,
        business_type: formData.businessType || 'other',
      };

      // Use the full registration endpoint that creates tenant + config + returns tokens
      const response = await axios.post(`${API_URL}/core/auth/register/`, registrationData);

      if (response.data?.access) {
        // Store tokens immediately — no second login needed
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);

        // Store tenant info
        if (response.data.tenant) {
          localStorage.setItem('activeTenant', JSON.stringify(response.data.tenant));
        }

        // Log the user in via AuthContext
        if (response.data.user) {
          await login(response.data.user);
        }

        setStep(4);
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const backendMsg = err?.response?.data?.error || err?.response?.data?.detail;
      if (backendMsg && /email/i.test(backendMsg) && /exist/i.test(backendMsg)) {
        setError('An account with this email already exists. Please log in or use a different email.');
      } else if (backendMsg && /username/i.test(backendMsg) && /exist/i.test(backendMsg)) {
        setError('This username is already taken. Please choose another.');
      } else if (backendMsg) {
        setError(backendMsg);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 py-8">
      <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 text-gray-600 hover:text-gray-900 transition text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="inline-flex items-center justify-center h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create Your Account</h1>
          <p className="text-gray-600 text-xs">Get started with your business in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center justify-center h-6 w-6 rounded-full font-semibold text-xs ${
                step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i ? <CheckCircle className="h-3 w-3" /> : i}
              </div>
              {i < 3 && <div className={`h-0.5 w-6 mx-1 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="w-full">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2 text-xs">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl text-sm"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Business Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="businessName"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="My Hardware Store"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Type <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="businessTypeDisplay"
                    required
                    value={formData.businessTypeDisplay}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Type your business type..."
                    autoComplete="off"
                    disabled={!!window.history.state?.usr?.preselectedBusinessType}
                  />
                  <input type="hidden" name="businessType" value={formData.businessType} />
                  {formData.businessTypeDisplay && suggestedType && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                      Closest match: <span className="font-semibold">{suggestedType.label}</span>
                      <span className="ml-1 text-gray-500">({suggestedType.description})</span>
                    </div>
                  )}
                  {formData.businessTypeDisplay && !suggestedType && (
                    <div className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      No matching business type found. Your entry will be saved as is.
                    </div>
                  )}
                  {formData.businessType && getFeaturesForBusinessType(formData.businessType).length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] font-semibold text-gray-500 mb-1">Suggested features:</div>
                      <ul className="list-disc list-inside text-xs text-gray-700">
                        {getFeaturesForBusinessType(formData.businessType).map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Industry Description (Optional)</label>
                  <textarea
                    name="industryDescription"
                    value={formData.industryDescription}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Tell us more about your business..."
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl text-sm"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Your Information</h2>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{formData.firstName} {formData.lastName || '(Not provided)'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Username</p>
                      <p className="font-medium">{formData.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Business Name</p>
                      <p className="font-medium">{formData.businessName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Business Type</p>
                    <p className="font-medium">{businessTypes.find(t => t.value === formData.businessType)?.label}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-xs text-blue-800">
                  Your business will be configured with industry-specific features and terminology based on your business type. You can customize these settings after registration.
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50 text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="flex flex-col items-center mt-4 animate-fadeIn text-sm">
                <div className="relative flex items-center justify-center mb-2">
                  <span className="absolute animate-firework1">🎆</span>
                  <span className="absolute animate-firework2">🎇</span>
                  <span className="absolute animate-firework3">✨</span>
                  <span className="text-4xl">🔥</span>
                </div>
                <h2 className="text-xl font-bold text-green-600 mb-1">Welcome to Your Business!</h2>
                <p className="text-gray-700 text-center mb-2">Your account is ready and configured!<br/>Taking you to your dashboard...</p>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600 font-semibold">Setting up your workspace...</span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Firework Animations */}
      <style>{`
        @keyframes firework1 { 0%{opacity:0;transform:scale(0);} 50%{opacity:1;transform:scale(1.2);} 100%{opacity:0;transform:scale(0);} }
        @keyframes firework2 { 0%{opacity:0;transform:scale(0);} 60%{opacity:1;transform:scale(1.1);} 100%{opacity:0;transform:scale(0);} }
        @keyframes firework3 { 0%{opacity:0;transform:scale(0);} 70%{opacity:1;transform:scale(1.3);} 100%{opacity:0;transform:scale(0);} }
        .animate-firework1 { left: -20px; top: -20px; animation: firework1 1.2s infinite; }
        .animate-firework2 { right: -20px; top: -20px; animation: firework2 1.4s infinite; }
        .animate-firework3 { bottom: -20px; animation: firework3 1.6s infinite; }
        .animate-fadeIn { animation: fadeIn 0.7s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
