import { useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import axios from 'axios';
import { fetchWithAuth } from '../../api';
import { buildStampWithDate } from '../../utils/stampProcessor';
import { loadReceiptSettings } from '../../services/receiptSettingsService';
import { printHTML } from '../../utils/printHTML';

const BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school-accounting`;
const SETTINGS_API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/business-settings/`;
const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

function buildPayslipHTML(salary, school, sig, receiptNumber) {
  const receiptNo = receiptNumber || `SAL-${String(salary.id).padStart(4, '0')}-${(salary.month || '').replace(/-/g, '')}`;
  const monthLabel = salary.month
    ? new Date(salary.month + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : salary.month;

  const logoHTML = school.logo
    ? `<img src="${school.logo}" alt="logo" style="height:48px;object-fit:contain;margin-bottom:4px"/>`
    : '';

  const sigHTML = sig.mode === 'image' && sig.image
    ? `<img src="${sig.image}" style="height:40px;object-fit:contain;display:block;margin:0 auto"/>`
    : sig.mode === 'name' && sig.name
      ? `<span style="font-family:cursive;font-size:16px;color:#1e3a5f">${sig.name}</span>`
      : `<div style="border-bottom:1px solid #999;width:120px;margin:0 auto;height:28px"></div>`;

  const stampHTML = sig.stamp
    ? `<img src="${sig.stamp}" style="height:70px;object-fit:contain;display:inline-block"/>`
    : `<div style="border:1px dashed #ccc;border-radius:50%;width:70px;height:70px;display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:9px">STAMP</div>`;

  const statusColor = { paid: '#059669', partial: '#d97706', pending: '#6b7280', overdue: '#dc2626' }[salary.status] || '#6b7280';

  return `
    <div style="padding:24px;border:1px solid #ccc;font-family:Arial,sans-serif;font-size:12px;color:#111;background:#fff;max-width:700px;margin:0 auto;box-sizing:border-box">
      <!-- HEADER -->
      <div style="text-align:center;border-bottom:2px solid #222;padding-bottom:10px;margin-bottom:14px">
        ${logoHTML}
        <div style="font-size:16px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">${school.name || 'School'}</div>
        ${school.address ? `<div style="font-size:10px;color:#555;margin-top:1px">${school.address}</div>` : ''}
        ${school.phone ? `<div style="font-size:10px;color:#555">Tel: ${school.phone}</div>` : ''}
        <div style="font-size:14px;font-weight:bold;margin-top:6px;letter-spacing:0.5px">SALARY PAYMENT RECEIPT</div>
        <div style="font-size:10px;color:#999;margin-top:2px">Receipt No: ${receiptNo}</div>
      </div>

      <!-- EMPLOYEE INFO -->
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:8px 12px;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse;font-size:12px;color:#111">
          <tr>
            <td style="padding:3px 0;width:50%;font-weight:400"><span style="color:#6b7280">Employee:</span> ${salary.teacher_name}</td>
            <td style="padding:3px 0;width:50%;font-weight:400"><span style="color:#6b7280">Employee ID:</span> ${salary.employee_id || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Month:</span> ${monthLabel}</td>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Payment Date:</span> ${salary.payment_date || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Method:</span> ${(salary.payment_method || '').replace('_', ' ')}</td>
            <td style="padding:3px 0;font-weight:400"><span style="color:#6b7280">Reference:</span> ${salary.reference_number || '—'}</td>
          </tr>
        </table>
      </div>

      <!-- SALARY BREAKDOWN -->
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:4px">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:6px 8px;text-align:left;border:1px solid #ddd">Description</th>
            <th style="padding:6px 8px;text-align:right;border:1px solid #ddd">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:5px 8px;border:1px solid #eee">Basic Salary</td>
            <td style="padding:5px 8px;border:1px solid #eee;text-align:right;font-weight:600">${fmt(salary.basic_salary)}</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td style="padding:5px 8px;border:1px solid #eee;color:#059669">Allowances</td>
            <td style="padding:5px 8px;border:1px solid #eee;text-align:right;color:#059669;font-weight:600">+ ${fmt(salary.allowances)}</td>
          </tr>
          <tr>
            <td style="padding:5px 8px;border:1px solid #eee;color:#dc2626">Deductions (Tax / NSSF)</td>
            <td style="padding:5px 8px;border:1px solid #eee;text-align:right;color:#dc2626;font-weight:600">- ${fmt(salary.deductions)}</td>
          </tr>
          <tr style="background:#f0f0f0;font-weight:bold;border-top:2px solid #222">
            <td style="padding:6px 8px;border:1px solid #ddd">NET SALARY</td>
            <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;font-size:14px">${fmt(salary.net_salary)}</td>
          </tr>
        </tbody>
      </table>

      <!-- PAYMENT STATUS -->
      <table style="width:100%;border-collapse:collapse;font-size:12px;border-top:2px solid #222;margin-top:8px">
        <tr style="background:#f9f9f9">
          <td style="padding:5px 8px;color:#555;font-weight:500">Amount Paid</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#059669">${fmt(salary.amount_paid)}</td>
        </tr>
        <tr>
          <td style="padding:5px 8px;color:#555;font-weight:500">Balance Due</td>
          <td style="padding:5px 8px;text-align:right;font-weight:700;color:#dc2626">${fmt(salary.balance_due || 0)}</td>
        </tr>
        <tr style="border-top:1px solid #ddd">
          <td style="padding:6px 8px;font-weight:700">Status</td>
          <td style="padding:6px 8px;text-align:right;font-weight:700;color:${statusColor};text-transform:uppercase;letter-spacing:0.5px">${salary.status}</td>
        </tr>
      </table>

      <!-- SIGNATURE & STAMP -->
      <div style="margin-top:20px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#555">
        <div style="flex:1">
          <div style="margin-bottom:4px;color:#888">Received by (Employee):</div>
          <div style="border-bottom:1px solid #999;width:140px;height:28px"></div>
          <div style="margin-top:3px;font-weight:700;text-transform:uppercase">${salary.teacher_name}</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="margin-bottom:2px;color:#888">${sig.label || 'Bursar'}'s Signature:</div>
          ${sigHTML}
          <div style="margin-top:3px;font-size:10px;color:#888">${sig.label || 'Bursar'}</div>
        </div>
        <div style="flex:1;text-align:right">
          <div style="margin-bottom:2px;color:#888">Date: <strong style="color:#111">${new Date().toLocaleDateString()}</strong></div>
          ${stampHTML}
        </div>
      </div>

      <div style="margin-top:12px;text-align:center;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:6px">
        This is an official salary payment receipt. Please retain for your records.
        Printed: ${new Date().toLocaleString()}
      </div>
    </div>`;
}

export default function SalaryReceipt({ salary, onClose }) {
  const [school, setSchool] = useState({ name: '', address: '', phone: '', logo: '' });
  const [sig, setSig] = useState({ mode: '', image: '', name: '', label: 'Bursar', stamp: '' });
  const [previewStamp, setPreviewStamp] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Generate or fetch receipt from backend on mount
  useEffect(() => {
    const generate = async () => {
      setGenerating(true);
      try {
        const res = await fetchWithAuth(`${BASE}/teacher-salaries/${salary.id}/generate_receipt/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (res?.ok) setReceiptData(await res.json());
      } catch (e) {
        console.error('Receipt generation error:', e);
      } finally {
        setGenerating(false);
      }
    };
    generate();
  }, [salary.id]);

  useEffect(() => {
    const tenantUUID = JSON.parse(localStorage.getItem('activeTenant') || '{}')?.uuid;
    axios.get(SETTINGS_API, {
      params: { tenant_uuid: tenantUUID },
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).then(r => {
      const d = r.data;
      setSchool({
        name: d.businessName || localStorage.getItem('businessName') || '',
        address: [d.location, d.town, d.district].filter(Boolean).join(', '),
        phone: d.phone || '',
        logo: d.businessLogoUrl || localStorage.getItem('businessLogoUrl') || '',
      });
    }).catch(() => {
      setSchool(s => ({ ...s, name: localStorage.getItem('businessName') || '', logo: localStorage.getItem('businessLogoUrl') || '' }));
    });

    loadReceiptSettings().then(data => {
      const rawStamp = data.stamp_raw || '';
      const opts = {
        offsetX: Number(data.stamp_offset_x || 0),
        offsetY: Number(data.stamp_offset_y || 0),
        rotate: Number(data.stamp_rotate || 0),
        circular: data.stamp_circular === true || data.stamp_circular === 'true',
      };
      setSig({ mode: data.sig_mode || '', image: data.sig_image || '', name: data.sig_name || '', label: data.sig_label || 'Bursar', stamp: rawStamp });
      setSchool(s => ({ ...s, logo: data.logo || s.logo }));
      if (rawStamp) buildStampWithDate(rawStamp, opts).then(setPreviewStamp).catch(() => setPreviewStamp(rawStamp));
    });
  }, []);

  const handlePrint = async () => {
    let freshSig = sig;
    if (sig.stamp) {
      try {
        const opts = {
          offsetX: Number(localStorage.getItem('schoolStampOffsetX') || 0),
          offsetY: Number(localStorage.getItem('schoolStampOffsetY') || 0),
          rotate: Number(localStorage.getItem('schoolStampRotate') || 0),
          circular: localStorage.getItem('schoolStampCircular') === 'true',
        };
        freshSig = { ...sig, stamp: await buildStampWithDate(sig.stamp, opts) };
      } catch { /* use as-is */ }
    }
    const html = buildPayslipHTML(salary, school, freshSig, receiptData?.receipt_number);
    await printHTML(html, 'Salary Receipt');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-800">Salary Receipt — {salary.teacher_name}</h2>
            {receiptData?.receipt_number && (
              <p className="text-xs text-gray-400 mt-0.5">Receipt No: {receiptData.receipt_number}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>
        <div className="p-5">
          {generating ? (
            <div className="py-12 text-center text-gray-400 text-sm">Generating receipt…</div>
          ) : (
            <div
              className="border border-gray-200 rounded-xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: buildPayslipHTML(salary, school, { ...sig, stamp: previewStamp }, receiptData?.receipt_number) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
