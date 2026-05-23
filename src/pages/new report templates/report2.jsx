import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode.react';
import './report2.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

// ── DEFAULT DATA ────────────────────────────────────────────────────────────
const defaultData = {
  school: {
    logo: '', name: 'ST. MARK SCHOOLS', subtitle: 'PRIMARY & SECONDARY',
    address: 'Kayunga, Uganda', phone: '+256 700 123456', phone2: '+256 776 987654',
    email: 'info@stmark.sc.ug', website: 'www.stmark.sc.ug', term: 'TERM 1', year: '2026',
  },
  student: {
    photo: '', name: 'John Doe', gender: 'Male', section: 'A',
    class: 'S.5', stream: 'Science', idNo: '12345', payCode: 'PC001', term: 'Term 1', year: '2026',
  },
  subjects: [
    { code: 'ENG', name: 'English',         scores: [90, 85, 88], grade: 'A', achievement: 'Excellent',  teacher: 'Ms. Smith'    },
    { code: 'BIO', name: 'Biology',          scores: [78, 80, 75], grade: 'B', achievement: 'Very Good',  teacher: 'Mr. Okello'   },
    { code: 'MAT', name: 'Mathematics',      scores: [92, 88, 90], grade: 'A', achievement: 'Excellent',  teacher: 'Mr. Kato'     },
    { code: 'CHE', name: 'Chemistry',        scores: [74, 70, 72], grade: 'B', achievement: 'Very Good',  teacher: 'Ms. Namutebi' },
    { code: 'PHY', name: 'Physics',          scores: [85, 82, 84], grade: 'A', achievement: 'Excellent',  teacher: 'Mr. Ssali'    },
    { code: 'HIS', name: 'History',          scores: [65, 60, 63], grade: 'C', achievement: 'Good',       teacher: 'Ms. Nakato'   },
    { code: 'GEO', name: 'Geography',        scores: [70, 68, 69], grade: 'B', achievement: 'Very Good',  teacher: 'Mr. Mugisha'  },
    { code: 'ICT', name: 'ICT',              scores: [88, 85, 87], grade: 'A', achievement: 'Excellent',  teacher: 'Mr. Tumwine'  },
    { code: 'ENT', name: 'Entrepreneurship', scores: [76, 72, 74], grade: 'B', achievement: 'Very Good',  teacher: 'Ms. Apio'     },
  ],
  assessmentModel: 'A1',
  summary: { average: 78, total: 100, result: 'Pass', position: 3, outOf: 30 },
  overall: { identifier: 'OP1', achievement: 'Very Good', grade: 'B' },
  comments: {
    classTeacher: 'John has performed very well this term. Keep up the good work!',
    headTeacher: 'Excellent performance. We encourage continued dedication to studies.',
  },
  admin: {
    termEnded: '2026-04-17', nextTerm: '2026-05-04', balance: '0', nextFees: '450,000',
    other: 'School uniform', classTeacherName: 'Mr. Ssempala David',
    headTeacherName: 'Mrs. Nankya Patience',
  },
};

// ── PRESET PALETTES ──────────────────────────────────────────────────────────
const PALETTES = [
  { label: 'Indigo & Pink',    primary: '#6366f1', secondary: '#ec4899', accent: '#8b5cf6' },
  { label: 'Teal & Orange',    primary: '#14b8a6', secondary: '#f97316', accent: '#06b6d4' },
  { label: 'Purple & Yellow',  primary: '#9333ea', secondary: '#eab308', accent: '#a855f7' },
  { label: 'Blue & Green',     primary: '#3b82f6', secondary: '#10b981', accent: '#0ea5e9' },
  { label: 'Red & Amber',      primary: '#ef4444', secondary: '#f59e0b', accent: '#dc2626' },
  { label: 'Emerald & Rose',   primary: '#059669', secondary: '#f43f5e', accent: '#10b981' },
];

// ── SVG ICONS ────────────────────────────────────────────────────────────────
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r2-icon">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r2-icon">
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r2-icon">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);
const IconWeb = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r2-icon">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

