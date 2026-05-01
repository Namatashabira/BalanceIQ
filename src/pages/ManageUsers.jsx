import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AdminPaymentRequests from './AdminPaymentRequests';
import {
  CreditCard, Users, Building2, ShieldCheck, RefreshCw,
  CheckCircle, XCircle, Clock, Search, MoreVertical,
  UserCheck, UserX, Trash2, Crown, AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

// ── Tenants tab ───────────────────────────────────────────────────────────────
function TenantsTab() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/tenants/`, { headers: authHeaders() });
      setTenants(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch { setTenants([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.admin_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenants…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <button onClick={fetch} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-purple-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No tenants found</p></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Tenant', 'Admin', 'Plan', 'Status', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                        {(t.name || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.schema_name || `#${t.id}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.admin_email || t.admin?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {t.subscription?.plan?.name || t.plan || 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.is_verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {t.is_verified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {t.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users/admin/all-users/`, { headers: authHeaders() });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDeactivate = async (id) => {
    setActionId(id);
    try {
      await axios.post(`${API}/users/admin/deactivate-user/${id}/`, {}, { headers: authHeaders() });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u));
    } catch { alert('Failed.'); }
    finally { setActionId(null); setOpenMenu(null); }
  };

  const handleReactivate = async (id) => {
    setActionId(id);
    try {
      await axios.post(`${API}/users/admin/reactivate-user/${id}/`, {}, { headers: authHeaders() });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: true } : u));
    } catch { alert('Failed.'); }
    finally { setActionId(null); setOpenMenu(null); }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setActionId(id);
    try {
      await axios.delete(`${API}/users/admin/delete-user/${id}/`, { headers: authHeaders() });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { alert('Failed to delete.'); }
    finally { setActionId(null); setOpenMenu(null); }
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <button onClick={fetch} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <span className="text-sm text-gray-400">{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-purple-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No users found</p></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Role', 'Tenant', 'Status', 'Last Login', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        u.is_superuser ? 'bg-purple-600' : u.is_staff ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                        {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                          {u.username}
                          {u.is_superuser && <Crown className="w-3 h-3 text-purple-500" />}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      u.is_superuser ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      u.is_staff ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      {u.is_superuser ? 'Superadmin' : u.is_staff ? 'Staff' : u.role || 'Worker'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.tenant_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {openMenu === u.id && (
                      <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                        {u.is_active ? (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            disabled={actionId === u.id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition"
                          >
                            <UserX className="w-4 h-4" /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(u.id)}
                            disabled={actionId === u.id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <UserCheck className="w-4 h-4" /> Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={actionId === u.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main SuperAdmin page ──────────────────────────────────────────────────────
const TABS = [
  { id: 'payments', label: 'Payment Requests', icon: CreditCard },
  { id: 'tenants',  label: 'All Tenants',       icon: Building2 },
  { id: 'users',    label: 'All Users',          icon: Users },
];

export default function ManageUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('payments');

  const isSuperAdmin = user?.is_staff || user?.is_superuser || user?.role === 'superadmin';

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShieldCheck className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 font-medium">Superadmin access required</p>
        <button onClick={() => navigate('/')} className="text-purple-600 text-sm underline">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Crown className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Superadmin Panel</h1>
          <p className="text-sm text-gray-500">Manage payment requests, tenants, and users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'payments' && <AdminPaymentRequests />}
        {activeTab === 'tenants'  && <TenantsTab />}
        {activeTab === 'users'    && <UsersTab />}
      </div>
    </div>
  );
}
