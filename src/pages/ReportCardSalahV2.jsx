/**
 * ReportCardSalahV2 — Navy & Gold with watermark upload (MODERNIZED)
 * Centered header layout matching ReportCardSalah
 */
import { useState, useEffect } from 'react';
import { StudentBio } from './salah-react/src/components/StudentBio';
import { PerformanceTable } from './salah-react/src/components/PerformanceTable';
import { SummaryRow } from './salah-react/src/components/SummaryRow';
import { GradeScale } from './salah-react/src/components/GradeScale';
import { OverallPerformance } from './salah-react/src/components/OverallPerformance';
import { KeyToTerms } from './salah-react/src/components/KeyToTerms';
import { Comments } from './salah-react/src/components/Comments';
import { FooterSignatures } from './salah-react/src/components/FooterSignatures';
import { buildStampWithDate } from '../utils/stampProcessor';
import { loadReceiptSettings } from '../services/receiptSettingsService';
import salahCss from './salah-react/src/index.css?raw';

function mapData(data) {
  const total = data.subjects.reduce((a, s) => a + (s.score ?? 0), 0);
  const creds = (() => { try { return JSON.parse(localStorage.getItem('staffCredentials') || '[]'); } catch { return []; } })();
  const teacherCred = creds.find(c => c.role === 'teacher');
  const headCred    = creds.find(c => c.role === 'headteacher');
  const avg = data.subjects.length ? Math.round(total / data.subjects.length) : 0;

  return {
    school: {
      name: data.school?.name || 'School Name',
      motto: data.school?.motto || 'Let Our Future Shine',
      address: data.school?.address || '',
      phone: data.school?.phone || '',
      email: data.school?.email || '',
      website: data.school?.website || '',
      logo: data.school?.logo || '',
      term: data.metadata?.term || 'Term 1',
      year: data.metadata?.academic_year || String(new Date().getFullYear()),
    },
    student: {
      name: data.student.full_name,
      gender: data.student.gender || '',
      section: data.student.stream || '',
      class: data.student.class_or_grade || '',
      stream: data.student.stream || '',
      idNo: data.student.admission_number || '',
      payCode: data.student.index_number || '',
      term: data.metadata?.term || '',
      year: data.metadata?.academic_year || '',
      photo: data.student.photo || '',
    },
    subjects: data.subjects.map((s, i) => ({
      code: String(i + 1).padStart(2, '0'),
      name: s.subject_name,
      scores: s.ca_score != null
        ? [s.ca_score, s.exam_score ?? 0, s.score ?? 0]
        : [s.score ?? 0],
      grade: s.grade || '—',
      achievement: s.remark || '—',
      teacher: s.competency || '—',
    })),
    assessmentModel: 'A1',
    summary: {
      average: `${avg}%`,
      total: `${total}`,
      position: '—',
      outOf: '—',
    },
    overall: {
      identifier: avg >= 75 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 50 ? 'Satisfactory' : avg >= 35 ? 'Needs Improvement' : 'Fail',
      achievement: avg >= 75 ? 'Outstanding' : avg >= 60 ? 'Good' : 'Average',
      grade: avg >= 75 ? 'A' : avg >= 60 ? 'B' : avg >= 50 ? 'C' : avg >= 35 ? 'D' : 'E',
    },
    comments: {
      classTeacher: data.ai_comment || data.notes?.[0]?.description || '',
      headTeacher: '',
    },
    admin: {
      termEnded: '___________',
      nextTerm: '___________',
      balance: Number(data.student.fees_balance || 0).toLocaleString(),
      nextFees: '___________',
      classTeacherName: teacherCred?.name || '',
      classTeacherTitle: teacherCred?.title || 'Class Teacher',
      headTeacherName: headCred?.name || '',
      headTeacherTitle: headCred?.title || 'Head Teacher',
    },
  };
}

