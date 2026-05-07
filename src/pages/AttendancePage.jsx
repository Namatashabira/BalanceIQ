import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, ChevronDown, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { fetchWithAuth } from '../api';

const API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school`;

const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];
const TERMS   = ['Term 1', 'Term 2', 'Term 3'];
const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const STATUS_STYLES = {
  present: { bg: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-500 text-white' },
  absent:  { bg: 'bg-red-100 text-red-700',         active: 'bg-red-500 text-white'     },
  late:    { bg: 'bg-amber-100 text-amber-700',     active: 'bg-amber-500 text-white'   },
  excused: { bg: 'bg-blue-100 text-blue-700',       active: 'bg-blue-500 text-white'    },
};

const today       = new Date().toISOString().split('T')[0];
const currentYear = String(new Date().getFullYear());
const YEARS       = Array.from({ length: 7 }, (_, i) => String(new Date().getFullYear() - i));

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, photo }) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-violet-400', 'bg-indigo-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400'];
  const color  = colors[name.charCodeAt(0) % colors.length];

  if (photo && !err) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
      />
    );
  }
  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white ${color}`}>
      {initials}
    </div>
  );
}

// ── Status button ─────────────────────────────────────────────────────────────
function StatusBtn({ status, current, onClick, saving }) {
  const s = STATUS_STYLES[status];
  const isActive = current === status;
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize transition disabled:opacity-60 ${
        isActive ? s.active : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      }`}
    >
      {status}
    </button>
  );
}

// ── Save indicator ────────────────────────────────────────────────────────────
function SaveIndicator({ state }) {
  if (state === 'saving') return (
    <span className="inline-flex items-center gap-1 text-xs text-violet-500">
      <RefreshCw className="w-3 h-3 animate-spin" /> Saving…
    </span>
  );
  if (state === 'saved') return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
      <CheckCircle className="w-3 h-3" /> Saved
    </span>
  );
  if (state === 'error') return (
    <span className="inline-flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  );
  return null;
}

export default function AttendancePage() {
  const [filters, setFilters] = useState({ date: today, cls: '', term: TERMS[0], year: currentYear });
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);
  const [error, setError]     = useState(null);

  // Per-row save state: { [studentId]: 'idle' | 'saving' | 'saved' | 'error' }
  const [saveStates, setSaveStates] = useState({});
  // Debounce timers per row
  const timers = useRef({});
  // Always-current filters ref — avoids stale closure in debounced saves
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  const setFilter = useCallback((k, v) => setFilters(f => ({ ...f, [k]: v })), []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaveStates({});
    try {
      const sp = new URLSearchParams({ limit: 500 });
      if (filters.cls) sp.set('class_assigned', filters.cls);

      const ap = new URLSearchParams({ date: filters.date, term: filters.term, academic_year: filters.year });
      if (filters.cls) ap.set('class_assigned', filters.cls);

      const [studRes, attRes] = await Promise.all([
        fetchWithAuth(`${API}/students/?${sp}`),
        fetchWithAuth(`${API}/attendance/?${ap}`),
      ]);

      if (!studRes?.ok) throw new Error('Failed to fetch students');
      const studData = await studRes.json();
      const students = Array.isArray(studData) ? studData : (studData.results || []);

      const attMap = {};
      if (attRes?.ok) {
        const attData = await attRes.json();
        const list = Array.isArray(attData) ? attData : (attData.results || []);
        list.forEach(a => { attMap[a.student] = a; });
      }

      setRows(students.map(s => ({
        studentId: s.id,
        attId:  attMap[s.id]?.id || null,
        name:   `${s.first_name} ${s.last_name}`,
        photo:  s.photo || null,
        adm:    s.admission_number || '',
        cls:    s.class_assigned || '',
        status: attMap[s.id]?.status || 'present',
        note:   attMap[s.id]?.note   || '',
      })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters.cls, filters.date, filters.term, filters.year]);

  useEffect(() => { loadData(); }, [loadData]);

  // Clear timers on unmount
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  // ── Autosave a single row ─────────────────────────────────────────────────
  const saveRow = useCallback(async (row) => {
    // Always read latest filters from ref — never stale
    const f = filtersRef.current;
    setSaveStates(s => ({ ...s, [row.studentId]: 'saving' }));
    try {
      const res = await fetchWithAuth(`${API}/attendance/bulk-save/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          student:       row.studentId,
          date:          f.date,
          term:          f.term,
          academic_year: f.year,
          status:        row.status,
          note:          row.note,
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
  const updateRow = useCallback((id, field, value) => {
    setSaveStates(s => ({ ...s, [id]: 'idle' }));
    setRows(rs => {
      const updated = rs.map(r => r.studentId === id ? { ...r, [field]: value } : r);
      const row = updated.find(r => r.studentId === id);
      const delay = field === 'status' ? 300 : 900;
      clearTimeout(timers.current[id]);
      // Pass row snapshot into timeout — filtersRef read inside saveRow
      timers.current[id] = setTimeout(() => saveRow(row), delay);
      return updated;
    });
  }, [saveRow]);

  // ── Mark all ──────────────────────────────────────────────────────────────
  const markAll = useCallback((status) => {
    setRows(rs => {
      const updated = rs.map(r => ({ ...r, status }));
      updated.forEach(r => {
        clearTimeout(timers.current[r.studentId]);
        timers.current[r.studentId] = setTimeout(() => saveRow(r), 300);
      });
      setSaveStates(s => {
        const next = { ...s };
        updated.forEach(r => { next[r.studentId] = 'idle'; });
        return next;
      });
      return updated;
    });
  }, [saveRow]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const presentCount   = rows.filter(r => r.status === 'present').length;
  const absentCount    = rows.filter(r => r.status === 'absent').length;
  const lateCount      = rows.filter(r => r.status === 'late').length;
  const excusedCount   = rows.filter(r => r.status === 'excused').length;
  const savingCount    = Object.values(saveStates).filter(v => v === 'saving').length;
  const attendanceRate = rows.length > 0 ? Math.round(((presentCount + lateCount) / rows.length) * 100) : 0;

  return (
    <div className="space-y-4">

      {/* ── Header Banner ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-700 shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-52 h-52 rounded-full bg-white/5" />

        <div className="relative px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Attendance</h1>
              <p className="text-purple-200 text-xs mt-0.5">
                <span className="text-white font-semibold">{filters.date}</span>
                {filters.cls && <> · <span className="text-white font-semibold">{filters.cls}</span></>}
                {' '}· {filters.term} · {filters.year}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-2.5 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" /> {rows.length}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-400/25 text-emerald-100 text-xs font-medium px-2.5 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> {attendanceRate}%
            </span>
            {savingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-2.5 py-1.5 rounded-full">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…
              </span>
            )}
            {savingCount === 0 && Object.values(saveStates).some(v => v === 'saved') && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-400/25 text-emerald-100 text-xs font-medium px-2.5 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> All saved
              </span>
            )}
            <button onClick={loadData} disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* single scrollable row on all screen sizes */}
        <div className="flex items-end gap-2 px-3 py-3 overflow-x-auto scrollbar-none">

          {/* Date */}
          <div className="flex flex-col gap-1 min-w-[110px] flex-shrink-0">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">Date</label>
            <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div className="w-px h-8 bg-gray-200 flex-shrink-0 self-center" />

          {/* Term */}
          <div className="flex flex-col gap-1 min-w-[90px] flex-shrink-0">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">Term</label>
            <div className="relative">
              <select value={filters.term} onChange={e => setFilter('term', e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 pr-6 cursor-pointer">
                {TERMS.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1 min-w-[72px] flex-shrink-0">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">Year</label>
            <div className="relative">
              <select value={filters.year} onChange={e => setFilter('year', e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 pr-6 cursor-pointer">
                {YEARS.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Class */}
          <div className="flex flex-col gap-1 min-w-[90px] flex-shrink-0">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">Class</label>
            <div className="relative">
              <select value={filters.cls} onChange={e => setFilter('cls', e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 pr-6 cursor-pointer">
                <option value="">All</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: presentCount, icon: <UserCheck   className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />, iconBg: 'bg-emerald-100', bg: 'from-emerald-50 to-green-50',   border: 'border-emerald-100', val: 'text-emerald-700' },
          { label: 'Absent',  value: absentCount,  icon: <UserX       className="w-4 h-4 sm:w-5 sm:h-5 text-red-500"     />, iconBg: 'bg-red-100',     bg: 'from-red-50 to-rose-50',       border: 'border-red-100',     val: 'text-red-600'     },
          { label: 'Late',    value: lateCount,    icon: <Clock       className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600"   />, iconBg: 'bg-amber-100',   bg: 'from-amber-50 to-yellow-50',   border: 'border-amber-100',   val: 'text-amber-700'   },
          { label: 'Excused', value: excusedCount, icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500"    />, iconBg: 'bg-blue-100',    bg: 'from-blue-50 to-indigo-50',    border: 'border-blue-100',    val: 'text-blue-700'    },
        ].map(({ label, value, icon, iconBg, bg, border, val }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3`}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-lg sm:text-xl font-bold ${val} leading-tight`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Register ── */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-700 text-sm">
              Attendance Register
              {filters.cls && <span className="ml-2 text-xs font-normal text-gray-400">— {filters.cls}</span>}
              <span className="ml-2 text-xs font-normal text-gray-400">· {filters.date}</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Changes are saved automatically</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">Mark all:</span>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => markAll(s)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize transition hover:opacity-80 ${STATUS_STYLES[s].bg}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading students…
          </div>
        )}
        {!loading && error && <div className="text-center py-12 text-red-400 text-sm">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No students found. {filters.cls ? `No students in ${filters.cls}.` : 'Select a class to begin.'}
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <>
            {/* ── Desktop table md+ ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Student', 'Adm. No.', 'Class', 'Status', 'Note', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, i) => {
                    const ss = saveStates[row.studentId];
                    return (
                      <tr key={row.studentId} className={`transition-colors hover:bg-gray-50 ${ss === 'saving' ? 'bg-violet-50/30' : ''}`}>
                        <td className="px-4 py-3 text-gray-400 text-xs w-8">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.name} photo={row.photo} />
                            <span className="font-medium text-gray-800 whitespace-nowrap">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.adm || '—'}</td>
                        <td className="px-4 py-3">
                          {row.cls
                            ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{row.cls}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {STATUS_OPTIONS.map(s => (
                              <StatusBtn key={s} status={s} current={row.status} saving={ss === 'saving'}
                                onClick={() => updateRow(row.studentId, 'status', s)} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full min-w-[120px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                            placeholder="Note…"
                            value={row.note}
                            onChange={e => updateRow(row.studentId, 'note', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <SaveIndicator state={ss} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards < md ── */}
            <div className="md:hidden divide-y divide-gray-100">
              {rows.map((row, i) => {
                const ss = saveStates[row.studentId];
                return (
                  <div key={row.studentId} className={`p-4 space-y-3 transition-colors ${ss === 'saving' ? 'bg-violet-50/30' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={row.name} photo={row.photo} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{row.name}</p>
                          <p className="text-xs text-gray-400">{row.adm || '—'}{row.cls && ` · ${row.cls}`}</p>
                        </div>
                      </div>
                      <SaveIndicator state={ss} />
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_OPTIONS.map(s => (
                        <StatusBtn key={s} status={s} current={row.status} saving={ss === 'saving'}
                          onClick={() => updateRow(row.studentId, 'status', s)} />
                      ))}
                    </div>

                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                      placeholder="Optional note…"
                      value={row.note}
                      onChange={e => updateRow(row.studentId, 'note', e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
