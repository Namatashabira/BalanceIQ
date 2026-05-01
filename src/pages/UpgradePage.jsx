import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import BIQLogo from '../components/BIQLogo';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

const PLAN_UI = {
  starter: {
    headerStyle: { background: 'linear-gradient(135deg, #10b981, #0d9488)' },
    badge: null,
    features: ['Unlimited products', 'Products & Inventory', 'Orders & Sales', 'Basic Reports', 'Receipt Lookup', 'Sales tracking'],
    locked: ['Customer Management', 'Analytics & AI Insights', 'Accounting Module', 'E-commerce Website', 'Appointments'],
  },
  business: {
    headerStyle: { background: 'linear-gradient(135deg, #2563eb, #4338ca)' },
    badge: 'Most Popular',
    features: ['Unlimited products', 'Products & Inventory', 'Orders & Sales', 'Customer Management', 'Analytics & AI Insights', 'Accounting Module', 'Advanced Reports'],
    locked: ['E-commerce Website', 'Appointments & Scheduling', 'Sales Forecasting'],
  },
  enterprise: {
    headerStyle: { background: 'linear-gradient(135deg, #7c3aed, #db2777)' },
    badge: 'Full Access',
    features: ['Everything in Business', 'E-commerce Website', 'Appointments & Scheduling', 'Sales Forecasting', 'Priority Support', 'Unlimited users'],
    locked: [],
  },
};

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-50">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BIQLogo size={32} />
          <span className="font-bold text-gray-900 text-lg">BusinessIQ</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-purple-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Upgrade your plan
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            You are currently on the <span className="font-semibold text-purple-700">{planDef?.name}</span> plan.
            Choose a plan below to unlock more features.
          </p>
        </div>

        {/* Plans grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Could not load plans from server.</p>
            <p className="text-sm text-gray-400 mb-6">Contact us to upgrade your plan.</p>
            <a
              href="https://wa.me/256794448439"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              Contact Us on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const ui = PLAN_UI[plan.key] || {};
              const isCurrent = currentPlan === plan.key;

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-3xl overflow-hidden shadow-xl transition-transform hover:-translate-y-1 duration-300 ${
                    ui.badge === 'Most Popular' ? 'ring-4 ring-blue-400 scale-105' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="px-6 pt-6 pb-8 text-white" style={ui.headerStyle}>
                    {ui.badge && (
                      <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 border border-white/30">
                        {ui.badge}
                      </span>
                    )}
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-end gap-1 mt-3">
                      <span className="text-xs text-white/60 mb-1">UGX</span>
                      <span className="text-4xl font-extrabold leading-none">
                        {Number(plan.price_ugx).toLocaleString()}
                      </span>
                      <span className="text-white/60 text-sm mb-1">/mo</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="bg-white flex-1 px-6 py-5 flex flex-col">
                    <ul className="space-y-2 flex-1 mb-5">
                      {(ui.features || []).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-800">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {(ui.locked || []).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                          <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => navigate(`/payment/${plan.key}`)}
                      disabled={isCurrent}
                      style={isCurrent ? {} : { background: ui.headerStyle?.background }}
                      className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all shadow-md ${
                        isCurrent
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'text-white hover:opacity-90 hover:scale-105'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          All plans billed monthly in UGX · No hidden fees · Cancel anytime
        </p>
      </div>
    </div>
  );
}
