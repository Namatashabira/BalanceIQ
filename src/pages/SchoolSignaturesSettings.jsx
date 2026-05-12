import { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, User, RefreshCw, ChevronDown, Upload, PenLine, Type, X, Trash2 } from 'lucide-react';
import { fetchWithAuth } from '../api';

const API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core/staff-credentials/`;

const ROLES = [
  { key: 'headteacher', label: 'Headteacher',               color: 'bg-indigo-100 text-indigo-700 border-indigo-200',    defaultTitle: 'Headteacher' },
  { key: 'deputy',      label: 'Deputy Headteacher',        color: 'bg-amber-100 text-amber-700 border-amber-200',       defaultTitle: 'Deputy Headteacher' },
  { key: 'dos',         label: 'Director of Studies (DOS)', color: 'bg-violet-100 text-violet-700 border-violet-200',    defaultTitle: 'Director of Studies' },
  { key: 'teacher',     label: 'Class Teacher',             color: 'bg-blue-100 text-blue-700 border-blue-200',          defaultTitle: 'Class Teacher' },
  { key: 'bursar',      label: 'Bursar',                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', defaultTitle: 'Bursar' },
  { key: 'director',    label: 'Director',                  color: 'bg-rose-100 text-rose-700 border-rose-200',          defaultTitle: 'Director' },
];

const EMPTY = (roleKey, defaultTitle) => ({ role: roleKey, name: '', title: defaultTitle, signature: '' });
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

/**
 * Remove background from a signature image using adaptive thresholding.
 * 1. Convert to greyscale
 * 2. Sample corners to detect background brightness
 * 3. Make all pixels close to background transparent
 * 4. Boost remaining dark pixels to pure navy ink
 */
function removeBackground(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample corners + edges to estimate background brightness
      const samplePoints = [];
      const step = Math.max(1, Math.floor(Math.min(w, h) / 20));
      for (let x = 0; x < w; x += step) {
        for (const y of [0, 1, 2, h - 3, h - 2, h - 1]) {
          if (y >= 0 && y < h) samplePoints.push((y * w + x) * 4);
        }
      }
      for (let y = 0; y < h; y += step) {
        for (const x of [0, 1, 2, w - 3, w - 2, w - 1]) {
          if (x >= 0 && x < w) samplePoints.push((y * w + x) * 4);
        }
      }

      // Average brightness of sampled background pixels
      let bgSum = 0;
      for (const idx of samplePoints) {
        bgSum += 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
      }
      const bgBrightness = bgSum / samplePoints.length;

      // Threshold: anything within 40 brightness units of background → transparent
      const threshold = Math.max(bgBrightness - 40, 80);

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (brightness >= threshold) {
          // Background — make transparent
          d[i + 3] = 0;
        } else {
          // Ink pixel — map darkness to opacity, boost to navy
          const inkStrength = 1 - brightness / threshold; // 0..1
          const alpha = Math.min(255, Math.round(inkStrength * 255 * 1.4));
          d[i]     = Math.round(30  * inkStrength); // R → navy
          d[i + 1] = Math.round(58  * inkStrength); // G
          d[i + 2] = Math.round(138 * inkStrength); // B
          d[i + 3] = alpha;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
}

// ── Draw pad ──────────────────────────────────────────────────────────────────
function DrawPad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // Initialise canvas resolution to match its actual CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = getPos(e);
  };
  const move = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    last.current = pos;
  };
  const stop = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.getContext('2d').clearRect(0, 0, rect.width * dpr, rect.height * dpr);
  };

  const save = () => {
    const canvas = canvasRef.current;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    if (!data.some(v => v !== 0)) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-indigo-300 rounded-xl overflow-hidden bg-gray-50"
           style={{ height: 110 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair block"
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        />
        <span className="absolute top-2 left-3 text-[10px] text-gray-300 pointer-events-none select-none">
          Sign here using mouse or finger
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={clear}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
        <button type="button" onClick={save}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Save className="w-3 h-3" /> Use This Signature
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 ml-auto">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── Type signature ────────────────────────────────────────────────────────────
function TypeSignature({ defaultName, onSave, onCancel }) {
  const [text, setText] = useState(defaultName || '');
  const [font, setFont] = useState('Dancing Script');
  const canvasRef = useRef(null);

  const FONTS = [
    { label: 'Cursive Script', value: 'Dancing Script' },
    { label: 'Elegant',        value: 'Great Vibes' },
    { label: 'Bold Signature', value: 'Pacifico' },
    { label: 'Handwritten',    value: 'Caveat' },
  ];

  // Load Google Fonts once
  useEffect(() => {
    if (!document.getElementById('sig-fonts')) {
      const link = document.createElement('link');
      link.id = 'sig-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Caveat:wght@700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const save = () => {
    if (!text.trim()) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `48px '${font}', cursive`;
    ctx.fillStyle = '#1e3a8a';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    canvas.width = Math.max(w + 40, 200);
    canvas.height = 80;
    ctx.font = `48px '${font}', cursive`;
    ctx.fillStyle = '#1e3a8a';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 20, 40);
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Type name</label>
          <input className={inputCls} value={text} placeholder="e.g. Mr. John Mukasa"
            onChange={e => setText(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Font style</label>
          <select className={inputCls} value={font} onChange={e => setFont(e.target.value)}>
            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>
      {/* Live preview */}
      {text && (
        <div className="border border-gray-200 rounded-xl bg-gray-50 px-6 py-3 text-center overflow-hidden">
          <span style={{ fontFamily: `'${font}', cursive`, fontSize: 36, color: '#1e3a8a', lineHeight: 1.2 }}>
            {text}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={!text.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          <Save className="w-3 h-3" /> Use This Signature
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 ml-auto">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleCard({ roleKey, label, color, defaultTitle, credential, onChange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // null | 'draw' | 'type'
  const [processing, setProcessing] = useState(false);
  const c = credential || EMPTY(roleKey, defaultTitle);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const cleaned = await removeBackground(ev.target.result);
      onChange({ ...c, signature: cleaned });
      setProcessing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearSig = () => onChange({ ...c, signature: '' });

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${open ? 'border-indigo-300 shadow-md' : 'border-gray-100'}`}>
      {/* Header */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>{label}</span>
          {c.name && <span className="text-xs text-gray-500">{c.name}{c.title ? ` · ${c.title}` : ''}</span>}
          {c.signature && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Signature set
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          {/* Name + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input className={inputCls} placeholder="e.g. Mr. John Mukasa"
                value={c.name} onChange={e => onChange({ ...c, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title / Designation</label>
              <input className={inputCls} placeholder={defaultTitle}
                value={c.title} onChange={e => onChange({ ...c, title: e.target.value })} />
            </div>
          </div>

          {/* Signature section */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Signature</label>

            {/* Current signature preview */}
            {c.signature && mode === null && (
              <div className="mb-3 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3"
                   style={{ background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' }}>
                <img
                  src={c.signature}
                  alt="signature preview"
                  style={{
                    height: 48,
                    width: 'auto',
                    maxWidth: 220,
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges',
                    display: 'block',
                  }}
                />
                <button type="button" onClick={clearSig}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 flex-shrink-0">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            )}

            {/* Method picker */}
            {mode === null && (
              <div className="flex flex-wrap gap-2">
                <label className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 transition-colors ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
                  {processing
                    ? <><RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" /> Removing background…</>
                    : <><Upload className="w-3.5 h-3.5 text-indigo-500" /> Upload Image</>}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={processing} />
                </label>
                <button type="button" onClick={() => setMode('draw')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 transition-colors">
                  <PenLine className="w-3.5 h-3.5 text-indigo-500" /> Draw / Sign
                </button>
                <button type="button" onClick={() => setMode('type')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 transition-colors">
                  <Type className="w-3.5 h-3.5 text-indigo-500" /> Type Name
                </button>
              </div>
            )}

            {/* Draw mode */}
            {mode === 'draw' && (
              <DrawPad
                onSave={img => { onChange({ ...c, signature: img }); setMode(null); }}
                onCancel={() => setMode(null)}
              />
            )}

            {/* Type mode */}
            {mode === 'type' && (
              <TypeSignature
                defaultName={c.name}
                onSave={img => { onChange({ ...c, signature: img }); setMode(null); }}
                onCancel={() => setMode(null)}
              />
            )}
          </div>

          <p className="text-xs text-gray-400">
            Name, title and signature will appear automatically on all printed report cards.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SchoolSignaturesSettings() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    fetchWithAuth(API)
      .then(r => r.json())
      .then(d => {
        const existing = d.staff_credentials || [];
        setCredentials(ROLES.map(r => existing.find(c => c.role === r.key) || EMPTY(r.key, r.defaultTitle)));
      })
      .catch(() => setCredentials(ROLES.map(r => EMPTY(r.key, r.defaultTitle))))
      .finally(() => setLoading(false));
  }, []);

  const updateRole = (roleKey, data) =>
    setCredentials(prev => prev.map(c => c.role === roleKey ? data : c));

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetchWithAuth(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_credentials: credentials }),
      });
      if (!res.ok) { setError('Failed to save. Please try again.'); return; }
      localStorage.setItem('staffCredentials', JSON.stringify(credentials));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
      <RefreshCw className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading…</span>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <User className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Staff Signatures for Report Cards</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Set the name, title and signature for each role. Choose to <strong>upload</strong> a photo of a handwritten
            signature, <strong>draw</strong> using mouse or finger, or <strong>type</strong> a name in cursive font.
            These appear automatically on every printed report card.
          </p>
        </div>
      </div>

      {/* Role cards */}
      <div className="space-y-3">
        {ROLES.map(r => (
          <RoleCard
            key={r.key}
            roleKey={r.key}
            label={r.label}
            color={r.color}
            defaultTitle={r.defaultTitle}
            credential={credentials.find(c => c.role === r.key)}
            onChange={data => updateRole(r.key, data)}
          />
        ))}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {error && <p className="text-xs text-red-500 mr-auto">{error}</p>}
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>
    </div>
  );
}

export function getStaffCredentials() {
  try { return JSON.parse(localStorage.getItem('staffCredentials') || '[]'); } catch { return []; }
}
export function getCredentialByRole(role) {
  return getStaffCredentials().find(c => c.role === role) || null;
}
