import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithAuth } from '../api';
import {
  Printer, Loader2, FileText, Calendar,
  Users, GraduationCap, CheckSquare, Square, X, History, Trash2
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useReportTemplate } from '../context/ReportTemplateContext';
import { ClassicPreview, ModernPreview, MinimalPreview, TEMPLATE_MAP } from './ReportTemplatesPage';
import { loadReceiptSettings } from '../services/receiptSettingsService';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
const SCHOOL_API = `${API}/school`;

const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const PRIMARY_CLASSES = ['Baby', 'Middle', 'Top', 'P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7'];
const SECONDARY_CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];
const CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const GRADE_SCALE = [
  { min: 80, grade: 'A' }, { min: 70, grade: 'B' }, { min: 60, grade: 'C' },
  { min: 50, grade: 'D' }, { min: 40, grade: 'E' }, { min: 0, grade: 'F' },
];
const getGrade = (score) => (GRADE_SCALE.find(g => score >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1]).grade;
const REMARK_MAP = { A: 'Excellent', B: 'Good', C: 'Satisfactory', D: 'Needs Improvement', E: 'Poor', F: 'Fail' };

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');

function resolvePhoto(photo) {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  return `${BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
}

async function buildReportData(student, term, academicYear, logo, schoolInfo) {
  const markParams = new URLSearchParams({ student: student.id, term, academic_year: academicYear });
  const marksRes = await fetchWithAuth(`${SCHOOL_API}/marks/?${markParams}`);
  let marks = [];
  if (marksRes?.ok) {
    const md = await marksRes.json();
    marks = Array.isArray(md) ? md : (md?.results || []);
  }

  const subjects = marks.map(m => {
    const total = (m.ca_score || 0) + (m.exam_score || 0);
    const grade = m.grade || getGrade(total);
    return { subject_name: m.subject, ca_score: m.ca_score ?? null, exam_score: m.exam_score ?? null, score: total, grade, remark: REMARK_MAP[grade] || '', competency: m.competency || '' };
  });

  // Fetch AI comment for this student
  let aiComment = '';
  try {
    const aiRes = await fetchWithAuth(`${API}/ai-comments/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, term, academic_year: academicYear }),
    });
    if (aiRes?.ok) {
      const aiData = await aiRes.json();
      aiComment = aiData.comment || '';
    }
  } catch { /* use empty comment on failure */ }

  const guardians = (student.guardians || []).map(g => ({ full_name: g.full_name, relationship: g.relationship, phone: g.phone, email: g.email || '' }));
  const history = student.history || [];

  return {
    school: {
      name: schoolInfo?.name || schoolInfo?.businessName || 'School Name',
      logo: logo || null,
      address: [schoolInfo?.poBox, schoolInfo?.location, schoolInfo?.town].filter(Boolean).join(' · ') || '',
      motto: schoolInfo?.motto || '',
    },
    student: {
      full_name: `${student.first_name} ${student.last_name}`,
      admission_number: student.admission_number || '—',
      class_or_grade: student.class_assigned || '—',
      stream: student.stream_name || student.stream || '—',
      gender: student.gender || '—',
      nationality: student.nationality || '—',
      district: student.district || '—',
      home_address: student.home_address || '',
      enrollment_date: student.enrollment_date || '',
      status: student.status || 'active',
      index_number: student.index_number || '',
      previous_school: student.previous_school || '',
      fees_balance: student.fees_balance ?? 0,
      payment_status: student.payment_status || 'not_paid',
      photo: resolvePhoto(student.photo) || null,
      guardians,
    },
    subjects,
    attendance: history.filter(h => h.history_type === 'attendance').map(h => ({ title: h.title, description: h.description, date: h.date })),
    notes: history.filter(h => h.history_type === 'note').map(h => ({ title: h.title, description: h.description, date: h.date })),
    ai_comment: aiComment,
    metadata: { term, academic_year: academicYear },
  };
}

