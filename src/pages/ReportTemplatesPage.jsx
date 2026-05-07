import { useState, useEffect } from 'react';
import { FileText, Eye, Printer, Check } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useReportTemplate } from '../context/ReportTemplateContext';
import BIQLogo from '../components/BIQLogo';
import { loadReceiptSettings } from '../services/receiptSettingsService';
import ReportCardSalah from './ReportCardSalah';
import ReportCardClassic from './ReportCardClassic';
import ReportCardSalahV2 from './ReportCardSalahV2';
import ReportCardGreenClassic from './ReportCardGreenClassic';

const TEMPLATES = [
  { id: 'salah',         name: 'Navy & Gold (New Curriculum)', description: 'Modern navy blue & gold design with competency-based assessment layout.' },
  { id: 'salahv2',       name: 'Navy & Gold + Watermark',      description: 'Same navy & gold design with interactive watermark & signature uploads.' },
  { id: 'greenclassic',  name: 'Green & Gold Classic',         description: 'Traditional green & gold school design with CBA layout and stamp upload.' },
  { id: 'classic2',      name: 'Classic A4',                   description: 'Traditional bordered A4 report card, clean and print-ready.' },
  { id: 'classic',       name: 'Classic (Original)',            description: 'Traditional school report card with bordered table layout.' },
  { id: 'modern',        name: 'Modern Card',                   description: 'Clean modern design with colored sections and badges.' },
  { id: 'minimal',       name: 'Minimal',                       description: 'Simple plain text format, ideal for printing.' },
];

const SAMPLE = {
  school: { name: "St. Joseph's College Layibi", logo: null, address: 'P.O. Box 123, Gulu, Uganda', motto: 'Knowledge is Power' },
  student: { full_name: 'Nakato Sarah', admission_number: 'ADM/2025/001', class_or_grade: 'S.3', stream: 'East', gender: 'Female', nationality: 'Ugandan', district: 'Kampala', enrollment_date: '2023-02-01', status: 'active', index_number: '', previous_school: "St. Mary's Primary", fees_balance: 120000, payment_status: 'partial', photo: null, guardians: [{ full_name: 'Nakato Grace', relationship: 'Mother', phone: '0701234567' }] },
  subjects: [
    { subject_name: 'Mathematics', score: 78, ca_score: 28, exam_score: 50, grade: 'B', remark: 'Good performance' },
    { subject_name: 'English',     score: 85, ca_score: 35, exam_score: 50, grade: 'A', remark: 'Excellent' },
    { subject_name: 'Biology',     score: 62, ca_score: 22, exam_score: 40, grade: 'C', remark: 'Satisfactory' },
    { subject_name: 'Chemistry',   score: 55, ca_score: 20, exam_score: 35, grade: 'D', remark: 'Needs improvement' },
    { subject_name: 'History',     score: 90, ca_score: 38, exam_score: 52, grade: 'A', remark: 'Outstanding' },
  ],
  attendance: [{ title: 'Term 1 Attendance', description: 'Present 58/60 days', date: '2025-04-30' }],
  notes: [{ title: 'Class Teacher Note', description: 'Sarah is a hardworking student who participates actively in class.', date: '2025-04-30' }],
  metadata: { term: 'Term 1', academic_year: '2025' },
};

