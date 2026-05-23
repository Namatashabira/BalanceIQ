import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Building2, Phone, Mail, MapPin, BookOpen, Stamp, PenLine, Image, CheckCircle, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { fetchWithAuth } from '../api';
import { loadReceiptSettings, syncPendingReceiptSettings } from '../services/receiptSettingsService';
import { buildStampWithDate } from '../utils/stampProcessor';
import { readSchoolType, writeSchoolType } from '../hooks/useSchoolClasses';
import ReportSettingsSection from './ReportSettingsSection';

const BASE = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const SETTINGS_API = `${BASE}/core/business-settings/`;
const RECEIPT_SETTINGS_API = `${BASE}/fees/receipt-settings/`;
const SCHOOL_TYPE_API = `${BASE}/tenants/school-type/`;
const REPORT_SETTINGS_API = `${BASE}/core/report-settings/`;

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SavedBadge({ show }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <CheckCircle className="w-3.5 h-3.5" /> Saved
    </span>
  );
}

const readAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = e => res(e.target.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

export default function SchoolProfileSettings() {
  // ── School info ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    businessName: '', phone: '', email: '', location: '', town: '', district: '',
    poBox: '', motto: '', website: '', registration_number: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ── School type ──────────────────────────────────────────────────────────────────────────────
  const [schoolType, setSchoolType] = useState(readSchoolType);
  const [schoolTypeSaving, setSchoolTypeSaving] = useState(false);
  const [schoolTypeSaved, setSchoolTypeSaved] = useState(false);

  // ── Logo + Stamp + Signature (all saved together to ReceiptSettings) ─────────
  const [rs, setRs] = useState({
    logo: '', sig_mode: '', sig_image: '', sig_name: '', sig_label: 'Bursar', stamp_raw: '',
  });
  const [stampPreview, setStampPreview] = useState('');
  const [rsSaving, setRsSaving] = useState(false);
  const [rsSaved, setRsSaved] = useState(false);
  const [rsError, setRsError] = useState('');

  const logoRef    = useRef();
  const stampRef   = useRef();
  const sigImgRef  = useRef();

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    const tenantUUID = JSON.parse(localStorage.getItem('activeTenant') || '{}')?.uuid;
    axios.get(SETTINGS_API, {
      params: { tenant_uuid: tenantUUID },
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).then(r => {
      const d = r.data;
      setProfile({
        businessName: d.businessName || '',
        phone: d.phone || '',
        email: d.email || '',
        location: d.location || '',
        town: d.town || '',
        district: d.district || '',
        poBox: d.poBox || d.po_box || '',
        motto: d.motto || '',
        website: d.website || '',
        registration_number: d.registration_number || '',
      });
    }).catch(() => {});

    syncPendingReceiptSettings();
    loadReceiptSettings().then(data => {
      const rawStamp = data.stamp_raw || '';
      setRs({
        logo:      data.logo      || '',
        sig_mode:  data.sig_mode  || '',
        sig_image: data.sig_image || '',
        sig_name:  data.sig_name  || '',
        sig_label: data.sig_label || 'Bursar',
        stamp_raw: rawStamp,
      });
      if (rawStamp) {
        const opts = {
          offsetX: Number(data.stamp_offset_x || 0),
          offsetY: Number(data.stamp_offset_y || 0),
          rotate:  Number(data.stamp_rotate   || 0),
          circular: data.stamp_circular === true || data.stamp_circular === 'true',
        };
        buildStampWithDate(rawStamp, opts).then(setStampPreview).catch(() => setStampPreview(rawStamp));
      }
    });
  }, []);

  // Save school type
  const saveSchoolType = async (type) => {
    setSchoolTypeSaving(true);
    try {
      const res = await fetchWithAuth(SCHOOL_TYPE_API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_type: type }),
      });
      if (res?.ok) {
        writeSchoolType(type);
        setSchoolType(type);
        setSchoolTypeSaved(true);
        setTimeout(() => setSchoolTypeSaved(false), 3000);
      }
    } catch { /* ignore */ }
    finally { setSchoolTypeSaving(false); }
  };

  // ── Save school profile (text fields only) ───────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true); setProfileError(''); setProfileSaved(false);
    try {
      const tenantUUID = JSON.parse(localStorage.getItem('activeTenant') || '{}')?.uuid;
      const payload = { ...profile };
      if (tenantUUID) payload.tenant_uuid = tenantUUID;
      const res = await axios.post(SETTINGS_API, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (res?.data?.data) {
        setProfile({
          businessName: res.data.data.businessName || '',
          phone: res.data.data.phone || '',
          email: res.data.data.email || '',
          location: res.data.data.location || '',
          town: res.data.data.town || '',
          district: res.data.data.district || '',
          poBox: res.data.data.poBox || '',
          motto: res.data.data.motto || '',
          website: res.data.data.website || '',
          registration_number: res.data.data.registrationNumber || '',
        });
      }
      localStorage.setItem('businessName', profile.businessName);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err?.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Save logo + stamp + signature together ───────────────────────────────────
  const saveReceiptAssets = async (e) => {
    e.preventDefault();
    setRsSaving(true); setRsError(''); setRsSaved(false);
    try {
      const res = await fetchWithAuth(RECEIPT_SETTINGS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo:      rs.logo,
          sig_mode:  rs.sig_mode,
          sig_image: rs.sig_image,
          sig_name:  rs.sig_name,
          sig_label: rs.sig_label,
          stamp_raw: rs.stamp_raw,
        }),
      });
      if (!res?.ok) { setRsError('Failed to save. Please try again.'); return; }
      // Keep localStorage in sync
      localStorage.setItem('schoolLogo', rs.logo);
      localStorage.setItem('businessLogoUrl', rs.logo);
      if (rs.stamp_raw) {
        buildStampWithDate(rs.stamp_raw, {}).then(setStampPreview).catch(() => setStampPreview(rs.stamp_raw));
      }
      setRsSaved(true);
      setTimeout(() => setRsSaved(false), 3000);
    } catch { setRsError('Network error.'); }
    finally { setRsSaving(false); }
  };

  // ── File handlers ────────────────────────────────────────────────────────────
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRs(s => ({ ...s, logo: '' })); // clear while reading
    const dataUrl = await readAsDataURL(file);
    setRs(s => ({ ...s, logo: dataUrl }));
  };

  const handleStampChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataURL(file);
    setRs(s => ({ ...s, stamp_raw: dataUrl }));
    buildStampWithDate(dataUrl, {}).then(setStampPreview).catch(() => setStampPreview(dataUrl));
  };

  const handleSigImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataURL(file);
    setRs(s => ({ ...s, sig_image: dataUrl, sig_mode: 'image' }));
  };

  return (
    <div className="space-y-6">

      {/* ── School Identity & Contact ── */}
      <form onSubmit={saveProfile} className="space-y-5">
        <Section title="School Identity" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>School Name</label>
              <input className={inputCls} value={profile.businessName}
                onChange={e => setProfile(p => ({ ...p, businessName: e.target.value }))}
                placeholder="e.g. St. Mary's Secondary School" />
            </div>
            <div>
              <label className={labelCls}>P.O. Box</label>
              <input className={inputCls} value={profile.poBox}
                onChange={e => setProfile(p => ({ ...p, poBox: e.target.value }))}
                placeholder="e.g. P.O. Box 1234, Kampala" />
            </div>
            <div>
              <label className={labelCls}>Registration Number</label>
              <input className={inputCls} value={profile.registration_number}
                onChange={e => setProfile(p => ({ ...p, registration_number: e.target.value }))}
                placeholder="e.g. S.5678/2010" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>School Motto</label>
              <input className={inputCls} value={profile.motto}
                onChange={e => setProfile(p => ({ ...p, motto: e.target.value }))}
                placeholder="e.g. Knowledge is Power" />
            </div>
          </div>
        </Section>

        <Section title="Contact & Location" icon={MapPin}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</label>
              <input className={inputCls} value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+256 700 000000" />
            </div>
            <div>
              <label className={labelCls}><Mail className="w-3.5 h-3.5 inline mr-1" />Email</label>
              <input type="email" className={inputCls} value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="school@example.com" />
            </div>
            <div>
              <label className={labelCls}>Address / Street</label>
              <input className={inputCls} value={profile.location}
                onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Plot 12, Entebbe Road" />
            </div>
            <div>
              <label className={labelCls}>Town / City</label>
              <input className={inputCls} value={profile.town}
                onChange={e => setProfile(p => ({ ...p, town: e.target.value }))}
                placeholder="e.g. Kampala" />
            </div>
            <div>
              <label className={labelCls}>District</label>
              <input className={inputCls} value={profile.district}
                onChange={e => setProfile(p => ({ ...p, district: e.target.value }))}
                placeholder="e.g. Wakiso" />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} value={profile.website}
                onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                placeholder="https://school.ac.ug" />
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-3 justify-end">
          {profileError && <p className="text-xs text-red-500 mr-auto">{profileError}</p>}
          <SavedBadge show={profileSaved} />
          <button type="submit" disabled={profileSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            <Save className="w-4 h-4" /> {profileSaving ? 'Saving…' : 'Save School Info'}
          </button>
        </div>
      </form>

      {/* School Type Selector */}
      <Section title="School Type" icon={GraduationCap}>
        <p className="text-sm text-gray-500 mb-4">Select whether this is a Primary or Secondary school. This controls which classes appear throughout the system.</p>
        <div className="grid grid-cols-2 gap-3">
          {[['primary', 'Primary School', 'Baby Class \u2013 P.7'], ['secondary', 'Secondary School', 'S.1 \u2013 S.6']].map(([val, label, sub]) => (
            <button key={val} type="button" onClick={() => saveSchoolType(val)} disabled={schoolTypeSaving}
              className={`p-4 rounded-xl border-2 text-left transition-all disabled:opacity-60 ${schoolType === val ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 bg-white'}`}>
              <p className={`text-sm font-semibold ${schoolType === val ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              {schoolType === val && <span className="text-[10px] font-bold text-indigo-500 mt-1 block">&#10003; Currently active</span>}
            </button>
          ))}
        </div>
        {schoolTypeSaved && <p className="text-xs text-emerald-600 mt-2">&#10003; School type saved</p>}
      </Section>

      {/* ── Logo + Stamp + Signature (single form, single save) ── */}
      <form onSubmit={saveReceiptAssets} className="space-y-5">

        {/* Logo */}
        <Section title="School Logo" icon={Image}>
          <div className="flex items-start gap-5">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
              {rs.logo
                ? <img src={rs.logo} alt="logo" className="w-full h-full object-contain" />
                : <Image className="w-8 h-8 text-gray-300" />}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Appears on receipts, report cards, and invoices.</p>
              <button type="button" onClick={() => logoRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Upload className="w-4 h-4" /> Choose Logo
              </button>
              {rs.logo && (
                <button type="button" onClick={() => setRs(s => ({ ...s, logo: '' }))}
                  className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
              )}
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-xs text-gray-400">PNG, JPG, SVG — transparent background recommended.</p>
            </div>
          </div>
        </Section>

        {/* Stamp */}
        <Section title="Official Stamp" icon={Stamp}>
          <div className="flex items-start gap-5">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
              {stampPreview
                ? <img src={stampPreview} alt="stamp" className="w-full h-full object-contain" />
                : <Stamp className="w-8 h-8 text-gray-300" />}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Appears on all printed receipts and report cards. Today's date is auto-composited at print time.</p>
              <button type="button" onClick={() => stampRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                <Upload className="w-4 h-4" /> Upload Stamp
              </button>
              {rs.stamp_raw && (
                <button type="button" onClick={() => { setRs(s => ({ ...s, stamp_raw: '' })); setStampPreview(''); }}
                  className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
              )}
              <input ref={stampRef} type="file" accept="image/*" className="hidden" onChange={handleStampChange} />
              <p className="text-xs text-gray-400">PNG with transparent background works best.</p>
            </div>
          </div>
        </Section>

        {/* Signature */}
        <Section title="Authorised Signature" icon={PenLine}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Signature Label</label>
              <input className={inputCls} value={rs.sig_label}
                onChange={e => setRs(s => ({ ...s, sig_label: e.target.value }))}
                placeholder="e.g. Bursar, Headteacher, Director" />
              <p className="text-xs text-gray-400 mt-1">Appears above the signature line on receipts.</p>
            </div>
            <div>
              <label className={labelCls}>Signature Mode</label>
              <div className="flex gap-2">
                {[['', 'None'], ['name', 'Typed Name'], ['image', 'Image']].map(([val, lbl]) => (
                  <button key={val} type="button"
                    onClick={() => setRs(s => ({ ...s, sig_mode: val }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${rs.sig_mode === val ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            {rs.sig_mode === 'name' && (
              <div>
                <label className={labelCls}>Name (shown in cursive)</label>
                <input className={inputCls} value={rs.sig_name}
                  onChange={e => setRs(s => ({ ...s, sig_name: e.target.value }))}
                  placeholder="e.g. John Mukasa" />
                {rs.sig_name && (
                  <p className="mt-2 text-sm" style={{ fontFamily: 'cursive', color: '#1e3a5f' }}>Preview: {rs.sig_name}</p>
                )}
              </div>
            )}
            {rs.sig_mode === 'image' && (
              <div className="flex items-start gap-4">
                <div className="w-32 h-16 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {rs.sig_image
                    ? <img src={rs.sig_image} alt="signature" className="h-full object-contain" />
                    : <PenLine className="w-6 h-6 text-gray-300" />}
                </div>
                <div className="space-y-2">
                  <button type="button" onClick={() => sigImgRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                    <Upload className="w-4 h-4" /> Upload Signature
                  </button>
                  {rs.sig_image && (
                    <button type="button" onClick={() => setRs(s => ({ ...s, sig_image: '', sig_mode: '' }))}
                      className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
                  )}
                  <input ref={sigImgRef} type="file" accept="image/*" className="hidden" onChange={handleSigImageChange} />
                  <p className="text-xs text-gray-400">PNG with transparent background recommended.</p>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Live preview */}
        <Section title="Receipt Preview" icon={BookOpen}>
          <div className="border border-gray-200 rounded-lg p-4 bg-white text-xs font-sans max-w-sm mx-auto">
            <div className="text-center border-b border-gray-300 pb-3 mb-3">
              {rs.logo
                ? <img src={rs.logo} alt="logo" className="h-10 object-contain mx-auto mb-1" />
                : <div className="w-10 h-10 rounded bg-gray-100 mx-auto mb-1 flex items-center justify-center text-gray-300 text-[9px]">LOGO</div>}
              <div className="font-bold uppercase text-sm">{profile.businessName || 'School Name'}</div>
              {profile.poBox && <div className="text-gray-500">{profile.poBox}</div>}
              {profile.motto && <div className="text-gray-400 italic text-[10px]">"{profile.motto}"</div>}
              {profile.phone && <div className="text-gray-500">Tel: {profile.phone}</div>}
              <div className="font-bold mt-1 text-[11px]">OFFICIAL PAYMENT RECEIPT</div>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-gray-200">
              <div>
                <div className="text-gray-400 text-[10px]">Received by:</div>
                <div className="border-b border-gray-400 w-20 mt-3" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-[10px]">{rs.sig_label || 'Bursar'}'s Signature:</div>
                {rs.sig_mode === 'image' && rs.sig_image
                  ? <img src={rs.sig_image} alt="sig" className="h-8 object-contain mx-auto mt-1" />
                  : rs.sig_mode === 'name' && rs.sig_name
                    ? <span style={{ fontFamily: 'cursive', fontSize: 13, color: '#1e3a5f' }}>{rs.sig_name}</span>
                    : <div className="border-b border-gray-400 w-20 mt-3" />}
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-[10px]">Stamp:</div>
                {stampPreview
                  ? <img src={stampPreview} alt="stamp" className="h-12 object-contain mt-1" />
                  : <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-[8px] mt-1">STAMP</div>}
              </div>
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-3 justify-end">
          {rsError && <p className="text-xs text-red-500 mr-auto">{rsError}</p>}
          <SavedBadge show={rsSaved} />
          <button type="submit" disabled={rsSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            <Save className="w-4 h-4" /> {rsSaving ? 'Saving…' : 'Save Logo, Stamp & Signature'}
          </button>
        </div>
      </form>

      {/* Report Settings Section */}
      <ReportSettingsSection />
    </div>
  );
}
