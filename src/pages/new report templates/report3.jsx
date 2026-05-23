import { useState, useRef } from 'react';
import './report3.css';

// ── DATA ────────────────────────────────────────────────────────────────────
const data = {
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
  { label: 'Navy & Gold',      primary: '#1e3a8a', secondary: '#d97706', accent: '#92400e' },
  { label: 'Forest & Cream',   primary: '#065f46', secondary: '#fbbf24', accent: '#047857' },
  { label: 'Burgundy & Tan',   primary: '#881337', secondary: '#d97706', accent: '#9f1239' },
  { label: 'Slate & Amber',    primary: '#334155', secondary: '#f59e0b', accent: '#475569' },
  { label: 'Teal & Coral',     primary: '#0f766e', secondary: '#f97316', accent: '#14b8a6' },
  { label: 'Plum & Gold',      primary: '#6b21a8', secondary: '#eab308', accent: '#7c3aed' },
];

// ── SVG ICONS ────────────────────────────────────────────────────────────────
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r3-icon">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r3-icon">
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r3-icon">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);
const IconWeb = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="r3-icon">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);


// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function R3Header({ school }) {
  return (
    <header className="r3-header">
      <div className="r3-header-top">
        <div className="r3-logo-label">
          <div className="r3-logo-ph" aria-label="Logo placeholder"></div>
        </div>
        
        <div className="r3-school-info">
          <h1 className="r3-school-name">{school.name}</h1>
          <p className="r3-school-subtitle">{school.subtitle}</p>
          <div className="r3-contacts">
            <span><IconPin /> {school.address}</span>
            <span><IconPhone /> {school.phone}</span>
            <span><IconMail /> {school.email}</span>
            <span><IconWeb /> {school.website}</span>
          </div>
        </div>

        <div className="r3-badge-box">
          <div className="r3-badge-inner">
            <span className="r3-badge-label">Academic Report</span>
            <div className="r3-term-year-box">
              <span>{school.term}</span>
              <span>{school.year}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function R3StudentBio({ student }) {
  return (
    <section className="r3-bio">
      <h3 className="r3-section-title">Student Information</h3>
      <div className="r3-bio-grid">
        <div className="r3-bio-item">
          <span className="r3-bio-label">Student Name</span>
          <span className="r3-bio-value">{student.name}</span>
        </div>
        <div className="r3-bio-item">
          <span className="r3-bio-label">Gender</span>
          <span className="r3-bio-value">{student.gender}</span>
        </div>
        <div className="r3-bio-item">
          <span className="r3-bio-label">Class</span>
          <span className="r3-bio-value">{student.class} {student.stream}</span>
        </div>
        <div className="r3-bio-item">
          <span className="r3-bio-label">Section</span>
          <span className="r3-bio-value">{student.section}</span>
        </div>
        <div className="r3-bio-item">
          <span className="r3-bio-label">ID Number</span>
          <span className="r3-bio-value">{student.idNo}</span>
        </div>
      </div>
    </section>
  );
}

function R3SubjectsTable({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <section className="r3-subjects">
        <h3 className="r3-section-title">Academic Performance</h3>
        <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No subjects data available. Please ensure marks have been entered for this student.</p>
      </section>
    );
  }
  
  const hasScores = subjects[0].scores && subjects[0].scores.length > 0;
  const scoreCount = hasScores ? subjects[0].scores.length : 0;
  const scoreHeaders = scoreCount === 7 ? ['A1', 'A2', 'A3', 'AVG', '20%', '80%', '100%'] : scoreCount === 3 ? ['A1', 'A2', 'A3'] : scoreCount === 4 ? ['BOT', 'MID', 'EOT', 'AVG'] : Array.from({ length: scoreCount }, (_, i) => `S${i + 1}`);
  
  return (
    <section className="r3-subjects">
      <h3 className="r3-section-title">Academic Performance</h3>
      <table className="r3-table">
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
                <td className="r3-grade">{sub.grade}</td>
                <td className="r3-achievement">{sub.achievement}</td>
                <td>{sub.teacher}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function R3Summary({ summary }) {
  return (
    <section className="r3-summary">
      <div className="r3-summary-grid">
        <div className="r3-sum-item">
          <span className="r3-sum-label">Average</span>
          <span className="r3-sum-value">{summary.average}%</span>
        </div>
        <div className="r3-sum-item">
          <span className="r3-sum-label">Total Marks</span>
          <span className="r3-sum-value">{summary.total}</span>
        </div>
        <div className="r3-sum-item">
          <span className="r3-sum-label">Result</span>
          <span className="r3-sum-value">{summary.result}</span>
        </div>
        <div className="r3-sum-item">
          <span className="r3-sum-label">Position</span>
          <span className="r3-sum-value">{summary.position}/{summary.outOf}</span>
        </div>
      </div>
    </section>
  );
}

function R3Overall({ overall }) {
  return (
    <section className="r3-overall">
      <h3 className="r3-section-title">Overall Performance</h3>
      <div className="r3-overall-content">
        <div className="r3-overall-item">
          <span className="r3-overall-label">Achievement Level</span>
          <span className="r3-overall-value">{overall.achievement}</span>
        </div>
        <div className="r3-overall-item">
          <span className="r3-overall-label">Overall Grade</span>
          <span className="r3-overall-value">{overall.grade}</span>
        </div>
      </div>
    </section>
  );
}

function R3Comments({ comments }) {
  return (
    <section className="r3-comments">
      <h3 className="r3-section-title">Teacher Comments</h3>
      <div className="r3-comment-grid">
        <div className="r3-comment-item">
          <div className="r3-comment-header">Class Teacher</div>
          <p>{comments.classTeacher}</p>
        </div>
        <div className="r3-comment-item">
          <div className="r3-comment-header">Head Teacher</div>
          <p>{comments.headTeacher}</p>
        </div>
      </div>
    </section>
  );
}

function R3Admin({ admin }) {
  return (
    <section className="r3-admin">
      <h3 className="r3-section-title">Administrative Information</h3>
      <div className="r3-admin-grid">
        <div className="r3-admin-item">
          <span className="r3-admin-label">Term Ended:</span>
          <span className="r3-admin-value">{admin.termEnded}</span>
        </div>
        <div className="r3-admin-item">
          <span className="r3-admin-label">Next Term:</span>
          <span className="r3-admin-value">{admin.nextTerm}</span>
        </div>
        <div className="r3-admin-item">
          <span className="r3-admin-label">Balance:</span>
          <span className="r3-admin-value">{admin.balance}</span>
        </div>
        <div className="r3-admin-item">
          <span className="r3-admin-label">Next Fees:</span>
          <span className="r3-admin-value">{admin.nextFees}</span>
        </div>
      </div>
    </section>
  );
}

function R3Footer({ admin, school }) {
  return (
    <footer className="r3-footer">
      <div className="r3-signatures">
        <div className="r3-sig-block">
          <span className="r3-sig-label">Class Teacher</span>
          <span className="r3-sig-name">{admin.classTeacherName}</span>
          <div className="r3-sig-ph" aria-label="Signature placeholder"></div>
        </div>

        <div className="r3-sig-block r3-stamp-block">
          <span className="r3-sig-label">Official Stamp</span>
          <div className="r3-stamp-ph" aria-label="Stamp placeholder"></div>
        </div>

        <div className="r3-sig-block">
          <span className="r3-sig-label">Head Teacher</span>
          <span className="r3-sig-name">{admin.headTeacherName}</span>
          <div className="r3-sig-ph" aria-label="Signature placeholder"></div>
        </div>
      </div>

      <div className="r3-footer-note">
        This is an official document from {school.name}. Any alterations will render it invalid.
      </div>
    </footer>
  );
}

// ── MAIN REPORT ──────────────────────────────────────────────────────────────
export default function Report3({ data: propData }) {
  const [palette, setPalette] = useState(PALETTES[0]);
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const cardRef = useRef(null);
  const [data] = useState(propData || data);

  const primary = customPrimary || palette.primary;
  const secondary = customSecondary || palette.secondary;
  const accent = palette.accent;

  const cssVars = {
    '--r3-primary': primary,
    '--r3-secondary': secondary,
    '--r3-accent': accent,
  };

  function handlePrint() {
    window.print();
  }

  return (
    <div className="r3-page">
      <div className="r3-controls no-print">
        <button className="r3-print-btn" onClick={handlePrint}>🖨 Print / Save PDF</button>

        <div className="r3-palette-bar">
          {PALETTES.map(p => (
            <button
              key={p.label}
              className={`r3-palette-swatch${palette.label === p.label ? ' active' : ''}`}
              style={{ background: p.primary }}
              title={p.label}
              onClick={() => { setPalette(p); setCustomPrimary(''); setCustomSecondary(''); }}
            />
          ))}
          <label className="r3-custom-label" title="Custom primary colour">
            <span>Primary</span>
            <input type="color" value={customPrimary || primary}
              onChange={e => setCustomPrimary(e.target.value)} className="r3-color-input" />
          </label>
          <label className="r3-custom-label" title="Custom secondary colour">
            <span>Secondary</span>
            <input type="color" value={customSecondary || secondary}
              onChange={e => setCustomSecondary(e.target.value)} className="r3-color-input" />
          </label>
        </div>
      </div>

      <div className="r3-card" ref={cardRef} style={cssVars}>
        <div className="r3-border-top"></div>
        <div className="r3-border-bottom"></div>
        
        <div className="r3-inner">
          <R3Header school={data.school} />
          <R3StudentBio student={data.student} />
          <R3SubjectsTable subjects={data.subjects} />
          <R3Summary summary={data.summary} />
          <R3Overall overall={data.overall} />
          <R3Comments comments={data.comments} />
          <R3Admin admin={data.admin} />
          <R3Footer admin={data.admin} school={data.school} />
        </div>
      </div>
    </div>
  );
}
