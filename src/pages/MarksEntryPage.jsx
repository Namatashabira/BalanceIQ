import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Upload, Save, RefreshCw, CheckCircle, AlertCircle, ChevronDown, Search, X, BookOpen, GraduationCap, ClipboardList, Users, TrendingDown, BarChart2, Trophy } from 'lucide-react';
import { fetchWithAuth } from '../api';

function Avatar({ name, photo }) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-teal-400', 'bg-emerald-400', 'bg-cyan-400', 'bg-blue-400', 'bg-indigo-400', 'bg-amber-400'];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (photo && !err)
    return <img src={photo} alt={name} onError={() => setErr(true)} className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />;
  return (
    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white ${color}`}>
      {initials}
    </div>
  );
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API = `${BASE_URL}/school`;

const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];
// Generate academic years: from current year back 6 years, most recent first
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear - i));
const DEFAULT_YEAR = String(currentYear);

const SUBJECT_GROUPS = [
  {
    label: 'Compulsory Subjects (S1–S2)',
    subjects: [
      'English Language',
      'Mathematics',
      'History and Political Education',
      'Geography',
      'Physics',
      'Biology',
      'Chemistry',
      'Physical Education',
      'Christian Religious Education',
      'Islamic Religious Education',
      'Entrepreneurship Education',
      'Kiswahili',
    ],
  },
  {
    label: 'Elective Subjects',
    subjects: [
      'Agriculture',
      'Information Communication Technology (ICT)',
      'Art and Design',
      'Performing Arts',
      'Technology and Design',
      'Nutrition and Food Technology',
      'Literature in English',
      'French',
      'German',
      'Arabic',
      'Latin',
      'Chinese',
    ],
  },
  {
    label: 'Local Languages',
    subjects: ['__custom__'],   // triggers free-text input
  },
];

const ALL_SUBJECTS = SUBJECT_GROUPS.flatMap(g => g.subjects).filter(s => s !== '__custom__');

const GRADE_SCALE = [
  { min: 80, grade: 'A', cls: 'bg-green-100 text-green-700' },
  { min: 70, grade: 'B', cls: 'bg-blue-100 text-blue-700' },
  { min: 60, grade: 'C', cls: 'bg-yellow-100 text-yellow-700' },
  { min: 50, grade: 'D', cls: 'bg-orange-100 text-orange-700' },
  { min: 40, grade: 'E', cls: 'bg-red-100 text-red-600' },
  { min: 0,  grade: 'F', cls: 'bg-red-200 text-red-700' },
];

function getGrade(total) {
  return GRADE_SCALE.find(g => total >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// ── Custom Subject Dropdown ───────────────────────────────────────────────────
function SubjectDropdown({ value, customValue, onSelect, onCustomChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const isCustom = value === '__custom__';
  const displayLabel = isCustom
    ? (customValue || 'Local Language…')
    : (value || 'Select subject…');

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 50); }, [open]);

  const filtered = SUBJECT_GROUPS.map(g => ({
    ...g,
    subjects: g.subjects.filter(s =>
      s === '__custom__' || s.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.subjects.length > 0);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
          open
            ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <span className={`truncate font-medium ${ value ? 'text-gray-800' : 'text-gray-400' }`}>
          {displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                placeholder="Search subjects…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-72 overflow-y-auto pb-2">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">No subjects match</p>
            )}
            {filtered.map(group => (
              <div key={group.label}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {group.label}
                </p>
                {group.subjects.map(s => {
                  if (s === '__custom__') return (
                    <button
                      key="__custom__"
                      type="button"
                      onClick={() => { onSelect('__custom__'); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                        value === '__custom__'
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">L</span>
                      Local Language <span className="text-gray-400 text-xs">(type name)</span>
                    </button>
                  );
                  const active = value === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { onSelect(s); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                        active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {active && <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                      {!active && <span className="w-3.5 h-3.5 flex-shrink-0" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom language input — shown below trigger when Local Language selected */}
      {isCustom && (
        <div className="mt-2 relative">
          <input
            className="w-full border border-purple-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-purple-50 placeholder-purple-300"
            placeholder="e.g. Luganda, Lutoro, Runyoro, Ateso…"
            value={customValue}
            onChange={e => onCustomChange(e.target.value)}
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-400 uppercase tracking-wide">Local</span>
        </div>
      )}
    </div>
  );
}

export default function MarksEntryPage() {
  const [filters, setFilters] = useState({ year: DEFAULT_YEAR, term: TERMS[0], cls: '', subject: 'English Language' });
  const [customSubject, setCustomSubject] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [saveStates, setSaveStates] = useState({});

  const timers = useRef({});
  const filtersRef = useRef(filters);
  const customSubjectRef = useRef(customSubject);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { customSubjectRef.current = customSubject; }, [customSubject]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const isCustomSubject = filters.subject === '__custom__';
  const activeSubject = isCustomSubject ? customSubject : filters.subject;

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaveStates({});
    try {
      const studentParams = new URLSearchParams({ limit: 500 });
      if (filters.cls) studentParams.set('class_assigned', filters.cls);

      const markParams = new URLSearchParams({
        subject: activeSubject,
        term: filters.term,
        academic_year: filters.year,
      });
      if (filters.cls) markParams.set('class_assigned', filters.cls);

      const [studentsRes, marksRes] = await Promise.all([
        fetchWithAuth(`${API}/students/?${studentParams}`),
        fetchWithAuth(`${API}/marks/?${markParams}`),
      ]);

      if (!studentsRes?.ok) throw new Error('Failed to fetch students');
      const studentsData = await studentsRes.json();
      const students = Array.isArray(studentsData) ? studentsData : (studentsData.results || []);

      const marksMap = {};
      if (marksRes?.ok) {
        const marksData = await marksRes.json();
        const marksList = Array.isArray(marksData) ? marksData : (marksData.results || []);
        marksList.forEach(m => { marksMap[m.student] = m; });
      }

      setRows(students.map(s => {
        const existing = marksMap[s.id];
        return {
          studentId: s.id,
          markId: existing?.id || null,
          name: `${s.first_name} ${s.last_name}`,
          photo: s.photo || null,
          adm: s.admission_number || '',
          cls: s.class_assigned || '',
          comp: existing?.competency || '',
          ca: existing?.ca_score ?? '',
          exam: existing?.exam_score ?? '',
        };
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters.cls, filters.subject, filters.term, filters.year, activeSubject]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Autosave a single row ─────────────────────────────────────────────────
  const saveRow = useCallback(async (row) => {
    const f = filtersRef.current;
    const subject = f.subject === '__custom__' ? customSubjectRef.current : f.subject;
    if (!subject || (row.ca === '' && row.exam === '')) return; // nothing to save
    if (String(row.studentId).startsWith('manual') && !row.name) return;

    setSaveStates(s => ({ ...s, [row.studentId]: 'saving' }));
    try {
      const res = await fetchWithAuth(`${API}/marks/bulk-save/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          student: row.studentId,
          subject,
          term: f.term,
          academic_year: f.year,
          competency: row.comp,
          ca_score: row.ca === '' ? null : Number(row.ca),
          exam_score: row.exam === '' ? null : Number(row.exam),
        }]),
      });
      if (!res?.ok) throw new Error();
      setSaveStates(s => ({ ...s, [row.studentId]: 'saved' }));
    } catch {
      setSaveStates(s => ({ ...s, [row.studentId]: 'error' }));
      showToast('Auto-save failed for one record', false);
    }
  }, []);

  // ── Update row + schedule autosave ────────────────────────────────────────
  const updateRow = useCallback((studentId, field, value) => {
    setSaveStates(s => ({ ...s, [studentId]: 'idle' }));
    setRows(rs => {
      const updated = rs.map(r => r.studentId === studentId ? { ...r, [field]: value } : r);
      const row = updated.find(r => r.studentId === studentId);
      clearTimeout(timers.current[studentId]);
      timers.current[studentId] = setTimeout(() => saveRow(row), 900);
      return updated;
    });
  }, [saveRow]);

  const addRow = () =>
    setRows(rs => [...rs, {
      studentId: `manual-${Date.now()}`,
      markId: null,
      name: '', adm: '', cls: filters.cls,
      photo: null,
      comp: '', ca: '', exam: '',
    }]);

  const removeRow = (studentId) => {
    clearTimeout(timers.current[studentId]);
    setRows(rs => rs.filter(r => r.studentId !== studentId));
  };

  const savingCount = Object.values(saveStates).filter(v => v === 'saving').length;
  const allSaved   = rows.length > 0 && Object.values(saveStates).every(v => v === 'saved');

  const totals = rows.map(r => (Number(r.ca) || 0) + (Number(r.exam) || 0)).filter(t => t > 0);
  const avg  = totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1) : null;
  const high = totals.length ? Math.max(...totals) : null;
  const low  = totals.length ? Math.min(...totals) : null;

  return (
    <div className="space-y-5">
      {/* ── Header Banner ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700 shadow-lg">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-52 h-52 rounded-full bg-white/5" />
        <div className="absolute top-4 right-32 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: title + meta */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Marks Entry</h1>
              <p className="text-blue-200 text-xs mt-0.5">
                {activeSubject
                  ? <><span className="text-white font-semibold">{activeSubject}</span> · {filters.term} · {filters.year}{filters.cls && <> · <span className="text-white font-semibold">{filters.cls}</span></>}</>
                  : 'Select a subject, term and class to begin'}
              </p>
            </div>
          </div>

          {/* Right: stat pills + action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* stat pills */}
            <div className="flex items-center gap-2 mr-1">
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <GraduationCap className="w-3.5 h-3.5" /> {rows.length} students
              </span>
              {avg && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  <BookOpen className="w-3.5 h-3.5" /> Avg {avg}
                </span>
              )}
              {savingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…
                </span>
              )}
              {savingCount === 0 && allSaved && (
                <span className="inline-flex items-center gap-1.5 bg-green-400/25 text-green-100 text-xs font-medium px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> All saved
                </span>
              )}
            </div>

            {/* action buttons */}
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Bulk Upload
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* filter header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100 rounded-t-2xl">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-cyan-500" />
          <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">Filter</span>
        </div>
        <div className="p-3 grid grid-cols-4 gap-2">
          {/* Year */}
          <div className="space-y-1 min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Year</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 pr-6 cursor-pointer"
                value={filters.year}
                onChange={e => setFilter('year', e.target.value)}
              >
                {YEARS.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Term */}
          <div className="space-y-1 min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Term</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 pr-6 cursor-pointer"
                value={filters.term}
                onChange={e => setFilter('term', e.target.value)}
              >
                {TERMS.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Subject */}
          <div className="space-y-1 min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
            <SubjectDropdown
              value={filters.subject}
              customValue={customSubject}
              onSelect={v => setFilter('subject', v)}
              onCustomChange={setCustomSubject}
            />
          </div>
          {/* Class */}
          <div className="space-y-1 min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Class</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 pr-6 cursor-pointer"
                value={filters.cls}
                onChange={e => setFilter('cls', e.target.value)}
              >
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Students',      value: rows.length, icon: <Users className="w-5 h-5 text-gray-500" />,       iconBg: 'bg-gray-200',    bg: 'from-slate-50 to-gray-100',   border: 'border-gray-200',    val: 'text-gray-800' },
          { label: 'Class Average', value: avg ?? '—',  icon: <BarChart2 className="w-5 h-5 text-teal-600" />,   iconBg: 'bg-teal-100',    bg: 'from-teal-50 to-cyan-50',    border: 'border-teal-100',    val: 'text-teal-700' },
          { label: 'Highest Score', value: high ?? '—', icon: <Trophy className="w-5 h-5 text-emerald-600" />,   iconBg: 'bg-emerald-100', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-100', val: 'text-emerald-700' },
          { label: 'Lowest Score',  value: low ?? '—',  icon: <TrendingDown className="w-5 h-5 text-rose-500" />, iconBg: 'bg-rose-100',    bg: 'from-rose-50 to-red-50',     border: 'border-rose-100',    val: 'text-rose-600' },
        ].map(({ label, value, icon, iconBg, bg, border, val }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-xl font-bold ${val} leading-tight`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-700">
              {activeSubject || <span className="text-gray-400 italic">Select a subject</span>}
              {filters.cls && <span className="ml-2 text-xs font-normal text-gray-400">— {filters.cls}</span>}
              <span className="ml-2 text-xs font-normal text-gray-400">· {filters.term} · {filters.year}</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Changes are saved automatically</p>
          </div>
          <button onClick={addRow} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Student Name', 'Adm. No.', 'Class', 'Competency', 'CA (/40)', 'Exam (/60)', 'Total', 'Grade', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />Loading students…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-red-400">{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400">
                    No students found. {filters.cls ? `No students in ${filters.cls}.` : 'Select a class or add a row manually.'}
                  </td>
                </tr>
              ) : rows.map((row, i) => {
                const total = (Number(row.ca) || 0) + (Number(row.exam) || 0);
                const hasScore = row.ca !== '' || row.exam !== '';
                const g = hasScore ? getGrade(total) : null;
                const ss = saveStates[row.studentId];
                return (
                  <tr key={row.studentId} className={`hover:bg-gray-50 transition-colors ${ss === 'saving' ? 'bg-teal-50/30' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      {row.name
                        ? <div className="flex items-center gap-2">
                            <Avatar name={row.name} photo={row.photo} />
                            <span className="font-medium text-gray-800 whitespace-nowrap">{row.name}</span>
                          </div>
                        : <input
                            className="w-36 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Student name"
                            value={row.name}
                            onChange={e => updateRow(row.studentId, 'name', e.target.value)}
                          />}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.adm || '—'}</td>
                    <td className="px-4 py-3">
                      {row.cls
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{row.cls}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-44 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="e.g. Number Operations"
                        value={row.comp}
                        onChange={e => updateRow(row.studentId, 'comp', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number" min="0" max="40"
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="0"
                        value={row.ca}
                        onChange={e => updateRow(row.studentId, 'ca', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number" min="0" max="60"
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="0"
                        value={row.exam}
                        onChange={e => updateRow(row.studentId, 'exam', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">
                      {hasScore ? total : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g
                        ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${g.cls}`}>{g.grade}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ss === 'saving' && <span className="inline-flex items-center gap-1 text-xs text-teal-500"><RefreshCw className="w-3 h-3 animate-spin" /> Saving…</span>}
                      {ss === 'saved'  && <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Saved</span>}
                      {ss === 'error'  && <span className="inline-flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>}
                      {!ss            && <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeRow(row.studentId)} className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
