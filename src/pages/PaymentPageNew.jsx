import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Clock, Copy, Loader2,
  KeyRound, Send, User, Phone, Hash, Zap
} from 'lucide-react';
import { SpinningLoader, EnvelopeAnimation, SuccessCheckmark, CountdownTimer } from '../components/Animations';
import { usePlan } from '../context/PlanContext';
import BIQLogo from '../components/BIQLogo';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const PAYMENT_METHODS = [
  { id: 'mtn', name: 'MTN Mobile Money', number: '0794 448 439', icon: '📱' },
  { id: 'airtel', name: 'Airtel Money', number: '0706 721 334', icon: '📱' },
  { id: 'bank', name: 'Bank Transfer', number: 'Contact us', icon: '🏦' },
];

const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition";

export default function PaymentPage() {
  const { planKey } = useParams();
  const navigate = useNavigate();
  const { selectPlan } = usePlan();

  // State
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('payment'); // payment, waiting, activate, success
  const [selectedMethod, setSelectedMethod] = useState('mtn');
  const [copied, setCopied] = useState(false);
  
  // Payment form
  const [form, setForm] = useState({ senderName: '', phoneNumber: '', transactionId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Polling state
  const [codeArrived, setCodeArrived] = useState(false);
  const [codeData, setCodeData] = useState(null);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const pollingRef = useRef(null);
  
  // Activation
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState('');

  // Load plan
  useEffect(() => {
    axios.get(`${API}/plans/`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPlan(data.find(p => p.key === planKey) || null);
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [planKey]);

  // Poll for activation code
  useEffect(() => {
    if (step !== 'waiting') return;

    const pollCode = async () => {
      try {
        const res = await axios.get(`${API}/plans/poll-code/`, { headers: authHeaders() });
        if (res.data.status === 'approved' && res.data.activation_code) {
          setCodeData(res.data);
          setCodeArrived(true);
          setEnvelopeOpen(true);
          // Auto-fill code after animation
          setTimeout(() => setActivationCode(res.data.activation_code), 800);
          // Clear polling
          clearInterval(pollingRef.current);
        } else if (res.data.status === 'rejected') {
          setStep('payment');
          setSubmitError('Your payment request was rejected. Please try again.');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    pollCode();
    pollingRef.current = setInterval(pollCode, 3000); // Poll every 3 seconds

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step]);

  // Handlers
  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const copyNumber = () => {
    navigator.clipboard.writeText(method.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const { senderName, phoneNumber, transactionId } = form;
    if (!senderName.trim() || !phoneNumber.trim() || !transactionId.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`${API}/plans/payment-request/`, {
        plan_key: planKey,
        sender_name: senderName,
        phone_number: phoneNumber,
        payment_method: selectedMethod,
        transaction_id: transactionId,
      }, { headers: authHeaders() });
      
      setStep('waiting');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit');
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
      setStep('success');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setActivateError(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setActivating(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SpinningLoader size="large" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Plan not found</p>
        <button onClick={() => navigate('/upgrade')} className="text-purple-400 hover:text-purple-300 text-sm">
          ← Back to plans
        </button>
      </div>
    );
  }

  // ── STEP 1: PAYMENT FORM ──
  if (step === 'payment') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="relative text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
          <div className="w-full px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BIQLogo size={30} />
              <span className="font-bold">BusinessIQ</span>
            </div>
            <button onClick={() => navigate('/upgrade')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>

        <div className="w-full px-8 py-16 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold mb-2">Complete Your Payment</h1>
              <p className="text-gray-400">
                Send <span className="font-bold text-white">{plan.price_ugx.toLocaleString()} UGX</span> to activate{' '}
                <span className="font-bold text-white">{plan.name}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment methods */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Step 1: Choose Payment Method</h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                        selectedMethod === m.id
                          ? 'bg-purple-500/15 border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{m.icon}</span>
                          <div>
                            <p className="font-bold text-white text-sm">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.number}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMethod === m.id ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                        }`}>
                          {selectedMethod === m.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Payment number card */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Payment Number</p>
                  <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                    <p className="font-mono font-bold text-lg">{method.number}</p>
                    <button
                      onClick={copyNumber}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Copy className={`w-4 h-4 transition-colors ${copied ? 'text-emerald-400' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  {copied && <p className="text-xs text-emerald-400 mt-2">✓ Copied!</p>}
                </div>
              </div>

              {/* Form */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Step 2: Your Details</h3>
                <form onSubmit={handleSubmitPayment} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Name on Account</label>
                    <input
                      type="text"
                      value={form.senderName}
                      onChange={e => setForm(p => ({ ...p, senderName: e.target.value }))}
                      placeholder="John Doe"
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                      placeholder="256794448439"
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Transaction ID</label>
                    <input
                      type="text"
                      value={form.transactionId}
                      onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))}
                      placeholder="e.g. TXN123456"
                      required
                      className={inputCls}
                    />
                  </div>

                  {submitError && (
                    <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Submit Payment</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: WAITING FOR CODE ──
  if (step === 'waiting') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="relative text-white flex flex-col items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg">
          {/* Envelope Animation */}
          <div className="w-full h-48 flex items-center justify-center mb-8">
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ rotate: [0, -2, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <EnvelopeAnimation isOpen={envelopeOpen} />
              </motion.div>

              {/* Spinner */}
              {!codeArrived && (
                <div className="flex flex-col items-center gap-3">
                  <SpinningLoader size="large" />
                  <p className="text-sm font-medium text-gray-400">
                    {envelopeOpen ? 'Code received!' : 'Verifying your payment…'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-2xl font-bold">Payment Verification</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              We're waiting for our team to verify and approve your payment. This usually takes a few minutes.
              Once approved, an <span className="text-purple-400 font-semibold">activation code</span> will
              be sent to your screen automatically.
            </p>
          </div>

          {/* Status card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Details Submitted</p>
            <p className="text-sm text-white font-mono">{form.phoneNumber}</p>
          </div>

          {/* Back button */}
          <button
            onClick={() => setStep('payment')}
            className="w-full py-3 rounded-xl text-white/60 border border-white/10 hover:border-white/30 hover:text-white transition-colors text-sm font-medium"
          >
            ← Back to payment
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3: ENTER ACTIVATION CODE ──
  if (step === 'activate') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="relative text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full px-8 py-16 flex flex-col items-center">
          <div className="w-full max-w-lg">
            {/* Success indicator */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Code Received!</h2>
              <p className="text-gray-400 text-sm">Your activation code has arrived. Enter it below to activate your plan.</p>
            </div>

            {/* Code countdown */}
            {codeData && codeData.code_expires_at && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-center">
                <CountdownTimer expiresAt={codeData.code_expires_at} />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleActivate} className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-6">
              <input
                type="text"
                value={activationCode}
                onChange={e => setActivationCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4E5"
                maxLength={20}
                required
                className={`${inputCls} text-center text-2xl font-mono tracking-[0.2em] uppercase`}
              />

              {activateError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                  {activateError}
                </p>
              )}

              <button
                type="submit"
                disabled={activating || !activationCode.trim()}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                {activating ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Activating…</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Zap className="w-4 h-4 text-yellow-300" /> Activate Plan</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 4: SUCCESS ──
  if (step === 'success') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: '#030712' }} className="relative flex flex-col items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg text-center space-y-6">
          <SuccessCheckmark />
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Plan Activated!</h2>
            <p className="text-gray-400">
              Welcome to <span className="text-white font-bold">{plan.name}</span>. Enjoy all the features!
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" /> Redirecting…
          </div>
        </div>
      </div>
    );
  }
}