function ModernHeader({ school, logoSrc, onLogoUpload }) {
  return (
    <header className="report-header">
      <div className="header-gradient-bar" />
      
      <div className="header-content-centered">
        <div className="header-school-info">
          <h1 className="school-name">{school.name}</h1>
          <p className="school-motto">&ldquo;{school.motto}&rdquo;</p>
          {school.address && <p className="school-location">{school.address}</p>}
          <div className="school-contact-info">
            {school.phone && <span>{school.phone}</span>}
            {school.phone && school.email && <span className="contact-separator"> • </span>}
            {school.email && <span>{school.email}</span>}
          </div>
        </div>

        <div className="header-logo-wrapper">
          <label className="logo-upload-label" title="Click to upload logo">
            {logoSrc
              ? <img src={logoSrc} alt="School Logo" className="school-logo" />
              : <div className="logo-placeholder">Upload<br/>Logo</div>
            }
            <input type="file" accept="image/*" onChange={onLogoUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="header-badge-wrapper">
          <div className="report-badge-simple">
            <h2 className="badge-title-simple">REPORT CARD</h2>
            <span className="badge-subtitle-simple">Competency Based Assessment</span>
            <span className="badge-term-year">{school.term}, YEAR {school.year}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function ReportCardSalahV2({ data }) {
  const [watermark, setWatermark] = useState('');
  const [logoSrc, setLogoSrc] = useState(data.school?.logo || '');
  const [stamp, setStamp] = useState('');
  const mapped = mapData(data);

  useEffect(() => {
    const loadStamp = async () => {
      try {
        const settings = await loadReceiptSettings();
        if (settings.stamp_raw) {
          const opts = {
            offsetX: Number(settings.stamp_offset_x || 0),
            offsetY: Number(settings.stamp_offset_y || 0),
            rotate: Number(settings.stamp_rotate || 0),
            circular: settings.stamp_circular === true || settings.stamp_circular === 'true',
          };
          const stampWithDate = await buildStampWithDate(settings.stamp_raw, opts);
          setStamp(stampWithDate);
        }
      } catch {
        const cached = localStorage.getItem('schoolStamp');
        if (cached) setStamp(cached);
      }
    };
    loadStamp();
  }, []);

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoSrc(URL.createObjectURL(file));
  }

  function handleWatermarkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setWatermark(URL.createObjectURL(file));
  }

  return (
    <>
      <style>{salahCss}</style>
      <div className="report-page" style={{ padding: 0 }}>
        <div className="top-controls" style={{ marginBottom: 12 }}>
          <button className="print-btn" onClick={() => window.print()}>🖨 Print Report Card</button>
          <label className="watermark-btn" title="Click to upload school watermark">
            💧 {watermark ? 'Change Watermark' : 'Add Watermark'}
            <input type="file" accept="image/*" onChange={handleWatermarkUpload} style={{ display: 'none' }} />
          </label>
          {watermark && (
            <button className="watermark-btn remove" onClick={() => setWatermark('')}>✕ Remove Watermark</button>
          )}
        </div>

        <div className="report-card">
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="corner-accent corner-bl" />
          <div className="corner-accent corner-br" />

          {watermark && (
            <div className="watermark-layer">
              <img src={watermark} alt="Watermark" className="watermark-img" />
            </div>
          )}

          <div className="report-inner">
            <div className="report-body">
              <ModernHeader school={mapped.school} logoSrc={logoSrc} onLogoUpload={handleLogoUpload} />
              <StudentBio student={mapped.student} />
              <PerformanceTable subjects={mapped.subjects} assessmentModel={mapped.assessmentModel} />
              <SummaryRow summary={mapped.summary} subjects={mapped.subjects} />
              <GradeScale />
              <OverallPerformance overall={mapped.overall} />
              <KeyToTerms />
              <Comments comments={mapped.comments} />
            </div>
            <div className="report-footer-push">
              <FooterSignatures admin={mapped.admin} school={mapped.school} stamp={stamp} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
