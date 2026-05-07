import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Scale, AlertTriangle, X } from 'lucide-react';
import { fetchWithAuth } from '../../api';

const BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school-accounting`;
const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

const ASSET_TYPES = [
  { value: 'building', label: 'Building' }, { value: 'land', label: 'Land' },
  { value: 'furniture', label: 'Furniture' }, { value: 'equipment', label: 'Equipment' },
  { value: 'vehicle', label: 'Vehicle' }, { value: 'computer', label: 'Computer/IT' },
  { value: 'other', label: 'Other' },
];
const DEBT_TYPES = [
  { value: 'supplier', label: 'Supplier Debt' }, { value: 'loan', label: 'Bank Loan' },
  { value: 'salary', label: 'Unpaid Salaries' }, { value: 'utility', label: 'Utility Bills' },
  { value: 'rent', label: 'Rent Arrears' }, { value: 'other', label: 'Other Debt' },
];

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700', overdue: 'bg-red-100 text-red-700',
};

const EMPTY_ASSET = {
  name: '', asset_type: 'equipment', purchase_value: '', current_value: '',
  purchase_date: new Date().toISOString().split('T')[0], depreciation_rate: '0',
  condition: '', location: '', notes: '',
};
const EMPTY_DEBT = {
  creditor_name: '', debt_type: 'supplier', original_amount: '', amount_paid: '0',
  incurred_date: new Date().toISOString().split('T')[0], due_date: '', description: '', notes: '',
};

export default function SchoolBalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [assets, setAssets] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET);
  const [debtForm, setDebtForm] = useState(EMPTY_DEBT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bsRes, assetsRes, debtsRes] = await Promise.all([
        fetchWithAuth(`${BASE}/balance-sheet/`),
        fetchWithAuth(`${BASE}/assets/`),
        fetchWithAuth(`${BASE}/debts/`),
      ]);
      if (bsRes?.ok) setBalanceSheet(await bsRes.json());
      if (assetsRes?.ok) setAssets(await assetsRes.json());
      if (debtsRes?.ok) setDebts(await debtsRes.json());
    } catch (e) {
      console.error('SchoolBalanceSheet load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssetSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const method = editingAssetId ? 'PUT' : 'POST';
      const url = editingAssetId ? `${BASE}/assets/${editingAssetId}/` : `${BASE}/assets/`;
      const res = await fetchWithAuth(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assetForm),
      });
      if (!res?.ok) { const d = await res.json(); setError(Object.values(d).flat().join(' ')); return; }
      setShowAssetForm(false); load();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const handleDebtSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const method = editingDebtId ? 'PUT' : 'POST';
      const url = editingDebtId ? `${BASE}/debts/${editingDebtId}/` : `${BASE}/debts/`;
      const res = await fetchWithAuth(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debtForm),
      });
      if (!res?.ok) { const d = await res.json(); setError(Object.values(d).flat().join(' ')); return; }
      setShowDebtForm(false); load();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const openEditAsset = (a) => {
    setAssetForm({ name: a.name, asset_type: a.asset_type, purchase_value: a.purchase_value,
      current_value: a.current_value, purchase_date: a.purchase_date,
      depreciation_rate: a.depreciation_rate, condition: a.condition || '',
      location: a.location || '', notes: a.notes || '' });
    setEditingAssetId(a.id); setError(''); setShowAssetForm(true);
  };

  const openEditDebt = (d) => {
    setDebtForm({ creditor_name: d.creditor_name, debt_type: d.debt_type,
      original_amount: d.original_amount, amount_paid: d.amount_paid,
      incurred_date: d.incurred_date, due_date: d.due_date || '',
      description: d.description, notes: d.notes || '' });
    setEditingDebtId(d.id); setError(''); setShowDebtForm(true);
  };

  const deleteAsset = async (id) => {
    if (!confirm('Delete this asset?')) return;
    await fetchWithAuth(`${BASE}/assets/${id}/`, { method: 'DELETE' }); load();
  };
  const deleteDebt = async (id) => {
    if (!confirm('Delete this liability?')) return;
    await fetchWithAuth(`${BASE}/debts/${id}/`, { method: 'DELETE' }); load();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading…</div>;

  const isBalanced = balanceSheet?.is_balanced;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Balance Sheet</h2>
        <div className="flex gap-2">
          <button onClick={() => { setAssetForm(EMPTY_ASSET); setEditingAssetId(null); setError(''); setShowAssetForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={18} /> Add Asset
          </button>
          <button onClick={() => { setDebtForm(EMPTY_DEBT); setEditingDebtId(null); setError(''); setShowDebtForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            <Plus size={18} /> Add Liability
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {[['overview', 'Overview'], ['assets', 'Assets'], ['liabilities', 'Liabilities']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && balanceSheet && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            {isBalanced ? <Scale className="text-green-600" size={22} /> : <AlertTriangle className="text-yellow-600" size={22} />}
            <span className={`font-semibold text-sm ${isBalanced ? 'text-green-700' : 'text-yellow-700'}`}>
              {isBalanced ? 'Balance Sheet is Balanced ✓' : 'Balance Sheet is Unbalanced — check your entries'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Assets', value: fmt(balanceSheet.assets?.total), color: 'blue' },
              { label: 'Total Liabilities', value: fmt(balanceSheet.liabilities?.total), color: 'red' },
              { label: 'Net Equity', value: fmt(balanceSheet.equity?.total), color: 'green' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-white p-5 rounded-xl shadow-sm border border-${color}-100`}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <h3 className="text-lg font-bold text-center text-gray-800 mb-6">Balance Sheet Statement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="bg-blue-50 px-4 py-2 rounded font-semibold text-gray-700 text-sm mb-3">ASSETS</div>
                {balanceSheet.assets?.by_type?.map(item => (
                  <div key={item.asset_type} className="flex justify-between px-4 py-1.5 text-sm">
                    <span className="text-gray-600 capitalize">{item.asset_type}</span>
                    <span className="font-medium">{fmt(item.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2 border-t mt-2 font-bold text-sm">
                  <span>Total Assets</span>
                  <span className="text-blue-600">{fmt(balanceSheet.assets?.total)}</span>
                </div>
              </div>
              <div>
                <div className="bg-red-50 px-4 py-2 rounded font-semibold text-gray-700 text-sm mb-3">LIABILITIES</div>
                {balanceSheet.liabilities?.by_type?.map(item => (
                  <div key={item.debt_type} className="flex justify-between px-4 py-1.5 text-sm">
                    <span className="text-gray-600 capitalize">{item.debt_type.replace('_', ' ')}</span>
                    <span className="font-medium">{fmt(item.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2 border-t mt-2 font-bold text-sm">
                  <span>Total Liabilities</span>
                  <span className="text-red-600">{fmt(balanceSheet.liabilities?.total)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 mt-3 font-bold text-sm bg-green-50 rounded">
                  <span>Net Equity</span>
                  <span className="text-green-600">{fmt(balanceSheet.equity?.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Type', 'Purchase Value', 'Current Value', 'Condition', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No assets recorded.</td></tr>
                ) : assets.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3">{a.asset_type_display}</td>
                    <td className="px-4 py-3">{fmt(a.purchase_value)}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{fmt(a.current_value)}</td>
                    <td className="px-4 py-3">{a.condition || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditAsset(a)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={15} /></button>
                        <button onClick={() => deleteAsset(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liabilities Tab */}
      {activeTab === 'liabilities' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Creditor', 'Type', 'Original', 'Paid', 'Balance', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debts.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No liabilities recorded.</td></tr>
                ) : debts.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.creditor_name}</td>
                    <td className="px-4 py-3">{d.debt_type_display}</td>
                    <td className="px-4 py-3">{fmt(d.original_amount)}</td>
                    <td className="px-4 py-3 text-green-600">{fmt(d.amount_paid)}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{fmt(d.balance)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>
                        {d.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditDebt(d)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={15} /></button>
                        <button onClick={() => deleteDebt(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Form Modal */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">{editingAssetId ? 'Edit' : 'Add'} Asset</h3>
              <button onClick={() => setShowAssetForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAssetSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                <input type="text" required value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={assetForm.asset_type}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input type="date" required value={assetForm.purchase_date}
                    onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Value (UGX)</label>
                  <input type="number" required min="0" value={assetForm.purchase_value}
                    onChange={(e) => setAssetForm({ ...assetForm, purchase_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (UGX)</label>
                  <input type="number" required min="0" value={assetForm.current_value}
                    onChange={(e) => setAssetForm({ ...assetForm, current_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <input type="text" placeholder="Good / Fair / Poor" value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
                <button type="button" onClick={() => setShowAssetForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editingAssetId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Form Modal */}
      {showDebtForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">{editingDebtId ? 'Edit' : 'Add'} Liability</h3>
              <button onClick={() => setShowDebtForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleDebtSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creditor Name</label>
                <input type="text" required value={debtForm.creditor_name}
                  onChange={(e) => setDebtForm({ ...debtForm, creditor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Debt Type</label>
                  <select value={debtForm.debt_type}
                    onChange={(e) => setDebtForm({ ...debtForm, debt_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incurred Date</label>
                  <input type="date" required value={debtForm.incurred_date}
                    onChange={(e) => setDebtForm({ ...debtForm, incurred_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Amount (UGX)</label>
                  <input type="number" required min="0" value={debtForm.original_amount}
                    onChange={(e) => setDebtForm({ ...debtForm, original_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (UGX)</label>
                  <input type="number" min="0" value={debtForm.amount_paid}
                    onChange={(e) => setDebtForm({ ...debtForm, amount_paid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={debtForm.due_date}
                  onChange={(e) => setDebtForm({ ...debtForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required rows={2} value={debtForm.description}
                  onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
                <button type="button" onClick={() => setShowDebtForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editingDebtId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
