import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, RefreshCw, KeyRound,
  Copy, ChevronDown, ChevronUp, AlertCircle, Send, Loader2, Eye
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: Clock, label: 'Pending Review' },
  approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle, label: 'Approved' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', icon: XCircle, label: 'Rejected' },
};

export default function AdminPaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [codes, setCodes] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/plans/admin/payment-requests/?status=${filter}`,
        { headers: authHeaders() }
      );
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleGenerate = async (id) => {
    setGeneratingId(id);
    try {
      const res = await axios.post(
        `${API}/plans/admin/payment-requests/${id}/generate-code/`,
        {},
        { headers: authHeaders() }
      );
      setCodes(prev => ({ ...prev, [id]: res.data.activation_code }));
      // Auto-refresh to show updated status
      await fetchRequests();
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendCode = async (id) => {
    // Code is already automatically sent via polling from user's side
    // This just confirms the action
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReject = async (id) => {
    setRejectingId(id);
    try {
      await axios.post(
        `${API}/plans/admin/payment-requests/${id}/reject/`,
        { note: 'Rejected by admin' },
        { headers: authHeaders() }
      );
      await fetchRequests();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setRejectingId(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full px-6 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Requests</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve payment submissions from customers</p>
      </div>

      {/* Filter tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2 flex-wrap">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {STATUS_STYLES[s].label}
            <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
              {requests.filter(r => r.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-7xl mx-auto flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No payment requests in this category</p>
        </div>
      )}

      {/* Requests list */}
      {!loading && requests.length > 0 && (
        <div className="max-w-7xl mx-auto space-y-4">
          {requests.map(req => {
            const StatusIcon = STATUS_STYLES[req.status].icon;
            const code = codes[req.id];
            const isExpanded = expanded === req.id;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : req.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    {/* Status badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${STATUS_STYLES[req.status].bg} border ${STATUS_STYLES[req.status].border}`}>
                      <StatusIcon className={`w-5 h-5 ${STATUS_STYLES[req.status].text}`} />
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{req.tenant_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {req.plan_name} • {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className={`ml-auto hidden sm:block px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[req.status].bg} ${STATUS_STYLES[req.status].text}`}>
                      {STATUS_STYLES[req.status].label}
                    </div>
                  </div>

                  {/* Expand icon */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 space-y-4"
                  >
                    {/* Payment details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Sender Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.sender_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.phone_number}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Payment Method</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{req.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Transaction ID</p>
                        <p className="text-sm font-medium font-mono text-gray-900 dark:text-white">{req.transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Plan</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.plan_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Submitted</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(req.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Activation code section */}
                    {req.status === 'approved' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <p className="font-bold text-blue-900 dark:text-blue-100">Activation Code</p>
                        </div>
                        {code ? (
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400 text-center">
                              {code}
                            </code>
                            <button
                              onClick={() => copyCode(code)}
                              className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                            >
                              <Copy className={`w-4 h-4 ${copiedCode === code ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400'}`} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-700 dark:text-blue-300">Code generated and automatically sent to user</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleGenerate(req.id)}
                            disabled={generatingId === req.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingId === req.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {generatingId === req.id ? 'Generating…' : 'Generate & Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={rejectingId === req.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rejectingId === req.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {rejectingId === req.id ? 'Rejecting…' : 'Reject'}
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && code && (
                        <button
                          onClick={() => handleSendCode(req.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          {copiedCode === req.id ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-300" />
                              Code Sent
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Confirm Sent
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Refresh button */}
      <div className="max-w-7xl mx-auto mt-8 flex justify-center">
        <button
          onClick={() => fetchRequests()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
