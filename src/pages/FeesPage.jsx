import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, DollarSign, Users, BookOpen } from 'lucide-react';
import { fetchWithAuth } from '../api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/fees`;

const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const METHODS = ['cash', 'bank', 'mobile_money', 'other'];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    paid: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-amber-100 text-amber-700',
    not_paid: 'bg-red-100 text-red-700',
    no_structure: 'bg-gray-100 text-gray-500',
  }[status] || 'bg-gray-100 text-gray-500';
  const label = { paid: 'Paid', partial: 'Partial', not_paid: 'Not Paid', no_structure: 'No Structure' }[status] || status;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg}`}>{label}</span>;
}

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const currentYear = () => String(new Date().getFullYear());

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [filters, setFilters] = useState({ term: 'Term 1', academic_year: currentYear(), class_assigned: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetchWithAuth(`${API}/payments/summary/?${params}`);
      if (res?.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totals = data?.totals;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Field label="Term">
          <select className={inputCls + ' w-32'} value={filters.term} onChange={e => setFilters(f => ({ ...f, term: e.target.value }))}>
            {TERMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Academic Year">
          <input className={inputCls + ' w-28'} value={filters.academic_year} onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))} />
        </Field>
        <Field label="Class">
          <select className={inputCls + ' w-28'} value={filters.class_assigned} onChange={e => setFilters(f => ({ ...f, class_assigned: e.target.value }))}>
            <option value="">All</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      {/* Summary cards */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Required', value: fmt(totals.required), color: 'text-gray-800' },
            { label: 'Total Collected', value: fmt(totals.paid), color: 'text-emerald-600' },
            { label: 'Outstanding', value: fmt(totals.balance), color: 'text-red-600' },
            { label: 'Fully Paid', value: `${totals.count_paid} students`, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Student', 'Adm. No.', 'Class', 'Required', 'Paid', 'Balance', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : !data?.students?.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No data found.</td></tr>
            ) : data.students.map(s => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.student_name}</td>
                <td className="px-4 py-3 text-gray-500">{s.admission_number}</td>
                <td className="px-4 py-3 text-gray-500">{s.class_assigned}</td>
                <td className="px-4 py-3 text-gray-700">{fmt(s.required)}</td>
                <td className="px-4 py-3 text-emerald-600 font-medium">{fmt(s.paid)}</td>
                <td className="px-4 py-3 text-red-500 font-medium">{fmt(s.balance)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.payment_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ term: '', academic_year: '' });

  const EMPTY = { student: '', term: 'Term 1', academic_year: currentYear(), amount_paid: '', payment_date: new Date().toISOString().slice(0, 10), payment_method: 'cash', reference: '', notes: '' };
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const res = await fetchWithAuth(`${API}/payments/?${params}`);
      if (res?.ok) setPayments(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY); setError(''); setSelected(null); setModal('form'); };
  const openEdit = (p) => {
    setForm({ student: p.student, term: p.term, academic_year: p.academic_year, amount_paid: p.amount_paid, payment_date: p.payment_date, payment_method: p.payment_method, reference: p.reference || '', notes: p.notes || '' });
    setSelected(p); setError(''); setModal('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const method = selected ? 'PUT' : 'POST';
      const url = selected ? `${API}/payments/${selected.id}/` : `${API}/payments/`;
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res?.ok) { const d = await res.json(); setError(JSON.stringify(d)); return; }
      setModal(null); load();
    } catch (e) { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment?')) return;
    await fetchWithAuth(`${API}/payments/${id}/`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex gap-3 flex-wrap items-end">
          <Field label="Term">
            <select className={inputCls + ' w-32'} value={filters.term} onChange={e => setFilters(f => ({ ...f, term: e.target.value }))}>
              <option value="">All</option>
              {TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Academic Year">
            <input className={inputCls + ' w-28'} value={filters.academic_year} onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))} />
          </Field>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Student', 'Class', 'Term', 'Year', 'Amount', 'Date', 'Method', 'Reference', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : !payments.length ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">No payments found.</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.student_name}</td>
                <td className="px-4 py-3 text-gray-500">{p.student_class}</td>
                <td className="px-4 py-3 text-gray-500">{p.term}</td>
                <td className="px-4 py-3 text-gray-500">{p.academic_year}</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">{fmt(p.amount_paid)}</td>
                <td className="px-4 py-3 text-gray-500">{p.payment_date}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method?.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.reference || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={selected ? 'Edit Payment' : 'Record Payment'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Student ID">
              <input required type="number" className={inputCls} value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))} placeholder="Student ID" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Term">
                <select className={inputCls} value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  {TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Academic Year">
                <input required className={inputCls} value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount Paid (UGX)">
                <input required type="number" min="0" className={inputCls} value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} />
              </Field>
              <Field label="Payment Date">
                <input required type="date" className={inputCls} value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Method">
                <select className={inputCls} value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                  {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <Field label="Reference (optional)">
                <input className={inputCls} value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Fee Structure Tab ─────────────────────────────────────────────────────────
function FeeStructureTab() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const EMPTY = { class_assigned: 'S.1', term: 'Term 1', academic_year: currentYear(), amount: '', description: '' };
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/structures/`);
      if (res?.ok) setStructures(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setSelected(null); setModal('form'); };
  const openEdit = (s) => {
    setForm({ class_assigned: s.class_assigned, term: s.term, academic_year: s.academic_year, amount: s.amount, description: s.description || '' });
    setSelected(s); setError(''); setModal('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const method = selected ? 'PUT' : 'POST';
      const url = selected ? `${API}/structures/${selected.id}/` : `${API}/structures/`;
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res?.ok) { const d = await res.json(); setError(JSON.stringify(d)); return; }
      setModal(null); load();
    } catch (e) { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee structure?')) return;
    await fetchWithAuth(`${API}/structures/${id}/`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Structure
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Class', 'Term', 'Academic Year', 'Amount', 'Description', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : !structures.length ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No fee structures defined yet.</td></tr>
            ) : structures.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-blue-700">{s.class_assigned}</td>
                <td className="px-4 py-3 text-gray-600">{s.term}</td>
                <td className="px-4 py-3 text-gray-600">{s.academic_year}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(s.amount)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{s.description || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={selected ? 'Edit Fee Structure' : 'Add Fee Structure'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class">
                <select className={inputCls} value={form.class_assigned} onChange={e => setForm(f => ({ ...f, class_assigned: e.target.value }))}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Term">
                <select className={inputCls} value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  {TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Academic Year">
                <input required className={inputCls} value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
              </Field>
              <Field label="Amount (UGX)">
                <input required type="number" min="0" className={inputCls} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </Field>
            </div>
            <Field label="Description (optional)">
              <input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', icon: Users },
  { key: 'payments', label: 'Payments', icon: DollarSign },
  { key: 'structure', label: 'Fee Structure', icon: BookOpen },
];

export default function FeesPage() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'structure' && <FeeStructureTab />}
    </div>
  );
}
