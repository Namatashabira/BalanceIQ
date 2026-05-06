import { useState, useEffect, useRef } from 'react';
import { X, Printer, ArrowLeft, Search, LayoutGrid, AlignJustify } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import axios from 'axios';
import { buildStampWithDate } from '../../utils/stampProcessor';
import { loadReceiptSettings, syncPendingReceiptSettings } from '../../services/receiptSettingsService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/fees`;
const STUDENTS_API = `${BASE_URL}/students/students`; // used for search only
const SETTINGS_API = `${BASE_URL}/core/business-settings/`;

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const normalize = (d) => Array.isArray(d) ? d : (d?.results || []);

// ── Single receipt HTML block ─────────────────────────────────────────────────
function buildReceiptHTML(student, payments, summary, term, year, school = {}, sig = {}, compact = false) {
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount_paid), 0);
  const receiptNo = `RCP-${String(student.id || student.student_id || '0').padStart(4, '0')}-${term.replace(' ', '')}-${year}`;
  const isCandidate = ['S.4', 'S.6'].includes(student.class_assigned);

  const rows = payments.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:10px;color:#999;">No payments recorded.</td></tr>`
    : payments.map((p, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
          <td style="padding:4px 6px;border:1px solid #eee">${i + 1}</td>
          <td style="padding:4px 6px;border:1px solid #eee">${p.payment_date}</td>
          <td style="padding:4px 6px;border:1px solid #eee;font-weight:600;color:#1d4ed8">${p.category_display || (p.payment_category || '').replace(/_/g, ' ')}</td>
          <td style="padding:4px 6px;border:1px solid #eee;font-weight:600;color:#059669;text-align:right">${fmt(p.amount_paid)}</td>
          <td style="padding:4px 6px;border:1px solid #eee;text-transform:capitalize">${(p.payment_method || '').replace('_', ' ')}</td>
          <td style="padding:4px 6px;border:1px solid #eee;font-family:monospace;font-size:11px;color:#888">${p.reference || '—'}</td>
        </tr>`).join('');

const pad = compact ? '8px 10px' : '18px 24px';
  const titleSize = compact ? '12px' : '16px';
  const bodySize = compact ? '9px' : '12px';
  const logoHTML = school.logo
    ? `<img src="${school.logo}" alt="logo" style="height:${compact ? '32px' : '48px'};object-fit:contain;margin-bottom:4px"/>`
    : '';

  return `
    <div class="receipt" style="padding:${pad};border:1px solid #ccc;font-family:Arial,sans-serif;font-size:${bodySize};color:#111;background:#fff;box-sizing:border-box;">
      <!-- SCHOOL HEADER -->
      <div style="text-align:center;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:10px">
        ${logoHTML}
        <div style="font-size:${titleSize};font-weight:bold;text-transform:uppercase;letter-spacing:1px">${school.name || 'School Fee Receipt'}</div>
        ${school.address ? `<div style="font-size:10px;color:#555;margin-top:1px">${school.address}</div>` : ''}
        ${school.phone ? `<div style="font-size:10px;color:#555">Tel: ${school.phone}</div>` : ''}
        <div style="font-size:${compact ? '11px' : '13px'};font-weight:bold;margin-top:5px">OFFICIAL PAYMENT RECEIPT</div>
        <div style="font-size:10px;color:#999;margin-top:2px">Receipt No: ${receiptNo}</div>
      </div>

      <!-- STUDENT INFO -->
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:6px 10px;margin-bottom:10px;font-size:${bodySize}">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:2px 0;width:50%">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">Name: </span>
              <strong style="color:#111;text-transform:uppercase">${student.first_name} ${student.last_name}</strong>
            </td>
            <td style="padding:2px 0;width:50%">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">Class: </span>
              <strong style="color:#111">${student.class_assigned}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">Term: </span>
              <strong style="color:#111">${term}</strong>
            </td>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">Year: </span>
              <strong style="color:#111">${year}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">Adm No: </span>
              <strong style="color:#111">${student.admission_number || '—'}</strong>
            </td>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">${isCandidate ? 'Index No: ' : 'Stream: '}</span>
              <strong style="color:#111">${isCandidate ? (student.index_number || '——————————') : (student.stream_name || '—')}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:${bodySize};text-transform:uppercase;letter-spacing:0.4px">Gender: </span>
              <strong style="color:#111;text-transform:capitalize">${student.gender || '—'}</strong>
            </td>
            <td style="padding:2px 0;text-align:right">
              <span style="color:#9ca3af;font-size:${bodySize};font-style:italic">Printed: ${new Date().toLocaleDateString()}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- PAYMENTS TABLE -->
      <table style="width:100%;border-collapse:collapse;font-size:${bodySize};margin-bottom:8px">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">No.</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Date</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Payment For</th>
            <th style="padding:5px 6px;text-align:right;border:1px solid #ddd">Amount Paid</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Method</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Reference</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <!-- TOTALS -->
      <table style="width:100%;border-collapse:collapse;font-size:${bodySize};border-top:2px solid #222;margin-top:8px">
        ${summary ? `
        <tr>
          <td style="padding:5px 8px;color:#555;font-weight:500">Total Required</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#111">${fmt(summary.required)}</td>
        </tr>` : ''}
        <tr style="background:#f9f9f9">
          <td style="padding:5px 8px;color:#555;font-weight:500">Total Paid</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#059669">${fmt(totalPaid)}</td>
        </tr>
        ${summary && summary.balance > 0 ? `
        <tr style="border-top:1px solid #ddd">
          <td style="padding:6px 8px;font-weight:700;color:#dc2626">Balance Due</td>
          <td style="padding:6px 8px;text-align:right;font-weight:700;font-size:${compact ? '11px' : '14px'};color:#dc2626">${fmt(summary.balance)}</td>
        </tr>` : `
        <tr style="border-top:1px solid #ddd;background:#f0fdf4">
          <td colspan="2" style="padding:6px 8px;text-align:center;font-weight:700;font-size:${compact ? '11px' : '14px'};color:#059669;letter-spacing:0.5px">✓ FULLY PAID</td>
        </tr>`}
      </table>

      <!-- SIGNATURE & STAMP -->
      <div style="margin-top:${compact ? '8px' : '16px'};padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#555">
        <!-- Left: Received by -->
        <div style="flex:1">
          <div style="margin-bottom:4px;color:#888">Received by:</div>
          <div style="font-weight:700;font-size:11px;text-transform:uppercase;color:#111">${student.first_name} ${student.last_name}</div>
        </div>
        <!-- Center: Bursar signature -->
        <div style="flex:1;text-align:center">
          <div style="margin-bottom:2px;color:#888">${sig.label || 'Bursar'}'s Signature:</div>
          ${sig.mode === 'image' && sig.image
            ? `<img src="${sig.image}" style="height:${compact ? '28px' : '40px'};object-fit:contain;display:block;margin:0 auto"/>`
            : sig.mode === 'name' && sig.name
              ? `<span style="font-family:cursive;font-size:${compact ? '13px' : '16px'};color:#1e3a5f">${sig.name}</span>`
              : `<div style="border-bottom:1px solid #999;width:120px;margin:0 auto;height:28px"></div>`
          }
        </div>
        <!-- Right: Stamp + date -->
        <div style="flex:1;text-align:right">
          <div style="margin-bottom:2px;color:#888">Date: <strong style="color:#111">${new Date().toLocaleDateString()}</strong></div>
          ${sig.stamp
            ? `<img src="${sig.stamp}" style="height:${compact ? '48px' : '70px'};object-fit:contain;display:inline-block"/>`
            : `<div style="border:1px dashed #ccc;border-radius:50%;width:${compact ? '48px' : '70px'};height:${compact ? '48px' : '70px'};display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:9px">STAMP</div>`
          }
        </div>
        </div>
      </div>
    </div>`;
}

export default function FeeReceipt({ studentId: initStudentId, term: initTerm, academic_year: initYear, onClose }) {
  const [studentId, setStudentId] = useState(initStudentId || '');
  const [term, setTerm] = useState(initTerm || 'Term 1');
  const [year, setYear] = useState(initYear || String(new Date().getFullYear()));
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [school, setSchool] = useState({ name: '', address: '', phone: '', email: '', logo: '' });
  const [sig, setSig] = useState({ mode: '', image: '', name: '', stamp: '' });
  const [previewStamp, setPreviewStamp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [printMode, setPrintMode] = useState('single');

  // Load school info once
  useEffect(() => {
    const tenantUUID = JSON.parse(localStorage.getItem('activeTenant') || '{}')?.uuid;
    axios.get(SETTINGS_API, {
      params: { tenant_uuid: tenantUUID },
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).then(r => {
      const d = r.data;
      setSchool({
        name: d.businessName || '',
        address: [d.location, d.town, d.district].filter(Boolean).join(', '),
        phone: d.phone || '',
        email: d.email || '',
        logo: d.businessLogoUrl || localStorage.getItem('businessLogoUrl') || '',
      });
    }).catch(() => {
      setSchool(s => ({ ...s, name: localStorage.getItem('businessName') || '', logo: localStorage.getItem('businessLogoUrl') || '' }));
    });
    // Load sig & stamp from DB (localStorage fallback if offline)
    syncPendingReceiptSettings(); // push any pending offline saves
    loadReceiptSettings().then(data => {
      const rawStamp = data.stamp_raw || '';
      const opts = {
        offsetX:  Number(data.stamp_offset_x  || 0),
        offsetY:  Number(data.stamp_offset_y  || 0),
        rotate:   Number(data.stamp_rotate    || 0),
        circular: data.stamp_circular === true || data.stamp_circular === 'true',
      };
      const sigData = {
        mode:  data.sig_mode  || '',
        image: data.sig_image || '',
        name:  data.sig_name  || '',
        label: data.sig_label || 'Bursar',
        stamp: rawStamp,
      };
      setSig(sigData);
      if (rawStamp) {
        buildStampWithDate(rawStamp, opts)
          .then(setPreviewStamp)
          .catch(() => setPreviewStamp(rawStamp));
      }
    });
  }, []);

  // Auto-load when opened with a studentId (e.g. from Payment tab receipt button)
  useEffect(() => {
    if (initStudentId) {
      setStudentId(initStudentId);
      setTerm(initTerm || 'Term 1');
      setYear(initYear || String(new Date().getFullYear()));
      loadData(initStudentId, initTerm || 'Term 1', initYear || String(new Date().getFullYear()));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initStudentId, initTerm, initYear]);

  const searchStudents = async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetchWithAuth(`${STUDENTS_API}/?search=${encodeURIComponent(q)}&limit=8`);
      if (res?.ok) setSearchResults(normalize(await res.json()));
    } catch { /* ignore */ }
  };

  const loadData = async (sid, t, y) => {
    if (!sid) return;
    setLoading(true); setSearched(true); setError('');
    setStudent(null); setPayments([]); setSummary(null);
    try {
      const [pRes, sumRes] = await Promise.all([
        fetchWithAuth(`${API}/payments/?${new URLSearchParams({ student: sid, term: t, academic_year: y })}`),
        fetchWithAuth(`${API}/payments/summary/?${new URLSearchParams({ term: t, academic_year: y })}`),
      ]);

      if (pRes?.ok) setPayments(normalize(await pRes.json()));

      if (sumRes?.ok) {
        const sumData = await sumRes.json();
        const match = (sumData.students || []).find(s => String(s.student_id) === String(sid));
        if (!match) { setError('Student not found in fee records for this term/year.'); return; }
        setSummary(match);
        // Build student object from summary row — no separate /students/:id/ call needed
        setStudent({
          id: match.student_id,
          first_name: match.student_name?.split(' ')[0] || '',
          last_name: match.student_name?.split(' ').slice(1).join(' ') || '',
          admission_number: match.admission_number || '—',
          class_assigned: match.class_assigned || '—',
          stream_name: match.stream_name || '',
          gender: match.gender || '',
          index_number: match.index_number || '',
        });
      } else {
        setError('Could not load fee summary. Please try again.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!student) return;
    const compact = printMode === '6per';

    // Always composite stamp with today's fresh date at print time
    let freshSig = sig;
    if (sig.stamp) {
      try {
        const rawStamp = sig.stamp;
        const opts = {
          offsetX:  Number(localStorage.getItem('schoolStampOffsetX')  || 0),
          offsetY:  Number(localStorage.getItem('schoolStampOffsetY')  || 0),
          rotate:   Number(localStorage.getItem('schoolStampRotate')   || 0),
          circular: localStorage.getItem('schoolStampCircular') === 'true',
        };
        const freshStamp = await buildStampWithDate(rawStamp, opts);
        freshSig = { ...sig, stamp: freshStamp };
      } catch { /* use as-is */ }
    }

    const receiptHTML = buildReceiptHTML(student, payments, summary, term, year, school, freshSig, compact);

    let bodyHTML, bodyStyle;
    if (printMode === '6per') {
      bodyStyle = `body{margin:0;padding:8px;background:#fff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.receipt{overflow:hidden}@media print{body{padding:0}}`;
      bodyHTML = `<div class="grid">${Array(6).fill(receiptHTML).join('')}</div>`;
    } else {
      bodyStyle = `body{margin:0;padding:20px;background:#fff}.receipt{max-width:700px;margin:0 auto}@media print{body{padding:0}}`;
      bodyHTML = receiptHTML;
    }

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Fee Receipt</title><style>${bodyStyle}</style></head><body>${bodyHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  const content = (
    <div className="space-y-5">
      {/* Search — only when not pre-filled */}
      {!initStudentId && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Search Student</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
              placeholder="Type student name or admission number…"
              value={query}
              onChange={e => { setQuery(e.target.value); searchStudents(e.target.value); }}
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                {searchResults.map(s => (
                  <li key={s.id} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    onClick={() => { setStudentId(s.id); setQuery(`${s.first_name} ${s.last_name}`); setSearchResults([]); }}>
                    <span className="font-medium">{s.first_name} {s.last_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{s.admission_number} · {s.class_assigned}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3 flex-wrap items-end">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={term} onChange={e => setTerm(e.target.value)}>
              {['Term 1', 'Term 2', 'Term 3'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28" value={year} onChange={e => setYear(e.target.value)} placeholder="Year" />
            <button
              onClick={() => loadData(studentId, term, year)}
              disabled={!studentId || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load Receipt'}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-gray-400 py-8">Loading receipt…</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {searched && !loading && !error && student && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPrintMode('single')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${printMode === 'single' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <AlignJustify className="w-4 h-4" /> 1 per page
              </button>
              <button
                onClick={() => setPrintMode('6per')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${printMode === '6per' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4" /> 6 per page
              </button>
            </div>
            <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900">
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>

          <div
            className="border border-gray-200 rounded-xl bg-white overflow-hidden"
            dangerouslySetInnerHTML={{ __html: buildReceiptHTML(student, payments, summary, term, year, school, { ...sig, stamp: previewStamp }, false) }}
          />
        </>
      )}

      {searched && !loading && !error && !student && (
        <p className="text-center text-gray-400 py-8">Student not found. Please search again.</p>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
            <h2 className="font-semibold text-gray-800">Fee Receipt</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Fee Receipt</h1>
      </div>
      {content}
    </div>
  );
}
