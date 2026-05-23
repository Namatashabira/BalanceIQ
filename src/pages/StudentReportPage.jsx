import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithAuth } from '../api';
import {
  Printer, Loader2, FileText, Calendar,
  Users, GraduationCap, CheckSquare, Square, X, History, Trash2, CheckCircle
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useReportTemplate } from '../context/ReportTemplateContext';
import { ClassicPreview, ModernPreview, MinimalPreview, TEMPLATE_MAP } from './ReportTemplatesPage';
import { loadReceiptSettings } from '../services/receiptSettingsService';
import { loadReportSettings, mergeReportSettings } from '../services/reportSettingsService';
import { buildCompleteReportData } from '../services/reportDataService';
import Report1 from './new report templates/report1';
import Report2 from './new report templates/report2';
import Report3 from './new report templates/report3';
import Report4 from './new report templates/report4';
import Report5 from './new report templates/report5';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
const STUDENTS_API = `${API}/school`;

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



export default function StudentReportPage() {
  const { schoolInfo } = useConfig();
  const { template, setTemplate } = useReportTemplate();
  const [rsLogo, setRsLogo] = useState('');
  const [schoolSettings, setSchoolSettings] = useState({});
  const [reportSettings, setReportSettings] = useState(null);

  useEffect(() => {
    loadReceiptSettings().then(data => {
      if (data.logo) setRsLogo(data.logo);
      if (data.stamp) setSchoolSettings(prev => ({ ...prev, school_stamp: data.stamp }));
    }).catch(err => {
      console.warn('Failed to load receipt settings:', err);
    });
    
    fetchWithAuth(`${API}/core/business-settings/`)
      .then(res => {
        if (res?.ok) return res.json();
        throw new Error('Failed to fetch business settings');
      })
      .then(data => {
        setSchoolSettings(prev => ({
          ...prev,
          headteacher_name: data.headteacher_name || 'Head Teacher',
          class_teacher_name: data.class_teacher_name || 'Class Teacher',
          term_ended_date: data.term_ended_date || new Date().toISOString().split('T')[0],
          next_term_date: data.next_term_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          next_term_fees: data.next_term_fees || '0',
          headteacher_signature: data.headteacher_signature || null,
          school_stamp: data.school_stamp || null,
        }));
      })
      .catch(err => {
        console.warn('Failed to load business settings:', err);
      });
    
    loadReportSettings().then(settings => {
      setReportSettings(settings);
    }).catch(err => {
      console.warn('Failed to load report settings:', err);
    });
  }, []); // 'generate' | 'history'
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
  const [reportsPersist, setReportsPersist] = useState(true); // Keep reports visible
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('generate');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (saveStatus === 'saving') {
      setShowSaveModal(true);
    } else if (saveStatus === 'saved') {
      const timer = setTimeout(() => setShowSaveModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ term: '', academic_year: '', class_assigned: '' });
  const [expandedReport, setExpandedReport] = useState(null);

  // Restore last generated session from DB on mount - DISABLED to prevent auto-refresh
  // useEffect(() => {
  //   const saved = localStorage.getItem('lastReportSession');
  //   if (!saved) return;
  //   const { term: t, academic_year: y } = JSON.parse(saved);
  //   setTerm(t);
  //   setAcademicYear(y);
  //   setReportsLoading(true);
  //   fetchWithAuth(`${STUDENTS_API}/generated-reports/?term=${encodeURIComponent(t)}&academic_year=${encodeURIComponent(y)}&page_size=500`)
  //     .then(r => {
  //       if (!r?.ok) {
  //         console.warn('Failed to fetch generated reports:', r?.status, r?.statusText);
  //         return null;
  //       }
  //       return r.json();
  //     })
  //     .then(d => {
  //       if (!d) {
  //         console.log('No generated reports found');
  //         return;
  //       }
  //       const items = Array.isArray(d) ? d : (d?.results || []);
  //       setReports(items.map(r => r.report_data));
  //     })
  //     .catch(err => {
  //       console.warn('Error fetching generated reports:', err);
  //     })
  //     .finally(() => setReportsLoading(false));
  // }, []);

  useEffect(() => {
    fetchWithAuth(`${STUDENTS_API}/students/?page_size=500`)
      .then(r => {
        if (!r?.ok) {
          console.error('Failed to fetch students:', r?.status, r?.statusText);
          setError(`Failed to load students: ${r?.status} ${r?.statusText}`);
          return null;
        }
        return r.json();
      })
      .then(d => {
        if (d) setAllStudents(Array.isArray(d) ? d : (d?.results || []));
      })
      .catch(err => {
        console.error('Error loading students:', err);
        setError(`Failed to load students: ${err.message}`);
      });
    fetchWithAuth(`${STUDENTS_API}/streams/`)
      .then(r => r?.json())
      .then(d => setStreams(Array.isArray(d) ? d : (d?.results || [])))
      .catch(err => console.warn('Failed to load streams:', err));
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const params = new URLSearchParams();
    if (historyFilter.term) params.set('term', historyFilter.term);
    if (historyFilter.academic_year) params.set('academic_year', historyFilter.academic_year);
    if (historyFilter.class_assigned) params.set('class_assigned', historyFilter.class_assigned);
    const res = await fetchWithAuth(`${STUDENTS_API}/generated-reports/?${params}`);
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
    await fetchWithAuth(`${STUDENTS_API}/generated-reports/${id}/`, { method: 'DELETE' });
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

    // Ensure schoolInfo has motto by fetching fresh data if needed
    let freshSchoolInfo = schoolInfo;
    if (!freshSchoolInfo?.motto) {
      try {
        const bsRes = await fetchWithAuth(`${API}/core/business-settings/`);
        if (bsRes?.ok) {
          const bs = await bsRes.json();
          freshSchoolInfo = {
            ...schoolInfo,
            motto: bs.motto || '',
            name: bs.business_name || bs.businessName || schoolInfo?.name || 'School Name',
            phone: bs.phone || schoolInfo?.phone || '',
            email: bs.email || schoolInfo?.email || '',
            website: bs.website || schoolInfo?.website || '',
            poBox: bs.po_box || bs.poBox || schoolInfo?.poBox || '',
            registration_number: bs.registration_number || bs.registrationNumber || schoolInfo?.registration_number || '',
            location: bs.location || schoolInfo?.location || '',
            town: bs.town || schoolInfo?.town || '',
            district: bs.district || schoolInfo?.district || '',
            headteacher_signature: bs.headteacher_signature || null,
            school_stamp: bs.school_stamp || null,
          };
          console.log('[generateReports] Fresh schoolInfo fetched:', freshSchoolInfo);
        }
      } catch (err) {
        console.warn('[generateReports] Error fetching fresh school info:', err);
      }
    }

    const results = [];
    const studentMap = {}; // reportData index -> student id
    for (const student of targets) {
      try {
        let fullStudent = student;
        if (!student.guardians) {
          const res = await fetchWithAuth(`${STUDENTS_API}/students/${student.id}/`);
          if (res?.ok) fullStudent = await res.json();
        }
        let data = await buildCompleteReportData(fullStudent, term, academicYear, rsLogo, freshSchoolInfo, reportSettings);
        if (reportSettings && data) {
          data = mergeReportSettings(data, reportSettings);
        }
        studentMap[results.length] = student.id;
        results.push(data);
      } catch (err) {
        console.error('[generateReports] Error processing student:', student.id, err.message, err);
        setError(`Error generating report for ${student.first_name} ${student.last_name}: ${err.message}`);
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }

    setReports(results);
    setLoading(false);

    // Auto-scroll to reports section
    if (results.length > 0) {
      setTimeout(() => {
        const reportsSection = document.getElementById('reports-section');
        if (reportsSection) {
          reportsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }

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
        const res = await fetchWithAuth(`${STUDENTS_API}/generated-reports/bulk-save/`, {
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
      } catch (err) {
        console.error('[generateReports] Error saving reports:', err.message, err);
        setSaveStatus('error');
      }
    }
  }, [visibleStudents, selectedIds, scope, term, academicYear, rsLogo, template, schoolSettings, schoolInfo, reportSettings]);

  const handlePrint = useCallback(() => {
    const style = document.createElement('style');
    style.id = '__print_style__';
    style.innerHTML = `
@page {
  size: A4 portrait;
  margin: 5mm;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box !important;
  }

  html, body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  #print-area,
  #print-area * {
    visibility: visible !important;
  }

  #print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  .page-break {
    width: 210mm !important;
    height: 297mm !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .page-break:last-child {
    page-break-after: auto !important;
  }

  .r4-card,
  .r5-card {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 8px !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .r4-header, .r5-header {
    flex-shrink: 0 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .r4-content, .r5-content {
    flex: 1 !important;
    overflow: hidden !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .r4-footer, .r5-footer {
    flex-shrink: 0 !important;
    margin-top: auto !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .r4-table, .r5-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 8px !important;
  }

  .r4-table th, .r4-table td,
  .r5-table th, .r5-table td {
    padding: 2px 3px !important;
    font-size: 8px !important;
  }

  .overflow-x-auto {
    overflow: visible !important;
  }
}
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      document.head.removeChild(style);
    }, 100);
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
      {/* Save Status Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            {saveStatus === 'saving' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Saving Reports</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we save your reports…</p>
                </div>
              </div>
            ) : saveStatus === 'saved' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Reports Saved</p>
                  <p className="text-sm text-gray-500 mt-1">All reports have been saved to history</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
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
          {['salah', 'salahv2', 'greenclassic', 'classic2', 'classic', 'modern', 'minimal', 'report1', 'report2', 'report3', 'report4', 'report5'].map(t => (
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
              <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" value={term} onChange={e => { setTerm(e.target.value); }}>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Year
              </label>
              <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" value={academicYear} onChange={e => { setAcademicYear(e.target.value); }}>
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
        <div id="reports-section" className="space-y-4">
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
