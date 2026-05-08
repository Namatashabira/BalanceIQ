import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Users, CheckCircle, Clock, AlertCircle, X, Receipt } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import SalaryReceipt from './SalaryReceipt';

const SA_BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school-accounting`;
const FEES_BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/fees`;
const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

const STATUS_CFG = {
  paid:    { color: 'bg-green-100 text-green-700',  Icon: CheckCircle },
  pending: { color: 'bg-yellow-100 text-yellow-700', Icon: Clock },
  partial: { color: 'bg-blue-100 text-blue-700',    Icon: Clock },
  overdue: { color: 'bg-red-100 text-red-700',      Icon: AlertCircle },
};

const EMPTY_SALARY = {
  teacher_name: '', employee_id: '',
  month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
  basic_salary: '', allowances: '0', deductions: '0',
  amount_paid: '0', payment_date: '', payment_method: 'bank_transfer',
  reference_number: '', notes: '',
};

export default function SchoolPayments() {
  const [feePayments, setFeePayments] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [salarySummary, setSalarySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fees');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [salaryFilters, setSalaryFilters] = useState({ status: '', teacher_name: '' });
  const [form, setForm] = useState(EMPTY_SALARY);
  const [receiptSalary, setReceiptSalary] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const salaryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(salaryFilters).filter(([, v]) => v))
      );
      const [feesRes, salariesRes, salSumRes] = await Promise.all([
        fetchWithAuth(`${FEES_BASE}/payments/?payment_category=school_fees`),
        fetchWithAuth(`${SA_BASE}/teacher-salaries/?${salaryParams}`),
        fetchWithAuth(`${SA_BASE}/teacher-salaries/summary/`),
      ]);
      if (feesRes?.ok) setFeePayments(await feesRes.json());
      if (salariesRes?.ok) setSalaries(await salariesRes.json());
      if (salSumRes?.ok) setSalarySummary(await salSumRes.json());
    } catch (e) {
      console.error('SchoolPayments load error:', e);
    } finally {
      setLoading(false);
    }
  }, [salaryFilters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_SALARY); setEditingId(null); setError(''); setShowForm(true); };
  const openEdit = (s) => {
    setForm({
      teacher_name: s.teacher_name, employee_id: s.employee_id || '',
      month: s.month, basic_salary: s.basic_salary, allowances: s.allowances,
      deductions: s.deductions, amount_paid: s.amount_paid,
      payment_date: s.payment_date || '', payment_method: s.payment_method,
      reference_number: s.reference_number || '', notes: s.notes || '',
    });
    setEditingId(s.id); setError(''); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${SA_BASE}/teacher-salaries/${editingId}/` : `${SA_BASE}/teacher-salaries/`;
      const res = await fetchWithAuth(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res?.ok) { const d = await res.json(); setError(Object.values(d).flat().join(' ')); return; }
      setShowForm(false); load();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this salary record?')) return;
    await fetchWithAuth(`${SA_BASE}/teacher-salaries/${id}/`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden min-w-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
        {activeTab === 'salaries' && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus size={18} /> Add Salary
          </button>
        )}
      </div>

      {/* Salary Summary Cards */}
      {salarySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Paid', value: fmt(salarySummary.total_paid), icon: CheckCircle, color: 'green' },
            { label: 'Balance Due', value: fmt(salarySummary.balance_due), icon: Clock, color: 'yellow' },
            { label: 'This Month', value: fmt(salarySummary.this_month_paid), icon: CreditCard, color: 'blue' },
            { label: 'Teachers', value: salarySummary.teacher_count, icon: Users, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`text-${color}-600 flex-shrink-0`} size={16} />
                <p className="text-xs text-gray-500 truncate">{label}</p>
              </div>
              <p className={`text-sm font-bold text-${color}-600 truncate`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {[['fees', 'Fee Payments'], ['salaries', 'Teacher Salaries']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Fee Payments */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date', 'Student', 'Term', 'Category', 'Method', 'Amount'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feePayments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No fee payments found.</td></tr>
                ) : feePayments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{p.payment_date}</td>
                    <td className="px-4 py-3 font-medium">{p.student_name || `Student #${p.student}`}</td>
                    <td className="px-4 py-3">{p.term} {p.academic_year}</td>
                    <td className="px-4 py-3 capitalize">{p.category_display || p.payment_category?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 capitalize">{p.payment_method}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{fmt(p.amount_paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden divide-y divide-gray-100">
            {feePayments.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400">No fee payments found.</p>
            ) : feePayments.map(p => (
              <div key={p.id} className="p-4 space-y-0.5">
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-800 text-sm">{p.student_name || `Student #${p.student}`}</p>
                  <p className="font-bold text-green-600 text-sm">{fmt(p.amount_paid)}</p>
                </div>
                <p className="text-xs text-gray-500">{p.payment_date} &middot; {p.term} {p.academic_year}</p>
                <p className="text-xs text-gray-500 capitalize">{p.category_display} &middot; {p.payment_method}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Salaries */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Search teacher name…"
                value={salaryFilters.teacher_name}
                onChange={(e) => setSalaryFilters({ ...salaryFilters, teacher_name: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <select value={salaryFilters.status}
                onChange={(e) => setSalaryFilters({ ...salaryFilters, status: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Teacher', 'Month', 'Net Salary', 'Paid', 'Balance', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salaries.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No salary records found.</td></tr>
                  ) : salaries.map(s => {
                    const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending;
                    const Icon = cfg.Icon;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{s.teacher_name}</td>
                        <td className="px-4 py-3">{s.month}</td>
                        <td className="px-4 py-3">{fmt(s.net_salary)}</td>
                        <td className="px-4 py-3 text-green-600">{fmt(s.amount_paid)}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{fmt(s.balance_due)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            <Icon size={11} />{s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setReceiptSalary(s)} title="View Receipt"
                              className="p-1.5 rounded hover:bg-green-50 text-green-600"><Receipt size={15} /></button>
                            <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={15} /></button>
                            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-gray-100">
              {salaries.length === 0 ? (
                <p className="px-4 py-8 text-center text-gray-400">No salary records found.</p>
              ) : salaries.map(s => {
                const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending;
                const Icon = cfg.Icon;
                return (
                  <div key={s.id} className="p-4 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{s.teacher_name}</p>
                        <p className="text-xs text-gray-500">{s.month}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon size={10} />{s.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>Net: <strong>{fmt(s.net_salary)}</strong></span>
                      <span className="text-green-600">Paid: {fmt(s.amount_paid)}</span>
                      <span className="text-red-600">Bal: {fmt(s.balance_due)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setReceiptSalary(s)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Receipt size={14} /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Salary Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Edit' : 'Add'} Salary Record</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
                  <input type="text" required value={form.teacher_name}
                    onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input type="text" value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input type="date" required value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                  <input type="number" required min="0" value={form.basic_salary}
                    onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
                  <input type="number" min="0" value={form.allowances}
                    onChange={(e) => setForm({ ...form, allowances: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                  <input type="number" min="0" value={form.deductions}
                    onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                  <input type="number" min="0" value={form.amount_paid}
                    onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input type="date" value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
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
              <div className="flex justify-end gap-3 pt-2">
                {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Salary Receipt Modal */}
      {receiptSalary && (
        <SalaryReceipt salary={receiptSalary} onClose={() => setReceiptSalary(null)} />
      )}
    </div>
  );
}
