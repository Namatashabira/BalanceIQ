import { useState, useEffect } from 'react';
import { Search, FileText, WifiOff, Printer, Hash } from 'lucide-react';
import { fetchWithAuth } from '../api';
import { buildStampWithDate } from '../utils/stampProcessor';
import { loadReceiptSettings } from '../services/receiptSettingsService';
import axios from 'axios';
import { printHTML } from '../utils/printHTML';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const FEES_API = `${BASE_URL}/fees`;
const SETTINGS_API = `${BASE_URL}/core/business-settings/`;

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const normalize = (d) => Array.isArray(d) ? d : (d?.results || []);

function buildReceiptHTML(student, payments, summary, term, year, school = {}, sig = {}, compact = false) {
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount_paid), 0);
  const receiptNo = payments[0]?.receipt_number
    || `RCP-${String(student.student_id || student.id || '0').padStart(4, '0')}-${term.replace(' ', '')}-${year}`;
  const isCandidate = ['S.4', 'S.6'].includes(student.class_assigned);
  const pad = compact ? '8px 10px' : '18px 24px';
  const bodySize = compact ? '9px' : '12px';
  const titleSize = compact ? '12px' : '16px';
  const logoHTML = school.logo
    ? `<img src="${school.logo}" alt="logo" style="height:${compact ? '32px' : '48px'};object-fit:contain;margin-bottom:4px"/>`
    : '';

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

  return `
    <div class="receipt" style="padding:${pad};border:1px solid #ccc;font-family:Arial,sans-serif;font-size:${bodySize};color:#111;background:#fff;box-sizing:border-box;">
      <div style="text-align:center;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:10px">
        ${logoHTML}
        <div style="font-size:${titleSize};font-weight:bold;text-transform:uppercase;letter-spacing:1px">${school.name || 'School Fee Receipt'}</div>
        ${school.address ? `<div style="font-size:10px;color:#555;margin-top:1px">${school.address}</div>` : ''}
        ${school.phone ? `<div style="font-size:10px;color:#555">Tel: ${school.phone}</div>` : ''}
        <div style="font-size:${compact ? '11px' : '13px'};font-weight:bold;margin-top:5px">OFFICIAL PAYMENT RECEIPT</div>
        <div style="font-size:10px;color:#999;margin-top:2px">Receipt No: ${receiptNo}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:6px 10px;margin-bottom:10px;font-size:${bodySize}">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:2px 0;width:50%">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase">Name: </span>
              <strong style="color:#111;text-transform:uppercase">${student.first_name || ''} ${student.last_name || ''}</strong>
            </td>
            <td style="padding:2px 0;width:50%">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase">Class: </span>
              <strong style="color:#111">${student.class_assigned}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase">Term: </span>
              <strong style="color:#111">${term}</strong>
            </td>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase">Year: </span>
              <strong style="color:#111">${year}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase">Adm No: </span>
              <strong style="color:#111">${student.admission_number || '—'}</strong>
            </td>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase">${isCandidate ? 'Index No: ' : 'Stream: '}</span>
              <strong style="color:#111">${isCandidate ? (student.index_number || '——————————') : (student.stream_name || '—')}</strong>
            </td>
          </tr>
        </table>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:${bodySize};margin-bottom:8px">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">No.</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Date</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Payment For</th>
            <th style="padding:5px 6px;text-align:right;border:1px solid #ddd">Amount</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Method</th>
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Reference</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:${bodySize};border-top:2px solid #222;margin-top:8px">
        ${summary ? `<tr><td style="padding:5px 8px;color:#555;font-weight:500">Total Required</td><td style="padding:5px 8px;text-align:right;font-weight:700;color:#111">${fmt(summary.required)}</td></tr>` : ''}
        <tr style="background:#f9f9f9"><td style="padding:5px 8px;color:#555;font-weight:500">Total Paid</td><td style="padding:5px 8px;text-align:right;font-weight:700;color:#059669">${fmt(totalPaid)}</td></tr>
        ${summary && summary.balance > 0
          ? `<tr style="border-top:1px solid #ddd"><td style="padding:6px 8px;font-weight:700;color:#dc2626">Balance Due</td><td style="padding:6px 8px;text-align:right;font-weight:700;font-size:14px;color:#dc2626">${fmt(summary.balance)}</td></tr>`
          : `<tr style="border-top:1px solid #ddd;background:#f0fdf4"><td colspan="2" style="padding:6px 8px;text-align:center;font-weight:700;font-size:14px;color:#059669">✓ FULLY PAID</td></tr>`}
      </table>
      <div style="margin-top:16px;padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#555">
        <div style="flex:1">
          <div style="margin-bottom:4px;color:#888">Received by:</div>
          <div style="font-weight:700;font-size:11px;text-transform:uppercase;color:#111">${student.first_name || ''} ${student.last_name || ''}</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="margin-bottom:2px;color:#888">${sig.label || 'Bursar'}'s Signature:</div>
          ${sig.mode === 'image' && sig.image
            ? `<img src="${sig.image}" style="height:40px;object-fit:contain;display:block;margin:0 auto"/>`
            : sig.mode === 'name' && sig.name
              ? `<span style="font-family:cursive;font-size:16px;color:#1e3a5f">${sig.name}</span>`
              : `<div style="border-bottom:1px solid #999;width:120px;margin:0 auto;height:28px"></div>`}
        </div>
        <div style="flex:1;text-align:right">
          <div style="margin-bottom:2px;color:#888">Date: <strong style="color:#111">${new Date().toLocaleDateString()}</strong></div>
          ${sig.stamp
            ? `<img src="${sig.stamp}" style="height:70px;object-fit:contain;display:inline-block"/>`
            : `<div style="border:1px dashed #ccc;border-radius:50%;width:70px;height:70px;display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:9px">STAMP</div>`}
        </div>
      </div>
    </div>`;
}