export default function StudentReportPage() {
  const { schoolInfo } = useConfig();
  const { template, setTemplate } = useReportTemplate();
  const [rsLogo, setRsLogo] = useState('');  // logo from ReceiptSettings (single source of truth)

  // Load logo from ReceiptSettings on mount
  useEffect(() => {
    loadReceiptSettings().then(data => {
      if (data.logo) setRsLogo(data.logo);
    }).catch(() => {});
  }, []);

  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'history'
  const [allStudents, setAllStudents] = useState([]);
  const [streams, setStreams] = useState([]);
  const [term, setTerm] = useState(TERMS[0]);
  const [academicYear, setAcademicYear] = useState(String(currentYear));

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [scope, setScope] = useState('all');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');
  const printRef = useRef(null);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ term: '', academic_year: '', class_assigned: '' });
  const [expandedReport, setExpandedReport] = useState(null);

  // Restore last generated session from DB on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastReportSession');
    if (!saved) return;
    const { term: t, academic_year: y } = JSON.parse(saved);
    setTerm(t);
    setAcademicYear(y);
    setReportsLoading(true);
    fetchWithAuth(`${SCHOOL_API}/generated-reports/?term=${encodeURIComponent(t)}&academic_year=${encodeURIComponent(y)}&page_size=500`)
      .then(r => r?.json())
      .then(d => {
        const items = Array.isArray(d) ? d : (d?.results || []);
        setReports(items.map(r => r.report_data));
      })
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, []);

  useEffect(() => {
    fetchWithAuth(`${SCHOOL_API}/students/?page_size=500`)
      .then(r => r?.json())
      .then(d => setAllStudents(Array.isArray(d) ? d : (d?.results || [])))
      .catch(() => setError('Failed to load students'));
    fetchWithAuth(`${SCHOOL_API}/streams/`)
      .then(r => r?.json())
      .then(d => setStreams(Array.isArray(d) ? d : (d?.results || [])))
      .catch(() => {});
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const params = new URLSearchParams();
    if (historyFilter.term) params.set('term', historyFilter.term);
    if (historyFilter.academic_year) params.set('academic_year', historyFilter.academic_year);
    if (historyFilter.class_assigned) params.set('class_assigned', historyFilter.class_assigned);
    const res = await fetchWithAuth(`${SCHOOL_API}/generated-reports/?${params}`);
    if (res?.ok) {
      const d = await res.json();
      setHistory(Array.isArray(d) ? d : (d?.results || []));
    }
    setHistoryLoading(false);
  }, [historyFilter]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  const deleteReport = async (id) => {
    if (!confirm('Delete this saved report?')) return;
    await fetchWithAuth(`${SCHOOL_API}/generated-reports/${id}/`, { method: 'DELETE' });
    setHistory(h => h.filter(r => r.id !== id));
    if (expandedReport?.id === id) setExpandedReport(null);
  };

  // Derived: students visible after class+stream filter
  const visibleStudents = allStudents.filter(s => {
    if (filterClass && s.class_assigned !== filterClass) return false;
    if (filterStream && String(s.stream) !== String(filterStream) && s.stream_name !== filterStream) return false;
    return true;
  });

  // Students to generate for
  const targetStudents = scope === 'individual'
    ? visibleStudents.filter(s => selectedIds.has(s.id))
    : visibleStudents;

  const toggleStudent = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === visibleStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleStudents.map(s => s.id)));
    }
  };

  const generateReports = useCallback(async () => {
    const targets = scope === 'individual'
      ? visibleStudents.filter(s => selectedIds.has(s.id))
      : visibleStudents;

    if (!targets.length) { setError('No students match the current filters.'); return; }

    setLoading(true);
    setError('');
    setReports([]);
    setSaveStatus('');
    setProgress({ done: 0, total: targets.length });

    const results = [];
    const studentMap = {}; // reportData index -> student id
    for (const student of targets) {
      try {
        let fullStudent = student;
        if (!student.guardians) {
          const res = await fetchWithAuth(`${SCHOOL_API}/students/${student.id}/`);
          if (res?.ok) fullStudent = await res.json();
        }
    const data = await buildReportData(fullStudent, term, academicYear, rsLogo, schoolInfo);
        studentMap[results.length] = student.id;
        results.push(data);
      } catch {
        // skip failed student
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }

    setReports(results);
    setLoading(false);

    // Save to database
    if (results.length > 0) {
      setSaveStatus('saving');
      const payload = results.map((data, i) => ({
        student: studentMap[i],
        term,
        academic_year: academicYear,
        template,
        report_data: data,
      }));
      try {
        const res = await fetchWithAuth(`${SCHOOL_API}/generated-reports/bulk-save/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res?.ok) {
          setSaveStatus('saved');
          localStorage.setItem('lastReportSession', JSON.stringify({ term, academic_year: academicYear }));
        } else {
          setSaveStatus('error');
        }
      } catch {
        setSaveStatus('error');
      }
    }
  }, [visibleStudents, selectedIds, scope, term, academicYear, rsLogo, template]);

  const handlePrint = useCallback(() => {
    const style = document.createElement('style');
    style.id = '__print_style__';
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-area, #print-area * { visibility: visible; }
        #print-area { position: absolute; top: 0; left: 0; width: 100%; }
        #print-area .no-print { display: none !important; }
        .page-break { page-break-after: always; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, []);

  const PreviewComponent = TEMPLATE_MAP[template] || TEMPLATE_MAP.classic;

  const scopeLabel = scope === 'all'
    ? `Whole School (${visibleStudents.length})`
    : scope === 'class'
    ? `Class ${filterClass || '—'} (${visibleStudents.length})`
    : scope === 'stream'
    ? `Stream ${filterStream || '—'} (${visibleStudents.length})`
    : `${selectedIds.size} selected`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Reports</h1>
            <p className="text-sm text-gray-500">Generate report cards in bulk or individually</p>
          </div>
        </div>
        {/* Template switcher — wraps on small screens */}
        <div className="flex flex-wrap gap-1.5">
          {['salah', 'salahv2', 'greenclassic', 'classic2', 'classic', 'modern', 'minimal'].map(t => (
            <button key={t} onClick={() => setTemplate(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all border ${
                template === t
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ key: 'generate', icon: FileText, label: 'Generate' }, { key: 'history', icon: History, label: 'History' }].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Filters &amp; Scope</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1: term, year, class, stream */}
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Term
              </label>
              <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" value={term} onChange={e => { setTerm(e.target.value); setReports([]); setSaveStatus(''); }}>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Year
              </label>
              <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" value={academicYear} onChange={e => { setAcademicYear(e.target.value); setReports([]); setSaveStatus(''); }}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Class
              </label>
              <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                value={filterClass}
                onChange={e => { setFilterClass(e.target.value); setFilterStream(''); setSelectedIds(new Set()); if (e.target.value) setScope('class'); else setScope('all'); }}>
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Stream
              </label>
              <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                value={filterStream}
                onChange={e => { setFilterStream(e.target.value); setSelectedIds(new Set()); if (e.target.value) setScope('stream'); else setScope(filterClass ? 'class' : 'all'); }}>
                <option value="">All Streams</option>
                {streams.map(s => <option key={s.id} value={s.name}>{s.name}{s.class_label ? ` (${s.class_label})` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: scope pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500">Generate for:</span>
            {[
              { key: 'all', label: 'Whole School' },
              { key: 'class', label: `Class${filterClass ? ` ${filterClass}` : ''}` },
              { key: 'stream', label: `Stream${filterStream ? ` ${filterStream}` : ''}` },
              { key: 'individual', label: 'Pick Students' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => { setScope(key); setSelectedIds(new Set()); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${scope === key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}`}>
                {label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {visibleStudents.length} student{visibleStudents.length !== 1 ? 's' : ''} visible
            </span>
          </div>

          {/* Row 3: student checklist (only when scope=individual) */}
          {scope === 'individual' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                <button onClick={toggleAll} className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-emerald-600">
                  {selectedIds.size === visibleStudents.length && visibleStudents.length > 0
                    ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                    : <Square className="w-4 h-4" />}
                  {selectedIds.size === visibleStudents.length && visibleStudents.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-xs text-gray-400">{selectedIds.size} selected</span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                {visibleStudents.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">No students match filters</p>
                )}
                {visibleStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-emerald-600 rounded"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleStudent(s.id)} />
                    <span className="flex-1 text-sm text-gray-800">{s.first_name} {s.last_name}</span>
                    {s.admission_number && <span className="text-xs text-gray-400 font-mono">{s.admission_number}</span>}
                    {s.class_assigned && <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{s.class_assigned}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={generateReports}
              disabled={loading || (scope === 'individual' && selectedIds.size === 0) || visibleStudents.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {progress.done}/{progress.total}…</>
                : <><FileText className="w-4 h-4" /> Generate Reports — {scopeLabel}</>}
            </button>
            {reports.length > 0 && !loading && (
              <button onClick={() => setReports([])}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-3">
              <select className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={historyFilter.term} onChange={e => setHistoryFilter(f => ({ ...f, term: e.target.value }))}>
                <option value="">All Terms</option>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
              <select className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={historyFilter.academic_year} onChange={e => setHistoryFilter(f => ({ ...f, academic_year: e.target.value }))}>
                <option value="">All Years</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
              <select className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={historyFilter.class_assigned} onChange={e => setHistoryFilter(f => ({ ...f, class_assigned: e.target.value }))}>
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {historyLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>}

          {!historyLoading && history.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <History className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">No saved reports found</p>
            </div>
          )}

          {!historyLoading && history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest">
                {history.length} saved report{history.length !== 1 ? 's' : ''}
              </div>
              <div className="divide-y divide-gray-100">
                {history.map(r => (
                  <div key={r.id}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.student_name}</p>
                        <p className="text-xs text-gray-400">{r.term} · {r.academic_year} · <span className="capitalize">{r.template}</span> template</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(r.generated_at).toLocaleDateString()}</span>
                      <button onClick={() => setExpandedReport(expandedReport?.id === r.id ? null : r)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                        {expandedReport?.id === r.id ? 'Hide' : 'View'}
                      </button>
                      <button onClick={() => deleteReport(r.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {expandedReport?.id === r.id && (
                      <div className="px-4 pb-4 bg-gray-50 overflow-x-auto">
                        <PreviewComponent data={r.report_data} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && <>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      {/* Progress bar while loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Generating reports…</span>
            <span className="font-semibold">{progress.done} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !reportsLoading && reports.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Configure filters above and click Generate</p>
          <p className="text-xs text-gray-300 mt-1">Using <span className="capitalize font-medium">{template}</span> template</p>
        </div>
      )}

      {reportsLoading && (
        <div className="flex items-center justify-center py-10 gap-2 text-emerald-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Restoring saved reports…</span>
        </div>
      )}

      {/* Reports */}
      {!loading && !reportsLoading && reports.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{reports.length}</span> report{reports.length !== 1 ? 's' : ''} generated ·
                <span className="capitalize ml-1 text-teal-600 font-semibold">{template}</span> template
              </p>
              {saveStatus === 'saving' && <span className="text-xs text-teal-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
              {saveStatus === 'saved' && <span className="text-xs text-green-600 font-semibold">✓ Saved to history</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-500">Save failed</span>}
            </div>
            <button onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-sm">
              <Printer className="w-4 h-4" /> Print All / Save PDF
            </button>
          </div>

          <div ref={printRef} id="print-area" className="space-y-0">
            {reports.map((data, i) => (
              <div key={i} className="page-break bg-gray-50 rounded-xl p-4 mb-4 overflow-x-auto">
                <div className="flex items-center justify-between mb-3 no-print">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {i + 1} of {reports.length} — {data.student.full_name}
                  </span>
                  <span className="text-xs text-gray-400">{data.student.class_or_grade} · {data.metadata.term} {data.metadata.academic_year}</span>
                </div>
                <PreviewComponent data={data} />
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      }
    </div>
  );
}
