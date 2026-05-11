import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, User, Mail, Lock, ArrowLeft, CheckCircle,
  AlertCircle, Zap, ChevronRight, Cpu, Lightbulb, Gift, Rocket
} from 'lucide-react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { getFeaturesForBusinessType } from '../businessTypeFeatures';
import { useAuth } from '../context/AuthContext';
import SuccessFireworks from '../components/SuccessFireworks';

const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm bg-white text-gray-900 placeholder-gray-400 transition-all hover:border-gray-300';
const iconInputCls = inputCls + ' pl-12';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-2';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', businessName: '', businessType: '',
    businessTypeDisplay: '', industryDescription: '', schoolType: '',
  });

  useEffect(() => { fetchBusinessTypes(); }, []);

  useEffect(() => {
    if (window.history.state?.usr?.preselectedBusinessType) {
      const preType = window.history.state.usr.preselectedBusinessType;
      const match = businessTypes.find(t => t.value === preType);
      setFormData(prev => ({
        ...prev,
        businessTypeDisplay: match ? match.label : preType,
        businessType: preType,
      }));
      setSuggestedType(match || { label: preType, value: preType, description: 'Business category' });
    }
  }, [businessTypes]);

  const fetchBusinessTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/core/auth/business-types/`);
      setBusinessTypes((res.data.business_types || []).map(t => ({
        label: t.label || t.name || t,
        value: t.value || t.code || t,
        description: t.description || 'Business category',
      })));
    } catch {}
  };

  const fuse = new Fuse(businessTypes, { keys: ['label', 'value'], threshold: 0.2 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'businessTypeDisplay') {
      // First try exact label match (case-insensitive)
      const exact = businessTypes.find(
        t => t.label.toLowerCase() === value.toLowerCase() || t.value.toLowerCase() === value.toLowerCase()
      );
      const bestMatch = exact || (value && businessTypes.length ? fuse.search(value)[0]?.item : null) || null;
      setSuggestedType(bestMatch);
      setFormData({ ...formData, businessTypeDisplay: value, businessType: bestMatch ? bestMatch.value : '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password) return setError('Please fill in all required fields');
      if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
      if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    }
    if (step === 2 && (!formData.businessName || !formData.businessType)) return setError('Please fill in all required fields');
    if (step === 2 && formData.businessType === 'school' && !formData.schoolType) return setError('Please select the type of school (Primary or Secondary)');
    setStep(step + 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/core/auth/register/`, {
        username: formData.username, email: formData.email, password: formData.password,
        first_name: formData.firstName, last_name: formData.lastName,
        business_name: formData.businessName, business_type: formData.businessType || 'other',
        ...(formData.businessType === 'school' && formData.schoolType ? { school_type: formData.schoolType } : {}),
      });
      if (res.data?.access) {
        localStorage.setItem('accessToken', res.data.access);
        localStorage.setItem('refreshToken', res.data.refresh);
        if (res.data.tenant) {
          localStorage.setItem('activeTenant', JSON.stringify(res.data.tenant));
          if (res.data.tenant.school_type) localStorage.setItem('schoolType', res.data.tenant.school_type);
        }
        // Apply pre-selected plan from pricing page
        const pendingPlan = localStorage.getItem('selectedPlan');
        if (pendingPlan && pendingPlan !== 'free') {
          try {
            await axios.post(
              `${API_URL}/plans/select/`,
              { plan_key: pendingPlan },
              { headers: { Authorization: `Bearer ${res.data.access}` } }
            );
          } catch {}
        }
        try {
          await axios.get(`${API_URL}/plans/my-subscription/`, {
            headers: { Authorization: `Bearer ${res.data.access}` }
          });
        } catch {}
        window.dispatchEvent(new Event('plan-changed'));
        setRegisteredUser(res.data.user);
        setStep(4);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail;
      if (msg && /email/i.test(msg) && /exist/i.test(msg)) setError('An account with this email already exists.');
      else if (msg && /username/i.test(msg) && /exist/i.test(msg)) setError('This username is already taken.');
      else setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── LEFT: Scrollable Form Panel ─────────────────────────────────── */}
      <div className="w-full lg:w-[60%] flex flex-col min-h-screen overflow-y-auto bg-white">
        <div className="flex-1 px-6 sm:px-10 py-8 flex flex-col">

          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 transition mb-8 font-medium w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          {/* Logo + title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-11 w-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Create Your Account</h1>
              <p className="text-gray-500 text-sm">Join thousands of successful businesses</p>
            </div>
          </div>

          {/* Progress */}
          {step < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Step {Math.min(step, 3)} of 3</span>
                <span className="text-xs font-semibold text-pink-600">
                  {step === 1 && 'Account Setup'}
                  {step === 2 && 'Business Details'}
                  {step === 3 && 'Confirm & Create'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((i) => (
                  <React.Fragment key={i}>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                      step > i ? 'bg-emerald-500 text-white' : step === i ? 'bg-purple-600 text-white ring-4 ring-purple-200' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step > i ? '✓' : i}
                    </div>
                    {i < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > i ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input type="text" name="firstName" placeholder="First" value={formData.firstName} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input type="text" name="lastName" placeholder="Last" value={formData.lastName} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Username <span className="text-pink-400">*</span></label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <input type="text" name="username" required placeholder="Choose a username" value={formData.username} onChange={handleChange} className={iconInputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Email Address <span className="text-pink-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <input type="email" name="email" required placeholder="your@email.com" value={formData.email} onChange={handleChange} className={iconInputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Password <span className="text-pink-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                      <input type="password" name="password" required placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} className={iconInputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password <span className="text-pink-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                      <input type="password" name="confirmPassword" required placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} className={iconInputCls} />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                  <Zap className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-700 text-xs">Minimum 6 characters — letters and numbers recommended</p>
                </div>

                <button type="button" onClick={handleNext}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg flex items-center justify-center gap-2 text-sm mt-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-800 transition">Sign In</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-5 flex-1">
                <div>
                  <label className={labelCls}>Business Name <span className="text-pink-400">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <input type="text" name="businessName" required placeholder="E.g., John's Hardware Store"
                      value={formData.businessName} onChange={handleChange} className={iconInputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Business Type <span className="text-pink-400">*</span></label>
                  <input type="text" name="businessTypeDisplay" required placeholder="E.g., Retail, Restaurant, Agriculture..."
                    value={formData.businessTypeDisplay} onChange={handleChange} autoComplete="off"
                    disabled={!!window.history.state?.usr?.preselectedBusinessType}
                    className={inputCls}
                  />
                  <input type="hidden" name="businessType" value={formData.businessType} />

                  {/* Dropdown suggestions */}
                  {formData.businessTypeDisplay && !formData.businessType && businessTypes.length > 0 && (
                    <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                      {businessTypes
                        .filter(t =>
                          t.label.toLowerCase().includes(formData.businessTypeDisplay.toLowerCase()) ||
                          t.value.toLowerCase().includes(formData.businessTypeDisplay.toLowerCase())
                        )
                        .map(t => (
                          <button
                            key={t.value}
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition"
                            onClick={() => {
                              setSuggestedType(t);
                              setFormData(prev => ({ ...prev, businessTypeDisplay: t.label, businessType: t.value }));
                            }}
                          >
                            <span className="font-medium">{t.label}</span>
                            <span className="text-xs text-gray-400 ml-2">{t.description}</span>
                          </button>
                        ))
                      }
                    </div>
                  )}

                  {formData.businessTypeDisplay && (
                    <div className="mt-3">
                      {suggestedType ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Matched: {suggestedType.label}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Features will be automatically configured</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-orange-800">Custom Business Type</p>
                            <p className="text-xs text-orange-600 mt-0.5">Will be saved as entered. Customize later.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.businessType && getFeaturesForBusinessType(formData.businessType).length > 0 && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5" /> Included Features
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getFeaturesForBusinessType(formData.businessType).map((f, i) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full border border-purple-300">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* School Type selector — only shown when business type is school */}
                {formData.businessType === 'school' && (
                  <div>
                    <label className={labelCls}>Type of School <span className="text-pink-400">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {[['primary', '🏫 Primary School', 'Baby Class to P.7'], ['secondary', '🎓 Secondary School', 'S.1 to S.6']].map(([val, label, sub]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, schoolType: val }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.schoolType === val
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300 bg-white'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${formData.schoolType === val ? 'text-purple-700' : 'text-gray-700'}`}>{label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelCls}>Description <span className="text-white/40 font-normal">(Optional)</span></label>
                  <textarea name="industryDescription" placeholder="Tell us about your business goals or unique needs..."
                    value={formData.industryDescription} onChange={handleChange} rows={3}
                    className={inputCls + ' resize-none'}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setStep(1); setError(''); }}
                    className="px-6 py-3.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
                  >
                    Back
                  </button>
                  <button type="button" onClick={handleNext}
                    className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="space-y-5 flex-1">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-purple-500" /> Account
                  </h3>
                  <div className="space-y-3">
                    {[
                      ['Name', `${formData.firstName} ${formData.lastName}`.trim() || '—'],
                      ['Username', formData.username],
                      ['Email', formData.email],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k}</span>
                        <span className="text-sm font-medium text-gray-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-emerald-500" /> Business
                  </h3>
                  <div className="space-y-3">
                    {[
                      ['Business', formData.businessName],
                      ['Type', businessTypes.find(t => t.value === formData.businessType)?.label || formData.businessTypeDisplay],
                      ...(formData.businessType === 'school' && formData.schoolType ? [['School Type', formData.schoolType === 'primary' ? 'Primary School (Baby – P.7)' : 'Secondary School (S.1 – S.6)']] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k}</span>
                        <span className="text-sm font-medium text-gray-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex gap-3">
                  <Cpu className="h-4 w-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <p className="text-pink-700 text-xs">Your workspace will be configured with industry-specific features. Customize anytime.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setStep(2); setError(''); }}
                    className="px-6 py-3.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
                  >
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                    ) : (
                      <>Create Account <CheckCircle className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Success Fireworks ── */}
            {step === 4 && (
              <SuccessFireworks
                name={formData.firstName || formData.username}
                businessType={formData.businessType}
                onDone={() => { login(registeredUser); navigate('/'); }}
              />
            )}
          </form>
        </div>
      </div>

      {/* ── RIGHT: Image Panel ──────────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-[40%] sticky top-0 h-screen overflow-hidden relative">
        <img
          src="https://photo.odoo.com/unsplash/JKUTrJ4vK00/323/data%20charts.jpg?unique=42ae832b"
          alt="Business analytics"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4 w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Trusted by 12,000+ businesses</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 leading-snug drop-shadow">
            Everything you need to<br />
            <span className="text-purple-300">run your business</span>
          </h2>
          <p className="text-white/70 text-sm">Orders, analytics, inventory — all in one place.</p>
        </div>
      </div>
    </div>
  );
}