export default function SchoolReceiptLookup() {
  const [tab, setTab] = useState('student');  // 'student' | 'number'
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(null);   // { student, payments, summary }
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  // Receipt number lookup
  const [receiptInput, setReceiptInput] = useState('');
  const [receiptLookupLoading, setReceiptLookupLoading] = useState(false);
  const [receiptLookupError, setReceiptLookupError] = useState('');
  const [receiptResult, setReceiptResult] = useState(null);
  const [school, setSchool] = useState({});
  const [sig, setSig] = useState({ mode: '', image: '', name: '', label: 'Bursar', stamp: '' });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Load school + sig settings once
  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

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
        logo: d.businessLogoUrl || localStorage.getItem('businessLogoUrl') || '',
      });
    }).catch(() => {
      setSchool({ name: localStorage.getItem('businessName') || '', logo: localStorage.getItem('businessLogoUrl') || '' });
    });

    loadReceiptSettings().then(data => {
      const rawStamp = data.stamp_raw || '';
      const opts = {
        offsetX:  Number(data.stamp_offset_x || 0),
        offsetY:  Number(data.stamp_offset_y || 0),
        rotate:   Number(data.stamp_rotate   || 0),
        circular: data.stamp_circular === true || data.stamp_circular === 'true',
      };
      const sigData = { mode: data.sig_mode || '', image: data.sig_image || '', name: data.sig_name || '', label: data.sig_label || 'Bursar', stamp: rawStamp };
      if (rawStamp) {
        buildStampWithDate(rawStamp, opts).then(s => setSig({ ...sigData, stamp: s })).catch(() => setSig(sigData));
      } else {
        setSig(sigData);
      }
      setSchool(s => ({ ...s, logo: data.logo || s.logo }));
    });

    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const searchStudents = async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetchWithAuth(`${BASE_URL}/students/students/?search=${encodeURIComponent(q)}&limit=8`);
      if (res?.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : (data.results || []));
      }
    } catch { /* ignore */ }
    finally { setSearching(false); }
  };

  const loadReceipt = async (studentId) => {
    setLoading(true); setError(''); setSelected(null);
    try {
      const params = new URLSearchParams({ student: studentId, term, academic_year: year });
      const [pRes, sumRes] = await Promise.all([
        fetchWithAuth(`${FEES_API}/payments/?${params}`),
        fetchWithAuth(`${FEES_API}/payments/summary/?${new URLSearchParams({ term, academic_year: year })}`),
      ]);
      const payments = pRes?.ok ? normalize(await pRes.json()) : [];
      if (sumRes?.ok) {
        const sumData = await sumRes.json();
        const match = (sumData.students || []).find(s => String(s.student_id) === String(studentId));
        if (!match) { setError('No fee records found for this student in the selected term/year.'); return; }
        setSelected({
          student: {
            id: match.student_id,
            student_id: match.student_id,
            first_name: match.student_name?.split(' ')[0] || '',
            last_name: match.student_name?.split(' ').slice(1).join(' ') || '',
            admission_number: match.admission_number || '—',
            class_assigned: match.class_assigned || '—',
            stream_name: match.stream_name || '',
            index_number: match.index_number || '',
          },
          payments,
          summary: match,
        });
        setSearchResults([]);
        setQuery(match.student_name || '');
      } else {
        setError('Could not load fee summary.');
      }
    } catch { setError('Network error — please try again.'); }
    finally { setLoading(false); }
  };

  const lookupByReceiptNumber = async () => {
    const rn = receiptInput.trim().toUpperCase();
    if (!rn) { setReceiptLookupError('Enter a receipt number.'); return; }
    setReceiptLookupLoading(true); setReceiptLookupError(''); setReceiptResult(null);
    try {
      const res = await fetchWithAuth(`${FEES_API}/receipt/${encodeURIComponent(rn)}/`);
      if (res?.ok) {
        const data = await res.json();
        // Build selected-compatible shape for reuse of buildReceiptHTML
        setReceiptResult({
          student: data.student,
          payments: data.all_payments,
          summary: { required: null, balance: data.balance, paid: data.total_paid },
          highlightReceipt: data.receipt_number,
        });
      } else if (res?.status === 404) {
        setReceiptLookupError('Receipt not found. Check the number and try again.');
      } else {
        setReceiptLookupError('Lookup failed. Please try again.');
      }
    } catch { setReceiptLookupError('Network error — please try again.'); }
    finally { setReceiptLookupLoading(false); }
  };

  const handlePrint = async (overrideSelected) => {
    const src = overrideSelected || selected;
    if (!src) return;
    let freshSig = sig;
    if (sig.stamp) {
      try {
        const opts = {
          offsetX:  Number(localStorage.getItem('schoolStampOffsetX') || 0),
          offsetY:  Number(localStorage.getItem('schoolStampOffsetY') || 0),
          rotate:   Number(localStorage.getItem('schoolStampRotate')  || 0),
          circular: localStorage.getItem('schoolStampCircular') === 'true',
        };
        freshSig = { ...sig, stamp: await buildStampWithDate(sig.stamp, opts) };
      } catch { /* use as-is */ }
    }
    const html = buildReceiptHTML(src.student, src.payments, src.summary, term, year, school, freshSig, false);
    await printHTML(html, 'Fee Receipt');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">School Receipt Lookup</h1>
        {isOffline && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 px-2.5 py-1 rounded-full">
            <WifiOff className="w-3.5 h-3.5" /> Offline
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setTab('student'); setReceiptResult(null); setReceiptLookupError(''); }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'student' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <Search className="w-4 h-4" /> Search by Student
        </button>
        <button
          onClick={() => { setTab('number'); setSelected(null); setError(''); }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'number' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}>
          <Hash className="w-4 h-4" /> Lookup by Receipt No.
        </button>
      </div>

      {/* ── Tab: Search by student ── */}
      {tab === 'student' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1 truncate">Student Name / Adm No.</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type to search…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); searchStudents(e.target.value); }}
                />
              </div>
              {searchResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {searchResults.map(s => (
                    <li key={s.id}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      onClick={() => loadReceipt(s.id)}>
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{s.admission_number} · {s.class_assigned}</span>
                    </li>
                  ))}
                </ul>
              )}
              {searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
              <select className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                value={term} onChange={e => setTerm(e.target.value)}>
                {['Term 1', 'Term 2', 'Term 3'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
              <input className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2025" />
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          {loading && <p className="text-sm text-gray-400">Loading receipt…</p>}
        </div>
      )}

      {/* ── Tab: Lookup by receipt number ── */}
      {tab === 'number' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <label className="block text-xs font-medium text-gray-600">Receipt Number</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="e.g. RCP-20250115-A3F9B2C1-4E8D2F"
                value={receiptInput}
                onChange={e => setReceiptInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && lookupByReceiptNumber()}
              />
            </div>
            <button
              onClick={lookupByReceiptNumber}
              disabled={receiptLookupLoading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {receiptLookupLoading ? 'Looking up…' : 'Find Receipt'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Receipt numbers are printed on every payment receipt in the format <span className="font-mono">RCP-YYYYMMDD-XXXXXXXX-XXXXXX</span></p>
          {receiptLookupError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{receiptLookupError}</div>
          )}
        </div>
      )}

      {/* Receipt preview — student search result */}
      {tab === 'student' && selected && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Receipt for <span className="text-blue-700">{selected.student.first_name} {selected.student.last_name}</span> — {term}, {year}
            </p>
            <div className="flex gap-2">
              <button onClick={() => handlePrint(selected)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => { setSelected(null); setQuery(''); setError(''); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                Clear
              </button>
            </div>
          </div>
          <div
            className="border border-gray-200 rounded-xl bg-white overflow-hidden"
            dangerouslySetInnerHTML={{ __html: buildReceiptHTML(selected.student, selected.payments, selected.summary, term, year, school, sig, false) }}
          />
        </div>
      )}

      {/* Receipt preview — receipt number lookup result */}
      {tab === 'number' && receiptResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Receipt for <span className="text-blue-700">{receiptResult.student.first_name} {receiptResult.student.last_name}</span>
              </p>
              <p className="text-xs font-mono text-green-700 mt-0.5">✓ Valid receipt: {receiptResult.highlightReceipt}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePrint(receiptResult)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => { setReceiptResult(null); setReceiptInput(''); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                Clear
              </button>
            </div>
          </div>
          <div
            className="border border-gray-200 rounded-xl bg-white overflow-hidden"
            dangerouslySetInnerHTML={{ __html: buildReceiptHTML(
              receiptResult.student,
              receiptResult.payments,
              receiptResult.summary,
              receiptResult.payments[0]?.term || term,
              receiptResult.payments[0]?.academic_year || year,
              school, sig, false
            ) }}
          />
        </div>
      )}
    </div>
  );
}
