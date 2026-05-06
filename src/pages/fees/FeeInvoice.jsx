import { useState, useEffect, useRef } from 'react';
import { X, Printer, ArrowLeft, FileText, Users, Filter, AlignJustify, LayoutGrid } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import axios from 'axios';
import { buildStampWithDate } from '../../utils/stampProcessor';
import { loadReceiptSettings } from '../../services/receiptSettingsService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/fees`;
const STUDENTS_API = `${BASE_URL}/students/students`;
const SETTINGS_API = `${BASE_URL}/core/business-settings/`;

const TERMS = ['Term 1', 'Term 2', 'Term 3'];
const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ── Build one student invoice HTML block ──────────────────────────────────────
function buildStudentInvoiceHTML(student, school, sig, term, year, compact = false) {
  const invoiceNo = `INV-${String(student.student_id).padStart(4, '0')}-${term.replace(' ', '')}-${year}`;
  const isCandidate = ['S.4', 'S.6'].includes(student.class_assigned);
  const pad = compact ? '8px 10px' : '18px 24px';
  const titleSize = compact ? '12px' : '16px';
  const bodySize = compact ? '9px' : '12px';

  const logoHTML = school.logo
    ? `<img src="${school.logo}" alt="logo" style="height:${compact ? '32px' : '48px'};object-fit:contain;margin-bottom:4px"/>`
    : '';

  const statusColor = { paid: '#059669', partial: '#d97706', not_paid: '#dc2626', no_structure: '#9ca3af' }[student.payment_status] || '#6b7280';
  const statusLabel = { paid: 'PAID', partial: 'PARTIAL', not_paid: 'NOT PAID', no_structure: 'NO STRUCTURE' }[student.payment_status] || (student.payment_status || '').toUpperCase();

  return `
    <div class="invoice" style="padding:${pad};border:1px solid #ccc;font-family:Arial,sans-serif;font-size:${bodySize};color:#111;background:#fff;box-sizing:border-box;">

      <!-- SCHOOL HEADER -->
      <div style="text-align:center;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:10px">
        ${logoHTML}
        <div style="font-size:${titleSize};font-weight:bold;text-transform:uppercase;letter-spacing:1px">${school.name || 'School Name'}</div>
        ${school.address ? `<div style="font-size:10px;color:#555;margin-top:1px">${school.address}</div>` : ''}
        ${school.phone ? `<div style="font-size:10px;color:#555">Tel: ${school.phone}</div>` : ''}
        ${school.email ? `<div style="font-size:10px;color:#555">${school.email}</div>` : ''}
        <div style="font-size:${compact ? '11px' : '13px'};font-weight:bold;margin-top:5px">SCHOOL FEES INVOICE</div>
        <div style="font-size:10px;color:#999;margin-top:2px">Invoice No: ${invoiceNo}</div>
      </div>

      <!-- STUDENT INFO — same layout as receipt -->
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:6px 10px;margin-bottom:10px;font-size:${bodySize}">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:2px 0;width:50%">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">Name: </span>
              <strong style="color:#111;text-transform:uppercase">${student.student_name}</strong>
            </td>
            <td style="padding:2px 0;width:50%">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">Class: </span>
              <strong style="color:#111">${student.class_assigned}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">Term: </span>
              <strong style="color:#111">${term}</strong>
            </td>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">Year: </span>
              <strong style="color:#111">${year}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">Adm No: </span>
              <strong style="color:#111">${student.admission_number || '—'}</strong>
            </td>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">${isCandidate ? 'Index No: ' : 'Stream: '}</span>
              <strong style="color:#111">${isCandidate ? (student.index_number || '——————————') : (student.stream_name || '—')}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:2px 0">
              <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:0.4px">Status: </span>
              <strong style="color:${statusColor}">${statusLabel}</strong>
            </td>
            <td style="padding:2px 0;text-align:right">
              <span style="color:#9ca3af;font-size:9px;font-style:italic">Issued: ${new Date().toLocaleDateString()}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- FEE BREAKDOWN -->
      <table style="width:100%;border-collapse:collapse;font-size:${bodySize};margin-bottom:8px">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:5px 6px;text-align:left;border:1px solid #ddd">Description</th>
            <th style="padding:5px 6px;text-align:right;border:1px solid #ddd">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:4px 6px;border:1px solid #ddd">School Fees — ${term}, ${year} (${student.class_assigned})</td>
            <td style="padding:4px 6px;text-align:right;border:1px solid #ddd">${fmt(student.required)}</td>
          </tr>
        </tbody>
      </table>

      <!-- TOTALS — same 2-col table as receipt -->
      <table style="width:100%;border-collapse:collapse;font-size:${bodySize};border-top:2px solid #222;margin-top:8px">
        <tr>
          <td style="padding:5px 8px;color:#555;font-weight:500">Total Required</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#111">${fmt(student.required)}</td>
        </tr>
        <tr style="background:#f9f9f9">
          <td style="padding:5px 8px;color:#555;font-weight:500">Amount Paid</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#059669">${fmt(student.paid)}</td>
        </tr>
        ${student.balance > 0
          ? `<tr style="border-top:1px solid #ddd">
              <td style="padding:6px 8px;font-weight:700;color:#dc2626">Balance Due</td>
              <td style="padding:6px 8px;text-align:right;font-weight:700;font-size:${compact ? '11px' : '14px'};color:#dc2626">${fmt(student.balance)}</td>
             </tr>`
          : `<tr style="border-top:1px solid #ddd;background:#f0fdf4">
              <td colspan="2" style="padding:6px 8px;text-align:center;font-weight:700;font-size:${compact ? '11px' : '14px'};color:#059669;letter-spacing:0.5px">✓ FULLY PAID</td>
             </tr>`
        }
      </table>

      <!-- SIGNATURE & STAMP — identical to receipt -->
      <div style="margin-top:${compact ? '8px' : '16px'};padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#555">
        <div style="flex:1">
          <div style="margin-bottom:4px;color:#888">Received by:</div>
          <div style="font-weight:700;font-size:11px;text-transform:uppercase;color:#111">${student.student_name}</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="margin-bottom:2px;color:#888">${sig.label || 'Bursar'}'s Signature:</div>
          ${sig.mode === 'image' && sig.image
            ? `<img src="${sig.image}" style="height:${compact ? '28px' : '40px'};object-fit:contain;display:block;margin:0 auto"/>`
            : sig.mode === 'name' && sig.name
              ? `<span style="font-family:cursive;font-size:${compact ? '13px' : '16px'};color:#1e3a5f">${sig.name}</span>`
              : `<div style="border-bottom:1px solid #999;width:120px;margin:0 auto;height:28px"></div>`
          }
        </div>
        <div style="flex:1;text-align:right">
          <div style="margin-bottom:2px;color:#888">Date: <strong style="color:#111">${new Date().toLocaleDateString()}</strong></div>
          ${sig.stamp
            ? `<img src="${sig.stamp}" style="height:${compact ? '48px' : '70px'};object-fit:contain;display:inline-block"/>`
            : `<div style="border:1px dashed #ccc;border-radius:50%;width:${compact ? '48px' : '70px'};height:${compact ? '48px' : '70px'};display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:9px">STAMP</div>`
          }
        </div>
      </div>
    </div>`;
}

