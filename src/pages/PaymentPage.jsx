import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, CheckCircle, Phone, CreditCard,
  Building2, Copy, Loader2, ShieldCheck, Clock,
  Zap, Sparkles, KeyRound, Send, User, Hash, Mail, MailOpen
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import BIQLogo from '../components/BIQLogo';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const PLAN_GRADIENTS = {
  starter:    { style: { background: 'linear-gradient(135deg, #10b981, #0d9488)' }, glow: 'shadow-emerald-500/20' },
  business:   { style: { background: 'linear-gradient(135deg, #2563eb, #4338ca)' }, glow: 'shadow-blue-500/20' },
  enterprise: { style: { background: 'linear-gradient(135deg, #7c3aed, #db2777)' }, glow: 'shadow-violet-500/20' },
};

const PAYMENT_METHODS = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    logo: 'https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png?w=360',
    logoBg: 'bg-yellow-400',
    number: '0794 448 439',
    instructions: 'Dial *165# → Send Money → Enter number → Enter amount → Confirm',
    activeBorder: 'border-yellow-500/60',
    activeBg: 'bg-yellow-500/10',
    activeGlow: 'shadow-yellow-500/20',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    logo: 'https://cdn-webportal.airtelstream.net/website/airtel-money/uganda/assets/images/airtel-logo.png',
    logoBg: 'bg-red-600',
    number: '0706 721 334',
    instructions: 'Dial *185# → Send Money → Enter number → Enter amount → Confirm',
    activeBorder: 'border-red-500/60',
    activeBg: 'bg-red-500/10',
    activeGlow: 'shadow-red-500/20',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    logo: null,
    logoBg: 'bg-blue-600',
    number: 'Contact us for details',
    instructions: 'Contact us on WhatsApp or call to get bank account details.',
    activeBorder: 'border-blue-500/60',
    activeBg: 'bg-blue-500/10',
    activeGlow: 'shadow-blue-500/20',
  },
];

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition";

