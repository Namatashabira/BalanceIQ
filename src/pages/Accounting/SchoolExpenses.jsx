import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, Calendar, Filter, X, Printer } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import axios from 'axios';
import { buildStampWithDate } from '../../utils/stampProcessor';
import { loadReceiptSettings } from '../../services/receiptSettingsService';
import { printHTML } from '../../utils/printHTML';

const BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school-accounting`;
const SETTINGS_API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/business-settings/`;
const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

function buildExpenseReceiptHTML(exp, school, sig) {
  const receiptNo = `EXP-${String(exp.id).padStart(5, '0')}-${(exp.date || '').replace(/-/g, '')}`;
  const logoHTML = school.logo
    ? `<img src="${school.logo}" alt="logo" style="height:48px;object-fit:contain;margin-bottom:4px"/>`
    : '';
  const sigHTML = sig.mode === 'image' && sig.image
    ? `<img src="${sig.image}" style="height:40px;object-fit:contain;display:block;margin:0 auto"/>`
    : sig.mode === 'name' && sig.name
      ? `<span style="font-family:cursive;font-size:16px;color:#1e3a5f">${sig.name}</span>`
      : `<div style="border-bottom:1px solid #999;width:120px;margin:0 auto;height:28px"></div>`;
  const stampHTML = sig.stamp
    ? `<img src="${sig.stamp}" style="height:70px;object-fit:contain;display:inline-block"/>`
    : `<div style="border:1px dashed #ccc;border-radius:50%;width:70px;height:70px;display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:9px">STAMP</div>`;

  return `
    <div style="padding:24px;border:1px solid #ccc;font-family:Arial,sans-serif;font-size:12px;color:#111;background:#fff;max-width:700px;margin:0 auto;box-sizing:border-box">
      <div style="text-align:center;border-bottom:2px solid #222;padding-bottom:10px;margin-bottom:14px">
        ${logoHTML}
        <div style="font-size:16px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">${school.name || 'School'}</div>
        ${school.address ? `<div style="font-size:10px;color:#555;margin-top:1px">${school.address}</div>` : ''}
        ${school.phone ? `<div style="font-size:10px;color:#555">Tel: ${school.phone}</div>` : ''}
        <div style="font-size:14px;font-weight:bold;margin-top:6px">EXPENSE PAYMENT RECEIPT</div>
        <div style="font-size:10px;color:#999;margin-top:2px">Receipt No: ${receiptNo}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:8px 12px;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse;font-size:12px;color:#111">
          <tr>
            <td style="padding:3px 0;width:50%;font-weight:400"><span style="color:#6b7280">Date:</span> ${exp.date}</td>
            <td style="padding:3px 0;width:50%;font-weight:400"><span style="color:#6b7280">Category:</span> ${exp.category_name || '&mdash;'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Payee:</span> ${exp.payee}</td>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Method:</span> ${(exp.payment_method || '').replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Reference:</span> ${exp.reference_number || '&mdash;'}</td>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Term/Year:</span> ${[exp.term, exp.academic_year].filter(Boolean).join(' ') || '&mdash;'}</td>
          </tr>
        </table>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px">
        <thead><tr style="background:#f0f0f0">
          <th style="padding:6px 8px;text-align:left;border:1px solid #ddd">Description</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #ddd">Amount</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style="padding:6px 8px;border:1px solid #eee">${exp.description}</td>
            <td style="padding:6px 8px;border:1px solid #eee;text-align:right;font-weight:700;color:#dc2626;font-size:14px">${fmt(exp.amount)}</td>
          </tr>
          ${exp.notes ? `<tr style="background:#f9f9f9"><td colspan="2" style="padding:5px 8px;border:1px solid #eee;color:#555;font-style:italic">Note: ${exp.notes}</td></tr>` : ''}
        </tbody>
      </table>
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#555">
        <div style="flex:1">
          <div style="margin-bottom:4px;color:#888">Received by:</div>
          <div style="border-bottom:1px solid #999;width:140px;height:28px"></div>
          <div style="margin-top:3px;font-weight:700;text-transform:uppercase">${exp.payee}</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="margin-bottom:2px;color:#888">${sig.label || 'Bursar'}'s Signature:</div>
          ${sigHTML}
        </div>
        <div style="flex:1;text-align:right">
          <div style="margin-bottom:2px;color:#888">Date: <strong style="color:#111">${new Date().toLocaleDateString()}</strong></div>
          ${stampHTML}
        </div>
      </div>
      <div style="margin-top:10px;text-align:center;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:6px">
        Official expense receipt. Printed: ${new Date().toLocaleString()}
      </div>
    </div>`;
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  category: '', custom_category: '', description: '', amount: '',
  payment_method: 'cash', payee: '', reference_number: '',
  term: '', academic_year: '', notes: '',
};