export function ClassicPreview({ data }) {
  const payLabel = data.student.payment_status === 'paid' ? 'PAID' : data.student.payment_status === 'partial' ? 'PARTIAL' : 'NOT PAID';
  const total = data.subjects.reduce((a, s) => a + s.score, 0);
  const avg = Math.round(total / data.subjects.length);

  const SectionHead = ({ title }) => (
    <tr>
      <td colSpan={6} className="border border-gray-900 bg-gray-300 px-3 py-1 font-black uppercase tracking-wider text-center text-xs">
        {title}
      </td>
    </tr>
  );

  return (
    <div style={{fontFamily: `'Times New Roman', Times, serif`}} className="text-gray-900 bg-white w-full max-w-2xl mx-auto text-[10px] sm:text-xs relative overflow-x-auto">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{zIndex:0}}>
        {data.school?.logo
          ? <img src={data.school.logo} alt="" className="w-64 h-64 object-contain opacity-5" />
          : <BIQLogo size={256} className="opacity-5" />
        }
      </div>
      <div style={{position:'relative', zIndex:1}}>
      <table className="w-full border-collapse border-4 border-gray-900" style={{tableLayout:'fixed',wordBreak:'break-word'}}>
        <tbody>
          <tr>
            <td colSpan={6} className="border-b-4 border-gray-900 text-center px-4 py-4">
              <p className="text-xl font-black uppercase tracking-widest">{data.school?.name || 'School Name'}</p>
              {data.school?.address && <p className="text-xs text-gray-600 mt-0.5">{data.school.address}</p>}
              {data.school?.motto && <p className="text-xs italic text-gray-400 mt-0.5">&ldquo;{data.school.motto}&rdquo;</p>}
              <div className="flex justify-center py-2">
                {data.school?.logo
                  ? <img src={data.school.logo} alt="logo" className="w-16 h-16 object-contain" />
                  : <BIQLogo size={64} />
                }
              </div>
              <p className="text-base font-black uppercase tracking-widest">STUDENT REPORT CARD</p>
              <p className="text-xs font-semibold mt-0.5">{data.metadata.term} &mdash; Academic Year {data.metadata.academic_year}</p>
            </td>
          </tr>
          <SectionHead title="Student Information" />
          <tr>
            <td className="border border-gray-900 px-2 py-2 text-center align-middle" rowSpan={4} style={{width:'90px'}}>
              {data.student.photo
                ? <img src={data.student.photo} alt="" className="w-20 h-24 object-cover mx-auto border border-gray-400" />
                : <div className="w-20 h-24 bg-gray-100 mx-auto border border-gray-400 flex items-center justify-center text-xs text-gray-400">Photo</div>
              }
            </td>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100" style={{width:'100px'}}>Full Name</td>
            <td className="border border-gray-900 px-2 py-1 font-semibold" colSpan={4}>{data.student.full_name}</td>
          </tr>
          <tr>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Adm. Number</td>
            <td className="border border-gray-900 px-2 py-1" colSpan={2}>{data.student.admission_number}</td>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Gender</td>
            <td className="border border-gray-900 px-2 py-1 capitalize">{data.student.gender}</td>
          </tr>
          <tr>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Class</td>
            <td className="border border-gray-900 px-2 py-1" colSpan={2}>{data.student.class_or_grade}</td>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Stream</td>
            <td className="border border-gray-900 px-2 py-1">{data.student.stream}</td>
          </tr>
          <tr>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Nationality</td>
            <td className="border border-gray-900 px-2 py-1" colSpan={2}>{data.student.nationality}</td>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">District</td>
            <td className="border border-gray-900 px-2 py-1">{data.student.district}</td>
          </tr>
          {data.student.guardians?.[0] && (
            <tr>
              <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Guardian</td>
              <td className="border border-gray-900 px-2 py-1" colSpan={2}>
                {data.student.guardians[0].full_name} ({data.student.guardians[0].relationship})
              </td>
              <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Phone</td>
              <td className="border border-gray-900 px-2 py-1" colSpan={2}>{data.student.guardians[0].phone}</td>
            </tr>
          )}
          <SectionHead title="Academic Performance" />
          <tr className="bg-gray-300">
            <td className="border border-gray-900 px-2 py-1 font-bold text-center w-6">#</td>
            <td className="border border-gray-900 px-2 py-1 font-bold" colSpan={2}>Subject</td>
            <td className="border border-gray-900 px-2 py-1 font-bold text-center w-14">Score</td>
            <td className="border border-gray-900 px-2 py-1 font-bold text-center w-12">Grade</td>
            <td className="border border-gray-900 px-2 py-1 font-bold">Remark</td>
          </tr>
          {data.subjects.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-900 px-2 py-1 text-center">{i + 1}</td>
              <td className="border border-gray-900 px-2 py-1" colSpan={2}>{s.subject_name}</td>
              <td className="border border-gray-900 px-2 py-1 text-center font-semibold">{s.score} / 100</td>
              <td className="border border-gray-900 px-2 py-1 text-center font-black">{s.grade}</td>
              <td className="border border-gray-900 px-2 py-1">{s.remark}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold">
            <td className="border border-gray-900 px-2 py-1 text-center" colSpan={3}>TOTAL / AVERAGE</td>
            <td className="border border-gray-900 px-2 py-1 text-center">{total} / {data.subjects.length * 100}</td>
            <td className="border border-gray-900 px-2 py-1 text-center">{avg}%</td>
            <td className="border border-gray-900 px-2 py-1">{avg >= 80 ? 'Excellent' : avg >= 65 ? 'Good' : avg >= 50 ? 'Satisfactory' : 'Needs Improvement'}</td>
          </tr>
          {data.attendance?.[0] && (
            <>
              <SectionHead title="Attendance" />
              <tr>
                <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Record</td>
                <td className="border border-gray-900 px-2 py-1" colSpan={2}>{data.attendance[0].title}</td>
                <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Details</td>
                <td className="border border-gray-900 px-2 py-1" colSpan={2}>{data.attendance[0].description}</td>
              </tr>
            </>
          )}
          <SectionHead title="Class Teacher's Comment" />
          <tr>
            <td className="border border-gray-900 px-3 py-2" colSpan={6}>
              {data.notes?.[0]?.description || '................................................................................................'}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-900 px-3 py-1" colSpan={3}>Signature: ___________________________</td>
            <td className="border border-gray-900 px-3 py-1" colSpan={3}>Date: ___________________________</td>
          </tr>
          <SectionHead title="Fees Information" />
          <tr>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Fees Balance</td>
            <td className="border border-gray-900 px-2 py-1 font-semibold" colSpan={2}>UGX {Number(data.student.fees_balance).toLocaleString()}</td>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Payment Status</td>
            <td className="border border-gray-900 px-2 py-1 font-black" colSpan={2}>{payLabel}</td>
          </tr>
          <tr>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Next Term Begins</td>
            <td className="border border-gray-900 px-2 py-1" colSpan={2}>___________________________</td>
            <td className="border border-gray-900 px-2 py-1 font-bold bg-gray-100">Head Teacher</td>
            <td className="border border-gray-900 px-2 py-1" colSpan={2}>___________________________</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}

export function ModernPreview({ data }) {
  const total = data.subjects.reduce((a, s) => a + s.score, 0);
  const avg = Math.round(total / data.subjects.length);
  const gradeColor = (g) => ({ A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-700' }[g] || 'bg-gray-100 text-gray-600');

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl overflow-hidden shadow text-xs sm:text-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
        <div className="flex items-center gap-4">
          {data.school?.logo
            ? <img src={data.school.logo} alt="logo" className="w-14 h-14 object-contain bg-white rounded-xl p-1" />
            : <BIQLogo size={56} className="bg-white rounded-xl p-1" />}
          <div>
            <p className="text-lg font-black uppercase tracking-wide">{data.school?.name || 'School Name'}</p>
            {data.school?.address && <p className="text-indigo-200 text-xs">{data.school.address}</p>}
            {data.school?.motto && <p className="text-indigo-300 text-xs italic">&ldquo;{data.school.motto}&rdquo;</p>}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-bold text-base">STUDENT REPORT CARD</p>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{data.metadata.term} · {data.metadata.academic_year}</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="bg-indigo-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[['Full Name', data.student.full_name], ['Adm. No.', data.student.admission_number],
            ['Class', data.student.class_or_grade], ['Stream', data.student.stream],
            ['Gender', data.student.gender], ['Nationality', data.student.nationality]]
            .map(([k, v]) => (
              <div key={k}><span className="text-gray-500 font-semibold">{k}: </span><span className="text-gray-800">{v}</span></div>
            ))}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Academic Performance</p>
          <div className="space-y-1.5">
            {data.subjects.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-400 text-xs w-4">{i + 1}</span>
                <span className="flex-1 font-medium text-gray-800">{s.subject_name}</span>
                <span className="text-gray-600 text-xs w-14 text-right">{s.score} / 100</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor(s.grade)}`}>{s.grade}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-bold">
            <span>Total / Average</span>
            <span>{total} pts · {avg}%</span>
          </div>
        </div>
        {data.notes?.[0] && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-700 mb-1">Class Teacher's Comment</p>
            <p className="text-xs text-gray-700">{data.notes[0].description}</p>
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-xs">
            <p className="text-gray-500 font-semibold">Fees Balance</p>
            <p className="font-bold text-gray-800">UGX {Number(data.student.fees_balance).toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-xs">
            <p className="text-gray-500 font-semibold">Payment Status</p>
            <p className={`font-bold ${data.student.payment_status === 'paid' ? 'text-green-600' : data.student.payment_status === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>
              {data.student.payment_status === 'paid' ? 'PAID' : data.student.payment_status === 'partial' ? 'PARTIAL' : 'NOT PAID'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MinimalPreview({ data }) {
  const line = '─'.repeat(50);
  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-4 font-mono text-[10px] sm:text-xs text-gray-800 space-y-3 break-words">
      <div className="text-center">
        <p className="font-bold text-base uppercase">STUDENT REPORT</p>
        <p>{data.metadata.term} / {data.metadata.academic_year}</p>
        <p>{line}</p>
      </div>
      <div>
        <p>Name          : {data.student.full_name}</p>
        <p>Admission No. : {data.student.admission_number}</p>
        <p>Class         : {data.student.class_or_grade} — {data.student.stream}</p>
        <p>Gender        : {data.student.gender}</p>
        <p>Nationality   : {data.student.nationality}</p>
        <p>District      : {data.student.district}</p>
      </div>
      <p>{line}</p>
      <div>
        <p className="font-bold mb-1">SUBJECTS</p>
        {data.subjects.map((s, i) => (
          <p key={i} className="break-words">{i + 1}. {s.subject_name} — {s.score}/100 [{s.grade}] {s.remark}</p>
        ))}
      </div>
      <p>{line}</p>
      <div>
        <p>Fees Balance  : UGX {Number(data.student.fees_balance).toLocaleString()}</p>
        <p>Payment Status: {data.student.payment_status.replace('_', ' ').toUpperCase()}</p>
      </div>
      {data.notes[0] && (
        <>
          <p>{line}</p>
          <p className="font-bold">TEACHER'S COMMENT</p>
          <p>{data.notes[0].description}</p>
        </>
      )}
    </div>
  );
}

export const TEMPLATE_MAP = {
  salah:        ReportCardSalah,
  salahv2:      ReportCardSalahV2,
  greenclassic: ReportCardGreenClassic,
  classic2:     ReportCardClassic,
  classic:      ClassicPreview,
  modern:       ModernPreview,
  minimal:      MinimalPreview,
};

export default function ReportTemplatesPage() {
  const { template: selected, setTemplate: setSelected } = useReportTemplate();
  const [previewing, setPreviewing] = useState(false);
  const { schoolInfo } = useConfig();
  const [rsLogo, setRsLogo] = useState('');

  useEffect(() => {
    loadReceiptSettings().then(data => {
      if (data.logo) setRsLogo(data.logo);
    }).catch(() => {});
  }, []);

  const sampleWithLogo = {
    ...SAMPLE,
    school: {
      ...SAMPLE.school,
      logo: rsLogo || null,
      name: schoolInfo?.name || schoolInfo?.businessName || SAMPLE.school.name,
      address: [schoolInfo?.poBox, schoolInfo?.location, schoolInfo?.town].filter(Boolean).join(' · ') || SAMPLE.school.address,
      motto: schoolInfo?.motto || SAMPLE.school.motto,
      phone: schoolInfo?.phone || '',
    },
  };

  const PreviewComponent = TEMPLATE_MAP[selected] || ClassicPreview;

  const handleSelect = (id) => { setSelected(id); setPreviewing(true); };

  const THUMBS = {
    salah:        <div className="w-10 space-y-0.5"><div className="h-2 rounded" style={{background:'linear-gradient(90deg,#1e3a8a,#d4af37)'}} />{[...Array(4)].map((_,i)=><div key={i} className="h-1 bg-blue-200 rounded"/>)}</div>,
    salahv2:      <div className="w-10 space-y-0.5"><div className="h-2 rounded" style={{background:'linear-gradient(90deg,#1e3a8a,#d4af37)'}} /><div className="h-1 bg-yellow-300 rounded opacity-50"/>{[...Array(3)].map((_,i)=><div key={i} className="h-1 bg-blue-200 rounded"/>)}</div>,
    greenclassic: <div className="w-10 space-y-0.5"><div className="h-2 rounded" style={{background:'linear-gradient(90deg,#2d5a1b,#c87820)'}} />{[...Array(4)].map((_,i)=><div key={i} className="h-1 bg-green-200 rounded"/>)}</div>,
    classic2:     <div className="w-10 space-y-0.5"><div className="h-1.5 bg-blue-900 rounded"/>{[...Array(4)].map((_,i)=><div key={i} className="h-1 bg-gray-400 rounded"/>)}</div>,
    classic:      <div className="w-10 space-y-0.5"><div className="h-1.5 bg-gray-700 rounded"/>{[...Array(4)].map((_,i)=><div key={i} className="h-1 bg-gray-300 rounded"/>)}</div>,
    modern:       <div className="w-10 space-y-0.5"><div className="h-3 bg-indigo-500 rounded"/>{[...Array(3)].map((_,i)=><div key={i} className="h-1.5 bg-gray-200 rounded"/>)}</div>,
    minimal:      <div className="w-10 space-y-0.5">{[...Array(6)].map((_,i)=><div key={i} className={`h-0.5 rounded ${i===0?'bg-gray-700':'bg-gray-300'}`}/>)}</div>,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Templates</h1>
            <p className="text-sm text-gray-500">Choose a format for student report cards</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreviewing(p => !p)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50">
            <Eye className="w-4 h-4" /> {previewing ? 'Hide Preview' : 'Preview'}
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
            <Printer className="w-4 h-4" /> Print Sample
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${previewing ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Select Template</p>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => handleSelect(t.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                selected === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              <div className={`w-16 h-20 rounded-lg shrink-0 flex items-center justify-center border-2 ${selected === t.id ? 'border-indigo-300 bg-indigo-100' : 'border-gray-200 bg-gray-50'}`}>
                {THUMBS[t.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  {selected === t.id && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
              </div>
            </button>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">How to use</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Select a template above</li>
              <li>Go to <strong>Student Reports</strong> and pick a student</li>
              <li>Click <strong>Generate</strong> — the report uses this template</li>
              <li>Use <strong>Print</strong> to print or save as PDF</li>
            </ol>
          </div>
        </div>

        {previewing && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Preview — Sample Data</p>
            <div className="bg-gray-100 rounded-xl p-4 overflow-auto max-h-[70vh]">
              <PreviewComponent data={sampleWithLogo} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
