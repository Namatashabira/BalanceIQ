import { useState, useRef, useEffect } from 'react';
import './report4.css';
import { loadReceiptSettings } from '../../services/receiptSettingsService';

// ── DEFAULT DATA (for standalone preview) ────────────────────────────────────
const defaultData = {
  school: {
    logo: '', name: 'ST. MARK SCHOOLS', subtitle: 'PRIMARY & SECONDARY',
    address: 'Kayunga, Uganda', phone: '+256 700 123456', phone2: '+256 776 987654',
    email: 'info@stmark.sc.ug', website: 'www.stmark.sc.ug', term: 'TERM 1', year: '2026',
  },
  student: {
    name: 'John Doe', gender: 'Male', section: 'A',
    class: 'S.5', stream: 'Science', idNo: '12345', term: 'Term 1', year: '2026',
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
  overall: { achievement: 'Very Good', grade: 'B' },
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
  { label: 'Teal Modern',      primary: '#0d9488', secondary: '#06b6d4', accent: '#14919b' },
  { label: 'Purple Pro',       primary: '#7c3aed', secondary: '#8b5cf6', accent: '#6d28d9' },
  { label: 'Green Fresh',      primary: '#059669', secondary: '#10b981', accent: '#047857' },
  { label: 'Slate Premium',    primary: '#475569', secondary: '#64748b', accent: '#334155' },
  { label: 'Indigo Elegant',   primary: '#4f46e5', secondary: '#6366f1', accent: '#4338ca' },
  { label: 'Cyan Modern',      primary: '#0891b2', secondary: '#06b6d4', accent: '#0e7490' },
];

// ── SVG ICONS ────────────────────────────────────────────────────────────────
const IconDot = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r4-icon">
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function R4Header({ school }) {
  return (
    <header className="r4-header">
      <div className="r4-logo-area">
        {school.logo ? (
          <img src={school.logo} alt="School Logo" className="r4-logo-img" style={{ maxHeight: '70px', maxWidth: '100px', objectFit: 'contain' }} />
        ) : (
          <div className="r4-logo-ph"></div>
        )}
      </div>
      <div className="r4-school-details">
        <h1 className="r4-school-name">{school.name}</h1>
        <p className="r4-report-title">ACADEMIC REPORT CARD</p>
      </div>
      <div className="r4-contact-info">
        <p className="r4-contact-line">{school.address}</p>
        <p className="r4-contact-line">Tel: {school.phone}</p>
        <p className="r4-contact-line">Email: {school.email}</p>
      </div>
      <div className="r4-term-badge">
        <span className="r4-term">{school.term}</span>
        <span className="r4-year">{school.year}</span>
      </div>
    </header>
  );
}

function R4StudentBio({ student }) {
  return (
    <section className="r4-student-sec">
      <div className="r4-bio-row">
        <div className="r4-bio-cell"><span className="r4-bio-label">Name:</span> {student.name}</div>
        <div className="r4-bio-cell"><span className="r4-bio-label">Class:</span> {student.class}</div>
      </div>
      <div className="r4-bio-row">
        <div className="r4-bio-cell"><span className="r4-bio-label">Gender:</span> {student.gender}</div>
        <div className="r4-bio-cell"><span className="r4-bio-label">Stream:</span> {student.stream}</div>
      </div>
      <div className="r4-bio-row">
        <div className="r4-bio-cell"><span className="r4-bio-label">Index No:</span> {student.idNo}</div>
        <div className="r4-bio-cell"><span className="r4-bio-label">Admin:</span> {student.admissionNumber}</div>
      </div>
    </section>
  );
}

function R4SubjectsTable({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <section className="r4-subjects">
        <h3 className="r4-section-header">Academic Performance</h3>
        <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No subjects data available. Please ensure marks have been entered for this student.</p>
      </section>
    );
  }
  
  // Dynamically determine column headers based on data
  const hasScores = subjects.length > 0 && subjects[0].scores && subjects[0].scores.length > 0;
  const scoreCount = hasScores ? subjects[0].scores.length : 0;
  
  // Map score columns to headers
  const scoreHeaders = {
    1: ['Score'],
    2: ['A1', 'A2'],
    3: ['A1', 'A2', 'A3'],
    4: ['BOT', 'MID', 'EOT', 'AVG'],
  }[scoreCount] || Array.from({ length: scoreCount }, (_, i) => `S${i + 1}`);

  return (
    <section className="r4-subjects">
      <h3 className="r4-section-header">Academic Performance</h3>
      <table className="r4-table">
        <thead>
          <tr>
            <th>#</th><th>Subject</th><th>Teacher</th>
            {scoreHeaders.map((h, i) => <th key={i}>{h}</th>)}
            <th>Total</th><th>Grade</th><th>Achievement</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s, i) => {
            const total = s.scores.reduce((sum, score) => sum + score, 0);
            const avg = scoreCount > 0 ? Math.round(total / scoreCount) : total;
            return (
              <tr key={i}>
                <td>{i + 1}</td><td>{s.name}</td><td>{s.teacher}</td>
                {s.scores.map((score, idx) => <td key={idx}>{score}</td>)}
                <td><strong>{avg}</strong></td><td><strong className="r4-grade">{s.grade}</strong></td>
                <td className="r4-ach">{s.achievement}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function R4Performance({ summary, overall }) {
  return (
    <section className="r4-perf">
      <h3 className="r4-section-header">Overall Performance</h3>
      <div className="r4-perf-row">
        <div className="r4-perf-box">
          <span className="r4-perf-label">Average</span>
          <span className="r4-perf-value">{summary.average}%</span>
        </div>
        <div className="r4-perf-box">
          <span className="r4-perf-label">Result</span>
          <span className="r4-perf-value">{summary.result}</span>
        </div>
        <div className="r4-perf-box">
          <span className="r4-perf-label">Position</span>
          <span className="r4-perf-value">{summary.position}/{summary.outOf}</span>
        </div>
        <div className="r4-perf-box">
          <span className="r4-perf-label">Overall Grade</span>
          <span className="r4-perf-value">{overall.grade}</span>
        </div>
      </div>
    </section>
  );
}

function R4Admin({ admin }) {
  return (
    <section className="r4-admin">
      <h3 className="r4-section-header">Administrative Information</h3>
      <div className="r4-admin-grid">
        <div className="r4-admin-item">
          <span className="r4-admin-label">Term Ended</span>
          <span className="r4-admin-value">{admin.termEnded}</span>
        </div>
        <div className="r4-admin-item">
          <span className="r4-admin-label">Next Term</span>
          <span className="r4-admin-value">{admin.nextTerm}</span>
        </div>
        <div className="r4-admin-item">
          <span className="r4-admin-label">Balance</span>
          <span className="r4-admin-value">UGX {admin.balance}</span>
        </div>
        <div className="r4-admin-item">
          <span className="r4-admin-label">Next Fees</span>
          <span className="r4-admin-value">UGX {admin.nextFees}</span>
        </div>
      </div>
    </section>
  );
}

function R4Comments({ comments }) {
  return (
    <section className="r4-comments">
      <div className="r4-comment-box">
        <h4 className="r4-comment-title">Class Teacher</h4>
        <p>{comments.classTeacher}</p>
      </div>
      <div className="r4-comment-box">
        <h4 className="r4-comment-title">Head Teacher</h4>
        <p>{comments.headTeacher}</p>
      </div>
    </section>
  );
}

function R4Footer({ admin, school }) {
  return (
    <footer className="r4-footer">
      <div className="r4-sig-row">
        <div className="r4-sig-col">
          <span>{admin.classTeacherName}</span>
          {admin.classTeacherSignature ? (
            <img src={admin.classTeacherSignature} alt="Class Teacher Signature" style={{ maxHeight: '40px', maxWidth: '110px', objectFit: 'contain' }} />
          ) : (
            <span className="r4-sig-line">_____________________</span>
          )}
          <span>Class Teacher</span>
        </div>
        <div className="r4-stamp-col">
          {admin.schoolStamp ? (
            <img src={admin.schoolStamp} alt="School Stamp" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
          ) : (
            <div></div>
          )}
        </div>
        <div className="r4-sig-col">
          <span>{admin.headTeacherName}</span>
          {admin.headTeacherSignature ? (
            <img src={admin.headTeacherSignature} alt="Head Teacher Signature" style={{ maxHeight: '40px', maxWidth: '110px', objectFit: 'contain' }} />
          ) : (
            <span className="r4-sig-line">_____________________</span>
          )}
          <span>Head Teacher</span>
        </div>
      </div>
      <div className="r4-footer-line">
        {school.name} | Official Academic Report
      </div>
    </footer>
  );
}

// ── HELPER FUNCTION ──────────────────────────────────────────────────────────
function transformReportData(data) {
  if (!data) return defaultData;

  const subjects = (data.subjects || []).map(s => {
    // Handle different score formats
    const a1 = s.a1_score ?? 0;
    const a2 = s.a2_score ?? 0;
    const a3 = s.a3_score ?? 0;
    
    // Calculate total: ((a1+a2)/2) * 0.2 + a3 * 0.8
    const assessmentAvg = (a1 + a2) / 2;
    const total = (assessmentAvg * 0.2) + (a3 * 0.8);
    
    return {
      code: s.subject_name?.substring(0, 3).toUpperCase() || 'N/A',
      name: s.subject_name || 'Unknown',
      scores: [a1, a2, a3],
      grade: s.grade || 'N/A',
      achievement: s.remark || 'N/A',
      teacher: s.teacher || s.teacher_name || 'N/A',
    };
  });

  const total = subjects.reduce((sum, s) => sum + (s.scores[0] + s.scores[1] + s.scores[2]), 0);
  const average = subjects.length > 0 ? Math.round(total / (subjects.length * 3)) : 0;

  return {
    school: {
      logo: data.school?.logo || '',
      name: data.school?.name || 'School Name',
      subtitle: data.school?.subtitle || '',
      address: data.school?.address || '',
      phone: data.school?.phone || '',
      phone2: data.school?.phone2 || '',
      email: data.school?.email || '',
      website: data.school?.website || '',
      term: data.metadata?.term || 'Term 1',
      year: data.metadata?.academic_year || '2026',
      stamp: data.school?.stamp || '',
    },
    student: {
      name: data.student?.full_name || 'Student Name',
      gender: data.student?.gender || 'N/A',
      section: data.student?.stream || 'N/A',
      class: data.student?.class_or_grade || 'N/A',
      stream: data.student?.stream || 'N/A',
      idNo: data.student?.admission_number || 'N/A',
      term: data.metadata?.term || 'Term 1',
      year: data.metadata?.academic_year || '2026',
    },
    subjects,
    summary: {
      average: average || 0,
      total: subjects.length * 100,
      result: (average || 0) >= 50 ? 'Pass' : 'Fail',
      position: data.summary?.position || 0,
      outOf: data.summary?.outOf || 0,
    },
    overall: {
      achievement: (average || 0) >= 80 ? 'Excellent' : (average || 0) >= 60 ? 'Very Good' : (average || 0) >= 50 ? 'Good' : 'Needs Improvement',
      grade: (average || 0) >= 80 ? 'A' : (average || 0) >= 70 ? 'B' : (average || 0) >= 60 ? 'C' : (average || 0) >= 50 ? 'D' : 'F',
    },
    comments: {
      classTeacher: data.notes?.[0]?.description || 'No comment available.',
      headTeacher: 'Excellent performance. We encourage continued dedication to studies.',
    },
    admin: {
      termEnded: data.fees?.term_ended_date || data.admin?.termEnded || new Date().toISOString().split('T')[0],
      nextTerm: data.fees?.next_term_date || data.admin?.nextTerm || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      balance: data.student?.fees_balance ? `${data.student.fees_balance}` : (data.admin?.balance || '0'),
      nextFees: data.fees?.next_term_fees || data.admin?.nextFees || '0',
      other: '',
      classTeacherName: data.admin?.classTeacherName || data.staff?.class_teacher_name || 'Class Teacher',
      classTeacherSignature: data.staff?.class_teacher_signature || '',
      headTeacherName: data.admin?.headTeacherName || data.staff?.headteacher_name || 'Head Teacher',
      headTeacherSignature: data.staff?.headteacher_signature || '',
      schoolStamp: data.school?.stamp || '',
    },
  };
}

// ── MAIN REPORT ──────────────────────────────────────────────────────────────
export default function Report4({ data: propData }) {
  let initialData = propData ? transformReportData(propData) : defaultData;
  const [palette, setPalette] = useState(PALETTES[0]);
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const [receiptSettings, setReceiptSettings] = useState(null);
  const [data, setData] = useState(initialData);
  const cardRef = useRef(null);

  // ── Load receipt settings on mount ────────────────────────────────────────
  useEffect(() => {
    loadReceiptSettings()
      .then(settings => {
        setReceiptSettings(settings);
        // Update data with logo and stamp from receipt settings
        if (settings) {
          setData(prevData => ({
            ...prevData,
            school: {
              ...prevData.school,
              logo: settings.logo || prevData.school.logo,
            },
            admin: {
              ...prevData.admin,
              schoolStamp: settings.stamp_raw || prevData.admin.schoolStamp,
            },
          }));
        }
      })
      .catch(err => console.error('Failed to load receipt settings:', err));
  }, []);

  const primary = customPrimary || palette.primary;
  const secondary = customSecondary || palette.secondary;
  const accent = palette.accent;

  const cssVars = {
    '--r4-primary': primary,
    '--r4-secondary': secondary,
    '--r4-accent': accent,
  };

  function handlePrint() {
    window.print();
  }

  return (
    <div className="r4-page">
      <div className="r4-controls">
        <button onClick={handlePrint} className="r4-print-btn">Print Report</button>
        <div className="r4-palette-bar">
          {PALETTES.map((p, i) => (
            <button
              key={i}
              className={`r4-palette-swatch ${palette.label === p.label ? 'active' : ''}`}
              style={{ background: p.primary }}
              onClick={() => { setPalette(p); setCustomPrimary(''); setCustomSecondary(''); }}
              title={p.label}
            />
          ))}
          <label className="r4-custom-label">
            Primary
            <input type="color" value={customPrimary || primary} onChange={e => setCustomPrimary(e.target.value)} className="r4-color-input" />
          </label>
          <label className="r4-custom-label">
            Secondary
            <input type="color" value={customSecondary || secondary} onChange={e => setCustomSecondary(e.target.value)} className="r4-color-input" />
          </label>
        </div>
      </div>

      <div className="r4-card" ref={cardRef} style={cssVars}>
        <R4Header school={data.school} />
        <div className="r4-content">
          <R4StudentBio student={data.student} />
          <R4SubjectsTable subjects={data.subjects} />
          <R4Performance summary={data.summary} overall={data.overall} />
          <R4Comments comments={data.comments} />
          <R4Admin admin={data.admin} />
          <R4Footer admin={data.admin} school={data.school} />
        </div>
      </div>
    </div>
  );
}
