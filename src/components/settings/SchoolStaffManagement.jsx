import { useState, useCallback, useEffect } from 'react';
import {
  Plus, Search, Filter, Trash2, Edit, Eye, Printer, X,
  Upload, ChevronDown, Users, Phone, Mail, MapPin, AlertCircle,
  RefreshCw, Save, CheckCircle, Camera, Zap, Loader2
} from 'lucide-react';
import { fetchWithAuth } from '../../api';

const API = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/staff/staff`;

const STAFF_ROLES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'class-teacher', label: 'Class Teacher' },
  { value: 'deputy-headteacher', label: 'Deputy Headteacher' },
  { value: 'headteacher', label: 'Headteacher' },
  { value: 'dos', label: 'Director of Studies' },
  { value: 'bursar', label: 'Bursar' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'nurse', label: 'School Nurse' },
  { value: 'matron', label: 'Matron' },
  { value: 'lab-tech', label: 'Lab Technician' },
  { value: 'sports-teacher', label: 'Sports Teacher' },
  { value: 'security', label: 'Security Officer' },
];

const ADDITIONAL_TITLES = [
  'Senior Woman Teacher',
  'Senior Man Teacher',
  'P7 Class Teacher',
  'Debate Patron',
  'ICT Coordinator',
  'Examination Officer',
  'Discipline Master',
  'Time Table Master',
];

const DEPARTMENTS = [
  'sciences',
  'arts',
  'languages',
  'ict',
  'administration',
];

const SUBJECTS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
  'French',
  'Luganda',
];

const CLASSES = [
  'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7',
  'S1', 'S2', 'S3', 'S4', 'S5', 'S6',
];

const ACCOUNT_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'librarian', label: 'Librarian' },
];

const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'left', label: 'Left School', color: 'bg-red-100 text-red-700' },
];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide';

// ─── Staff Row Component ─────────────────────────────────────────────────────
function StaffRow({ staff, onEdit, onDelete, onView, onPrint, onSync }) {
  const statusObj = STATUS_OPTIONS.find(s => s.value === staff.status) || STATUS_OPTIONS[0];
  
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
            {staff.photo_url ? (
              <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 font-bold text-xs">
                {staff.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-medium text-gray-800 text-sm">{staff.full_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{staff.main_role || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{staff.department || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{staff.phone_number || '—'}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusObj.color}`}>
            {statusObj.label}
          </span>
          {staff.is_synced ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Synced</span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">Pending</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end flex-wrap">
          <button onClick={() => onView(staff)} title="View" className="p-1 rounded hover:bg-blue-50 text-blue-600">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(staff)} title="Edit" className="p-1 rounded hover:bg-amber-50 text-amber-600">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onPrint(staff)} title="Print" className="p-1 rounded hover:bg-green-50 text-green-600">
            <Printer className="w-4 h-4" />
          </button>
          {!staff.is_synced && (
            <button onClick={() => onSync(staff.id)} title="Sync Account" className="p-1 rounded hover:bg-purple-50 text-purple-600">
              <Zap className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onDelete(staff.id)} title="Delete" className="p-1 rounded hover:bg-red-50 text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Add/Edit Form Component ─────────────────────────────────────────────────
function StaffForm({ staff, onSave, onClose }) {
  const getInitialForm = () => {
    if (staff) {
      return {
        full_name: staff.full_name || '',
        gender: staff.gender || 'M',
        date_of_birth: staff.date_of_birth || '',
        national_id: staff.national_id || '',
        staff_id: staff.staff_id || '',
        passport_photo: staff.passport_photo || null,
        phone_number: staff.phone_number || '',
        email: staff.email || '',
        physical_address: staff.physical_address || '',
        emergency_contact: staff.emergency_contact || '',
        emergency_phone: staff.emergency_phone || '',
        main_role: staff.main_role || '',
        additional_titles: staff.additional_titles || [],
        department: staff.department || '',
        subjects_taught: staff.subjects_taught || [],
        classes_assigned: staff.classes_assigned || [],
        account_role: staff.account_role || 'teacher',
        username: staff.username || '',
        is_account_active: staff.is_account_active !== false,
        signature: staff.signature || null,
        display_name_on_reports: staff.display_name_on_reports || '',
        report_title: staff.report_title || '',
        date_joined: staff.date_joined || new Date().toISOString().split('T')[0],
        employment_type: staff.employment_type || 'full-time',
        salary: staff.salary || '',
        status: staff.status || 'active',
        staff_priority_ranking: staff.staff_priority_ranking || 50,
        can_sign_report_cards: staff.can_sign_report_cards || false,
        can_sign_attendance_reports: staff.can_sign_attendance_reports || false,
        can_sign_recommendation_letters: staff.can_sign_recommendation_letters || false,
      };
    }
    return {
      full_name: '',
      gender: 'M',
      date_of_birth: '',
      national_id: '',
      staff_id: '',
      passport_photo: null,
      phone_number: '',
      email: '',
      physical_address: '',
      emergency_contact: '',
      emergency_phone: '',
      main_role: '',
      additional_titles: [],
      department: '',
      subjects_taught: [],
      classes_assigned: [],
      account_role: 'teacher',
      username: '',
      is_account_active: true,
      signature: null,
      display_name_on_reports: '',
      report_title: '',
      date_joined: new Date().toISOString().split('T')[0],
      employment_type: 'full-time',
      salary: '',
      status: 'active',
      staff_priority_ranking: 50,
      can_sign_report_cards: false,
      can_sign_attendance_reports: false,
      can_sign_recommendation_letters: false,
    };
  };

  const [form, setForm] = useState(getInitialForm());

  const [section, setSection] = useState('basic');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(staff?.profile_photo ? (staff.profile_photo.startsWith('http') ? staff.profile_photo : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${staff.profile_photo}`) : null);
  const [signaturePreview, setSignaturePreview] = useState(staff?.profile_signature ? (staff.profile_signature.startsWith('http') ? staff.profile_signature : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${staff.profile_signature}`) : null);

  useEffect(() => {
    if (saveStatus === 'saving') {
      setShowSaveModal(true);
    } else if (saveStatus === 'saved') {
      const timer = setTimeout(() => setShowSaveModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleInputChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({ ...f, profile_photo: file }));
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({ ...f, profile_signature: file }));
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('saving');
    setError('');
    try {
      const fullNameTrimmed = form.full_name?.trim() || '';

      if (!fullNameTrimmed) {
        setError('Full name is required');
        setSaving(false);
        return;
      }

      const endpoint = staff?.id ? `${API}/${staff.id}/` : `${API}/`;
      const method = staff?.id ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('full_name', fullNameTrimmed);
      formData.append('gender', form.gender || 'M');
      formData.append('date_of_birth', form.date_of_birth || '');
      formData.append('national_id', form.national_id || '');
      formData.append('staff_id', form.staff_id || '');
      formData.append('phone_number', form.phone_number || '');
      formData.append('email', form.email || '');
      formData.append('physical_address', form.physical_address || '');
      formData.append('emergency_contact', form.emergency_contact || '');
      formData.append('emergency_phone', form.emergency_phone || '');
      formData.append('main_role', form.main_role || '');
      formData.append('additional_titles', JSON.stringify(form.additional_titles || []));
      formData.append('department', form.department || '');
      formData.append('subjects_taught', JSON.stringify(form.subjects_taught || []));
      formData.append('classes_assigned', JSON.stringify(form.classes_assigned || []));
      formData.append('account_role', form.account_role || 'teacher');
      formData.append('username', form.username || (form.email ? form.email.split('@')[0] : ''));
      formData.append('is_account_active', form.is_account_active !== false);
      formData.append('display_name_on_reports', form.display_name_on_reports || '');
      formData.append('report_title', form.report_title || '');
      formData.append('staff_priority_ranking', form.staff_priority_ranking || 50);
      formData.append('date_joined', form.date_joined || new Date().toISOString().split('T')[0]);
      formData.append('employment_type', form.employment_type || 'full-time');
      formData.append('salary', form.salary ? parseFloat(form.salary) : '');
      formData.append('status', form.status || 'active');
      formData.append('can_sign_report_cards', form.can_sign_report_cards || false);
      formData.append('can_sign_attendance_reports', form.can_sign_attendance_reports || false);
      formData.append('can_sign_recommendation_letters', form.can_sign_recommendation_letters || false);
      
      if (form.profile_photo instanceof File) {
        formData.append('profile_photo', form.profile_photo);
      }
      
      if (form.profile_signature instanceof File) {
        formData.append('profile_signature', form.profile_signature);
      }
      
      const res = await fetchWithAuth(endpoint, {
        method,
        body: formData,
      });

      if (!res?.ok) {
        const data = await res.json();
        const errorMsg = data.detail || data.error || JSON.stringify(data);
        setError('Failed to save staff: ' + errorMsg);
        setSaveStatus('');
        setSaving(false);
        console.error('API Error:', data);
        return;
      }

      const savedData = await res.json();
      setSaveStatus('saved');
      
      setTimeout(() => {
        setSaving(false);
        setSaveStatus('');
        onSave(savedData?.id);
      }, 3000);
    } catch (err) {
      setError('Network error: ' + err.message);
      setSaveStatus('');
      console.error('Save error:', err);
      setSaving(false);
    }
  };

  return (
    <>
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            {saveStatus === 'saving' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Saving Staff Member</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we save the information…</p>
                </div>
              </div>
            ) : saveStatus === 'saved' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Staff Member Saved</p>
                  <p className="text-sm text-gray-500 mt-1">Successfully saved to the system</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">{staff ? 'Edit Staff' : 'Add New Staff Member'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Section tabs */}
          <div className="flex gap-2 border-b flex-wrap">
            {[
              { key: 'basic', label: 'Basic Info' },
              { key: 'contact', label: 'Contact' },
              { key: 'professional', label: 'Professional' },
              { key: 'permission', label: 'Account' },
              { key: 'signature', label: 'Signature' },
              { key: 'employment', label: 'Employment' },
            ].map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => { setSection(s.key); setCurrentStep(s.step); }}
                className={`pb-2 px-3 text-sm font-medium border-b-2 transition-all ${
                  section === s.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* ──── BASIC INFO SECTION ──── */}
          {(section === 'basic' || currentStep === 1) && (
            <div className="space-y-4">
              <div className="flex gap-6">
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-lg bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-indigo-200">
                    {photoPreview ? (
                      <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-indigo-300" />
                    )}
                  </div>
                  <label className="text-xs font-medium text-indigo-600 cursor-pointer hover:underline">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                {/* Basic fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.full_name}
                        onChange={e => handleInputChange('full_name', e.target.value)}
                        placeholder="e.g. Mr. John Ssemata"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select className={inputCls} value={form.gender} onChange={e => handleInputChange('gender', e.target.value)}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" className={inputCls} value={form.date_of_birth} onChange={e => handleInputChange('date_of_birth', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Staff ID / Employee #</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.staff_id}
                        onChange={e => handleInputChange('staff_id', e.target.value)}
                        placeholder="e.g. ST-001"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>National ID (Optional)</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={form.national_id}
                      onChange={e => handleInputChange('national_id', e.target.value)}
                      placeholder="National ID number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──── CONTACT SECTION ──── */}
          {(section === 'contact' || currentStep === 2) && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Phone Number</label>
                <input
                  type="tel"
                  className={inputCls}
                  value={form.phone_number}
                  onChange={e => handleInputChange('phone_number', e.target.value)}
                  placeholder="+256 7XX XXX XXXX"
                />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="staff@school.com"
                />
              </div>
              <div>
                <label className={labelCls}>Physical Address</label>
                <textarea
                  rows="2"
                  className={inputCls}
                  value={form.physical_address}
                  onChange={e => handleInputChange('physical_address', e.target.value)}
                  placeholder="Street, area, city"
                />
              </div>
              <div>
                <label className={labelCls}>Emergency Contact Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.emergency_contact}
                  onChange={e => handleInputChange('emergency_contact', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className={labelCls}>Emergency Contact Phone</label>
                <input
                  type="tel"
                  className={inputCls}
                  value={form.emergency_phone}
                  onChange={e => handleInputChange('emergency_phone', e.target.value)}
                  placeholder="+256 7XX XXX XXXX"
                />
              </div>
            </div>
          )}

          {/* ──── PROFESSIONAL SECTION ──── */}
          {(section === 'professional' || currentStep === 3) && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Main Role / Position</label>
                <select
                  className={inputCls}
                  value={form.main_role}
                  onChange={e => handleInputChange('main_role', e.target.value)}
                >
                  <option value="">Select a role</option>
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Additional Titles / Responsibilities</label>
                <div className="space-y-2">
                  {ADDITIONAL_TITLES.map(title => (
                    <label key={title} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.additional_titles?.includes(title)}
                        onChange={e => {
                          const titles = e.target.checked
                            ? [...(form.additional_titles || []), title]
                            : (form.additional_titles || []).filter(t => t !== title);
                          handleInputChange('additional_titles', titles);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Department</label>
                <select className={inputCls} value={form.department} onChange={e => handleInputChange('department', e.target.value)}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Subjects Taught</label>
                <div className="space-y-2">
                  {SUBJECTS.map(subject => (
                    <label key={subject} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.subjects_taught?.includes(subject)}
                        onChange={e => {
                          const subjects = e.target.checked
                            ? [...(form.subjects_taught || []), subject]
                            : (form.subjects_taught || []).filter(s => s !== subject);
                          handleInputChange('subjects_taught', subjects);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Classes Assigned</label>
                <div className="grid grid-cols-4 gap-2">
                  {CLASSES.map(cls => (
                    <label key={cls} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.classes_assigned?.includes(cls)}
                        onChange={e => {
                          const classes = e.target.checked
                            ? [...(form.classes_assigned || []), cls]
                            : (form.classes_assigned || []).filter(c => c !== cls);
                          handleInputChange('classes_assigned', classes);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{cls}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──── PERMISSION SECTION ──── */}
          {(section === 'permission' || currentStep === 4) && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">Account settings determine system access and login credentials</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Account Role</label>
                <select className={inputCls} value={form.account_role} onChange={e => handleInputChange('account_role', e.target.value)}>
                  {ACCOUNT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Username</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.username}
                  onChange={e => handleInputChange('username', e.target.value)}
                  placeholder="username"
                />
              </div>

              {!staff && (
                <div>
                  <label className={labelCls}>Password</label>
                  <input
                    type="password"
                    className={inputCls}
                    value={form.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    placeholder="Set initial password"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_account_active}
                  onChange={e => handleInputChange('is_account_active', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Account Active</span>
              </label>
            </div>
          )}

          {/* ──── SIGNATURE SECTION ──── */}
          {(section === 'signature' || currentStep === 5) && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">IMPORTANT: Used for auto-generating report cards, result slips, and other documents</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Upload Signature (Cloudinary)</label>
                <div className="w-40 h-20 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="signature" className="w-full h-full object-contain" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <label className="mt-2 text-xs font-medium text-indigo-600 cursor-pointer hover:underline block">
                  Upload Signature
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className={labelCls}>Upload Profile Photo (Cloudinary)</label>
                <div className="w-40 h-40 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <label className="mt-2 text-xs font-medium text-indigo-600 cursor-pointer hover:underline block">
                  Upload Profile Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className={labelCls}>Display Name on Reports</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.display_name_on_reports}
                  onChange={e => handleInputChange('display_name_on_reports', e.target.value)}
                  placeholder="e.g. Mr. John Ssemata"
                />
              </div>

              <div>
                <label className={labelCls}>Title to Appear on Reports</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.report_title}
                  onChange={e => handleInputChange('report_title', e.target.value)}
                  placeholder="e.g. Headteacher"
                />
              </div>

              <div>
                <label className={labelCls}>Staff Priority Ranking (for report order)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={inputCls}
                  value={form.staff_priority_ranking}
                  onChange={e => handleInputChange('staff_priority_ranking', parseInt(e.target.value))}
                  placeholder="1 = First on reports, 100 = Last"
                />
              </div>

              <div className="border-t pt-4">
                <label className={labelCls}>Report Signing Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.can_sign_report_cards}
                      onChange={e => handleInputChange('can_sign_report_cards', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Can Sign Report Cards</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.can_sign_attendance_reports}
                      onChange={e => handleInputChange('can_sign_attendance_reports', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Can Sign Attendance Reports</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.can_sign_recommendation_letters}
                      onChange={e => handleInputChange('can_sign_recommendation_letters', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Can Sign Recommendation Letters</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ──── EMPLOYMENT SECTION ──── */}
          {(section === 'employment' || currentStep === 6) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date Joined</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.date_joined}
                    onChange={e => handleInputChange('date_joined', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelCls}>Employment Type</label>
                  <select className={inputCls} value={form.employment_type} onChange={e => handleInputChange('employment_type', e.target.value)}>
                    <option value="full-time">full-time</option>
                    <option value="part-time">part-time</option>
                    <option value="contract">contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Salary (Optional)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.salary}
                    onChange={e => handleInputChange('salary', e.target.value)}
                    placeholder="Annual salary or monthly amount"
                  />
                </div>

                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status} onChange={e => handleInputChange('status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Navigation and Save/Cancel buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Staff Member'}
              </button>
            </div>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {currentStep < totalSteps && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function SchoolStaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modal, setModal] = useState(null); // 'add', 'edit', 'view', 'delete'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [error, setError] = useState('');

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/`);
      if (res?.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : data.results || []);
      } else {
        setError(`Failed to load staff: ${res?.status}`);
      }
    } catch (err) {
      setError('Failed to load staff: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || s.main_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      const res = await fetchWithAuth(`${API}/${id}/`, { method: 'DELETE' });
      if (res?.ok) {
        setStaff(s => s.filter(x => x.id !== id));
        setModal(null);
        setError('');
      } else {
        setError(`Failed to delete: ${res?.status}`);
      }
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  };

  const handleSyncWithAccount = async (staffId) => {
    try {
      const res = await fetchWithAuth(`${API}/${staffId}/sync-account/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          password: `Staff@${new Date().getFullYear()}!Temp`
        }),
      });

      const data = await res.json();
      if (res?.ok) {
        loadStaff();
        setError('');
        return true;
      } else {
        setError('Sync failed: ' + (data.message || data.error || 'Unknown error'));
        return false;
      }
    } catch (err) {
      setError('Sync error: ' + err.message);
      return false;
    }
  };

  const onSaveHandler = async (staffId) => {
    if (staffId && !selectedStaff) {
      await handleSyncWithAccount(staffId);
    }
    loadStaff();
    setModal(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Manage school staff profiles and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStaff}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setSelectedStaff(null); setModal('add'); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            className={`${inputCls} pl-9`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={inputCls + ' w-48'}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Staff Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading staff…</span>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-400">No staff members found</p>
          <p className="text-xs text-gray-300 mt-1">Click "Add Staff" to add a new staff member</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Main Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <StaffRow
                  key={s.id}
                  staff={s}
                  onEdit={s => { setSelectedStaff(s); setModal('edit'); }}
                  onDelete={handleDelete}
                  onView={s => { setSelectedStaff(s); setModal('view'); }}
                  onPrint={s => window.print()}
                  onSync={handleSyncWithAccount}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <StaffForm
          staff={modal === 'edit' ? selectedStaff : null}
          onSave={onSaveHandler}
          onClose={() => setModal(null)}
        />
      )}

      {/* View Modal */}
      {modal === 'view' && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Staff Profile</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              {/* Photo */}
              {selectedStaff.photo_url && (
                <div className="w-full h-40 rounded-lg bg-gray-100 overflow-hidden">
                  <img src={selectedStaff.photo_url} alt={selectedStaff.full_name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Sync Status */}
              {selectedStaff.is_synced && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs font-semibold text-green-700">Account Synced</p>
                    <p className="text-xs text-green-600">Linked with user account</p>
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Name', value: selectedStaff.full_name },
                  { label: 'Gender', value: selectedStaff.gender },
                  { label: 'Email', value: selectedStaff.email },
                  { label: 'Phone', value: selectedStaff.phone_number },
                  { label: 'Role', value: selectedStaff.main_role },
                  { label: 'Department', value: selectedStaff.department },
                  { label: 'Status', value: selectedStaff.status },
                  { label: 'Date Joined', value: selectedStaff.date_joined },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
                    <p className="text-gray-800 font-medium">{value || '—'}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setModal(null)}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
