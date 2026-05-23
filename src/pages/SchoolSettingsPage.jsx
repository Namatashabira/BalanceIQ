import { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, RefreshCw, Plus, Trash2, X,
  GraduationCap, DollarSign, LayoutDashboard,
  ClipboardList, FileText, UserCheck, BarChart3, CheckCircle, XCircle, Building2,
  ChevronDown, Key, Copy, Mail, AtSign, Crown, PenLine
} from 'lucide-react';
import { fetchWithAuth } from '../api';
import SchoolProfileSettings from './SchoolProfileSettings';
import SchoolSignaturesSettings from './SchoolSignaturesSettings';
import SchoolStaffManagement from '../components/settings/SchoolStaffManagement';
import { useAuth } from '../context/AuthContext';

const API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/tenants`;

// ── Role definitions ──────────────────────────────────────────────────────────
const SCHOOL_ROLES = [
  { value: 'teacher',     label: 'Teacher',                  color: 'bg-blue-100 text-blue-700' },
  { value: 'bursar',      label: 'Bursar',                   color: 'bg-emerald-100 text-emerald-700' },
  { value: 'dos',         label: 'Director of Studies (DOS)', color: 'bg-violet-100 text-violet-700' },
  { value: 'deputy',      label: 'Deputy Headteacher',       color: 'bg-amber-100 text-amber-700' },
  { value: 'headteacher', label: 'Headteacher',              color: 'bg-indigo-100 text-indigo-700' },
  { value: 'director',    label: 'Director',                 color: 'bg-rose-100 text-rose-700' },
];

const PAGES = [
  { key: 'dashboard',          label: 'Dashboard',          icon: LayoutDashboard },
  { key: 'student-management', label: 'Student Management', icon: Users },
  { key: 'attendance',         label: 'Attendance',         icon: UserCheck },
  { key: 'marks-entry',        label: 'Marks Entry',        icon: ClipboardList },
  { key: 'fees',               label: 'Fees',               icon: DollarSign },
  { key: 'report-templates',   label: 'Report Templates',   icon: FileText },
  { key: 'analytics',          label: 'Analytics',          icon: BarChart3 },
];

const ROLE_PAGES = {
  teacher:     ['marks-entry', 'attendance'],
  bursar:      ['fees', 'school-receipt-lookup'],
  dos:         ['student-management', 'marks-entry', 'report-templates', 'attendance'],
  deputy:      ['student-management', 'marks-entry', 'fees', 'report-templates', 'attendance'],
  headteacher: ['dashboard', 'student-management', 'marks-entry', 'fees', 'report-templates', 'attendance', 'analytics'],
  director:    ['dashboard', 'student-management', 'marks-entry', 'fees', 'report-templates', 'attendance', 'analytics'],
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

function RoleBadge({ role }) {
  const r = SCHOOL_ROLES.find(r => r.value === role);
  if (!r) return <span className="text-xs text-gray-400">—</span>;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.color}`}>{r.label}</span>;
}

const ROLE_ORDER = ['teacher', 'bursar', 'dos', 'deputy', 'headteacher', 'director'];

