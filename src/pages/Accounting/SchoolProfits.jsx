import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, X, Printer } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import axios from 'axios';
import { buildStampWithDate } from '../../utils/stampProcessor';
import { loadReceiptSettings } from '../../services/receiptSettingsService';
import { printHTML } from '../../utils/printHTML';

const BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school-accounting`;
const SETTINGS_API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/business-settings/`;
const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

function buildIncomeReceiptHTML(item, school, sig) {
  const receiptNo = `INC-${String(item.id).padStart(5, '0')}-${(item.date || '').replace(/-/g, '')}`;
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
        <div style="font-size:14px;font-weight:bold;margin-top:6px">INCOME RECEIPT</div>
        <div style="font-size:10px;color:#999;margin-top:2px">Receipt No: ${receiptNo}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:8px 12px;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse;font-size:12px;color:#111">
          <tr>
            <td style="padding:3px 0;width:50%;font-weight:400"><span style="color:#6b7280">Date:</span> ${item.date}</td>
            <td style="padding:3px 0;width:50%;font-weight:400"><span style="color:#6b7280">Type:</span> ${item.income_type_display || item.income_type}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Source:</span> ${item.source}</td>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Method:</span> ${(item.payment_method || '').replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Reference:</span> ${item.reference_number || '&mdash;'}</td>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Term/Year:</span> ${[item.term, item.academic_year].filter(Boolean).join(' ') || '&mdash;'}</td>
          </tr>
        </table>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px">
        <thead><tr style="background:#f0f0f0">
          <th style="padding:6px 8px;text-align:left;border:1px solid #ddd">Description</th>
          <th style="padding:6px 8px;text-align:right;border:1px solid #ddd">Amount Received</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style="padding:6px 8px;border:1px solid #eee">${item.description}</td>
            <td style="padding:6px 8px;border:1px solid #eee;text-align:right;font-weight:700;color:#059669;font-size:14px">${fmt(item.amount)}</td>
          </tr>
          ${item.notes ? `<tr style="background:#f9f9f9"><td colspan="2" style="padding:5px 8px;border:1px solid #eee;color:#555;font-style:italic">Note: ${item.notes}</td></tr>` : ''}
        </tbody>
      </table>
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#555">
        <div style="flex:1">
          <div style="margin-bottom:4px;color:#888">Received from:</div>
          <div style="border-bottom:1px solid #999;width:140px;height:28px"></div>
          <div style="margin-top:3px;font-weight:700;text-transform:uppercase">${item.source}</div>
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
        Official income receipt. Printed: ${new Date().toLocaleString()}
      </div>
    </div>`;
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  income_type: 'fees',
  description: '',
  amount: '',
  source: '',
  payment_method: 'cash',
  reference_number: '',
  term: '',
  academic_year: '',
  notes: '',
};

export default function SchoolProfits() {
  const [income, setIncome] = useState([]);
  const [summary, setSummary] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    date_from: `${new Date().getFullYear()}-01-01`,
    date_to: new Date().toISOString().split('T')[0],
  });
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

  const handlePrintIncome = async (item) => {
    let freshSig = sig;
    if (sig.stamp) {
      try {
        const opts = { offsetX: Number(localStorage.getItem('schoolStampOffsetX') || 0), offsetY: Number(localStorage.getItem('schoolStampOffsetY') || 0), rotate: Number(localStorage.getItem('schoolStampRotate') || 0), circular: localStorage.getItem('schoolStampCircular') === 'true' };
        freshSig = { ...sig, stamp: await buildStampWithDate(sig.stamp, opts) };
      } catch { /* use as-is */ }
    }
    const html = buildIncomeReceiptHTML(item, school, freshSig);
    await printHTML(html, 'Income Receipt');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plParams = new URLSearchParams(dateRange);
      const [incRes, sumRes, plRes] = await Promise.all([
        fetchWithAuth(`${BASE}/income/`),
        fetchWithAuth(`${BASE}/income/summary/`),
        fetchWithAuth(`${BASE}/profit-loss/?${plParams}`),
      ]);
      if (incRes?.ok) setIncome(await incRes.json());
      if (sumRes?.ok) setSummary(await sumRes.json());
      if (plRes?.ok) setProfitLoss(await plRes.json());
    } catch (e) {
      console.error('SchoolProfits load error:', e);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setError(''); setShowForm(true); };
  const openEdit = (item) => {
    setForm({
      date: item.date, income_type: item.income_type, description: item.description,
      amount: item.amount, source: item.source, payment_method: item.payment_method,
      reference_number: item.reference_number || '', term: item.term || '',
      academic_year: item.academic_year || '', notes: item.notes || '',
    });
    setEditingId(item.id); setError(''); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${BASE}/income/${editingId}/` : `${BASE}/income/`;
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res?.ok) {
        const d = await res.json();
        setError(Object.values(d).flat().join(' '));
        return;
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this income record?')) return;
    await fetchWithAuth(`${BASE}/income/${id}/`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading…</div>;

  const netProfit = profitLoss?.net_profit || 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Profits & Income</h2>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
          <Plus size={18} /> Add Income
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {[['overview', 'Overview'], ['income', 'Income Records'], ['profit-loss', 'Profit & Loss']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === key ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-lg"><DollarSign className="text-green-600" size={22} /></div>
                <div>
                  <p className="text-xs text-gray-500">Total Income</p>
                  <p className="text-xl font-bold text-gray-800">{fmt(summary.total_income)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg"><Calendar className="text-blue-600" size={22} /></div>
                <div>
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-xl font-bold text-gray-800">{fmt(summary.this_month)}</p>
                </div>
              </div>
            </div>
            <div className={`bg-white p-5 rounded-xl shadow-sm border ${isProfit ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isProfit ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isProfit ? <TrendingUp className="text-green-600" size={22} /> : <TrendingDown className="text-red-600" size={22} />}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net Profit (YTD)</p>
                  <p className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? '' : '-'}{fmt(Math.abs(netProfit))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {summary.by_type?.length > 0 && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Income by Type</h3>
              <div className="space-y-2">
                {summary.by_type.map(item => (
                  <div key={item.income_type} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 capitalize">{item.income_type.replace('_', ' ')}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">{item.count} records</span>
                      <span className="text-sm font-semibold text-green-600">{fmt(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Income Records */}
      {activeTab === 'income' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date', 'Type', 'Description', 'Source', 'Amount', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {income.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No income records found.</td></tr>
                ) : income.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {item.income_type_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{item.description}</td>
                    <td className="px-4 py-3">{item.source}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{fmt(item.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handlePrintIncome(item)} title="Print Receipt"
                          className="p-1.5 rounded hover:bg-green-50 text-green-600"><Printer size={15} /></button>
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profit & Loss */}
      {activeTab === 'profit-loss' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input type="date" value={dateRange.date_from}
                  onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input type="date" value={dateRange.date_to}
                  onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          {profitLoss && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h3 className="text-lg font-bold text-center text-gray-800 mb-1">Profit & Loss Statement</h3>
              <p className="text-center text-xs text-gray-400 mb-6">
                {profitLoss.period?.start} — {profitLoss.period?.end}
              </p>

              <div className="mb-5">
                <div className="bg-green-50 px-4 py-2 rounded font-semibold text-gray-700 text-sm mb-2">INCOME</div>
                <div className="px-4 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Fee Income</span><span>{fmt(profitLoss.income?.fee_income)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Other Income</span><span>{fmt(profitLoss.income?.other_income)}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold"><span>Total Income</span><span className="text-green-600">{fmt(profitLoss.income?.total)}</span></div>
                </div>
              </div>

              <div className="mb-5">
                <div className="bg-red-50 px-4 py-2 rounded font-semibold text-gray-700 text-sm mb-2">EXPENSES</div>
                <div className="px-4 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">General Expenses</span><span>{fmt(profitLoss.expenses?.general_expenses)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Teacher Salaries</span><span>{fmt(profitLoss.expenses?.teacher_salaries)}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold"><span>Total Expenses</span><span className="text-red-600">{fmt(profitLoss.expenses?.total)}</span></div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isProfit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{isProfit ? 'NET PROFIT' : 'NET LOSS'}</span>
                  <span className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(Math.abs(netProfit))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Profit Margin: {profitLoss.profit_margin?.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Edit' : 'Add'} Income</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
                  <select value={form.income_type}
                    onChange={(e) => setForm({ ...form, income_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="fees">School Fees</option>
                    <option value="donation">Donation</option>
                    <option value="grant">Government Grant</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="other">Other Income</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" required value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
                  <input type="number" required min="0" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input type="text" required value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                  <input type="text" value={form.reference_number}
                    onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
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
              <div className="flex justify-end gap-3 pt-2">
                {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