export default function SchoolExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', term: '', academic_year: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [school, setSchool] = useState({ name: '', address: '', phone: '', logo: '' });
  const [sig, setSig] = useState({ mode: '', image: '', name: '', label: 'Bursar', stamp: '' });

  useEffect(() => {
    const tenantUUID = JSON.parse(localStorage.getItem('activeTenant') || '{}')?.uuid;
    axios.get(SETTINGS_API, {
      params: { tenant_uuid: tenantUUID },
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).then(r => {
      const d = r.data;
      setSchool({ name: d.businessName || '', address: [d.location, d.town, d.district].filter(Boolean).join(', '), phone: d.phone || '', logo: d.businessLogoUrl || localStorage.getItem('businessLogoUrl') || '' });
    }).catch(() => {
      setSchool(s => ({ ...s, name: localStorage.getItem('businessName') || '', logo: localStorage.getItem('businessLogoUrl') || '' }));
    });
    loadReceiptSettings().then(data => {
      const rawStamp = data.stamp_raw || '';
      const opts = { offsetX: Number(data.stamp_offset_x || 0), offsetY: Number(data.stamp_offset_y || 0), rotate: Number(data.stamp_rotate || 0), circular: data.stamp_circular === true || data.stamp_circular === 'true' };
      const sigData = { mode: data.sig_mode || '', image: data.sig_image || '', name: data.sig_name || '', label: data.sig_label || 'Bursar', stamp: rawStamp };
      if (rawStamp) {
        buildStampWithDate(rawStamp, opts).then(s => setSig({ ...sigData, stamp: s })).catch(() => setSig(sigData));
      } else {
        setSig(sigData);
      }
      setSchool(s => ({ ...s, logo: data.logo || s.logo }));
    });
  }, []);

  const handlePrintExpense = async (exp) => {
    let freshSig = sig;
    if (sig.stamp) {
      try {
        const opts = { offsetX: Number(localStorage.getItem('schoolStampOffsetX') || 0), offsetY: Number(localStorage.getItem('schoolStampOffsetY') || 0), rotate: Number(localStorage.getItem('schoolStampRotate') || 0), circular: localStorage.getItem('schoolStampCircular') === 'true' };
        freshSig = { ...sig, stamp: await buildStampWithDate(sig.stamp, opts) };
      } catch { /* use as-is */ }
    }
    const html = buildExpenseReceiptHTML(exp, school, freshSig);
    await printHTML(html, 'Expense Receipt');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const [expRes, catRes, sumRes] = await Promise.all([
        fetchWithAuth(`${BASE}/expenses/?${params}`),
        fetchWithAuth(`${BASE}/expense-categories/`),
        fetchWithAuth(`${BASE}/expenses/summary/`),
      ]);
      if (expRes?.ok) setExpenses(await expRes.json());
      if (catRes?.ok) setCategories(await catRes.json());
      if (sumRes?.ok) setSummary(await sumRes.json());
    } catch (e) {
      console.error('SchoolExpenses load error:', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setError(''); setShowForm(true); };
  const openEdit = (exp) => {
    setForm({
      date: exp.date, category: exp.category, custom_category: exp.custom_category || '',
      description: exp.description, amount: exp.amount, payment_method: exp.payment_method,
      payee: exp.payee, reference_number: exp.reference_number || '',
      term: exp.term || '', academic_year: exp.academic_year || '', notes: exp.notes || '',
    });
    setEditingId(exp.id); setError(''); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${BASE}/expenses/${editingId}/` : `${BASE}/expenses/`;
      const payload = {
        ...form,
        category: form.category === 'custom' ? null : form.category || null,
        description: form.category === 'custom' && form.custom_category
          ? `[${form.custom_category}] ${form.description}` : form.description,
      };
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res?.ok) { const d = await res.json(); setError(Object.values(d).flat().join(' ')); return; }
      setShowForm(false); load();
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await fetchWithAuth(`${BASE}/expenses/${id}/`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden min-w-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Expenses', value: fmt(summary.total_expenses), icon: DollarSign, color: 'red' },
            { label: 'This Month', value: fmt(summary.this_month), icon: Calendar, color: 'orange' },
            { label: 'Total Records', value: summary.expense_count, icon: TrendingUp, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-2 bg-${color}-100 rounded-lg flex-shrink-0`}><Icon className={`text-${color}-600`} size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{label}</p>
                  <p className="text-sm sm:text-xl font-bold text-gray-800 truncate">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600"><Filter size={16} /> Filters</div>
        <div className="grid grid-cols-3 gap-3">
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <input type="text" placeholder="Academic Year (e.g. 2024)" value={filters.academic_year}
            onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Category', 'Description', 'Payee', 'Method', 'Amount', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No expenses found.</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{exp.date}</td>
                  <td className="px-4 py-3">{exp.category_name || '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{exp.description}</td>
                  <td className="px-4 py-3">{exp.payee}</td>
                  <td className="px-4 py-3 capitalize">{exp.payment_method?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{fmt(exp.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handlePrintExpense(exp)} title="Print Receipt"
                        className="p-1.5 rounded hover:bg-green-50 text-green-600"><Printer size={15} /></button>
                      <button onClick={() => openEdit(exp)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {expenses.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-400">No expenses found.</p>
          ) : expenses.map(exp => (
            <div key={exp.id} className="p-4 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{exp.description}</p>
                  <p className="text-xs text-gray-500">{exp.date} &middot; {exp.category_name || '—'}</p>
                  <p className="text-xs text-gray-500">{exp.payee} &middot; {exp.payment_method?.replace('_', ' ')}</p>
                </div>
                <p className="font-bold text-red-600 text-sm">{fmt(exp.amount)}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => handlePrintExpense(exp)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Printer size={14} /></button>
                <button onClick={() => openEdit(exp)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Edit' : 'Add'} Expense</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, custom_category: '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="custom">Custom (type below)</option>
                  </select>
                  {form.category === 'custom' && (
                    <input type="text" required placeholder="Enter custom category name" value={form.custom_category}
                      onChange={(e) => setForm({ ...form, custom_category: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg text-sm" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
                  <input type="number" required min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payee</label>
                  <input type="text" required value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                  <input type="text" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">Select Term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input type="text" placeholder="e.g. 2024" value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
