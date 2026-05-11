/**
 * ReportCardSalahV2 — Navy & Gold with watermark upload
 * Uses salah-react components. Accepts the standard buildReportData shape.
 */
import { useState } from 'react';
import { Header } from './salah-react/src/components/Header';
import { StudentBio } from './salah-react/src/components/StudentBio';
import { PerformanceTable } from './salah-react/src/components/PerformanceTable';
import { SummaryRow } from './salah-react/src/components/SummaryRow';
import { GradeScale } from './salah-react/src/components/GradeScale';
import { OverallPerformance } from './salah-react/src/components/OverallPerformance';
import { KeyToTerms } from './salah-react/src/components/KeyToTerms';
import { Comments } from './salah-react/src/components/Comments';
import { FooterSignatures } from './salah-react/src/components/FooterSignatures';
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
      subtitle: 'Secondary School',
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

export default function ReportCardSalahV2({ data }) {
  const [watermark, setWatermark] = useState('');
  const mapped = mapData(data);

  return (
    <>
      <style>{salahCss}</style>
      <div className="report-page" style={{ padding: 0 }}>
        <div className="top-controls" style={{ marginBottom: 12 }}>
          <button className="print-btn" onClick={() => window.print()}>🖨 Print Report Card</button>
          <label className="watermark-btn" title="Click to upload school watermark">
            💧 {watermark ? 'Change Watermark' : 'Add Watermark'}
            <input type="file" accept="image/*" onChange={e => {
              const f = e.target.files[0];
              if (f) setWatermark(URL.createObjectURL(f));
            }} style={{ display: 'none' }} />
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
              <Header school={mapped.school} />
              <StudentBio student={mapped.student} />
              <PerformanceTable subjects={mapped.subjects} assessmentModel={mapped.assessmentModel} />
              <SummaryRow summary={mapped.summary} subjects={mapped.subjects} />
              <GradeScale />
              <OverallPerformance overall={mapped.overall} />
              <KeyToTerms />
              <Comments comments={mapped.comments} />
            </div>
            <div className="report-footer-push">
              <FooterSignatures admin={mapped.admin} school={mapped.school} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
