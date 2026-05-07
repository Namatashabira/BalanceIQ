import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Pencil, Trash2, DollarSign, Users, BookOpen, CreditCard, Settings, Upload, PenLine, Type } from 'lucide-react';
import { buildStampWithDate } from '../utils/stampProcessor';
import { loadReceiptSettings, saveReceiptSettings } from '../services/receiptSettingsService';
import { fetchWithAuth } from '../api';
import PaymentTab from './fees/Payment';
import FeeReceipt from './fees/FeeReceipt';
import FeeInvoice from './fees/FeeInvoice';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/fees`;

const CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
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

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const currentYear = () => String(new Date().getFullYear());

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [filters, setFilters] = useState({ term: 'Term 1', academic_year: currentYear(), class_assigned: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetchWithAuth(`${API}/payments/summary/?${params}`);
      if (res?.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totals = data?.totals;

  return (
    <div className="space-y-5">
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

      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Required', value: fmt(totals.required), color: 'text-gray-800' },
            { label: 'Total Collected', value: fmt(totals.paid), color: 'text-emerald-600' },
            { label: 'Outstanding', value: fmt(totals.balance), color: 'text-red-600' },
            { label: 'Fully Paid', value: `${totals.count_paid} students`, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Student', 'Adm. No.', 'Class', 'Required', 'Paid', 'Balance', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : !data?.students?.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No data found.</td></tr>
            ) : data.students.map(s => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.student_name}</td>
                <td className="px-4 py-3 text-gray-500">{s.admission_number}</td>
                <td className="px-4 py-3 text-gray-500">{s.class_assigned}</td>
                <td className="px-4 py-3 text-gray-700">{fmt(s.required)}</td>
                <td className="px-4 py-3 text-emerald-600 font-medium">{fmt(s.paid)}</td>
                <td className="px-4 py-3 text-red-500 font-medium">{fmt(s.balance)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.payment_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Receipt Settings Tab ─────────────────────────────────────────────────────
function ReceiptSettingsTab() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [sigMode, setSigMode] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [sigName, setSigName] = useState(localStorage.getItem('bursarSigName') || '');
  const [sigLabel, setSigLabel] = useState(localStorage.getItem('bursarSigLabel') || 'Bursar');
  const [editingLabel, setEditingLabel] = useState(false);
  const [sigImage, setSigImage] = useState(localStorage.getItem('bursarSigImage') || '');
  const [stampImage, setStampImage] = useState(localStorage.getItem('schoolStamp') || '');
  const [stampProcessing, setStampProcessing] = useState(false);
  const [stampInfo, setStampInfo] = useState('');
  const [stampOffsetY, setStampOffsetY] = useState(Number(localStorage.getItem('schoolStampOffsetY') || 0));
  const [stampOffsetX, setStampOffsetX] = useState(Number(localStorage.getItem('schoolStampOffsetX') || 0));
  const [stampRotate, setStampRotate]   = useState(Number(localStorage.getItem('schoolStampRotate')  || 0));
  const [stampCircular, setStampCircular] = useState(localStorage.getItem('schoolStampCircular') === 'true');

  const stampOpts = { offsetX: stampOffsetX, offsetY: stampOffsetY, rotate: stampRotate, circular: stampCircular };

  const rebuildPreview = async (opts) => {
    const raw = localStorage.getItem('schoolStampRaw');
    if (!raw) return;
    const composed = await buildStampWithDate(raw, opts);
    setStampImage(composed);
  };
  const [saveState, setSaveState] = useState(null); // null | 'saving' | 'success'
  const [canvasDirty, setCanvasDirty] = useState(false);
  const [uploadDirty, setUploadDirty] = useState(false);
  const savedRef = useRef(null); // snapshot of last saved/loaded values
  const lastPos = useRef(null);

  // Load from DB (with localStorage fallback)
  useEffect(() => {
    loadReceiptSettings().then(data => {
      const mode     = data.sig_mode  || 'draw';
      const name     = data.sig_name  || '';
      const label    = data.sig_label || 'Bursar';
      const image    = data.sig_image || '';
      const offsetX  = Number(data.stamp_offset_x || 0);
      const offsetY  = Number(data.stamp_offset_y || 0);
      const rotate   = Number(data.stamp_rotate   || 0);
      const circular = data.stamp_circular === true || data.stamp_circular === 'true';
      setSigMode(mode); setSigName(name); setSigLabel(label); setSigImage(image);
      setStampOffsetX(offsetX); setStampOffsetY(offsetY);
      setStampRotate(rotate); setStampCircular(circular);
      savedRef.current = { sigMode: mode, sigName: name, sigLabel: label, sigImage: image, stampOffsetX: offsetX, stampOffsetY: offsetY, stampRotate: rotate, stampCircular: circular };
      if (data.stamp_raw) {
        const opts = { offsetX, offsetY, rotate, circular };
        buildStampWithDate(data.stamp_raw, opts).then(setStampImage).catch(() => setStampImage(data.stamp_raw));
      }
    });
  }, []);

  // Init canvas with saved drawing
  useEffect(() => {
    if (sigMode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (sigImage && sigMode === 'draw') {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = sigImage;
    }
  }, [sigMode]);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return {
      x: (src.clientX - r.left) * scaleX,
      y: (src.clientY - r.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    setDrawing(true);
    setCanvasDirty(true);
    lastPos.current = getPos(e, canvasRef.current);
  };
  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCanvasDirty(true);
  };

  const handleSigUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSigImage(ev.target.result); setUploadDirty(true); };
    reader.readAsDataURL(file);
  };

  const handleStampUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStampProcessing(true);
    setStampInfo('');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target.result;
      const composed = await buildStampWithDate(raw, stampOpts);
      setStampInfo('✓ Stamp uploaded. Use controls below to position the date.');
      setStampProcessing(false);
      setStampImage(composed);
      localStorage.setItem('schoolStampRaw', raw);
      setUploadDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const s = savedRef.current;
  const isDirty = !s
    || canvasDirty
    || uploadDirty
    || sigMode !== s.sigMode
    || sigName !== s.sigName
    || sigLabel !== s.sigLabel
    || sigImage !== s.sigImage
    || stampOffsetX !== s.stampOffsetX
    || stampOffsetY !== s.stampOffsetY
    || stampRotate !== s.stampRotate
    || stampCircular !== s.stampCircular;

  const compressImage = (dataUrl, maxWidth = 400, quality = 0.7) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const handleSave = async () => {
    let finalSigImage = sigImage;
    let finalSigMode  = sigMode;

    if (sigMode === 'draw' && canvasRef.current) {
      finalSigImage = canvasRef.current.toDataURL('image/jpeg', 0.8);
      finalSigMode  = 'image';
      setSigImage(finalSigImage);
    } else if (finalSigMode === 'image' && finalSigImage) {
      finalSigImage = await compressImage(finalSigImage);
    }

    const rawStamp = localStorage.getItem('schoolStampRaw') || '';
    const compressedStamp = rawStamp ? await compressImage(rawStamp, 600, 0.8) : '';
    if (compressedStamp) localStorage.setItem('schoolStampRaw', compressedStamp);

    const payload = {
      sig_mode:       finalSigMode,
      sig_image:      finalSigMode === 'image' ? finalSigImage : '',
      sig_name:       sigMode === 'type' ? sigName : '',
      sig_label:      sigLabel || 'Bursar',
      stamp_raw:      compressedStamp || rawStamp,
      stamp_offset_x: stampOffsetX,
      stamp_offset_y: stampOffsetY,
      stamp_rotate:   stampRotate,
      stamp_circular: stampCircular,
    };

    setSaveState('saving');
    await saveReceiptSettings(payload);
    savedRef.current = { sigMode: finalSigMode, sigName, sigLabel, sigImage: finalSigImage, stampOffsetX, stampOffsetY, stampRotate, stampCircular };
    setCanvasDirty(false);
    setUploadDirty(false);
    setSaveState('success');
    setTimeout(() => setSaveState(null), 2000);
  };

  return (
    <div className="relative space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><PenLine className="w-4 h-4 text-blue-600" /> Signature Settings</h3>

        <div className="flex items-center gap-2">
          {editingLabel ? (
            <input
              autoFocus
              className="border border-blue-400 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={sigLabel}
              onChange={e => setSigLabel(e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false); }}
              placeholder="e.g. Bursar, Headteacher"
            />
          ) : (
            <>
              <span className="text-sm font-semibold text-gray-800">{sigLabel || 'Bursar'}</span>
              <button onClick={() => setEditingLabel(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
            </>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[['draw','Draw',PenLine],['type','Type Name',Type],['upload','Upload',Upload]].map(([m, label, Icon]) => (
            <button key={m} onClick={() => setSigMode(m)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sigMode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {sigMode === 'draw' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Draw your signature below using mouse or touch</p>
            <canvas
              ref={canvasRef}
              width={400} height={100}
              className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
              style={{ touchAction: 'none' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
            <button onClick={clearCanvas} className="text-xs text-red-500 hover:text-red-700">Clear</button>
          </div>
        )}

        {sigMode === 'type' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Bursar's name will appear as the signature on receipts</p>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Mr. John Okello"
              value={sigName}
              onChange={e => setSigName(e.target.value)}
            />
            {sigName && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <span style={{ fontFamily: 'cursive', fontSize: '20px', color: '#1e3a5f' }}>{sigName}</span>
              </div>
            )}
          </div>
        )}

        {sigMode === 'upload' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Upload a photo/scan of the bursar's signature</p>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
              <Upload className="w-4 h-4" /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={handleSigUpload} />
            </label>
            {sigImage && <img src={sigImage} alt="signature" className="h-16 object-contain border rounded" />}
          </div>
        )}
      </div>

      {/* School Stamp */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Upload className="w-4 h-4 text-purple-600" /> School Stamp</h3>
        <p className="text-xs text-gray-400">Upload your school stamp <strong className="text-amber-600">without any date on it</strong>. The current date will always be printed in the center of the stamp automatically.</p>
        <label className={`inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600 ${stampProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4" /> Upload stamp image
          <input type="file" accept="image/*" className="hidden" onChange={handleStampUpload} disabled={stampProcessing} />
        </label>
        {stampInfo && (
          <p className="text-xs font-medium text-emerald-600">{stampInfo}</p>
        )}
        {stampImage && !stampProcessing && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden inline-block bg-gray-50 p-1">
              <img src={stampImage} alt="stamp preview" className="h-28 object-contain" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              {/* Up / Down */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Up / Down</label>
                <input type="range" min="-100" max="100" step="2" value={stampOffsetY}
                  onChange={async e => { const v=Number(e.target.value); setStampOffsetY(v); await rebuildPreview({...stampOpts, offsetY:v}); }}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>↑ Up</span><span>{stampOffsetY > 0 ? '+' : ''}{stampOffsetY}px</span><span>Down ↓</span>
                </div>
              </div>

              {/* Left / Right */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Left / Right</label>
                <input type="range" min="-100" max="100" step="2" value={stampOffsetX}
                  onChange={async e => { const v=Number(e.target.value); setStampOffsetX(v); await rebuildPreview({...stampOpts, offsetX:v}); }}
                  className="w-full accent-purple-600" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>← Left</span><span>{stampOffsetX > 0 ? '+' : ''}{stampOffsetX}px</span><span>Right →</span>
                </div>
              </div>

              {/* Rotate */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Rotate</label>
                <input type="range" min="-180" max="180" step="5" value={stampRotate}
                  onChange={async e => { const v=Number(e.target.value); setStampRotate(v); await rebuildPreview({...stampOpts, rotate:v}); }}
                  className="w-full accent-amber-500" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>↺ CCW</span><span>{stampRotate}°</span><span>CW ↻</span>
                </div>
              </div>

              {/* Circular clip */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Shape</label>
                <div className="flex gap-2 pt-1">
                  {[['false','Rectangle'],['true','Circular']].map(([val, label]) => (
                    <button key={val}
                      onClick={async () => { const v=val==='true'; setStampCircular(v); await rebuildPreview({...stampOpts, circular:v}); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        String(stampCircular)===val ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={async () => { setStampOffsetX(0); setStampOffsetY(0); setStampRotate(0); setStampCircular(false); await rebuildPreview({offsetX:0,offsetY:0,rotate:0,circular:false}); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Reset to default
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={!isDirty}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          Save Settings
        </button>
      </div>

      {/* Save modal overlay — covers only the receipt settings area */}
      {saveState && (
        <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center justify-center gap-5 min-h-[160px] min-w-[200px]">
            {saveState === 'saving' ? (
              <>
                <div style={{
                  width: 60, height: 60,
                  border: '6px solid rgba(0,0,0,0.1)',
                  borderTopColor: '#ff0000',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  animation: 'rainbow-spin 1s linear infinite',
                }} />
                <div style={{ display: 'flex', gap: 12, fontSize: 32, fontWeight: 'bold' }}>
                  {['0s','0.3s','0.6s'].map((delay, i) => (
                    <span key={i} style={{ opacity: 0.3, color: '#333', animation: `dot-fill 1.5s ease-in-out infinite`, animationDelay: delay }}>.</span>
                  ))}
                </div>
                <style>{`
                  @keyframes rainbow-spin {
                    0%   { transform: rotate(0deg);   border-top-color: #ff0000; }
                    16.67% { border-top-color: #ff7f00; }
                    33.33% { border-top-color: #ffff00; }
                    50%  { border-top-color: #00ff00; }
                    66.67% { border-top-color: #0000ff; }
                    83.33% { border-top-color: #4b0082; }
                    100% { transform: rotate(360deg); border-top-color: #ff0000; }
                  }
                  @keyframes dot-fill {
                    0%, 20% { opacity: 0.3; }
                    40%, 100% { opacity: 1; }
                  }
                `}</style>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-800 text-base font-semibold">Settings Saved!</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fee Structure Tab ─────────────────────────────────────────────────────────
function FeeStructureTab() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'form' | 'items'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [itemForm, setItemForm] = useState({ name: '', amount: '', is_optional: false });
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState('');

  const EMPTY = { class_assigned: 'S.1', term: 'Term 1', academic_year: currentYear(), amount: '', description: '' };
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/structures/`);
      if (res?.ok) setStructures(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setSelected(null); setModal('form'); };
  const openEdit = (s) => {
    setForm({ class_assigned: s.class_assigned, term: s.term, academic_year: s.academic_year, amount: s.amount, description: s.description || '' });
    setSelected(s); setError(''); setModal('form');
  };
  const openItems = (s) => { setSelected(s); setItemForm({ name: '', amount: '', is_optional: false }); setItemError(''); setModal('items'); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const method = selected ? 'PUT' : 'POST';
      const url = selected ? `${API}/structures/${selected.id}/` : `${API}/structures/`;
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res?.ok) { const d = await res.json(); setError(JSON.stringify(d)); return; }
      setModal(null); load();
    } catch (e) { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee structure?')) return;
    await fetchWithAuth(`${API}/structures/${id}/`, { method: 'DELETE' });
    load();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.amount) { setItemError('Name and amount are required.'); return; }
    setItemSaving(true); setItemError('');
    try {
      const res = await fetchWithAuth(`${API}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemForm, structure: selected.id }),
      });
      if (!res?.ok) { const d = await res.json(); setItemError(JSON.stringify(d)); return; }
      setItemForm({ name: '', amount: '', is_optional: false });
      load(); // reload to get updated items
      // refresh selected
      const updated = await fetchWithAuth(`${API}/structures/${selected.id}/`);
      if (updated?.ok) setSelected(await updated.json());
    } catch { setItemError('Network error.'); }
    finally { setItemSaving(false); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remove this item?')) return;
    await fetchWithAuth(`${API}/items/${itemId}/`, { method: 'DELETE' });
    load();
    const updated = await fetchWithAuth(`${API}/structures/${selected.id}/`);
    if (updated?.ok) setSelected(await updated.json());
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Structure
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Class', 'Term', 'Academic Year', 'Amount', 'Items', 'Description', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : !structures.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No fee structures defined yet.</td></tr>
            ) : structures.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-blue-700">{s.class_assigned}</td>
                <td className="px-4 py-3 text-gray-600">{s.term}</td>
                <td className="px-4 py-3 text-gray-600">{s.academic_year}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(s.amount)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openItems(s)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100">
                    <BookOpen className="w-3.5 h-3.5" />
                    {s.items?.length || 0} items
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{s.description || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Structure form modal */}
      {modal === 'form' && (
        <Modal title={selected ? 'Edit Fee Structure' : 'Add Fee Structure'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class">
                <select className={inputCls} value={form.class_assigned} onChange={e => setForm(f => ({ ...f, class_assigned: e.target.value }))}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Term">
                <select className={inputCls} value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                  {TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Academic Year">
                <input required className={inputCls} value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
              </Field>
              <Field label="School Fees Amount (UGX)">
                <input required type="number" min="0" className={inputCls} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </Field>
            </div>
            <Field label="Description (optional)">
              <input className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              {error && <p className="text-xs text-red-500 self-center mr-auto">{error}</p>}
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Items modal */}
      {modal === 'items' && selected && (
        <Modal title={`Payment Items — ${selected.class_assigned} ${selected.term} ${selected.academic_year}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Add items like Uniform, Books, Transport that students must pay separately. These appear as unpaid items on each student's payment row.</p>

            {/* Existing items */}
            {selected.items?.length > 0 ? (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {selected.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <span className="font-medium text-gray-800 text-sm">{it.name}</span>
                      {it.is_optional && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">optional</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-700">{fmt(it.amount)}</span>
                      <button onClick={() => handleDeleteItem(it.id)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">No items added yet.</p>
            )}

            {/* Add item form */}
            <form onSubmit={handleAddItem} className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Add New Item</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Item Name">
                  <input required className={inputCls} placeholder="e.g. Uniform, Books" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <Field label="Amount (UGX)">
                  <input required type="number" min="0" className={inputCls} value={itemForm.amount} onChange={e => setItemForm(f => ({ ...f, amount: e.target.value }))} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={itemForm.is_optional} onChange={e => setItemForm(f => ({ ...f, is_optional: e.target.checked }))} className="rounded" />
                Optional item (doesn't affect payment status)
              </label>
              <div className="flex justify-end gap-2">
                {itemError && <p className="text-xs text-red-500 self-center mr-auto">{itemError}</p>}
                <button type="submit" disabled={itemSaving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {itemSaving ? 'Adding…' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', icon: Users },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'structure', label: 'Fee Structure', icon: BookOpen },
  { key: 'receipt_settings', label: 'Receipt Settings', icon: Settings },
];

export default function FeesPage() {
  const [tab, setTab] = useState('overview');
  const [receiptCtx, setReceiptCtx] = useState(null);   // { studentId, term, academic_year }
  const [invoiceCtx, setInvoiceCtx] = useState(null);   // { term, academic_year, class_assigned }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>

      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'payments' && (
        <PaymentTab
          onOpenReceipt={(ctx) => setReceiptCtx(ctx)}
          onOpenInvoice={(ctx) => setInvoiceCtx(ctx)}
        />
      )}
      {tab === 'structure' && <FeeStructureTab />}
      {tab === 'receipt_settings' && <ReceiptSettingsTab />}

      {/* Receipt modal */}
      {receiptCtx && (
        <FeeReceipt
          studentId={receiptCtx.studentId}
          term={receiptCtx.term}
          academic_year={receiptCtx.academic_year}
          paymentId={receiptCtx.paymentId || null}
          onClose={() => setReceiptCtx(null)}
        />
      )}

      {/* Invoice modal */}
      {invoiceCtx && (
        <FeeInvoice
          term={invoiceCtx.term}
          academic_year={invoiceCtx.academic_year}
          class_assigned={invoiceCtx.class_assigned}
          studentId={invoiceCtx.studentId || null}
          onClose={() => setInvoiceCtx(null)}
        />
      )}
    </div>
  );
}
