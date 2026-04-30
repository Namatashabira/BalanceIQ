import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BIQLogo from '../components/BIQLogo';
import {
  CheckCircle, XCircle, Zap, ArrowRight, Download, Monitor, Smartphone
} from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '80,000',
    headerStyle: { background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' },
    ringClass: 'ring-emerald-300',
    badge: null,
    description: 'Perfect for small businesses just getting started.',
    features: [
      { text: 'Up to 2 users', included: true },
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
      { text: 'Priority Support', included: false },
    ],
    cta: 'Get Started',
  },
  {
    name: 'Business',
    price: '150,000',
    headerStyle: { background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)' },
    ringClass: 'ring-blue-400',
    badge: 'Most Popular',
    description: 'For growing businesses that need more power.',
    features: [
      { text: 'Up to 10 users', included: true },
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
      { text: 'Priority Support', included: false },
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: '400,000',
    headerStyle: { background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)' },
    ringClass: 'ring-violet-400',
    badge: 'Full Access',
    description: 'Complete suite with all advanced features unlocked.',
    features: [
      { text: 'Unlimited users', included: true },
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
      { text: 'Priority Support', included: true },
    ],
    cta: 'Get Full Access',
  },
];

export default function Pricing() {
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Nav */}
      <nav className={`${scrolled ? 'shadow-lg bg-white/90' : 'bg-white/50'} backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <BIQLogo size={38} />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BusinessIQ
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">Features</Link>
              <Link to="/pricing" className="text-blue-600 text-sm font-semibold border-b-2 border-blue-600 pb-0.5">Pricing</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 text-sm font-medium transition">About</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition hidden sm:inline">
                Sign In
              </Link>
              <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-12 px-4">
        <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          Choose your plan
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          All plans billed monthly in UGX. No hidden fees. Cancel anytime.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl overflow-hidden shadow-xl transition-transform hover:-translate-y-2 duration-300 ${
                plan.badge === 'Most Popular' ? `ring-4 ${plan.ringClass} scale-105` : ''
              }`}
            >
              {/* Card top gradient */}
              <div className="px-8 pt-8 pb-10 text-white" style={plan.headerStyle}>
                {plan.badge && (
                  <span className="inline-block bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-4 border border-white/30">
                    {plan.badge}
                  </span>
                )}
                <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                <p className="text-white/70 text-sm mb-6">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-xs font-semibold text-white/60 mb-1">UGX</span>
                  <span className="text-5xl font-extrabold leading-none">{plan.price}</span>
                  <span className="text-white/60 text-sm mb-1">/mo</span>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white flex-1 px-8 py-7 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3">
                      {f.included
                        ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        : <XCircle className="h-5 w-5 text-gray-300 flex-shrink-0" />}
                      <span className={`text-sm ${f.included ? 'text-gray-800' : 'text-gray-400'}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  style={{
                    background: plan.badge === 'Most Popular'
                      ? 'linear-gradient(135deg, #2563eb, #4338ca)'
                      : plan.badge === 'Full Access'
                      ? 'linear-gradient(135deg, #7c3aed, #db2777)'
                      : '#111827'
                  }}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200 hover:scale-105 shadow-lg hover:opacity-90"
                >
                  {plan.badge === 'Most Popular' && <Zap className="h-4 w-4 text-yellow-300" />}
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-14 text-center">
          <p className="text-gray-500 text-sm mb-6">All plans include a <span className="font-semibold text-gray-700">14-day free trial</span>. No credit card required.</p>
          <div className="flex flex-row gap-3 justify-center">
            <a
              href="/downloads/BusinessIQ-Setup.exe"
              download
              className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg hover:scale-105"
            >
              <Monitor className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs text-gray-400 leading-none">Download for</div>
                <div className="leading-tight">Windows</div>
              </div>
              <Download className="h-4 w-4 flex-shrink-0" />
            </a>
            <a
              href="/downloads/BusinessIQ.apk"
              download
              className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg hover:scale-105"
            >
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
        © 2026 BusinessIQ. All rights reserved.
      </footer>
    </div>
  );
}