// ── UTILITY ─────────────────────────────────────────────────────────────────
function useImageUpload(initialSrc) {
  const [src, setSrc] = useState(initialSrc);
  const onChange = e => {
    const f = e.target.files[0];
    if (f) setSrc(URL.createObjectURL(f));
  };
  return [src, onChange];
}

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function R2Header({ school }) {
  const [logo, onLogo] = useImageUpload(school.logo);
  return (
    <header className="r2-header">
      <div className="r2-header-left">
        <div className="r2-header-logo-name">
          <label className="r2-logo-label" title="Upload logo">
            {logo ? <img src={logo} alt="logo" className="r2-logo-img" />
                  : <div className="r2-logo-ph">Upload<br/>Logo</div>}
            <input type="file" accept="image/*" onChange={onLogo} hidden />
          </label>
          <div className="r2-school-title">
            <h1 className="r2-school-name">{school.name}</h1>
            <p className="r2-school-subtitle">{school.subtitle}</p>
          </div>
        </div>

        <div className="r2-header-contacts">
          <div className="r2-contact-item"><IconPin /> {school.address}</div>
          <div className="r2-contact-item"><IconPhone /> {school.phone} | {school.phone2}</div>
          <div className="r2-contact-item"><IconMail /> {school.email} &nbsp; <IconWeb /> {school.website}</div>
        </div>
      </div>

      <div className="r2-header-right">
        <div className="r2-header-right-inner">
          <h2 className="r2-badge-title">REPORT CARD</h2>
          <span className="r2-cba-badge">COMPETENCY BASED ASSESSMENT</span>
          <div className="r2-term-info">
            <span className="r2-term">{school.term}</span>
            <span className="r2-year">{school.year}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function R2StudentBio({ student }) {
  const [photo, onPhoto] = useImageUpload(student.photo);
  return (
    <section className="r2-bio">
      <div className="r2-bio-left">
        <label className="r2-photo-label" title="Upload photo">
          {photo ? <img src={photo} alt="student" className="r2-photo-img" />
                : <div className="r2-photo-ph">Upload<br/>Photo</div>}
          <input type="file" accept="image/*" onChange={onPhoto} hidden />
        </label>
      </div>
      <div className="r2-bio-right">
        <div className="r2-bio-grid">
          <div className="r2-bio-cell">
            <span>Name</span>
            <strong>{student.name}</strong>
          </div>
          <div className="r2-bio-cell">
            <span>Gender</span>
            <strong>{student.gender}</strong>
          </div>
          <div className="r2-bio-cell">
            <span>Class</span>
            <strong>{student.class} {student.stream}</strong>
          </div>
          <div className="r2-bio-cell">
            <span>Section</span>
            <strong>{student.section}</strong>
          </div>
          <div className="r2-bio-cell">
            <span>ID No</span>
            <strong>{student.idNo}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function R2SubjectsTable({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <section className="r2-subjects">
        <h3 className="r2-section-title">Subject Performance</h3>
        <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No subjects data available. Please ensure marks have been entered for this student.</p>
      </section>
    );
  }
  
  const hasScores = subjects[0].scores && subjects[0].scores.length > 0;
  const scoreCount = hasScores ? subjects[0].scores.length : 0;
  const scoreHeaders = scoreCount === 7 ? ['A1', 'A2', 'A3', 'AVG', '20%', '80%', '100%'] : scoreCount === 3 ? ['A1', 'A2', 'A3'] : scoreCount === 4 ? ['BOT', 'MID', 'EOT', 'AVG'] : Array.from({ length: scoreCount }, (_, i) => `S${i + 1}`);
  
  return (
    <section className="r2-subjects">
      <h3 className="r2-section-title">Subject Performance</h3>
      <table className="r2-table">
        <thead>
          <tr>
            <th>Code</th><th>Subject</th>
            {scoreHeaders.map((h, i) => <th key={i}>{h}</th>)}
            <th>AVG</th><th>Total</th><th>Grade</th><th>Achievement</th><th>Teacher</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((sub, i) => {
            const total = sub.scores.reduce((sum, score) => sum + score, 0);
            const avg = scoreCount > 0 ? Math.round(total / scoreCount) : total;
            return (
              <tr key={i}>
                <td>{sub.code}</td>
                <td>{sub.name}</td>
                {sub.scores.map((score, idx) => <td key={idx}>{score}</td>)}
                <td>{avg}</td>
                <td>{total}</td>
                <td className="r2-grade">{sub.grade}</td>
                <td className="r2-achievement">{sub.achievement}</td>
                <td>{sub.teacher}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function R2Summary({ summary }) {
  return (
    <section className="r2-summary">
      <h3 className="r2-section-title">Summary</h3>
      <div className="r2-summary-grid">
        <div className="r2-sum-item">Average<strong>{summary.average}%</strong></div>
        <div className="r2-sum-item">Total<strong>{summary.total}</strong></div>
        <div className="r2-sum-item">Result<strong>{summary.result}</strong></div>
        <div className="r2-sum-item">Position<strong>{summary.position}/{summary.outOf}</strong></div>
      </div>
    </section>
  );
}

function R2Overall({ overall }) {
  return (
    <section className="r2-overall">
      <h3 className="r2-section-title">Overall Performance</h3>
      <div className="r2-overall-content">
        <div className="r2-overall-item">Achievement<strong>{overall.achievement}</strong></div>
        <div className="r2-overall-item">Grade<strong>{overall.grade}</strong></div>
      </div>
    </section>
  );
}

function R2Comments({ comments }) {
  return (
    <section className="r2-comments">
      <h3 className="r2-section-title">Comments</h3>
      <div className="r2-comment-grid">
        <div className="r2-comment-item">
          <div className="r2-comment-title">Class Teacher</div>
          <p>{comments.classTeacher}</p>
        </div>
        <div className="r2-comment-item">
          <div className="r2-comment-title">Head Teacher</div>
          <p>{comments.headTeacher}</p>
        </div>
      </div>
    </section>
  );
}

function R2Admin({ admin }) {
  return (
    <section className="r2-admin">
      <h3 className="r2-section-title">Administrative Information</h3>
      <div className="r2-admin-grid">
        <div className="r2-admin-item"><strong>Term Ended:</strong> {admin.termEnded}</div>
        <div className="r2-admin-item"><strong>Next Term:</strong> {admin.nextTerm}</div>
        <div className="r2-admin-item"><strong>Balance:</strong> {admin.balance}</div>
        <div className="r2-admin-item"><strong>Next Fees:</strong> {admin.nextFees}</div>
        <div className="r2-admin-item"><strong>Other:</strong> {admin.other}</div>
      </div>
    </section>
  );
}

function R2Footer({ admin, school, student = {} }) {
  const [classSig, onClassSig] = useImageUpload('');
  const [headSig, onHeadSig] = useImageUpload('');
  const [stamp, onStamp] = useImageUpload('');
  const baseUrl = window.location.origin;
  const qrValue = `${baseUrl}/verify-report?id=${student.idNo || 'N/A'}&class=${student.class || 'N/A'}&name=${encodeURIComponent(student.name || 'N/A')}`;

  return (
    <footer className="r2-footer">
      <div className="r2-qr-section" style={{ textAlign: 'center', margin: '10px 0', padding: '10px', borderTop: '1px solid #ddd' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>Report Verification</div>
        <QRCode value={qrValue} size={80} level="H" includeMargin={true} />
      </div>

      <div className="r2-signatures">
        <div className="r2-sig-card">
          <div className="r2-sig-role">CLASS TEACHER</div>
          <div className="r2-sig-name">{admin.classTeacherName}</div>
          <label className="r2-sig-upload" title="Upload signature">
            {classSig ? <img src={classSig} alt="sig" className="r2-sig-img" />
                      : <div className="r2-sig-ph">Upload Signature</div>}
            <input type="file" accept="image/*" onChange={onClassSig} hidden />
          </label>
          <div className="r2-sig-line">Signature</div>
        </div>

        <div className="r2-stamp-card">
          <label className="r2-sig-upload" title="Upload stamp">
            {stamp ? <img src={stamp} alt="stamp" className="r2-stamp-img" />
                   : <div className="r2-stamp-ph">Official<br />Stamp</div>}
            <input type="file" accept="image/*" onChange={onStamp} hidden />
          </label>
        </div>

        <div className="r2-sig-card">
          <div className="r2-sig-role">HEAD TEACHER</div>
          <div className="r2-sig-name">{admin.headTeacherName}</div>
          <label className="r2-sig-upload" title="Upload signature">
            {headSig ? <img src={headSig} alt="sig" className="r2-sig-img" />
                     : <div className="r2-sig-ph">Upload Signature</div>}
            <input type="file" accept="image/*" onChange={onHeadSig} hidden />
          </label>
          <div className="r2-sig-line">Signature</div>
        </div>
      </div>

      <div className="r2-footer-bar">
        This report is the property of {school.name}. If found, please return it to the school.
      </div>
    </footer>
  );
}

// ── MAIN REPORT ──────────────────────────────────────────────────────────────
export default function Report2({ data: propData }) {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('id') || '1';
  const [data, setData] = useState(propData || defaultData);
  const [watermark, setWatermark] = useState('');
  const [palette, setPalette] = useState(PALETTES[0]);
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (propData) {
      setData(propData);
    } else if (studentId && studentId !== '1') {
      fetchReportData();
    }
  }, [propData, studentId]);

  async function fetchReportData() {
    const cacheKey = `report2_student_${studentId}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      console.log('Loading from cache:', cacheKey);
      setData(JSON.parse(cachedData));
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const url = `${API}/school/students/${studentId}/`;
      console.log('Fetching from:', url);
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(url, { headers });
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const apiData = await response.json();
        console.log('API Response:', apiData);
        const transformedData = transformApiData(apiData);
        console.log('Transformed Data:', transformedData);
        localStorage.setItem(cacheKey, JSON.stringify(transformedData));
        setData(transformedData);
      } else {
        console.error('API Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  function transformApiData(apiData) {
    const subjects = (apiData.subjects || []).map(s => {
      const a1 = s.a1_score || 0;
      const a2 = s.a2_score || 0;
      const a3 = s.a3_score || 0;
      return {
        code: s.subject_code || 'N/A',
        name: s.subject_name || 'Subject',
        scores: [a1, a2, a3],
        grade: s.grade || 'B',
        achievement: s.achievement || s.remark || 'Good',
        teacher: s.teacher || 'Teacher',
      };
    });
    return {
      school: {
        ...defaultData.school,
      },
      student: {
        photo: '',
        name: apiData.student?.full_name || defaultData.student.name,
        gender: apiData.student?.gender || defaultData.student.gender,
        section: apiData.student?.stream || defaultData.student.section,
        class: apiData.student?.class_or_grade || defaultData.student.class,
        stream: apiData.student?.stream || defaultData.student.stream,
        idNo: apiData.student?.admission_number || defaultData.student.idNo,
        payCode: apiData.student?.index_number || defaultData.student.payCode,
        term: defaultData.student.term,
        year: defaultData.student.year,
      },
      subjects: subjects.length > 0 ? subjects : defaultData.subjects,
      assessmentModel: 'A1',
      summary: {
        average: subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + ((s.scores[0] + s.scores[1] + s.scores[2]) / 3), 0) / subjects.length) : 0,
        total: 100,
        result: 'Pass',
        position: apiData.summary?.position || 0,
        outOf: apiData.summary?.outOf || 0,
      },
      overall: {
        identifier: 'OP1',
        achievement: 'Very Good',
        grade: 'B',
      },
      comments: {
        classTeacher: apiData.notes?.[0]?.description || defaultData.comments.classTeacher,
        headTeacher: defaultData.comments.headTeacher,
      },
      admin: defaultData.admin,
    };
  }

  const onWatermark = e => { const f = e.target.files[0]; if (f) setWatermark(URL.createObjectURL(f)); };

  const primary = customPrimary || palette.primary;
  const secondary = customSecondary || palette.secondary;
  const accent = palette.accent;

  const cssVars = {
    '--r2-primary': primary,
    '--r2-secondary': secondary,
    '--r2-accent': accent,
  };

  function handlePrint() {
    window.print();
  }

  return (
    <div className="r2-page">
      <div className="r2-controls no-print">
        <button className="r2-print-btn" onClick={handlePrint}>🖨 Print / Save PDF</button>

        <div className="r2-palette-bar">
          {PALETTES.map(p => (
            <button
              key={p.label}
              className={`r2-palette-swatch${palette.label === p.label ? ' active' : ''}`}
              style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
              title={p.label}
              onClick={() => { setPalette(p); setCustomPrimary(''); setCustomSecondary(''); }}
            />
          ))}
          <label className="r2-custom-label" title="Custom primary colour">
            <span>Primary</span>
            <input type="color" value={customPrimary || primary}
              onChange={e => setCustomPrimary(e.target.value)} className="r2-color-input" />
          </label>
          <label className="r2-custom-label" title="Custom secondary colour">
            <span>Secondary</span>
            <input type="color" value={customSecondary || secondary}
              onChange={e => setCustomSecondary(e.target.value)} className="r2-color-input" />
          </label>
        </div>

        <label className="r2-wm-btn">
          💧 {watermark ? 'Change Watermark' : 'Add Watermark'}
          <input type="file" accept="image/*" onChange={onWatermark} hidden />
        </label>
        {watermark && <button className="r2-wm-btn r2-wm-remove" onClick={() => setWatermark('')}>✗ Remove</button>}
      </div>

      <div className="r2-card" ref={cardRef} style={cssVars}>
        <span className="r2-corner r2-corner-tl" />
        <span className="r2-corner r2-corner-tr" />
        <span className="r2-corner r2-corner-bl" />
        <span className="r2-corner r2-corner-br" />

        {watermark && (
          <div className="r2-watermark-layer">
            <img src={watermark} alt="" className="r2-watermark-img" />
          </div>
        )}
        
        <div className="r2-inner">
          <R2Header school={data.school} />
          <R2StudentBio student={data.student} />
          <R2SubjectsTable subjects={data.subjects} />
          <R2Summary summary={data.summary} />
          <R2Overall overall={data.overall} />
          <R2Comments comments={data.comments} />
          <R2Admin admin={data.admin} />
          <R2Footer admin={data.admin} school={data.school} student={data.student} />
        </div>
      </div>
    </div>
  );
}