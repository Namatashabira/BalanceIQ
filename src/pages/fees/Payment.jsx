import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Pencil, Trash2, Search, Receipt, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { fetchWithAuth } from '../../api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/fees`;
const STUDENTS_API = `${BASE_URL}/students/students`;

const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const METHODS = ['cash', 'bank', 'mobile_money', 'other'];
const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];
const CATEGORIES = [
  { value: 'school_fees', label: 'School Fees' },
  { value: 'uneb_registration', label: 'UNEB Registration' },
  { value: 'ple_registration', label: 'PLE Registration' },
  { value: 'transport', label: 'Transport' },
  { value: 'meals', label: 'Meals / Boarding' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'medical', label: 'Medical' },
  { value: 'sports', label: 'Sports & Activities' },
  { value: 'other', label: 'Other (specify)' },
];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const currentYear = () => String(new Date().getFullYear());

function Avatar({ name, photo }) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-blue-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-purple-400'];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (photo && !err)
    return <img src={photo} alt={name} onError={() => setErr(true)} className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />;
  return (
    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white ${color}`}>
      {initials}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
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

function StudentSearch({ value, onChange, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetchWithAuth(`${STUDENTS_API}/?search=${encodeURIComponent(query)}&limit=10`);
        if (res?.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : (data.results || []));
          setOpen(true);
        }
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className={inputCls + ' pl-9'}
          placeholder="Search student name or admission no…"
          value={value ? `${value.first_name} ${value.last_name} (${value.admission_number || value.id})` : query}
          onChange={e => { setQuery(e.target.value); onChange(null); }}
          onFocus={() => { if (results.length) setOpen(true); }}
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map(s => (
            <li
              key={s.id}
              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm"
              onMouseDown={() => { onSelect(s); setQuery(''); setOpen(false); }}
            >
              <span className="font-medium">{s.first_name} {s.last_name}</span>
              <span className="text-gray-400 ml-2 text-xs">{s.admission_number} · {s.class_assigned}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StudentPaymentRow({ student, term, year, onAddPayment, onEditPayment, onDeletePayment, onReceipt, onInvoice, onSingleReceipt }) {
  const [expanded, setExpanded] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!expanded) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ student: student.student_id, term, academic_year: year });
      const res = await fetchWithAuth(`${API}/payments/?${params}`);
      if (res?.ok) setPayments(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [expanded, student.student_id, term, year]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            <Avatar name={student.student_name} photo={student.photo || null} />
            <span className="font-medium text-gray-900">{student.student_name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-gray-500 text-sm">{student.admission_number}</td>
        <td className="px-4 py-3 text-gray-500 text-sm">{student.class_assigned}</td>
        <td className="px-4 py-3 text-gray-700 text-sm">{fmt(student.required)}</td>
        <td className="px-4 py-3 text-emerald-600 font-semibold text-sm">{fmt(student.paid)}</td>
        <td className="px-4 py-3 text-red-500 font-semibold text-sm">{fmt(student.balance)}</td>
        <td className="px-4 py-3"><StatusBadge status={student.payment_status} /></td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <button onClick={() => onAddPayment(student)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Add payment"><Plus className="w-4 h-4" /></button>
              <button onClick={() => onReceipt(student)} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Print receipt (all payments)"><Receipt className="w-4 h-4" /></button>
              <button onClick={() => onInvoice(student)} className="p-1.5 rounded hover:bg-purple-50 text-purple-600" title="Print invoice"><FileText className="w-4 h-4" /></button>
            </div>
            {/* Unpaid items badges */}
            {student.unpaid_items?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
                {student.unpaid_items.map(it => (
                  <span key={it.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
                    {it.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-blue-50/40 px-6 py-3">
            {loading ? (
              <p className="text-sm text-gray-400 py-2">Loading payments…</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-1 pr-4">Date</th>
                    <th className="text-left py-1 pr-4">Category</th>
                    <th className="text-left py-1 pr-4">Amount</th>
                    <th className="text-left py-1 pr-4">Method</th>
                    <th className="text-left py-1 pr-4">Reference</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-t border-blue-100">
                      <td className="py-1.5 pr-4 text-gray-600">{p.payment_date}</td>
                      <td className="py-1.5 pr-4 text-blue-700 font-medium">{p.category_display || p.payment_category?.replace('_', ' ')}</td>
                      <td className="py-1.5 pr-4 font-semibold text-emerald-700">{fmt(p.amount_paid)}</td>
                      <td className="py-1.5 pr-4 text-gray-500 capitalize">{p.payment_method?.replace('_', ' ')}</td>
                      <td className="py-1.5 pr-4 font-mono text-gray-400">{p.reference || '—'}</td>
                      <td className="py-1.5">
                        <div className="flex gap-1">
                          <button onClick={() => onSingleReceipt({ ...p, student_obj: student })} className="p-1 rounded hover:bg-green-50 text-green-600" title="Print this payment receipt"><Receipt className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onEditPayment(p)} className="p-1 rounded hover:bg-yellow-50 text-yellow-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeletePayment(p.id, loadPayments)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function PaymentTab({ onOpenReceipt, onOpenInvoice }) {
  const [filters, setFilters] = useState({ term: 'Term 1', academic_year: currentYear(), class_assigned: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});

  // ── Fee items state ───────────────────────────────────────────────────────
  const [structureItems, setStructureItems] = useState([]);   // [{id, name, amount, is_optional}]
  const [paidItemIds, setPaidItemIds]       = useState([]);   // item ids already paid by this student
  const [checkedItems, setCheckedItems]     = useState({});   // { [itemId]: true/false }
  const [itemsLoading, setItemsLoading]     = useState(false);

  const loadStructureItems = async (classAssigned, term, academicYear, studentId) => {
    if (!classAssigned || !term || !academicYear) { setStructureItems([]); return; }
    setItemsLoading(true);
    try {
      const [structRes, paidRes] = await Promise.all([
        fetchWithAuth(`${API}/structures/?class_assigned=${classAssigned}&term=${encodeURIComponent(term)}&academic_year=${academicYear}`),
        studentId ? fetchWithAuth(`${API}/item-payments/?student=${studentId}`) : Promise.resolve(null),
      ]);
      const structs = structRes?.ok ? await structRes.json() : [];
      const items = (Array.isArray(structs) ? structs : structs.results || [])
        .flatMap(s => s.items || []);
      setStructureItems(items);

      const paid = paidRes?.ok ? await paidRes.json() : [];
      const paidIds = (Array.isArray(paid) ? paid : paid.results || []).map(p => p.item);
      setPaidItemIds(paidIds);

      // Pre-check unpaid items
      const checks = {};
      items.forEach(it => { checks[it.id] = !paidIds.includes(it.id); });
      setCheckedItems(checks);
    } catch { setStructureItems([]); }
    finally { setItemsLoading(false); }
  };

  const EMPTY_FORM = {
    student: null, term: filters.term, academic_year: filters.academic_year,
    amount_paid: '', payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'cash', reference: '', notes: '',
    payment_category: 'school_fees', custom_category: '',
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const res = await fetchWithAuth(`${API}/payments/summary/?${params}`);
      if (res?.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = (student) => {
    setSelectedStudent(student);
    setSelectedPayment(null);
    const studentObj = { id: student.student_id, first_name: student.student_name.split(' ')[0], last_name: student.student_name.split(' ').slice(1).join(' '), admission_number: student.admission_number, class_assigned: student.class_assigned };
    setForm({ ...EMPTY_FORM, student: studentObj });
    setError('');
    setModal('form');
    loadStructureItems(student.class_assigned, filters.term, filters.academic_year, student.student_id);
  };

  const openEdit = (payment) => {
    setSelectedPayment(payment);
    setSelectedStudent(null);
    setStructureItems([]); setPaidItemIds([]); setCheckedItems({});
    setForm({
      student: { id: payment.student, first_name: payment.student_name?.split(' ')[0] || '', last_name: payment.student_name?.split(' ').slice(1).join(' ') || '', admission_number: payment.admission_number, class_assigned: payment.student_class },
      term: payment.term, academic_year: payment.academic_year,
      amount_paid: payment.amount_paid, payment_date: payment.payment_date,
      payment_method: payment.payment_method, reference: payment.reference || '', notes: payment.notes || '',
      payment_category: payment.payment_category || 'school_fees',
      custom_category: payment.custom_category || '',
    });
    setError('');
    setModal('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.student?.id) { setError('Please select a student.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, student: form.student.id };
      const method = selectedPayment ? 'PUT' : 'POST';
      const url = selectedPayment ? `${API}/payments/${selectedPayment.id}/` : `${API}/payments/`;
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res?.ok) {
        const d = await res.json();
        setError(d.detail || JSON.stringify(d));
        return;
      }
      const saved = await res.json();
      // Mark checked items as paid
      const toMark = structureItems.filter(it => checkedItems[it.id] && !paidItemIds.includes(it.id)).map(it => it.id);
      if (toMark.length) {
        await fetchWithAuth(`${API}/item-payments/bulk-mark/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: form.student.id, item_ids: toMark, payment_id: saved.id }),
        });
      }
      setModal(null); load();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, reload) => {
    if (!confirm('Delete this payment?')) return;
    await fetchWithAuth(`${API}/payments/${id}/`, { method: 'DELETE' });
    load();
    if (reload) reload();
  };

  const filtered = (data?.students || []).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.student_name.toLowerCase().includes(q) || (s.admission_number || '').toLowerCase().includes(q);
  });

  const totals = data?.totals;

  const downloadCSV = () => {
    if (!filtered.length) return;
    const rows = [['Student', 'Adm No', 'Class', 'Required', 'Paid', 'Balance', 'Status']];
    filtered.forEach(s => rows.push([s.student_name, s.admission_number, s.class_assigned, s.required, s.paid, s.balance, s.payment_status]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `fees_${filters.term}_${filters.academic_year}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end justify-between">
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
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => onOpenInvoice({ term: filters.term, academic_year: filters.academic_year, class_assigned: filters.class_assigned })}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-purple-300 text-purple-700 rounded-lg text-sm hover:bg-purple-50">
            <FileText className="w-4 h-4" /> Generate Invoice
          </button>
          <button onClick={() => { setSelectedStudent(null); setSelectedPayment(null); setForm(EMPTY_FORM); setError(''); setModal('form'); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {totals && (
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-3">
          {[
            { label: 'Total Required', value: fmt(totals.required), color: 'text-gray-800' },
            { label: 'Total Collected', value: fmt(totals.paid), color: 'text-emerald-600' },
            { label: 'Outstanding Debt', value: fmt(totals.balance), color: 'text-red-600' },
            { label: 'Fully Paid', value: `${totals.count_paid}`, color: 'text-blue-600' },
            { label: 'Partial / Unpaid', value: `${totals.count_partial} / ${totals.count_not_paid}`, color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1 min-w-[120px]">
              <p className="text-xs text-gray-400 mb-1 whitespace-nowrap">{label}</p>
              <p className={`text-base font-bold ${color} whitespace-nowrap`}>{value}</p>
            </div>
          ))}
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className={inputCls + ' pl-9'} placeholder="Search student…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Student', 'Adm. No.', 'Class', 'Required', 'Paid', 'Balance', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : !filtered.length ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No students found.</td></tr>
            ) : filtered.map(s => (
              <StudentPaymentRow
                key={s.student_id}
                student={s}
                term={filters.term}
                year={filters.academic_year}
                onAddPayment={openAdd}
                onEditPayment={openEdit}
                onDeletePayment={handleDelete}
                onReceipt={(st) => onOpenReceipt({ studentId: st.student_id, term: filters.term, academic_year: filters.academic_year })}
                onInvoice={(st) => onOpenInvoice({ studentId: st.student_id, term: filters.term, academic_year: filters.academic_year, class_assigned: st.class_assigned })}
                onSingleReceipt={(p) => onOpenReceipt({ studentId: p.student, term: p.term || filters.term, academic_year: p.academic_year || filters.academic_year, paymentId: p.id })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={selectedPayment ? 'Edit Payment' : 'Record Payment'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Student">
              <StudentSearch
                value={form.student}
                onChange={(v) => setForm(f => ({ ...f, student: v }))}
                onSelect={(s) => setForm(f => ({ ...f, student: s }))}
              />
              {form.student && (
                <p className="text-xs text-blue-600 mt-1">
                  Selected: {form.student.first_name} {form.student.last_name} · {form.student.class_assigned}
                </p>
              )}
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

            {/* ── Structure items ── */}
            {!selectedPayment && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fee Items</span>
                  {itemsLoading && <span className="text-xs text-gray-400">Loading…</span>}
                </div>
                {structureItems.length === 0 && !itemsLoading ? (
                  <p className="text-xs text-gray-400 px-3 py-3">No items defined in fee structure for this class/term.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-8"></th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Item</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Amount</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {structureItems.map(it => {
                        const alreadyPaid = paidItemIds.includes(it.id);
                        return (
                          <tr key={it.id} className={alreadyPaid ? 'bg-emerald-50/50' : ''}>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={!!checkedItems[it.id]}
                                disabled={alreadyPaid}
                                onChange={e => setCheckedItems(c => ({ ...c, [it.id]: e.target.checked }))}
                                className="rounded accent-blue-600"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800">
                              {it.name}
                              {it.is_optional && <span className="ml-1.5 text-[10px] text-gray-400">(optional)</span>}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-700">{fmt(it.amount)}</td>
                            <td className="px-3 py-2 text-center">
                              {alreadyPaid
                                ? <span className="text-xs font-semibold text-emerald-600">✓ Paid</span>
                                : <span className="text-xs text-red-500">Unpaid</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount Paid (UGX)">
                <input required type="number" min="1" className={inputCls} value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} placeholder="e.g. 150000" />
              </Field>
              <Field label="Payment Date">
                <input required type="date" className={inputCls} value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
              </Field>
            </div>
            <Field label="Payment Category">
              <select className={inputCls} value={form.payment_category} onChange={e => setForm(f => ({ ...f, payment_category: e.target.value, custom_category: '' }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            {form.payment_category === 'other' && (
              <Field label="Specify Payment Purpose">
                <input
                  required
                  className={inputCls}
                  value={form.custom_category}
                  onChange={e => setForm(f => ({ ...f, custom_category: e.target.value }))}
                  placeholder="e.g. Swimming Pool Fund, Graduation Fee…"
                />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Method">
                <select className={inputCls} value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                  {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <Field label="Reference (optional)">
                <input className={inputCls} value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Bank ref / receipt no" />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