export default function FeeInvoice({ term: initTerm, academic_year: initYear, class_assigned: initClass, onClose }) {
  const [filters, setFilters] = useState({
    term: initTerm || 'Term 1',
    academic_year: initYear || String(new Date().getFullYear()),
    class_assigned: initClass || '',
    stream: '',
    gender: '',
    scope: 'all',
    balance_op: 'below',
    balance_amount: '',
    min_balance: '',   // only include students with balance >= this
    min_fees: '',      // only include students with required fees >= this
  });
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [invoiceStudents, setInvoiceStudents] = useState([]);
  const [school, setSchool] = useState({ name: '', address: '', phone: '', email: '', logo: '' });
  const [sig, setSig] = useState({ mode: '', image: '', name: '', label: 'Bursar', stamp: '' });
  const [printMode, setPrintMode] = useState('1per'); // '1per' | '6per'
  const previewRef = useRef(null);

  // Load school info
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
    // Load sig & stamp
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
      if (rawStamp) {
        buildStampWithDate(rawStamp, opts)
          .then(s => setSig({ ...sigData, stamp: s }))
          .catch(() => setSig(sigData));
      } else {
        setSig(sigData);
      }
    });
  }, []);

  // Load streams
  useEffect(() => {
    fetchWithAuth(`${STUDENTS_API.replace('/students', '')}/streams/`)
      .then(r => r?.ok ? r.json() : [])
      .then(d => setStreams(Array.isArray(d) ? d : (d.results || [])))
      .catch(() => {});
  }, []);

  const generate = async () => {
    setLoading(true); setGenerated(false);
    try {
      const params = new URLSearchParams({
        term: filters.term,
        academic_year: filters.academic_year,
        ...(filters.class_assigned ? { class_assigned: filters.class_assigned } : {}),
      });
      const res = await fetchWithAuth(`${API}/payments/summary/?${params}`);
      if (!res?.ok) return;
      const data = await res.json();
      let students = data.students || [];

      if (filters.scope === 'gender' && filters.gender) {
        const sRes = await fetchWithAuth(`${STUDENTS_API}/?gender=${filters.gender}&limit=500`);
        if (sRes?.ok) {
          const sData = await sRes.json();
          const ids = new Set((Array.isArray(sData) ? sData : sData.results || []).map(s => s.id));
          students = students.filter(s => ids.has(s.student_id));
        }
      }
      if (filters.scope === 'stream' && filters.stream) {
        const sRes = await fetchWithAuth(`${STUDENTS_API}/?stream=${filters.stream}&limit=500`);
        if (sRes?.ok) {
          const sData = await sRes.json();
          const ids = new Set((Array.isArray(sData) ? sData : sData.results || []).map(s => s.id));
          students = students.filter(s => ids.has(s.student_id));
        }
      }
      if (filters.scope === 'balance' && filters.balance_amount) {
        const amt = Number(filters.balance_amount);
        students = students.filter(s =>
          filters.balance_op === 'below' ? s.balance < amt : s.balance > amt
        );
      }
      if (filters.scope === 'balance') students = students.filter(s => s.balance > 0);

      // Threshold filters — always applied regardless of scope
      if (filters.min_balance !== '') {
        const mb = Number(filters.min_balance);
        students = students.filter(s => Number(s.balance) >= mb);
      }
      if (filters.min_fees !== '') {
        const mf = Number(filters.min_fees);
        students = students.filter(s => Number(s.required) >= mf);
      }

      setInvoiceStudents(students);
      setGenerated(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handlePrint = async () => {
    if (!invoiceStudents.length) return;
    const compact = printMode === '6per';

    // Re-composite stamp with today's fresh date at print time
    let freshSig = sig;
    if (sig.stamp) {
      try {
        const opts = {
          offsetX:  Number(localStorage.getItem('schoolStampOffsetX')  || 0),
          offsetY:  Number(localStorage.getItem('schoolStampOffsetY')  || 0),
          rotate:   Number(localStorage.getItem('schoolStampRotate')   || 0),
          circular: localStorage.getItem('schoolStampCircular') === 'true',
        };
        const freshStamp = await buildStampWithDate(sig.stamp, opts);
        freshSig = { ...sig, stamp: freshStamp };
      } catch { /* use as-is */ }
    }

    let bodyHTML, bodyStyle;
    if (printMode === '6per') {
      bodyStyle = `
        body{margin:0;padding:6px;background:#fff}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .invoice{height:calc(50vh - 16px);overflow:hidden;page-break-inside:avoid}
        @media print{body{padding:0}.grid{page-break-after:always}}
      `;
      // Group into pages of 6
      const pages = [];
      for (let i = 0; i < invoiceStudents.length; i += 6) pages.push(invoiceStudents.slice(i, i + 6));
      bodyHTML = pages.map(page =>
        `<div class="grid">${page.map(s => buildStudentInvoiceHTML(s, school, freshSig, filters.term, filters.academic_year, true)).join('')}</div>`
      ).join('');
    } else {
      bodyStyle = `
        body{margin:0;padding:20px;background:#fff}
        .invoice{max-width:680px;margin:0 auto;page-break-after:always}
        .invoice:last-child{page-break-after:auto}
        @media print{body{padding:0}}
      `;
      bodyHTML = invoiceStudents.map(s => buildStudentInvoiceHTML(s, school, freshSig, filters.term, filters.academic_year, false)).join('');
    }

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Fee Invoices</title><style>${bodyStyle}</style></head><body>${bodyHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  const scopeLabel = {
    all: 'Whole School',
    class: `Class ${filters.class_assigned || 'All'}`,
    stream: `Stream ${filters.stream || 'All'}`,
    gender: `${filters.gender ? filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1) : 'All'} Students`,
    balance: `Students with balance ${filters.balance_op} ${fmt(filters.balance_amount || 0)}`,
  }[filters.scope];

  const content = (
    <div className="space-y-5">
      {/* Filter panel */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <Filter className="w-4 h-4" /> Invoice Filters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Term">
            <select className={inputCls} value={filters.term} onChange={e => setFilters(f => ({ ...f, term: e.target.value }))}>
              {TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Academic Year">
            <input className={inputCls} value={filters.academic_year} onChange={e => setFilters(f => ({ ...f, academic_year: e.target.value }))} />
          </Field>
          <Field label="Scope">
            <select className={inputCls} value={filters.scope} onChange={e => setFilters(f => ({ ...f, scope: e.target.value }))}>
              <option value="all">Whole School</option>
              <option value="class">By Class</option>
              <option value="stream">By Stream</option>
              <option value="gender">By Gender</option>
              <option value="balance">By Balance</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(filters.scope === 'class' || filters.scope === 'all') && (
            <Field label="Class">
              <select className={inputCls} value={filters.class_assigned} onChange={e => setFilters(f => ({ ...f, class_assigned: e.target.value }))}>
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          )}
          {filters.scope === 'stream' && (
            <Field label="Stream">
              <select className={inputCls} value={filters.stream} onChange={e => setFilters(f => ({ ...f, stream: e.target.value }))}>
                <option value="">All Streams</option>
                {streams.map(s => <option key={s.id} value={s.id}>{s.name} {s.class_label ? `(${s.class_label})` : ''}</option>)}
              </select>
            </Field>
          )}
          {filters.scope === 'gender' && (
            <Field label="Gender">
              <select className={inputCls} value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          )}
          {filters.scope === 'balance' && (
            <>
              <Field label="Balance Condition">
                <select className={inputCls} value={filters.balance_op} onChange={e => setFilters(f => ({ ...f, balance_op: e.target.value }))}>
                  <option value="below">Below Amount</option>
                  <option value="above">Above Amount</option>
                </select>
              </Field>
              <Field label="Amount (UGX)">
                <input type="number" min="0" className={inputCls} value={filters.balance_amount} onChange={e => setFilters(f => ({ ...f, balance_amount: e.target.value }))} placeholder="e.g. 100000" />
              </Field>
            </>
          )}
        </div>

        {/* Threshold row — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 border-t border-purple-100">
          <Field label="Min. Balance (UGX)">
            <input
              type="number" min="0" className={inputCls}
              value={filters.min_balance}
              onChange={e => setFilters(f => ({ ...f, min_balance: e.target.value }))}
              placeholder="e.g. 50,000 — leave blank for all"
            />
          </Field>
          <Field label="Min. Fees Required (UGX)">
            <input
              type="number" min="0" className={inputCls}
              value={filters.min_fees}
              onChange={e => setFilters(f => ({ ...f, min_fees: e.target.value }))}
              placeholder="e.g. 200,000 — leave blank for all"
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <button onClick={generate} disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60">
            <Users className="w-4 h-4" />
            {loading ? 'Generating…' : 'Generate Invoices'}
          </button>
        </div>
      </div>

      {generated && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{invoiceStudents.length}</span> invoices · {scopeLabel}
            </p>
            <div className="flex items-center gap-3">
              {/* Print mode toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPrintMode('1per')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${printMode === '1per' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
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
                <Printer className="w-4 h-4" /> Print All
              </button>
            </div>
          </div>

          {/* Preview — first 3 invoices */}
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Preview (first {Math.min(3, invoiceStudents.length)} of {invoiceStudents.length})</p>
            {invoiceStudents.slice(0, 3).map(s => (
              <div
                key={s.student_id}
                className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                dangerouslySetInnerHTML={{ __html: buildStudentInvoiceHTML(s, school, sig, filters.term, filters.academic_year, false) }}
              />
            ))}
            {invoiceStudents.length > 3 && (
              <p className="text-center text-sm text-gray-400 py-2">
                + {invoiceStudents.length - 3} more invoices — click "Print All" to print all {invoiceStudents.length}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-800">Generate Invoices</h2>
            </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Generate Invoices</h1>
      </div>
      {content}
    </div>
  );
}
