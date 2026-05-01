import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CheckCircle, XCircle, Clock, RefreshCw, KeyRound,
  Copy, ChevronDown, ChevronUp, AlertCircle, User,
  Phone, Hash, CreditCard, Send, Mail, MailOpen
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const STATUS_STYLES = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  icon: Clock },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  rejected: { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: XCircle },
};

const METHOD_LOGOS = {
  mtn:    'https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png?w=360',
  airtel: 'https://cdn-webportal.airtelstream.net/website/airtel-money/uganda/assets/images/airtel-logo.png',
};

// ── Envelope animation component ─────────────────────────────────────────────
function EnvelopeCode({ code, expiresAt, onCopy, copied }) {
  const [open, setOpen] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);

  useEffect(() => {
    // Animate: envelope opens after 300ms, code appears after 800ms
    const t1 = setTimeout(() => setOpen(true), 300);
    const t2 = setTimeout(() => setCodeVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const hoursLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / (1000 * 60 * 60)))
    : 24;

  return (
    <div className="flex flex-col items-center py-4 select-none">
      {/* Envelope */}
      <div className="relative w-48 h-32 mb-4" style={{ perspective: '600px' }}>
        {/* Envelope body */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-xl shadow-lg flex items-end justify-center pb-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-300" />
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <div className="w-2 h-2 rounded-full bg-purple-300" />
          </div>
        </div>

        {/* Envelope flap */}
        <div
          className="absolute top-0 left-0 right-0 h-16 origin-top transition-transform duration-700 ease-in-out"
          style={{
            transform: open ? 'rotateX(-160deg)' : 'rotateX(0deg)',
            transformStyle: 'preserve-3d',
            zIndex: open ? 0 : 10,
          }}
        >
          <div className="w-full h-full bg-gradient-to-b from-purple-200 to-purple-100 border-2 border-purple-300 rounded-t-xl"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
        </div>

        {/* Mail icon when closed */}
        {!open && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mail className="w-10 h-10 text-purple-400" />
          </div>
        )}

        {/* Code card sliding out */}
        {open && (
          <div
            className="absolute left-4 right-4 bg-white border-2 border-emerald-300 rounded-lg shadow-md flex items-center justify-center transition-all duration-500 ease-out"
            style={{
              top: codeVisible ? '-28px' : '20px',
              height: '48px',
              opacity: codeVisible ? 1 : 0,
              zIndex: 20,
            }}
          >
            <span className="font-mono font-bold text-emerald-700 tracking-[0.2em] text-sm">
              {code}
            </span>
          </div>
        )}
      </div>

      {/* Code display */}
      <div
        className="transition-all duration-500"
        style={{ opacity: codeVisible ? 1 : 0, transform: codeVisible ? 'translateY(0)' : 'translateY(8px)' }}
      >
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 mb-2">
          <KeyRound className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-mono font-bold text-emerald-700 tracking-[0.25em] text-lg">{code}</span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-semibold transition ml-2"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-center text-amber-600 font-medium">
          ⏱ Expires in {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminPaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [actionState, setActionState] = useState({}); // { [id]: 'generating' | 'sending' | 'sent' | 'rejecting' }
  const [generatedCodes, setGeneratedCodes] = useState({}); // { [id]: { code, expiresAt } }
  const [copiedId, setCopiedId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/plans/admin/payment-requests/${filter !== 'all' ? `?status=${filter}` : ''}`,
        { headers: authHeaders() }
      );
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const setAction = (id, state) => setActionState(prev => ({ ...prev, [id]: state }));

  const handleGenerate = async (id) => {
    setAction(id, 'generating');
    try {
      const res = await axios.post(
        `${API}/plans/admin/payment-requests/${id}/generate-code/`,
        {},
        { headers: authHeaders() }
      );
      const code = res.data.activation_code;
      // Fetch updated request to get expires_at
      const updated = await axios.get(`${API}/plans/admin/payment-requests/`, { headers: authHeaders() });
      const pr = (Array.isArray(updated.data) ? updated.data : []).find(r => r.id === id);
      setGeneratedCodes(prev => ({ ...prev, [id]: { code, expiresAt: pr?.code_expires_at } }));
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', activation_code: code } : r));
      setAction(id, 'ready_to_send');
    } catch {
      setAction(id, null);
      alert('Failed to generate code.');
    }
  };

  const handleSend = async (id) => {
    // The code is already stored in DB and available via poll endpoint.
    // "Sending" here just marks it as delivered in our local UI.
    setAction(id, 'sending');
    await new Promise(r => setTimeout(r, 1200)); // brief animation
    setAction(id, 'sent');
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this payment request?')) return;
    setAction(id, 'rejecting');
    try {
      await axios.post(`${API}/plans/admin/payment-requests/${id}/reject/`, {}, { headers: authHeaders() });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    } catch {
      alert('Failed to reject.');
    } finally {
      setAction(id, null);
    }
  };

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getCode = (r) => generatedCodes[r.id]?.code || r.activation_code;
  const getExpiry = (r) => generatedCodes[r.id]?.expiresAt || r.code_expires_at;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Generate and send activation codes to verified customers</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map(s => {
          const st = STATUS_STYLES[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition capitalize ${
                filter === s ? `${st.bg} ${st.text} ${st.border}` : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {filter} payment requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
            const StatusIcon = st.icon;
            const isOpen = expanded === r.id;
            const code = getCode(r);
            const expiry = getExpiry(r);
            const action = actionState[r.id];

            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                {/* Row header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  {/* Method logo */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${
                    r.payment_method === 'mtn' ? 'bg-yellow-400' : r.payment_method === 'airtel' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    {METHOD_LOGOS[r.payment_method]
                      ? <img src={METHOD_LOGOS[r.payment_method]} alt={r.payment_method} className="w-full h-full object-contain p-1" />
                      : <CreditCard className="w-5 h-5 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{r.tenant_name}</span>
                      <span className="text-xs text-gray-400">→</span>
                      <span className="text-sm text-purple-700 font-medium">{r.plan_name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.sender_name}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone_number}</span>
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{r.transaction_id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.bg} ${st.text} ${st.border}`}>
                      <StatusIcon className="w-3 h-3" /> {r.status}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50">

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4 text-sm border-b border-gray-100">
                      <div><p className="text-xs text-gray-400 mb-0.5">Sender Name</p><p className="font-medium text-gray-800">{r.sender_name}</p></div>
                      <div><p className="text-xs text-gray-400 mb-0.5">Phone Number</p><p className="font-medium text-gray-800">{r.phone_number}</p></div>
                      <div><p className="text-xs text-gray-400 mb-0.5">Transaction ID</p><p className="font-medium text-gray-800 font-mono">{r.transaction_id}</p></div>
                      <div><p className="text-xs text-gray-400 mb-0.5">Method</p><p className="font-medium text-gray-800 capitalize">{r.payment_method}</p></div>
                    </div>

                    <div className="px-5 py-5">

                      {/* ── PENDING: Generate button ── */}
                      {r.status === 'pending' && !code && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleGenerate(r.id)}
                            disabled={action === 'generating'}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 shadow-md"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                          >
                            {action === 'generating'
                              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
                              : <><KeyRound className="w-4 h-4" /> Generate Activation Code</>}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={action === 'rejecting'}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            {action === 'rejecting' ? 'Rejecting…' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {/* ── Code generated — show envelope + send button ── */}
                      {code && action !== 'sent' && (
                        <div className="flex flex-col md:flex-row gap-6 items-start">

                          {/* Envelope animation */}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <MailOpen className="w-4 h-4 text-purple-500" />
                              Activation Code Ready
                            </p>
                            <EnvelopeCode
                              code={code}
                              expiresAt={expiry}
                              onCopy={() => copyCode(r.id, code)}
                              copied={copiedId === r.id}
                            />
                          </div>

                          {/* Send panel */}
                          <div className="md:w-64 flex flex-col gap-3">
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <p className="text-xs text-gray-500 mb-1">Send to</p>
                              <p className="font-semibold text-gray-900 text-sm">{r.tenant_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{r.sender_name} · {r.phone_number}</p>
                            </div>

                            <button
                              onClick={() => handleSend(r.id)}
                              disabled={action === 'sending'}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 shadow-md"
                              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                            >
                              {action === 'sending'
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                                : <><Send className="w-4 h-4" /> Send Code to User</>}
                            </button>

                            <p className="text-xs text-gray-400 text-center leading-relaxed">
                              The code is already available on the user's payment page. Clicking send confirms delivery.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── Sent confirmation ── */}
                      {action === 'sent' && code && (
                        <div className="flex flex-col items-center py-6 gap-3">
                          <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-emerald-500" />
                          </div>
                          <p className="font-bold text-gray-900">Code Sent Successfully!</p>
                          <p className="text-sm text-gray-500 text-center max-w-xs">
                            The activation code <span className="font-mono font-bold text-emerald-700">{code}</span> has been delivered to <span className="font-semibold">{r.tenant_name}</span>'s payment page.
                          </p>
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 mt-1">
                            <span className="font-mono font-bold text-emerald-700 tracking-[0.2em]">{code}</span>
                            <button onClick={() => copyCode(r.id, code)} className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1">
                              <Copy className="w-3 h-3" /> {copiedId === r.id ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-xs text-amber-600 font-medium">
                            ⏱ Expires in {Math.max(0, Math.ceil((new Date(expiry) - Date.now()) / (1000 * 60 * 60)))} hours
                          </p>
                        </div>
                      )}

                      {/* ── Already approved (revisiting) ── */}
                      {r.status === 'approved' && !code && action !== 'generating' && (
                        <button
                          onClick={() => handleGenerate(r.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition"
                        >
                          <KeyRound className="w-4 h-4" /> View / Resend Code
                        </button>
                      )}

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
