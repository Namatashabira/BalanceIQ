import { useState, useEffect } from 'react';
import { Save, CheckCircle, User, RefreshCw, ChevronDown } from 'lucide-react';
import { fetchWithAuth } from '../api';

const API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/staff-credentials/`;

const ROLES = [
  { key: 'headteacher', label: 'Headteacher',               color: 'bg-indigo-100 text-indigo-700 border-indigo-200',  defaultTitle: 'Headteacher' },
  { key: 'deputy',      label: 'Deputy Headteacher',        color: 'bg-amber-100 text-amber-700 border-amber-200',     defaultTitle: 'Deputy Headteacher' },
  { key: 'dos',         label: 'Director of Studies (DOS)', color: 'bg-violet-100 text-violet-700 border-violet-200',  defaultTitle: 'Director of Studies' },
  { key: 'teacher',     label: 'Class Teacher',             color: 'bg-blue-100 text-blue-700 border-blue-200',        defaultTitle: 'Class Teacher' },
  { key: 'bursar',      label: 'Bursar',                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', defaultTitle: 'Bursar' },
  { key: 'director',    label: 'Director',                  color: 'bg-rose-100 text-rose-700 border-rose-200',        defaultTitle: 'Director' },
];

const EMPTY = (roleKey, defaultTitle) => ({ role: roleKey, name: '', title: defaultTitle });

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

function RoleCard({ roleKey, label, color, defaultTitle, credential, onChange }) {
  const [open, setOpen] = useState(false);
  const c = credential || EMPTY(roleKey, defaultTitle);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${open ? 'border-indigo-300 shadow-md' : 'border-gray-100'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>{label}</span>
          {c.name && (
            <span className="text-xs text-gray-500">{c.name}{c.title ? ` · ${c.title}` : ''}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                className={inputCls}
                placeholder={`e.g. Mr. John Mukasa`}
                value={c.name}
                onChange={e => onChange({ ...c, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title / Designation</label>
              <input
                className={inputCls}
                placeholder={defaultTitle}
                value={c.title}
                onChange={e => onChange({ ...c, title: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            This name and title will appear automatically on all printed report cards in the signature section.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SchoolSignaturesSettings() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithAuth(API)
      .then(r => r.json())
      .then(d => {
        const existing = d.staff_credentials || [];
        const merged = ROLES.map(r => existing.find(c => c.role === r.key) || EMPTY(r.key, r.defaultTitle));
        setCredentials(merged);
      })
      .catch(() => setCredentials(ROLES.map(r => EMPTY(r.key, r.defaultTitle))))
      .finally(() => setLoading(false));
  }, []);

  const updateRole = (roleKey, data) =>
    setCredentials(prev => prev.map(c => c.role === roleKey ? data : c));

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetchWithAuth(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_credentials: credentials }),
      });
      if (!res.ok) { setError('Failed to save. Please try again.'); return; }
      localStorage.setItem('staffCredentials', JSON.stringify(credentials));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <User className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Staff Names for Report Cards</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Enter the name and title for each role. These are automatically printed in the signature section
            of every report card — staff sign physically on the printed copy.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ROLES.map(r => (
          <RoleCard
            key={r.key}
            roleKey={r.key}
            label={r.label}
            color={r.color}
            defaultTitle={r.defaultTitle}
            credential={credentials.find(c => c.role === r.key)}
            onChange={data => updateRole(r.key, data)}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {error && <p className="text-xs text-red-500 mr-auto">{error}</p>}
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>
    </div>
  );
}

/** Read all cached staff credentials from localStorage. */
export function getStaffCredentials() {
  try { return JSON.parse(localStorage.getItem('staffCredentials') || '[]'); } catch { return []; }
}

/** Get credential for a specific role key. */
export function getCredentialByRole(role) {
  return getStaffCredentials().find(c => c.role === role) || null;
}