// ── Inline role dropdown per card ─────────────────────────────────────────────
function RoleDropdown({ worker, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(worker.school_role || '');

  const handleChange = async (e) => {
    const roleValue = e.target.value;
    if (roleValue === current) return;
    setCurrent(roleValue); // optimistic update
    setSaving(true);
    try {
      await fetchWithAuth(`${API}/workers/${worker.id}/set-school-role/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_role: roleValue }),
      });
      onChanged();
    } catch {
      setCurrent(worker.school_role || ''); // revert on error
    } finally { setSaving(false); }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <ShieldCheck className="w-3.5 h-3.5 text-gray-400 pointer-events-none absolute left-2 z-10" />
      <select
        value={current}
        onChange={handleChange}
        disabled={saving}
        className="pl-7 pr-6 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 appearance-none cursor-pointer disabled:opacity-50 transition-colors"
      >
        {SCHOOL_ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-1.5" />
      {saving && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin ml-1" />}
    </div>
  );
}

// ── Staff tab ─────────────────────────────────────────────────────────────────
function StaffTab() {
  const { user } = useAuth();
  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role) || user?.is_staff;
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(null); // 'add' | 'otp' | 'transfer'
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [otpResult, setOtpResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', username: '', school_role: 'teacher' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/workers/`);
      if (res?.ok) setWorkers(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const CORE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core`;
      const pages = ROLE_PAGES[form.school_role] || [];
      const res = await fetchWithAuth(`${CORE}/access/invite/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.full_name,
          email: form.email,
          username: form.username,
          school_role: form.school_role,
          allowed_pages: pages,
        }),
      });
      const data = await res.json();
      if (!res?.ok) { setError(data.error || JSON.stringify(data)); return; }
      setOtpResult({ username: data.invite.username, otp_code: data.invite.otp_code });
      setCopied(false);
      setModal('otp');
      load();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    await fetchWithAuth(`${API}/workers/${id}/`, { method: 'DELETE' });
    load();
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    const res = await fetchWithAuth(`${API}/workers/${transferTarget.id}/transfer-ownership/`, { method: 'POST' });
    setTransferring(false);
    if (res?.ok) {
      setModal('transfer-done');
      load();
    } else {
      const d = await res.json();
      setError(d.error || 'Transfer failed.');
    }
  };

  const openAdd = () => {
    setForm({ full_name: '', email: '', username: '', school_role: 'teacher' });
    setError('');
    setModal('add');
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {workers.length} staff member{workers.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-400">Headteacher / Director can add, upgrade, downgrade or remove staff</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Staff cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading staff…</span>
        </div>
      ) : !workers.length ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-400">No staff added yet</p>
          <p className="text-xs text-gray-300 mt-1">Click “Add Staff” to invite a team member</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {workers.map(w => {
            const pages = Object.keys(w.pages || {});
            const initials = (w.name || w.username || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={w.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-3 sm:p-5 flex flex-col gap-3">
                {/* Top: avatar + name + delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Avatar: real photo or initials */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex-shrink-0 overflow-hidden bg-indigo-100 flex items-center justify-center">
                      {w.avatar_url ? (
                        <img src={w.avatar_url} alt={w.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-sm">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{w.name || '—'}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-xs mt-0.5">
                        <AtSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="font-mono truncate">{w.username || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(w.id)}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" title="Remove staff">
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 flex-shrink-0" />
                  <span className="truncate">{w.email || '—'}</span>
                </div>

                {/* Role dropdown */}
                <div className="pt-1 border-t border-gray-50">
                  <RoleDropdown worker={w} onChanged={load} />
                </div>

                {/* Transfer ownership — admin only */}
                {isAdmin && (
                  <button
                    onClick={() => { setTransferTarget(w); setModal('transfer'); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-[10px] sm:text-xs font-semibold transition-colors">
                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Transfer Ownership
                  </button>
                )}

                {/* Pages */}
                {pages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pages.map(p => (
                      <span key={p} className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add staff modal ── */}
      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Add Staff Member</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleGenerateCode} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required className={inputCls} value={form.full_name} placeholder="e.g. John Ssempala"
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" className={inputCls} value={form.email} placeholder="staff@school.com"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input required className={inputCls} value={form.username} placeholder="e.g. john.ssempala"
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '.') }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Role</label>
                <select className={inputCls} value={form.school_role}
                  onChange={e => setForm(f => ({ ...f, school_role: e.target.value }))}>
                  {SCHOOL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Will have access to:</p>
                <div className="flex flex-wrap gap-1">
                  {(ROLE_PAGES[form.school_role] || []).map(p => (
                    <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{p}</span>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {saving ? 'Generating…' : 'Generate Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── OTP result modal ── */}
      {modal === 'otp' && otpResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-gray-800">Staff Access Code</h2>
              </div>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">Share these credentials with the staff member. They will use them to set their password on first login.</p>
              <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Username</p>
                  <p className="font-mono font-bold text-indigo-800 text-lg select-all">{otpResult.username}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">One-Time Code (OTP)</p>
                  <p className="font-mono font-bold text-indigo-800 text-lg select-all break-all">{otpResult.otp_code}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">Instructions for the staff member:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to the login page</li>
                  <li>Click <strong>"Have an OTP code?"</strong></li>
                  <li>Enter the username and OTP code above</li>
                  <li>Set a new password to activate the account</li>
                </ol>
              </div>
              <button onClick={() => {
                navigator.clipboard?.writeText(`Username: ${otpResult.username}\nOTP Code: ${otpResult.otp_code}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }} className={`w-full py-2 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                copied
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50'
              }`}>
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
              </button>
              <button onClick={() => setModal(null)}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer ownership confirm modal ── */}
      {modal === 'transfer' && transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-gray-800">Transfer Ownership</h2>
              </div>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {transferTarget.avatar_url
                    ? <img src={transferTarget.avatar_url} alt={transferTarget.name} className="w-full h-full object-cover" />
                    : <span className="text-amber-700 font-bold text-sm">{(transferTarget.name || transferTarget.username || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{transferTarget.name || transferTarget.username}</p>
                  <p className="text-xs text-gray-500">{transferTarget.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Transferring ownership will:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                  <li>Make <strong>{transferTarget.name || transferTarget.username}</strong> the new Admin</li>
                  <li>Demote your account to a worker role</li>
                  <li>You will need to log out and log back in</li>
                </ul>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setModal(null); setError(''); }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleTransferOwnership} disabled={transferring}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                  {transferring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  {transferring ? 'Transferring…' : 'Yes, Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer done modal ── */}
      {modal === 'transfer-done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">Ownership Transferred!</p>
            <p className="text-sm text-gray-500">Please log out and log back in for the changes to take effect.</p>
            <button onClick={() => setModal(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Permissions matrix tab ────────────────────────────────────────────────────
function PermissionsMatrix() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Overview of what each school role can access. Roles are automatically applied when assigned to a staff member.</p>
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Page</th>
              {SCHOOL_ROLES.map(r => (
                <th key={r.value} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PAGES.map(({ key, label, icon: Icon }) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{label}</span>
                  </div>
                </td>
                {SCHOOL_ROLES.map(r => {
                  const allowed = (ROLE_PAGES[r.value] || []).includes(key);
                  return (
                    <td key={r.value} className="px-3 py-3 text-center">
                      {allowed
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-gray-200 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { role: 'teacher',     desc: 'Can only enter marks and record attendance. No access to fees, dashboard, or student data.' },
          { role: 'bursar',      desc: 'Manages school fees and payment receipts only.' },
          { role: 'dos',         desc: 'Director of Studies — manages student data, marks, attendance, and report templates.' },
          { role: 'deputy',      desc: 'Access to student management, marks, fees, attendance, and reports. No analytics.' },
          { role: 'headteacher', desc: 'Full access to all school pages including dashboard and analytics.' },
          { role: 'director',    desc: 'Same as Headteacher — full access to all school pages.' },
        ].map(({ role, desc }) => {
          const r = SCHOOL_ROLES.find(x => x.value === role);
          return (
            <div key={role} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.color}`}>{r.label}</span>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile',     label: 'School Profile',    icon: Building2 },
  { key: 'signatures',  label: 'Signatures',        icon: PenLine },
  { key: 'staff',       label: 'Staff Management',  icon: Users },
  { key: 'school-staff', label: 'School Staff',    icon: Users },
  { key: 'permissions', label: 'Role Permissions',  icon: ShieldCheck },
];

export default function SchoolSettingsPage() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-600 to-purple-700 shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-52 h-52 rounded-full bg-white/5" />
        <div className="relative px-6 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">School Settings</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Manage staff accounts, roles, and page access permissions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'profile'       && <SchoolProfileSettings />}
      {tab === 'signatures'    && <SchoolSignaturesSettings />}
      {tab === 'staff'         && <StaffTab />}
      {tab === 'school-staff'  && <SchoolStaffManagement />}
      {tab === 'permissions'   && <PermissionsMatrix />}
    </div>
  );
}
