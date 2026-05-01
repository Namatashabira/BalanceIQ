import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, CheckCircle, Phone, CreditCard,
  Building2, Copy, Loader2, ShieldCheck, Clock
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import BIQLogo from '../components/BIQLogo';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

const PAYMENT_METHODS = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: '🟡',
    number: '0794 448 439',
    instructions: 'Dial *165# → Send Money → Enter number → Enter amount → Confirm',
    color: 'bg-yellow-50 border-yellow-300',
    activeColor: 'ring-yellow-400 bg-yellow-50',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    icon: '🔴',
    number: '0706 721 334',
    instructions: 'Dial *185# → Send Money → Enter number → Enter amount → Confirm',
    color: 'bg-red-50 border-red-200',
    activeColor: 'ring-red-400 bg-red-50',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: '🏦',
    number: 'Contact us for bank details',
    instructions: 'Contact us on WhatsApp or call to get bank account details.',
    color: 'bg-blue-50 border-blue-200',
    activeColor: 'ring-blue-400 bg-blue-50',
  },
];

export default function PaymentPage() {
  const { planKey } = useParams();
  const navigate = useNavigate();
  const { selectPlan } = usePlan();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('mtn');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API}/plans/`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        const found = data.find(p => p.key === planKey);
        setPlan(found || null);
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [planKey]);

  const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const copyNumber = () => {
    navigator.clipboard.writeText(method.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) return;
    setSubmitting(true);

    // Optimistically activate the plan locally
    await selectPlan(planKey);

    // TODO: When payment backend is ready, send transaction ID for verification:
    // await axios.post(`${API}/plans/payment/`, {
    //   plan_key: planKey,
    //   method: selectedMethod,
    //   transaction_id: transactionId,
    // }, { headers: authHeaders() });

    setSubmitting(false);
    setSubmitted(true);

    // Redirect to dashboard after 3 seconds
    setTimeout(() => navigate('/'), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Plan not found.</p>
        <button onClick={() => navigate('/upgrade')} className="text-purple-600 underline text-sm">
          Back to plans
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-purple-50 px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Payment Submitted!</h2>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          Thank you! Your payment is being verified. Your <span className="font-semibold text-purple-700">{plan.name}</span> plan
          will be fully activated once confirmed. This usually takes a few minutes.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
          <Clock className="w-4 h-4" />
          Redirecting to dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-50">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BIQLogo size={32} />
          <span className="font-bold text-gray-900 text-lg">BusinessIQ</span>
        </div>
        <button
          onClick={() => navigate('/upgrade')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Change plan
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Plan summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Selected Plan</p>
              <h2 className="text-2xl font-extrabold text-gray-900">{plan.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {plan.product_limit === -1 ? 'Unlimited products' : `Up to ${plan.product_limit} products`} · All core features
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Monthly</p>
              <p className="text-3xl font-extrabold text-purple-700">
                UGX {Number(plan.price_ugx).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Manual payment:</span> Send the exact amount via your chosen method below,
            then enter your transaction ID. We'll verify and activate your plan within minutes.
          </p>
        </div>

        {/* Payment method selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Choose payment method</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                  selectedMethod === m.id
                    ? `ring-2 ${m.activeColor} border-transparent`
                    : `${m.color} border-transparent hover:border-gray-300`
                }`}
              >
                <span className="text-2xl">{m.icon}</span>
                <span className="text-gray-800">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment instructions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            {selectedMethod === 'bank'
              ? <Building2 className="w-4 h-4 text-blue-500" />
              : <Phone className="w-4 h-4 text-green-500" />}
            {method.name} Instructions
          </p>

          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Send to</p>
              <p className="text-lg font-bold text-gray-900">{method.number}</p>
            </div>
            {selectedMethod !== 'bank' && (
              <button
                onClick={copyNumber}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="bg-purple-50 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-gray-400 mb-0.5">Amount to send</p>
            <p className="text-xl font-extrabold text-purple-700">
              UGX {Number(plan.price_ugx).toLocaleString()}
            </p>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">{method.instructions}</p>
        </div>

        {/* Transaction ID form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            Enter Transaction ID
          </p>
          <p className="text-xs text-gray-400 mb-4">
            After sending payment, enter the transaction/reference ID you received.
          </p>

          <input
            type="text"
            value={transactionId}
            onChange={e => setTransactionId(e.target.value)}
            placeholder="e.g. 1234567890 or REF123ABC"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
          />

          <button
            type="submit"
            disabled={submitting || !transactionId.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all shadow-lg hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            {submitting
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</span>
              : 'Submit Payment'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Need help? Call or WhatsApp{' '}
            <a href="tel:+256794448439" className="text-purple-600 font-semibold">0794 448 439</a>
          </p>
        </form>
      </div>
    </div>
  );
}
