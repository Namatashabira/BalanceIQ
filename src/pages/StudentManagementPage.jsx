import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, User, Users, BookOpen, Settings, Mail, Phone, Calendar, TrendingUp, ClipboardList, StickyNote, Shield, MapPin, GraduationCap, Banknote } from 'lucide-react';
import { fetchWithAuth } from '../api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/school`;
const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];

const EMPTY_STUDENT = { first_name: '', last_name: '', admission_number: '', date_of_birth: '', gender: '', email: '', phone: '', class_assigned: '', stream: '', index_number: '', district: '', home_address: '', enrollment_date: '', status: 'active', previous_school: '', nationality: 'Ugandan', fees_balance: '', payment_status: 'not_paid' };
const EMPTY_GUARDIAN = { full_name: '', relationship: '', phone: '', email: '' };
const EMPTY_HISTORY = { history_type: 'performance', title: '', description: '', date: '' };
const EMPTY_GUARDIAN_ROW = { full_name: '', relationship: '', phone: '', email: '' };
const EMPTY_HISTORY_ROW = { history_type: 'performance', title: '', description: '', date: '' };

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age >= 0 ? age : null;
}

function resolvePhoto(photo) {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  return `${BASE_URL.replace('/api', '')}${photo}`;
}

function Avatar({ src, name, size = 'sm' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-8 h-8 text-xs';
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return src
    ? <img src={src} alt={name} className={`${dim} rounded-full object-cover border-2 border-white shadow`} />
    : <div className={`${dim} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white shadow`}>{initials}</div>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-xl shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
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

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_STUDENT);
  const [guardianForm, setGuardianForm] = useState(EMPTY_GUARDIAN);
  const [historyForm, setHistoryForm] = useState(EMPTY_HISTORY);
  const [profileTab, setProfileTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [newStream, setNewStream] = useState({ name: '', class_label: '' });
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formGuardians, setFormGuardians] = useState([]);
  const [formHistory, setFormHistory] = useState([]);

  const loadMeta = async () => {
    try {
      const res = await fetchWithAuth(`${API}/students/meta/`);
      const data = await res.json();
      setStreams(data.streams || []);
    } catch (e) { console.error(e); }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/students/`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); loadMeta(); }, []);

  const openAdd = () => { setForm(EMPTY_STUDENT); setError(null); setPhotoFile(null); setPhotoPreview(null); setFormGuardians([]); setFormHistory([]); setModal('add'); };
  const openEdit = (s) => { setForm({ ...s, class_assigned: s.class_assigned || '', stream: s.stream || '' }); setError(null); setPhotoFile(null); setPhotoPreview(s.photo ? resolvePhoto(s.photo) : null); setFormGuardians(s.guardians || []); setFormHistory(s.history || []); setSelected(s); setModal('edit'); };
  const openProfile = (s) => { setSelected(s); setProfileTab('profile'); setGuardianForm(EMPTY_GUARDIAN); setHistoryForm(EMPTY_HISTORY); setModal('profile'); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const url = modal === 'edit' ? `${API}/students/${selected.id}/` : `${API}/students/`;
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined && k !== 'photo') fd.append(k, v);
      });
      if (photoFile) fd.append('photo', photoFile);
      const res = await fetchWithAuth(url, { method, body: fd });
      if (!res.ok) {
        const data = await res.json();
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        setError(msg);
        return;
      }
      const saved = await res.json();
      const sid = saved.id;
      // Save new guardians (those without an id)
      for (const g of formGuardians) {
        if (!g.id && g.full_name) {
          await fetchWithAuth(`${API}/students/${sid}/guardians/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g),
          });
        }
      }
      // Save new history entries (those without an id)
      for (const h of formHistory) {
        if (!h.id && h.title) {
          await fetchWithAuth(`${API}/students/${sid}/history/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(h),
          });
        }
      }
      setModal(null);
      load();
    } catch (e) { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    await fetchWithAuth(`${API}/students/${id}/`, { method: 'DELETE' });
    load();
  };

  const handleAddStream = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchWithAuth(`${API}/streams/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStream),
      });
      setNewStream({ name: '', class_label: '' });
      loadMeta();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDeleteStream = async (id) => {
    if (!confirm('Delete this stream?')) return;
    await fetchWithAuth(`${API}/streams/${id}/`, { method: 'DELETE' });
    loadMeta();
  };

  const filteredStreams = form.class_assigned
    ? streams.filter(s => !s.class_label || s.class_label === form.class_assigned)
    : streams;

  // Table filters
  const [filterClass, setFilterClass] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [search, setSearch] = useState('');

  const filterStreamOptions = filterClass
    ? streams.filter(s => !s.class_label || s.class_label === filterClass)
    : streams;

  const visibleStudents = students.filter(s => {
    if (filterClass && s.class_assigned !== filterClass) return false;
    if (filterStream && String(s.stream) !== String(filterStream)) return false;
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (!fullName.includes(q) && !(s.admission_number || '').toLowerCase().includes(q) && !(s.index_number || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setModal('streams')} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Settings className="w-4 h-4" /> Manage Streams
          </button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search name, admission noâ€¦"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-56"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Class</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={filterClass}
            onChange={e => { setFilterClass(e.target.value); setFilterStream(''); }}
          >
            <option value="">All classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Stream</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50"
            value={filterStream}
            onChange={e => setFilterStream(e.target.value)}
            disabled={filterStreamOptions.length === 0}
          >
            <option value="">All streams</option>
            {filterStreamOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {(filterClass || filterStream || search) && (
          <button
            onClick={() => { setFilterClass(''); setFilterStream(''); setSearch(''); }}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{visibleStudents.length} student{visibleStudents.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['', 'Name', 'Admission No.', 'Class', 'Stream', 'Index No.', 'Age', 'Gender', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : visibleStudents.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students match the selected filters.</td></tr>
            ) : visibleStudents.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openProfile(s)}>
                <td className="px-4 py-3">
                  <Avatar src={resolvePhoto(s.photo)} name={`${s.first_name} ${s.last_name}`} />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{s.admission_number || 'â€”'}</td>
                <td className="px-4 py-3 text-gray-600">{s.class_assigned || 'â€”'}</td>
                <td className="px-4 py-3 text-gray-600">{s.stream_name || 'â€”'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {['S.4', 'S.6'].includes(s.class_assigned)
                    ? <span className={s.index_number ? 'font-mono text-blue-700' : 'text-gray-300'}>{s.index_number || 'No index'}</span>
                    : <span className="text-gray-300">â€”</span>}
                </td>
                <td className="px-4 py-3">
                  {calcAge(s.date_of_birth) !== null
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">{calcAge(s.date_of_birth)} yrs</span>
                    : <span className="text-gray-300">â€”</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{s.gender || 'â€”'}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openProfile(s)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View Profile"><User className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Student' : 'Add Student'} onClose={() => setModal(null)} wide>
          <form onSubmit={handleSave} className="space-y-3">
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar src={photoPreview} name={`${form.first_name} ${form.last_name}`} size="lg" />
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow">
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }} />
                </label>
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">Student Photo</p>
                <p>Click the <span className="text-blue-600">+</span> to upload. JPG, PNG supported.</p>
                {photoFile && <p className="text-emerald-600 mt-0.5">âœ“ {photoFile.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name">
                <input required className={inputCls} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </Field>
              <Field label="Last Name">
                <input required className={inputCls} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </Field>
            </div>
            <Field label="Admission Number">
              <input className={inputCls} value={form.admission_number} onChange={e => setForm(f => ({ ...f, admission_number: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <div className="relative">
                  <input type="date" className={inputCls + (form.date_of_birth ? ' pr-20' : '')} value={form.date_of_birth || ''} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                  {calcAge(form.date_of_birth) !== null && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full pointer-events-none">
                      {calcAge(form.date_of_birth)} yrs
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Gender">
                <select className={inputCls} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="">â€” Select â€”</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class">
                <select className={inputCls} value={form.class_assigned} onChange={e => setForm(f => ({ ...f, class_assigned: e.target.value, stream: '' }))}>
                  <option value="">â€” Select Class â€”</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Stream">
                <select className={inputCls} value={form.stream} onChange={e => setForm(f => ({ ...f, stream: e.target.value }))} disabled={!form.class_assigned}>
                  <option value="">â€” Select Stream â€”</option>
                  {filteredStreams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {!form.class_assigned && <p className="text-xs text-gray-400 mt-1">Select a class first</p>}
                {form.class_assigned && filteredStreams.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    No streams for {form.class_assigned} â€”{' '}
                    <button type="button" className="underline" onClick={() => setModal('streams')}>add one</button>
                  </p>
                )}
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className={inputCls} value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </Field>

            {/* Location Info */}
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-rose-500" /> Location Info
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="District">
                  <input className={inputCls} placeholder="e.g. Kampala" value={form.district || ''} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                </Field>
                <Field label="Nationality">
                  <input className={inputCls} placeholder="e.g. Ugandan" value={form.nationality || ''} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} />
                </Field>
                <Field label="Home Address / Village">
                  <input className={inputCls} placeholder="e.g. Bwaise, Kawempe" value={form.home_address || ''} onChange={e => setForm(f => ({ ...f, home_address: e.target.value }))} />
                </Field>
              </div>
            </div>

            {/* Academic Info */}
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-500" /> Academic Info
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Enrollment Date">
                  <input type="date" className={inputCls} value={form.enrollment_date || ''} onChange={e => setForm(f => ({ ...f, enrollment_date: e.target.value }))} />
                </Field>
                <Field label="Current Status">
                  <select className={inputCls} value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="transferred">Transferred</option>
                    <option value="graduated">Graduated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </Field>
                <Field label="Previous School (optional)">
                  <input className={inputCls} placeholder="e.g. St. Mary's Primary" value={form.previous_school || ''} onChange={e => setForm(f => ({ ...f, previous_school: e.target.value }))} />
                </Field>
              </div>
            </div>

            {/* Fees */}
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <Banknote className="w-4 h-4 text-amber-500" /> Fees
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fees Balance (UGX)">
                  <input type="number" min="0" className={inputCls} placeholder="0" value={form.fees_balance || ''} onChange={e => setForm(f => ({ ...f, fees_balance: e.target.value }))} />
                </Field>
                <Field label="Payment Status">
                  <select className={inputCls} value={form.payment_status || 'not_paid'} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))}>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="not_paid">Not Paid</option>
                  </select>
                </Field>
              </div>
            </div>
            {['S.4', 'S.6'].includes(form.class_assigned) && (
              <Field label="Index Number">
                <div className="relative">
                  <input
                    className={inputCls + ' pr-24'}
                    placeholder="e.g. U0001/001"
                    value={form.index_number || ''}
                    onChange={e => setForm(f => ({ ...f, index_number: e.target.value }))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {form.class_assigned} Exam
                  </span>
                </div>
              </Field>
            )}

            {/* Guardians */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-500" /> Parent / Guardian</p>
                <button type="button" onClick={() => setFormGuardians(g => [...g, { ...EMPTY_GUARDIAN_ROW }])}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {formGuardians.length === 0 && <p className="text-xs text-gray-400 italic">No guardians added yet.</p>}
              {formGuardians.map((g, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 mb-2 p-3 bg-gray-50 rounded-xl relative">
                  <button type="button" onClick={() => setFormGuardians(gs => gs.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  <Field label="Full Name"><input className={inputCls} value={g.full_name} onChange={e => setFormGuardians(gs => gs.map((x, idx) => idx === i ? { ...x, full_name: e.target.value } : x))} /></Field>
                  <Field label="Relationship"><input className={inputCls} value={g.relationship} onChange={e => setFormGuardians(gs => gs.map((x, idx) => idx === i ? { ...x, relationship: e.target.value } : x))} /></Field>
                  <Field label="Phone"><input className={inputCls} value={g.phone} onChange={e => setFormGuardians(gs => gs.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} /></Field>
                  <Field label="Email"><input type="email" className={inputCls} value={g.email} onChange={e => setFormGuardians(gs => gs.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))} /></Field>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-500" /> History Records</p>
                <button type="button" onClick={() => setFormHistory(h => [...h, { ...EMPTY_HISTORY_ROW }])}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {formHistory.length === 0 && <p className="text-xs text-gray-400 italic">No history records added yet.</p>}
              {formHistory.map((h, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 mb-2 p-3 bg-gray-50 rounded-xl relative">
                  <button type="button" onClick={() => setFormHistory(hs => hs.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  <Field label="Type">
                    <select className={inputCls} value={h.history_type} onChange={e => setFormHistory(hs => hs.map((x, idx) => idx === i ? { ...x, history_type: e.target.value } : x))}>
                      <option value="performance">Performance</option>
                      <option value="attendance">Attendance</option>
                      <option value="note">Note</option>
                    </select>
                  </Field>
                  <Field label="Date"><input type="date" className={inputCls} value={h.date} onChange={e => setFormHistory(hs => hs.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))} /></Field>
                  <Field label="Title"><input className={inputCls} value={h.title} onChange={e => setFormHistory(hs => hs.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} /></Field>
                  <Field label="Description"><input className={inputCls} value={h.description} onChange={e => setFormHistory(hs => hs.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} /></Field>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Savingâ€¦' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Streams Modal */}
      {modal === 'streams' && (
        <Modal title="Manage Streams" onClose={() => setModal(null)} wide>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 mb-4">Each class can have multiple streams. Add or remove streams per class below.</p>
            <div className="divide-y divide-gray-100">
              {CLASSES.map(cls => {
                const group = streams.filter(s => s.class_label === cls);
                const isAdding = newStream.class_label === cls;
                return (
                  <div key={cls} className="py-4 flex items-start gap-4">
                    {/* Class badge */}
                    <div className="w-14 shrink-0 flex items-center justify-center h-9 rounded-lg bg-blue-50 border border-blue-100">
                      <span className="text-sm font-bold text-blue-700">{cls}</span>
                    </div>

                    {/* Streams + add */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        {group.length === 0 && !isAdding && (
                          <span className="text-xs text-gray-400 italic">No streams yet</span>
                        )}
                        {group.map(s => (
                          <span key={s.id} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                            {s.name}
                            <button
                              onClick={() => handleDeleteStream(s.id)}
                              className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        {/* Inline add input */}
                        {isAdding ? (
                          <form
                            onSubmit={handleAddStream}
                            className="inline-flex items-center gap-1"
                          >
                            <input
                              autoFocus
                              required
                              value={newStream.name}
                              onChange={e => setNewStream(s => ({ ...s, name: e.target.value }))}
                              placeholder="Stream name"
                              className="w-28 border border-blue-400 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button type="submit" disabled={saving} className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-60">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setNewStream({ name: '', class_label: '' })} className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <button
                            onClick={() => setNewStream({ name: '', class_label: cls })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Add stream
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}


      {/* Profile Modal */}
      {modal === 'profile' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[92vh] overflow-hidden flex flex-col">

            {/* Hero banner */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 pt-6 pb-4">
              <button onClick={() => setModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              <button onClick={() => { setModal(null); setTimeout(() => openEdit(selected), 50); }}
                className="absolute top-4 right-14 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                <Pencil className="w-4 h-4" />
              </button>

              {/* Photo + name + badges */}
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {resolvePhoto(selected.photo)
                    ? <img src={resolvePhoto(selected.photo)} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl" />
                    : <div className="w-20 h-20 rounded-2xl bg-white/20 border-4 border-white/30 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                        {`${selected.first_name[0]}${selected.last_name[0]}`.toUpperCase()}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-xl font-bold text-white leading-tight truncate">{selected.first_name} {selected.last_name}</h2>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {selected.class_assigned || 'No class'}{selected.stream_name ? ` · ${selected.stream_name}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selected.admission_number && (
                      <span className="inline-flex items-center gap-1 bg-white/15 rounded-lg px-2 py-0.5 text-xs text-white">
                        <User className="w-3 h-3" /> {selected.admission_number}
                      </span>
                    )}
                    {['S.4', 'S.6'].includes(selected.class_assigned) && selected.index_number && (
                      <span className="inline-flex items-center gap-1 bg-orange-400/30 rounded-lg px-2 py-0.5 text-xs text-orange-100 font-mono">
                        IDX: {selected.index_number}
                      </span>
                    )}
                    {calcAge(selected.date_of_birth) !== null && (
                      <span className="inline-flex items-center gap-1 bg-white/15 rounded-lg px-2 py-0.5 text-xs text-white">
                        <Calendar className="w-3 h-3" /> {calcAge(selected.date_of_birth)} yrs
                      </span>
                    )}
                    {selected.gender && (
                      <span className="inline-flex items-center gap-1 bg-white/15 rounded-lg px-2 py-0.5 text-xs text-white capitalize">
                        {selected.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fees strip */}
              <div className="mt-4 flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-300" />
                  <span className="text-xs text-blue-100">Fees Balance</span>
                  <span className="text-sm font-bold text-white">
                    {selected.fees_balance ? `UGX ${Number(selected.fees_balance).toLocaleString()}` : 'UGX 0'}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selected.payment_status === 'paid' ? 'bg-emerald-400/30 text-emerald-100' :
                  selected.payment_status === 'partial' ? 'bg-amber-400/30 text-amber-100' :
                  'bg-red-400/30 text-red-100'
                }`}>
                  {selected.payment_status === 'paid' ? 'Paid' : selected.payment_status === 'partial' ? 'Partial' : 'Not Paid'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 px-6 border-b border-gray-100">
              {[['profile', 'Profile', User], ['guardians', 'Guardian', Users], ['history', 'History', BookOpen]].map(([key, label, Icon]) => (
                <button key={key} onClick={() => setProfileTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                    profileTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              {profileTab === 'profile' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {[
                      { label: 'Date of Birth', value: selected.date_of_birth, icon: <Calendar className="w-4 h-4 text-blue-500" /> },
                      { label: 'Email', value: selected.email, icon: <Mail className="w-4 h-4 text-violet-500" /> },
                      { label: 'Phone', value: selected.phone, icon: <Phone className="w-4 h-4 text-emerald-500" /> },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">{icon}</span>
                        <div>
                          <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-rose-100 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-rose-50">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-wide">Location Info</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[
                        { label: 'District', value: selected.district },
                        { label: 'Nationality', value: selected.nationality },
                        { label: 'Home Address / Village', value: selected.home_address },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-2.5">
                          <span className="text-xs text-gray-400">{label}</span>
                          <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50">
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Academic Info</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[
                        { label: 'Enrollment Date', value: selected.enrollment_date },
                        { label: 'Previous School', value: selected.previous_school },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-2.5">
                          <span className="text-xs text-gray-400">{label}</span>
                          <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-xs text-gray-400">Current Status</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          selected.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          selected.status === 'transferred' ? 'bg-blue-100 text-blue-700' :
                          selected.status === 'graduated' ? 'bg-violet-100 text-violet-700' :
                          'bg-red-100 text-red-700'
                        }`}>{selected.status ? selected.status.charAt(0).toUpperCase() + selected.status.slice(1) : 'Active'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'guardians' && (
                <div className="space-y-3">
                  {(selected.guardians || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No guardians added yet</p>
                    </div>
                  ) : (selected.guardians || []).map((g, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{g.full_name}</p>
                        <p className="text-xs text-violet-600 font-medium">{g.relationship}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{g.phone}{g.email ? ` · ${g.email}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === 'history' && (
                <div className="space-y-3">
                  {(selected.history || []).length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No history records yet</p>
                    </div>
                  ) : (selected.history || []).map((h, i) => {
                    const cfg = h.history_type === 'performance'
                      ? { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> }
                      : h.history_type === 'attendance'
                      ? { bg: 'bg-blue-50', text: 'text-blue-700', icon: <ClipboardList className="w-4 h-4 text-blue-600" /> }
                      : { bg: 'bg-amber-50', text: 'text-amber-700', icon: <StickyNote className="w-4 h-4 text-amber-600" /> };
                    return (
                      <div key={i} className={`p-3 rounded-xl ${cfg.bg}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center shrink-0">{cfg.icon}</span>
                          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{h.history_type}</span>
                          <span className="ml-auto text-xs text-gray-400">{h.date}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{h.title}</p>
                        {h.description && <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
