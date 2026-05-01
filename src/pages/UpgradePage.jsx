import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle, XCircle, Zap, ArrowRight, ArrowLeft,
  Loader2, Sparkles, Shield, TrendingUp, Users,
  BarChart3, Globe, Calendar, Package
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import BIQLogo from '../components/BIQLogo';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

const PLAN_UI = {
  starter: {
    gradient: 'from-emerald-500 to-teal-600',
    gradientStyle: { background: 'linear-gradient(135deg, #10b981, #0d9488)' },
    glow: 'shadow-emerald-200',
    ring: 'ring-emerald-300',
    badge: null,
    description: 'Perfect for small businesses getting started.',
    features: [
      { text: 'Unlimited products', included: true },
      { text: 'Products & Inventory', included: true },
      { text: 'Orders & Sales', included: true },
      { text: 'Basic Reports', included: true },
      { text: 'Receipt Lookup', included: true },
      { text: 'Sales Tracking', included: true },
      { text: 'Customer Management', included: false },
      { text: 'Analytics & AI Insights', included: false },
      { text: 'Accounting Module', included: false },
      { text: 'E-commerce Website', included: false },
      { text: 'Appointments & Scheduling', included: false },
    ],
    cta: 'Get Started',
  },
  business: {
    gradient: 'from-blue-600 to-indigo-700',
    gradientStyle: { background: 'linear-gradient(135deg, #2563eb, #4338ca)' },
    glow: 'shadow-blue-200',
    ring: 'ring-blue-400',
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
  },
  enterprise: {
    gradient: 'from-violet-600 to-pink-600',
    gradientStyle: { background: 'linear-gradient(135deg, #7c3aed, #db2777)' },
    glow: 'shadow-violet-200',
    ring: 'ring-violet-400',
    badge: 'Full Access',
    description: 'Complete suite with every feature unlocked.',
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
  },
};

const HIGHLIGHTS = [
  { icon: Shield, label: 'Secure & Reliable', desc: 'Bank-grade security for your data' },
  { icon: TrendingUp, label: 'Grow Faster', desc: 'AI-powered insights to boost revenue' },
  { icon: Users, label: 'Team Ready', desc: 'Role-based access for your whole team' },
  { icon: Globe, label: 'Always Online', desc: 'Cloud-based, access from anywhere' },
];

export default function UpgradePage() {
  const { planDef, planKey: currentPlan } = usePlan();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/plans/`)
      .then(res => {
        const filtered = Array.isArray(res.data) ? res.data.filter(p => p.key !== 'free') : [];
        setPlans(filtered);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{width:'100vw',minHeight:'100vh',background:'#030712',color:'white',overflowX:'hidden'}}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BIQLogo size={32} />
            <span className="font-bold text-white text-lg tracking-tight">BusinessIQ</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-purple-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Upgrade your plan
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-4">
            You're on the{' '}
            <span className="text-white font-semibold">{planDef?.name || 'Free'}</span> plan.
            Unlock the full power of BusinessIQ.
          </p>
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2 text-sm text-amber-300">
            🎉 All plans include a <strong className="text-amber-200">14-day free trial</strong> — no credit card required
          </div>
        </div>
      </div>

      {/* ── Plans ── */}
      <div className="w-full px-8 pb-20">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 mb-2">Could not load plans from server.</p>
            <a
              href="https://wa.me/256794448439"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              Contact Us on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const ui = PLAN_UI[plan.key] || {};
              const isCurrent = currentPlan === plan.key;
              const isPopular = ui.badge === 'Most Popular';

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    isPopular
                      ? `ring-2 ${ui.ring} shadow-2xl ${ui.glow} scale-[1.03]`
                      : 'ring-1 ring-white/10 shadow-xl hover:ring-white/20'
                  }`}
                  style={{ background: 'linear-gradient(180deg, #1e1e2e 0%, #16161f 100%)' }}
                >
                  {/* Popular badge */}
                  {ui.badge && (
                    <div
                      className="absolute top-0 inset-x-0 h-1 rounded-t-2xl"
                      style={ui.gradientStyle}
                    />
                  )}
                  {ui.badge && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <span
                        className="inline-block text-white text-[11px] font-bold px-3 py-0.5 rounded-b-lg"
                        style={ui.gradientStyle}
                      >
                        {ui.badge}
                      </span>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="px-7 pt-8 pb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={ui.gradientStyle}
                    >
                      {plan.key === 'starter' && <Package className="w-5 h-5 text-white" />}
                      {plan.key === 'business' && <BarChart3 className="w-5 h-5 text-white" />}
                      {plan.key === 'enterprise' && <Zap className="w-5 h-5 text-white" />}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                    <p className="text-sm text-gray-400 mb-5">{ui.description}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-xs text-gray-500 mb-1.5">UGX</span>
                      <span className="text-4xl font-extrabold text-white leading-none">
                        {Number(plan.price_ugx).toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm mb-1.5">/mo</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-7 h-px bg-white/10" />

                  {/* Features */}
                  <div className="px-7 py-6 flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {(ui.features || []).map((f, i) => (
                        <li key={i} className="flex items-center gap-3">
                          {f.included ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-700 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${f.included ? 'text-gray-200' : 'text-gray-600'}`}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => navigate(`/payment/${plan.key}`)}
                      disabled={isCurrent}
                      className={`mt-7 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                        isCurrent
                          ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                          : 'text-white hover:opacity-90 hover:scale-[1.02] shadow-lg active:scale-100'
                      }`}
                      style={isCurrent ? {} : ui.gradientStyle}
                    >
                      {!isCurrent && isPopular && <Zap className="w-4 h-4 text-yellow-300" />}
                      {isCurrent ? 'Current Plan' : ui.cta}
                      {!isCurrent && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-600 mt-8">
          All plans billed monthly in UGX · No hidden fees · Cancel anytime
        </p>
      </div>

      {/* ── Why upgrade highlights ── */}
      <div className="border-t border-white/10 bg-white/[0.02]">
        <div className="w-full px-8 py-16">
          <h2 className="text-center text-2xl font-bold text-white mb-10">Why upgrade?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BIQLogo size={22} />
          <span className="text-white font-semibold text-sm">BusinessIQ</span>
        </div>
        <p className="text-xs text-gray-600">© 2025 BusinessIQ. Built with ❤️ in Fort Portal, Uganda.</p>
      </footer>
    </div>
  );
}