export default function PaymentPage() {
  const { planKey } = useParams();
  const navigate = useNavigate();
  const { selectPlan } = usePlan();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('mtn');
  const [copied, setCopied] = useState(false);

  // Step 1 — payment submission
  const [senderName, setSenderName]     = useState('');
  const [phoneNumber, setPhoneNumber]   = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [submitted, setSubmitted]       = useState(false);

  // Load saved profile (name + phone) on mount
  useEffect(() => {
    axios.get(`${API}/plans/payment-profile/`, { headers: authHeaders() })
      .then(res => {
        if (res.data.sender_name)  setSenderName(res.data.sender_name);
        if (res.data.phone_number) setPhoneNumber(res.data.phone_number);
      })
      .catch(() => {});
  }, []);

  // Auto-save name+phone whenever they change (debounced 800ms)
  const saveProfileTimer = useRef(null);
  const saveProfile = (name, phone) => {
    clearTimeout(saveProfileTimer.current);
    saveProfileTimer.current = setTimeout(() => {
      if (!name.trim() && !phone.trim()) return;
      axios.post(`${API}/plans/payment-profile/`, {
        sender_name: name.trim(),
        phone_number: phone.trim(),
      }, { headers: authHeaders() })
        .then(() => setProfileSaved(true))
        .catch(() => {});
    }, 800);
  };

  // Step 2 — polling + activation code
  const [polling, setPolling]           = useState(false);
  const [codeArrived, setCodeArrived]   = useState(false);
  const [arrivedCode, setArrivedCode]   = useState('');
  const [codeExpiry, setCodeExpiry]     = useState(null);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [codeVisible, setCodeVisible]   = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating]     = useState(false);
  const [activateError, setActivateError] = useState('');
  const [activated, setActivated]       = useState(false);
  const [codeCopied, setCodeCopied]     = useState(false);
  const pollRef = useRef(null);

  // Start polling when submitted
  useEffect(() => {
    if (!submitted) return;
    setPolling(true);

    const doPoll = async () => {
      try {
        const res = await axios.get(`${API}/plans/poll-code/`, { headers: authHeaders() });
        const data = res.data;
        if (data.status === 'approved' && data.activation_code) {
          clearInterval(pollRef.current);
          setPolling(false);
          setArrivedCode(data.activation_code);
          setCodeExpiry(data.code_expires_at);
          // Animate: envelope opens then code drops in
          setTimeout(() => setEnvelopeOpen(true), 300);
          setTimeout(() => {
            setCodeVisible(true);
            setActivationCode(data.activation_code);
            setCodeArrived(true);
          }, 1100);
        }
      } catch { /* silent */ }
    };

    doPoll(); // immediate first check
    pollRef.current = setInterval(doPoll, 4000);
    return () => clearInterval(pollRef.current);
  }, [submitted]);

  // Countdown timer display
  const getTimeLeft = useCallback(() => {
    if (!codeExpiry) return '24h 00m';
    const diff = new Date(codeExpiry) - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }, [codeExpiry]);

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!codeExpiry) return;
    setTimeLeft(getTimeLeft());
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 30000);
    return () => clearInterval(t);
  }, [codeExpiry, getTimeLeft]);

  const copyArrivedCode = () => {
    navigator.clipboard.writeText(arrivedCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  useEffect(() => {
    axios.get(`${API}/plans/`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPlan(data.find(p => p.key === planKey) || null);
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [planKey]);

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
  const planGrad = PLAN_GRADIENTS[planKey] || PLAN_GRADIENTS.business;

  const copyNumber = () => {
    navigator.clipboard.writeText(method.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!senderName.trim() || !phoneNumber.trim() || !transactionId.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/plans/payment-request/`, {
        plan_key: planKey,
        sender_name: senderName.trim(),
        phone_number: phoneNumber.trim(),
        payment_method: selectedMethod,
        transaction_id: transactionId.trim(),
      }, { headers: authHeaders() });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setActivateError('');
    if (!activationCode.trim()) return;
    setActivating(true);
    try {
      await axios.post(`${API}/plans/activate/`, {
        activation_code: activationCode.trim().toUpperCase(),
      }, { headers: authHeaders() });
      await selectPlan(planKey);
      setActivated(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setActivateError(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setActivating(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin text-purple-400" />
      </div>
    );
  }

  // ── Not found ──
  if (!plan) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Plan not found.</p>
        <button onClick={() => navigate('/upgrade')} className="text-purple-400 hover:text-purple-300 underline text-sm transition">
          Back to plans
        </button>
      </div>
    );
  }

  // ── Activated ──
  if (activated) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="relative flex flex-col items-center justify-center gap-5 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Plan Activated!</h2>
        <p className="text-gray-400 text-sm text-center max-w-sm leading-relaxed">
          Your <span className="font-semibold text-white">{plan.name}</span> plan is now active. Enjoy all the features!
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <Clock className="w-4 h-4" /> Redirecting to dashboard…
        </div>
      </div>
    );
  }

  // ── Step 2: Waiting for code + activation ──
  if (submitted) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712', color: 'white' }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
          <div className="w-full px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BIQLogo size={30} />
              <span className="font-bold text-white text-base tracking-tight">BusinessIQ</span>
            </div>
            {!codeArrived && (
              <button onClick={() => { clearInterval(pollRef.current); setSubmitted(false); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full flex flex-col items-center px-6 py-16">

          {/* Steps */}
          <div className="w-full max-w-lg mb-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                Submitted
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className={`flex items-center gap-2 text-xs font-semibold ${codeArrived ? 'text-emerald-400' : 'text-purple-400'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                  codeArrived ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-purple-500/20 border-purple-500/40'
                }`}>
                  {codeArrived ? <CheckCircle className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                </div>
                Code Received
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                Activated
              </div>
            </div>
          </div>

          {/* ── WAITING: spinning wheel ── */}
          {!codeArrived && (
            <div className="w-full max-w-lg flex flex-col items-center gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-6 w-full">
                {/* Spinning wheel */}
                <div className="relative w-24 h-24">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  {/* Spinning arc */}
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                    style={{
                      borderTopColor: '#7c3aed',
                      borderRightColor: '#6d28d9',
                      animationDuration: '1.2s',
                    }}
                  />
                  {/* Inner pulse */}
                  <div className="absolute inset-3 rounded-full bg-purple-500/10 animate-pulse flex items-center justify-center">
                    <Mail className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">Verifying your payment…</h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                    Our team is reviewing your payment. Your activation code will appear here automatically once approved.
                  </p>
                </div>

                {/* Animated dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-600 text-center">
                This page checks automatically every few seconds. You can leave it open.
              </p>
            </div>
          )}

          {/* ── CODE ARRIVED: envelope + auto-filled input ── */}
          {codeArrived && (
            <div className="w-full max-w-lg space-y-6">

              {/* Envelope animation */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <MailOpen className="w-4 h-4" /> Your activation code has arrived!
                </p>

                {/* Envelope */}
                <div className="relative w-44 h-28" style={{ perspective: '600px' }}>
                  {/* Body */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 border border-purple-500/40 rounded-xl shadow-lg" />
                  {/* Flap */}
                  <div
                    className="absolute top-0 left-0 right-0 h-14 origin-top transition-transform duration-700 ease-in-out"
                    style={{
                      transform: envelopeOpen ? 'rotateX(-160deg)' : 'rotateX(0deg)',
                      transformStyle: 'preserve-3d',
                      zIndex: envelopeOpen ? 0 : 10,
                    }}
                  >
                    <div
                      className="w-full h-full bg-gradient-to-b from-purple-700/60 to-purple-800/40 border border-purple-500/40 rounded-t-xl"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                    />
                  </div>
                  {/* Code card sliding out */}
                  {envelopeOpen && (
                    <div
                      className="absolute left-3 right-3 bg-gray-900 border border-emerald-500/50 rounded-lg flex items-center justify-center transition-all duration-600 ease-out z-20"
                      style={{
                        top: codeVisible ? '-22px' : '18px',
                        height: '40px',
                        opacity: codeVisible ? 1 : 0,
                      }}
                    >
                      <span className="font-mono font-bold text-emerald-400 tracking-[0.2em] text-sm">{arrivedCode}</span>
                    </div>
                  )}
                </div>

                {/* Code display */}
                <div
                  className="transition-all duration-500"
                  style={{ opacity: codeVisible ? 1 : 0, transform: codeVisible ? 'translateY(0)' : 'translateY(8px)' }}
                >
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-3 mb-2">
                    <KeyRound className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-mono font-bold text-emerald-300 tracking-[0.25em] text-lg">{arrivedCode}</span>
                    <button onClick={copyArrivedCode} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-200 font-semibold transition ml-1">
                      <Copy className="w-3.5 h-3.5" />
                      {codeCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {timeLeft && (
                    <p className="text-xs text-center text-amber-400 font-medium">
                      <Clock className="inline w-3 h-3 mr-1" />
                      Expires in {timeLeft}
                    </p>
                  )}
                </div>
              </div>

              {/* Activation form — code auto-filled */}
              <form onSubmit={handleActivate} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-white mb-1">Activate your plan</h3>
                  <p className="text-xs text-gray-500">The code has been filled in automatically. Just click Activate.</p>
                </div>

                <input
                  type="text"
                  value={activationCode}
                  onChange={e => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="Activation code"
                  maxLength={20}
                  required
                  className={`${inputCls} text-center text-xl font-mono tracking-[0.3em] uppercase`}
                />

                {activateError && (
                  <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{activateError}</p>
                )}

                <button
                  type="submit"
                  disabled={activating || !activationCode.trim()}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  {activating ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Activating…</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><Zap className="w-4 h-4 text-yellow-300" /> Activate {plan.name} Plan</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step 1: Submit payment ──
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#030712', color: 'white' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="w-full px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BIQLogo size={30} />
            <span className="font-bold text-white text-base tracking-tight">BusinessIQ</span>
          </div>
          <button onClick={() => navigate('/upgrade')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Change plan
          </button>
        </div>
      </div>

      <div className="relative w-full px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Payment info ── */}
          <div className="space-y-5">

            {/* Plan card */}
            <div className="rounded-2xl p-px shadow-2xl" style={planGrad.style}>
              <div className="rounded-2xl bg-gray-900 px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Selected Plan</p>
                  <h2 className="text-2xl font-extrabold text-white">{plan.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {plan.product_limit === -1 ? 'Unlimited products' : `Up to ${plan.product_limit} products`} · All core features
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Monthly</p>
                  <p className="text-3xl font-extrabold text-white">UGX {Number(plan.price_ugx).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300/90 leading-relaxed">
                <span className="font-semibold text-amber-300">How it works:</span> Send the exact amount, fill in your details below, then submit. Our team will verify and send you an <strong className="text-amber-200">activation code</strong> to unlock your plan.
              </p>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-3">Choose payment method</p>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(m => {
                  const active = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl border transition-all ${
                        active
                          ? `${m.activeBorder} ${m.activeBg} shadow-lg ${m.activeGlow}`
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${m.logoBg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                        {m.logo
                          ? <img src={m.logo} alt={m.name} className="w-full h-full object-contain p-1" />
                          : <Building2 className="w-5 h-5 text-white" />}
                      </div>
                      <span className={`text-xs text-center leading-tight ${active ? 'text-white' : 'text-gray-400'}`}>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                {selectedMethod === 'bank' ? <Building2 className="w-4 h-4 text-blue-400" /> : <Phone className="w-4 h-4 text-emerald-400" />}
                {method.name} Instructions
              </p>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Send to</p>
                  <p className="text-lg font-bold text-white">{method.number}</p>
                </div>
                {selectedMethod !== 'bank' && (
                  <button onClick={copyNumber} className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition">
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <p className="text-xs text-gray-500 mb-0.5">Amount to send</p>
                <p className="text-2xl font-extrabold text-purple-300">UGX {Number(plan.price_ugx).toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{method.instructions}</p>
            </div>
          </div>

          {/* ── RIGHT: Form ── */}
          <div className="space-y-5">
            <form onSubmit={handleSubmitPayment} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-1">
                  <Send className="w-4 h-4 text-purple-400" />
                  Payment Details
                </p>
                <p className="text-xs text-gray-500">Fill in the details of the person who sent the money.</p>
              </div>

              {/* Sender name */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Name on the account used to send money</span>
                  {profileSaved && <span className="text-emerald-400 text-[10px] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => { setSenderName(e.target.value); setProfileSaved(false); saveProfile(e.target.value, phoneNumber); }}
                  placeholder="e.g. John Doe"
                  required
                  className={inputCls}
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone number used to send money
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => { setPhoneNumber(e.target.value); setProfileSaved(false); saveProfile(senderName, e.target.value); }}
                  placeholder="e.g. 0771234567"
                  required
                  className={inputCls}
                />
              </div>

              {/* Transaction ID — always blank, user must enter fresh */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Transaction / Reference ID
                  <span className="text-gray-600 text-[10px] ml-1">(enter for each payment)</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="e.g. 1234567890 or REF123ABC"
                  required
                  className={inputCls}
                />
              </div>

              {submitError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !senderName.trim() || !phoneNumber.trim() || !transactionId.trim()}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Submit Payment Request</span>
                )}
              </button>

              <p className="text-center text-xs text-gray-600">
                Need help? WhatsApp{' '}
                <a href="https://wa.me/256794448439" className="text-purple-400 hover:text-purple-300 font-semibold transition">0794 448 439</a>
              </p>
            </form>

            {/* Already have a code? */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-purple-400" /> Already have an activation code?
              </p>
              <button
                onClick={() => setSubmitted(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-purple-300 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition"
              >
                Enter activation code →
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure & verified
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Instant activation
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Cancel anytime
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
