import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BIQLogo from '../components/BIQLogo';
import { usePlan } from '../context/PlanContext';
import { CheckCircle, XCircle, Zap, ArrowRight, Download, Monitor, Smartphone, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

// Static UI config per plan key
const PLAN_UI = {
  starter: {
    headerStyle: { background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' },
    ringClass: 'ring-emerald-300',
    badge: null,
    description: 'Perfect for small businesses just getting started.',
    features: [
      { text: 'Unlimited products', included: true },
      { text: 'Products & Inventory', included: true },
      { text: 'Orders & Sales', included: true },
      { text: 'Basic Reports', included: true },
      { text: 'Receipt Lookup', included: true },
      { text: 'Customer Management', included: false },
      { text: 'Analytics & AI Insights', included: false },
      { text: 'Accounting Module', included: false },
      { text: 'E-commerce Website', included: false },
      { text: 'Appointments & Scheduling', included: false },
      { text: 'Sales Forecasting', included: false },
    ],
    cta: 'Get Started',
    ctaStyle: '#111827',
  },
  business: {
    headerStyle: { background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)' },
    ringClass: 'ring-blue-400',
    badge: 'Most Popular',
    description: 'For growing businesses that need more power.',
    features: [
      { text: 'Unlimited products', included: true },
      { text: 'Products & Inventory', included: true },
      { text: 'Orders & Sales', included: true },
      { text: 'Advanced Reports', included: true },
      { text: 'Receipt Lookup', included: true },
      { text: 'Customer Management', included: true },
      { text: 'Analytics & AI Insights', included: true },
      { text: 'Accounting Module', included: true },
      { text: 'E-commerce Website', included: false },
      { text: 'Appointments & Scheduling', included: false },
      { text: 'Sales Forecasting', included: false },
    ],
    cta: 'Start Now',
    ctaStyle: 'linear-gradient(135deg, #2563eb, #4338ca)',
  },
  enterprise: {
    headerStyle: { background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)' },
    ringClass: 'ring-violet-400',
    badge: 'Full Access',
    description: 'Complete suite with all advanced features unlocked.',
    features: [
      { text: 'Unlimited products', included: true },
      { text: 'Products & Inventory', included: true },
      { text: 'Orders & Sales', included: true },
      { text: 'Advanced Reports', included: true },
      { text: 'Receipt Lookup', included: true },
      { text: 'Customer Management', included: true },
      { text: 'Analytics & AI Insights', included: true },
      { text: 'Accounting Module', included: true },
      { text: 'E-commerce Website', included: true },
      { text: 'Appointments & Scheduling', included: true },
      { text: 'Sales Forecasting', included: true },
    ],
    cta: 'Get Full Access',
    ctaStyle: 'linear-gradient(135deg, #7c3aed, #db2777)',
  },
};

export default function Pricing() {
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { selectPlan, planKey: currentPlan } = usePlan();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    axios.get(`${API}/plans/`)
      .then(res => setPlans(res.data.filter(p => p.key !== 'free')))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleCta = (planKey) => {
    if (localStorage.getItem('accessToken')) {
      navigate(`/payment/${planKey}`);
    } else {
      selectPlan(planKey);
      navigate('/register');
    }
  };

  const formatPrice = (ugx) => ugx === 0 ? 'Free' : Number(ugx).toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Nav */}
      <nav className={`${scrolled ? 'shadow-lg bg-white/90' : 'bg-white/50'} backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <BIQLogo size={38} />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                BusinessIQ
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" className="text-gray-700 hover:text-purple-600 text-sm font-medium transition">Features</Link>
              <Link to="/pricing" className="text-purple-600 text-sm font-semibold border-b-2 border-purple-600 pb-0.5">Pricing</Link>
              <Link to="/about" className="text-gray-700 hover:text-purple-600 text-sm font-medium transition">About</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition hidden sm:inline">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-violet-700 transition shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-12 px-4">
        <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">Choose your plan</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          All plans billed monthly in UGX. No hidden fees. Cancel anytime.
        </p>
      </div>

      {/* Free trial banner */}
      <div className="max-w-2xl mx-auto px-4 mb-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-center">
          <p className="text-amber-800 text-sm font-medium">
            🎉 All plans start with a <span className="font-bold">14-day free trial</span> — up to 7 products, core features included. No credit card required.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loadingPlans ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const ui = PLAN_UI[plan.key] || {};
              const isCurrentPlan = currentPlan === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-3xl overflow-hidden shadow-xl transition-transform hover:-translate-y-2 duration-300 ${
                    ui.badge === 'Most Popular' ? `ring-4 ${ui.ringClass} scale-105` : ''
                  }`}
                >
                  {/* Header */}
                  <div className="px-8 pt-8 pb-10 text-white" style={ui.headerStyle}>
                    {ui.badge && (
                      <span className="inline-block bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-4 border border-white/30">
                        {ui.badge}
                      </span>
                    )}
                    <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                    <p className="text-white/70 text-sm mb-6">{ui.description}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-xs font-semibold text-white/60 mb-1">UGX</span>
                      <span className="text-5xl font-extrabold leading-none">{formatPrice(plan.price_ugx)}</span>
                      <span className="text-white/60 text-sm mb-1">/mo</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="bg-white flex-1 px-8 py-7 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {(ui.features || []).map((f, j) => (
                        <li key={j} className="flex items-center gap-3">
                          {f.included
                            ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            : <XCircle className="h-5 w-5 text-gray-300 flex-shrink-0" />}
                          <span className={`text-sm ${f.included ? 'text-gray-800' : 'text-gray-400'}`}>{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleCta(plan.key)}
                      disabled={isCurrentPlan}
                      style={{ background: ui.ctaStyle }}
                      className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200 hover:scale-105 shadow-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {ui.badge === 'Most Popular' && !isCurrentPlan
                        ? <Zap className="h-4 w-4 text-yellow-300" />
                        : null}
                      {isCurrentPlan ? 'Current Plan' : ui.cta}
                      {!isCurrentPlan && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Download buttons */}
        <div className="mt-14 text-center">
          <p className="text-gray-500 text-sm mb-6">Also available as a desktop & mobile app</p>
          <div className="flex flex-row gap-3 justify-center">
            <a href="/downloads/BusinessIQ-Setup.exe" download
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg hover:scale-105">
              <Monitor className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs text-gray-400 leading-none">Download for</div>
                <div className="leading-tight">Windows</div>
              </div>
              <Download className="h-4 w-4 flex-shrink-0" />
            </a>
            <a href="/downloads/BusinessIQ.apk" download
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg hover:scale-105">
              <Smartphone className="h-4 w-4 text-green-400 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs text-gray-400 leading-none">Download for</div>
                <div className="leading-tight">Android</div>
              </div>
              <Download className="h-4 w-4 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BIQLogo size={24} />
          <span className="text-white font-semibold">BusinessIQ</span>
        </div>
        <p>© 2025 BusinessIQ. Built with ❤️ in Fort Portal, Uganda.</p>
      </footer>
    </div>
  );
}
